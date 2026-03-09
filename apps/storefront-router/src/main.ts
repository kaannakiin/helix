import Fastify from 'fastify';
import { routerPlugin } from './plugins/router-plugin';
import { healthPlugin } from './plugins/health-plugin';

const host = process.env.HOST ?? '0.0.0.0';
const port = process.env.PORT ? Number(process.env.PORT) : 3100;

const server = Fastify({
  logger: {
    level: process.env.LOG_LEVEL ?? 'info',
  },
  trustProxy: true,
});

server.register(healthPlugin);
server.register(routerPlugin);

server.listen({ port, host }, (err) => {
  if (err) {
    server.log.error(err);
    process.exit(1);
  }
  server.log.info(`Storefront router listening on http://${host}:${port}`);
});
