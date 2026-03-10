import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { hash as argon2Hash, verify as argon2Verify } from '@node-rs/argon2';
import type { CustomerTokenPayload } from '@org/types/storefront';
import { randomUUID } from 'crypto';
import type { Response } from 'express';
import type Redis from 'ioredis';
import {
  clearCustomerAuthCookies,
  setCustomerAccessTokenCookie,
  setCustomerRefreshTokenCookie,
} from '../../../core/utils/cookie.util';
import { PrismaService } from '../../prisma/prisma.service';
import { REDIS_CLIENT } from '../../redis/redis.constants';
import { CustomerDeviceService } from './customer-device.service';
import { CustomerSessionService } from './customer-session.service';
import { CustomerTokenService } from './customer-token.service';
import type {
  CustomerOAuthProfile,
  CustomerRequestMetadata,
  ValidatedCustomer,
} from './interfaces';

const OAUTH_STATE_TTL_SECONDS = 300;

@Injectable()
export class StorefrontAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: CustomerTokenService,
    private readonly sessionService: CustomerSessionService,
    private readonly deviceService: CustomerDeviceService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis
  ) {}

  async register(
    storeId: string,
    data: {
      name: string;
      surname: string;
      email?: string | null;
      phone?: string | null;
      password: string;
    },
    metadata: CustomerRequestMetadata,
    res: Response,
    hostname?: string
  ) {
    if (data.email) {
      const existing = await this.prisma.customer.findUnique({
        where: { storeId_email: { storeId, email: data.email } },
      });
      if (existing) {
        throw new ConflictException('backend.errors.auth.email_conflict');
      }
    }

    if (data.phone) {
      const existing = await this.prisma.customer.findUnique({
        where: { storeId_phone: { storeId, phone: data.phone } },
      });
      if (existing) {
        throw new ConflictException('backend.errors.auth.phone_conflict');
      }
    }

    const hashedPassword = await argon2Hash(data.password);

    const customer = await this.prisma.customer.create({
      data: {
        storeId,
        name: data.name,
        surname: data.surname,
        email: data.email ?? null,
        phone: data.phone ?? null,
        password: hashedPassword,
      },
    });

    return this.issueTokens(
      {
        id: customer.id,
        storeId: customer.storeId,
        name: customer.name,
        surname: customer.surname,
        email: customer.email,
        phone: customer.phone,
      },
      metadata,
      res,
      hostname
    );
  }

  async validateCredentials(
    storeId: string,
    email: string | null,
    phone: string | null,
    password: string
  ): Promise<ValidatedCustomer | null> {
    if (!email && !phone) return null;

    const customer = email
      ? await this.prisma.customer.findUnique({
          where: { storeId_email: { storeId, email } },
        })
      : await this.prisma.customer.findUnique({
          where: { storeId_phone: { storeId, phone: phone! } },
        });

    if (!customer) return null;

    if (customer.status !== 'ACTIVE') {
      throw new ForbiddenException(
        `backend.errors.auth.account_${customer.status.toLowerCase()}`
      );
    }

    if (!customer.password) return null;

    const isValid = await argon2Verify(customer.password, password);
    if (!isValid) return null;

    return {
      id: customer.id,
      storeId: customer.storeId,
      name: customer.name,
      surname: customer.surname,
      email: customer.email,
      phone: customer.phone,
    };
  }

  async login(
    validatedCustomer: ValidatedCustomer,
    metadata: CustomerRequestMetadata,
    res: Response,
    hostname?: string
  ) {
    const result = await this.issueTokens(
      validatedCustomer,
      metadata,
      res,
      hostname
    );

    await this.prisma.customer.update({
      where: { id: validatedCustomer.id },
      data: {
        lastLoginAt: new Date(),
        loginCount: { increment: 1 },
      },
    });

    return result;
  }

  async refreshTokens(
    context: {
      user: CustomerTokenPayload;
      sessionId: string;
      family: string;
      tokenId: string;
    },
    res: Response,
    hostname?: string
  ) {
    const payload: CustomerTokenPayload = {
      sub: context.user.sub,
      sessionId: context.sessionId,
      storeId: context.user.storeId,
      name: context.user.name,
      surname: context.user.surname,
      email: context.user.email,
      phone: context.user.phone,
      aud: 'storefront',
    };

    const { rawToken } = await this.tokenService.rotateRefreshToken({
      oldTokenId: context.tokenId,
      customerId: context.user.sub,
      sessionId: context.sessionId,
      family: context.family,
      payload,
    });

    const accessToken = this.tokenService.generateAccessToken(payload);

    await this.sessionService.updateSessionActivity(context.sessionId);

    setCustomerAccessTokenCookie(res, accessToken, hostname);
    setCustomerRefreshTokenCookie(res, rawToken, hostname);

    return { message: 'Tokens refreshed successfully' };
  }

  async logout(
    customerId: string,
    sessionId: string | undefined,
    res: Response,
    hostname?: string
  ) {
    if (sessionId) {
      await Promise.all([
        this.sessionService.revokeSession(sessionId, 'USER_LOGOUT'),
        this.tokenService.revokeSessionTokens(sessionId),
      ]);
    }

    clearCustomerAuthCookies(res, hostname);

    return { message: 'Logged out successfully' };
  }

  async generateOAuthState(): Promise<string> {
    const state = randomUUID();
    await this.redis.set(
      `oauth:state:${state}`,
      '1',
      'EX',
      OAUTH_STATE_TTL_SECONDS
    );
    return state;
  }

  async validateAndConsumeOAuthState(state: string): Promise<boolean> {
    const key = `oauth:state:${state}`;
    const result = await this.redis.get(key);
    if (!result) return false;
    await this.redis.del(key);
    return true;
  }

  async handleCustomerOAuthLogin(
    storeId: string,
    oauthProfile: CustomerOAuthProfile,
    metadata: CustomerRequestMetadata,
    res: Response,
    hostname?: string
  ) {
    let oauthAccount = await this.prisma.customerOAuthAccount.findUnique({
      where: {
        provider_providerAccountId: {
          provider: oauthProfile.provider,
          providerAccountId: oauthProfile.providerAccountId,
        },
      },
      include: { customer: true },
    });

    let customer: {
      id: string;
      storeId: string;
      name: string;
      surname: string;
      email: string | null;
      phone: string | null;
      status: string;
    };

    if (oauthAccount) {
      customer = oauthAccount.customer;
      await this.prisma.customerOAuthAccount.update({
        where: { id: oauthAccount.id },
        data: {
          accessToken: oauthProfile.accessToken,
          refreshToken: oauthProfile.refreshToken,
        },
      });
    } else if (oauthProfile.email) {
      const existingCustomer = await this.prisma.customer.findUnique({
        where: { storeId_email: { storeId, email: oauthProfile.email } },
      });

      if (existingCustomer) {
        customer = existingCustomer;
        await this.prisma.customerOAuthAccount.create({
          data: {
            customerId: existingCustomer.id,
            provider: oauthProfile.provider,
            providerAccountId: oauthProfile.providerAccountId,
            accessToken: oauthProfile.accessToken,
            refreshToken: oauthProfile.refreshToken,
          },
        });
      } else {
        customer = await this.prisma.$transaction(async (tx) => {
          const newCustomer = await tx.customer.create({
            data: {
              storeId,
              name: oauthProfile.name,
              surname: oauthProfile.surname,
              email: oauthProfile.email,
              emailVerified: oauthProfile.emailVerified,
              avatar: oauthProfile.avatar,
            },
          });
          await tx.customerOAuthAccount.create({
            data: {
              customerId: newCustomer.id,
              provider: oauthProfile.provider,
              providerAccountId: oauthProfile.providerAccountId,
              accessToken: oauthProfile.accessToken,
              refreshToken: oauthProfile.refreshToken,
            },
          });
          return newCustomer;
        });
      }
    } else {
      customer = await this.prisma.$transaction(async (tx) => {
        const newCustomer = await tx.customer.create({
          data: {
            storeId,
            name: oauthProfile.name,
            surname: oauthProfile.surname,
            email: null,
            emailVerified: false,
            avatar: oauthProfile.avatar,
          },
        });
        await tx.customerOAuthAccount.create({
          data: {
            customerId: newCustomer.id,
            provider: oauthProfile.provider,
            providerAccountId: oauthProfile.providerAccountId,
            accessToken: oauthProfile.accessToken,
            refreshToken: oauthProfile.refreshToken,
          },
        });
        return newCustomer;
      });
    }

    if (customer.status !== 'ACTIVE') {
      throw new ForbiddenException(
        `backend.errors.auth.account_${customer.status.toLowerCase()}`
      );
    }

    const validatedCustomer: ValidatedCustomer = {
      id: customer.id,
      storeId: customer.storeId,
      name: customer.name,
      surname: customer.surname,
      email: customer.email,
      phone: customer.phone,
    };

    const result = await this.issueTokens(
      validatedCustomer,
      metadata,
      res,
      hostname
    );

    await this.prisma.customer.update({
      where: { id: customer.id },
      data: {
        lastLoginAt: new Date(),
        loginCount: { increment: 1 },
      },
    });

    return result;
  }

  async getProfile(customerId: string) {
    return this.prisma.customer.findUniqueOrThrow({
      where: { id: customerId },
      omit: { password: true, twoFactorSecret: true },
    });
  }

  private async issueTokens(
    validatedCustomer: ValidatedCustomer,
    metadata: CustomerRequestMetadata,
    res: Response,
    hostname?: string
  ) {
    const device = await this.deviceService.findOrCreateDevice({
      customerId: validatedCustomer.id,
      metadata,
    });

    const session = await this.sessionService.createSession({
      customerId: validatedCustomer.id,
      deviceId: device.id,
      metadata,
    });

    const payload = this.tokenService.buildPayload(
      validatedCustomer,
      session.id
    );

    const accessToken = this.tokenService.generateAccessToken(payload);
    const family = randomUUID();
    const jti = randomUUID();
    const rawRefreshToken = this.tokenService.generateRefreshToken({
      payload,
      sessionId: session.id,
      family,
      jti,
    });

    await this.tokenService.storeRefreshToken({
      customerId: validatedCustomer.id,
      sessionId: session.id,
      rawToken: rawRefreshToken,
      family,
    });

    setCustomerAccessTokenCookie(res, accessToken, hostname);
    setCustomerRefreshTokenCookie(res, rawRefreshToken, hostname);

    return {
      message: 'Authentication successful',
      user: {
        sub: payload.sub,
        storeId: payload.storeId,
        name: payload.name,
        surname: payload.surname,
        email: payload.email,
        phone: payload.phone,
        aud: payload.aud,
      },
      sessionId: session.id,
      deviceId: device.id,
    };
  }
}
