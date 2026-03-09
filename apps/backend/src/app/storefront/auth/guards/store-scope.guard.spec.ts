import { ForbiddenException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { HostRoutingService } from '../../../admin/stores/host-routing.service';
import { StoreScopeGuard } from './store-scope.guard';

describe('StoreScopeGuard', () => {
  const createContext = (request: Record<string, unknown>): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    }) as unknown as ExecutionContext;

  it('allows access-token requests on the matching store host', async () => {
    const hostRouting = {
      resolveActiveHost: jest.fn().mockResolvedValue({ storeId: 'store-1' }),
    } as unknown as HostRoutingService;
    const guard = new StoreScopeGuard(hostRouting);

    await expect(
      guard.canActivate(
        createContext({
          hostname: 'shop-a.e2e.test',
          user: {
            sub: 'customer-1',
            sessionId: 'session-1',
            storeId: 'store-1',
            name: 'Test',
            surname: 'Customer',
            aud: 'storefront',
          },
        })
      )
    ).resolves.toBe(true);
  });

  it('allows refresh-token requests on the matching store host', async () => {
    const hostRouting = {
      resolveActiveHost: jest.fn().mockResolvedValue({ storeId: 'store-1' }),
    } as unknown as HostRoutingService;
    const guard = new StoreScopeGuard(hostRouting);

    await expect(
      guard.canActivate(
        createContext({
          hostname: 'shop-a.e2e.test',
          user: {
            sessionId: 'session-1',
            family: 'family-1',
            tokenId: 'token-1',
            refreshToken: 'refresh-token',
            user: {
              sub: 'customer-1',
              sessionId: 'session-1',
              storeId: 'store-1',
              name: 'Test',
              surname: 'Customer',
              aud: 'storefront',
            },
          },
        })
      )
    ).resolves.toBe(true);
  });

  it('rejects requests on a different store host', async () => {
    const hostRouting = {
      resolveActiveHost: jest.fn().mockResolvedValue({ storeId: 'store-2' }),
    } as unknown as HostRoutingService;
    const guard = new StoreScopeGuard(hostRouting);

    await expect(
      guard.canActivate(
        createContext({
          hostname: 'shop-b.e2e.test',
          user: {
            sub: 'customer-1',
            sessionId: 'session-1',
            storeId: 'store-1',
            name: 'Test',
            surname: 'Customer',
            aud: 'storefront',
          },
        })
      )
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
