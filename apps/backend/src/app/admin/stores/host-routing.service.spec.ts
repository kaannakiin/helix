import { Logger } from '@nestjs/common';
import type Redis from 'ioredis';
import { HostRoutingService } from './host-routing.service';

describe('HostRoutingService', () => {
  const originalEnv = process.env;
  const originalFetch = global.fetch;

  let redis: {
    del: jest.Mock;
  };
  let service: HostRoutingService;
  let fetchMock: jest.Mock;
  let loggerWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    process.env = { ...originalEnv };

    redis = {
      del: jest.fn().mockResolvedValue(1),
    };

    service = new HostRoutingService(
      {} as never,
      {} as never,
      redis as unknown as Redis
    );

    fetchMock = jest.fn().mockResolvedValue({ ok: true });
    global.fetch = fetchMock as unknown as typeof fetch;
    loggerWarnSpy = jest
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    process.env = originalEnv;
    global.fetch = originalFetch;
    loggerWarnSpy.mockRestore();
    jest.restoreAllMocks();
  });

  it('sends the internal secret when invalidating router cache', async () => {
    process.env.ROUTER_URL = 'http://storefront-router:3100';
    process.env.ROUTER_INTERNAL_SECRET = 'internal-secret';

    await service.invalidateHostCache('shop.example.com');

    expect(redis.del).toHaveBeenCalledWith('storefront:host:shop.example.com');
    expect(fetchMock).toHaveBeenCalledWith(
      'http://storefront-router:3100/cache/invalidate',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'x-router-internal-secret': 'internal-secret',
        }),
        body: JSON.stringify({ hostname: 'shop.example.com' }),
      })
    );
  });

  it('skips router invalidation and warns when secret config is missing', async () => {
    process.env.ROUTER_URL = 'http://storefront-router:3100';
    delete process.env.ROUTER_INTERNAL_SECRET;

    await service.invalidateHostCache('shop.example.com');

    expect(fetchMock).not.toHaveBeenCalled();
    expect(loggerWarnSpy).toHaveBeenCalledWith(
      'Router cache invalidation skipped: missing ROUTER_INTERNAL_SECRET'
    );
  });
});
