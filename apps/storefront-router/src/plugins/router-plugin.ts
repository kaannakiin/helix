import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import httpProxy from 'http-proxy';
import { timingSafeEqual } from 'node:crypto';
import { BusinessModel, ResolveCache } from './resolve-cache';
import { UpstreamHealth } from './upstream-health';

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:3001';
const B2C_UPSTREAM = process.env.B2C_UPSTREAM ?? 'http://localhost:3200';
const B2B_UPSTREAM = process.env.B2B_UPSTREAM ?? 'http://localhost:3300';
const ROUTER_INTERNAL_SECRET = process.env.ROUTER_INTERNAL_SECRET;
const ROUTER_INTERNAL_SECRET_HEADER = 'x-router-internal-secret';

function errorPage(status: number, title: string, detail: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${title}</title>
<style>body{font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f5f5f5}
.box{text-align:center;padding:2rem;max-width:480px}
h1{font-size:1.5rem;color:#333}p{color:#666;line-height:1.6}</style></head>
<body><div class="box"><h1>${status} — ${title}</h1><p>${detail}</p></div></body></html>`;
}

function hasValidInternalSecret(
  expected: string | undefined,
  received: string | string[] | undefined
): boolean {
  if (!expected || typeof received !== 'string') {
    return false;
  }

  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(received);

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, receivedBuffer);
}

export const routerPlugin = fp(async function (fastify: FastifyInstance) {
  const resolveCache = new ResolveCache(BACKEND_URL);
  const health = new UpstreamHealth(B2C_UPSTREAM, B2B_UPSTREAM);

  if (!ROUTER_INTERNAL_SECRET) {
    fastify.log.warn(
      'ROUTER_INTERNAL_SECRET is not configured; internal router endpoints will reject all requests'
    );
  }

  await health.start();

  const proxies: Record<BusinessModel, httpProxy> = {
    B2C: httpProxy.createProxyServer({
      target: B2C_UPSTREAM,
      changeOrigin: false,
      xfwd: true,
      ws: true,
    }),
    B2B: httpProxy.createProxyServer({
      target: B2B_UPSTREAM,
      changeOrigin: false,
      xfwd: true,
      ws: true,
    }),
  };

  for (const [model, proxy] of Object.entries(proxies)) {
    proxy.on('error', (err, _req, res) => {
      fastify.log.error({ err, model }, 'Proxy error');
      if (res && 'writeHead' in res && !res.headersSent) {
        res.writeHead(502, { 'Content-Type': 'text/html' });
        res.end(
          errorPage(
            502,
            'Storefront Unavailable',
            `The ${model} storefront is temporarily unavailable. Please try again later.`
          )
        );
      }
    });
  }

  fastify.addHook('onClose', async () => {
    health.stop();
    proxies.B2C.close();
    proxies.B2B.close();
  });

  fastify.get('/health/upstreams', async () => {
    return {
      upstreams: health.getStatus(),
      cache: { entries: resolveCache.size },
    };
  });

  fastify.post<{ Body: { hostname?: string } }>(
    '/cache/invalidate',
    async (req, reply) => {
      if (
        !hasValidInternalSecret(
          ROUTER_INTERNAL_SECRET,
          req.headers[ROUTER_INTERNAL_SECRET_HEADER]
        )
      ) {
        reply.code(401).send({ message: 'Unauthorized' });
        return;
      }

      const { hostname } = req.body ?? {};
      if (hostname) {
        resolveCache.invalidate(hostname);
        fastify.log.info({ hostname }, 'Cache invalidated for hostname');
      } else {
        resolveCache.invalidateAll();
        fastify.log.info('Full cache invalidated');
      }
      reply.send({ ok: true });
    }
  );

  fastify.all('*', async (req: FastifyRequest, reply: FastifyReply) => {
    const hostname = req.hostname;

    const resolved = await resolveCache.resolve(hostname);

    if (!resolved) {
      reply
        .status(503)
        .type('text/html')
        .send(
          errorPage(
            503,
            'Store Not Found',
            `No active storefront is configured for "${hostname}". Please check your domain settings.`
          )
        );
      return;
    }

    if (!health.isHealthy(resolved.businessModel)) {
      const label = resolved.businessModel === 'B2C' ? 'B2C' : 'B2B';
      reply
        .status(503)
        .type('text/html')
        .send(
          errorPage(
            503,
            `${label} Storefront Unavailable`,
            `The ${label} storefront is not currently running. Contact the platform administrator.`
          )
        );
      return;
    }

    req.raw.headers['x-store-id'] = resolved.storeId;
    req.raw.headers['x-store-slug'] = resolved.storeSlug;
    req.raw.headers['x-store-name'] = encodeURIComponent(resolved.storeName);
    req.raw.headers['x-business-model'] = resolved.businessModel;

    const proxy = proxies[resolved.businessModel];

    return new Promise<void>((resolve, reject) => {
      reply.hijack();
      proxy.web(req.raw, reply.raw, {}, (err) => {
        if (err) {
          fastify.log.error(
            { err, hostname, businessModel: resolved.businessModel },
            'Proxy forwarding failed'
          );
          if (!reply.raw.headersSent) {
            reply.raw.writeHead(502, { 'Content-Type': 'text/html' });
            reply.raw.end(
              errorPage(502, 'Proxy Error', 'Failed to reach the storefront.')
            );
          }
          reject(err);
        } else {
          resolve();
        }
      });
    });
  });
});
