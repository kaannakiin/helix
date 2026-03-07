import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { STOREFRONT_AUTH_SURFACE } from '@org/constants/auth-constants';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  const createContext = (): ExecutionContext =>
    ({
      getHandler: jest.fn(),
      getClass: jest.fn(),
    }) as unknown as ExecutionContext;

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('skips auth for storefront surface routes', () => {
    const reflector = {
      getAllAndOverride: jest
        .fn()
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(STOREFRONT_AUTH_SURFACE),
    } as unknown as Reflector;
    const guard = new JwtAuthGuard(reflector);
    const superCanActivate = jest.spyOn(
      Object.getPrototypeOf(JwtAuthGuard.prototype),
      'canActivate'
    );

    expect(guard.canActivate(createContext())).toBe(true);
    expect(superCanActivate).not.toHaveBeenCalled();
  });

  it('skips auth for public routes', () => {
    const reflector = {
      getAllAndOverride: jest
        .fn()
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(undefined),
    } as unknown as Reflector;
    const guard = new JwtAuthGuard(reflector);
    const superCanActivate = jest.spyOn(
      Object.getPrototypeOf(JwtAuthGuard.prototype),
      'canActivate'
    );

    expect(guard.canActivate(createContext())).toBe(true);
    expect(superCanActivate).not.toHaveBeenCalled();
  });
});
