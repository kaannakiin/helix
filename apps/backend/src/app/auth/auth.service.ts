import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { hash as argon2Hash, verify as argon2Verify } from '@node-rs/argon2';
import type { LoginMethod, OAuthProvider } from '@org/prisma/client';
import type { TokenPayload } from '@org/types/token';
import { randomUUID } from 'crypto';
import type { Response } from 'express';
import {
  clearAuthCookies,
  setAccessTokenCookie,
  setRefreshTokenCookie,
} from '../../core/utils/cookie.util';
import { PrismaService } from '../prisma/prisma.service';
import { DeviceService } from './device.service';
import type {
  OAuthProfile,
  RequestMetadata,
  ValidatedUser,
} from './interfaces';
import { SessionService } from './session.service';
import { TokenService } from './token.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
    private readonly sessionService: SessionService,
    private readonly deviceService: DeviceService
  ) {}

  async register(
    data: {
      name: string;
      surname: string;
      email?: string | null;
      phone?: string | null;
      password: string;
    },
    metadata: RequestMetadata,
    res: Response
  ) {
    if (data.email) {
      const existing = await this.prisma.user.findUnique({
        where: { email: data.email },
      });
      if (existing) {
        throw new ConflictException('backend.errors.auth.email_conflict');
      }
    }

    if (data.phone) {
      const existing = await this.prisma.user.findUnique({
        where: { phone: data.phone },
      });
      if (existing) {
        throw new ConflictException('backend.errors.auth.phone_conflict');
      }
    }

    const hashedPassword = await argon2Hash(data.password);

    const user = await this.prisma.user.create({
      data: {
        name: data.name,
        surname: data.surname,
        email: data.email ?? null,
        phone: data.phone ?? null,
        password: hashedPassword,
      },
    });

    return this.issueTokens(
      {
        id: user.id,
        name: user.name,
        surname: user.surname,
        email: user.email,
        phone: user.phone,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
        role: user.role,
      },
      metadata,
      res
    );
  }

  async validateCredentials(
    email: string | null,
    phone: string | null,
    password: string
  ): Promise<ValidatedUser | null> {
    if (!email && !phone) return null;

    const user = await this.prisma.user.findUnique({
      where: email ? { email } : { phone: phone! },
      omit: { password: false },
    });

    if (!user) return null;

    if (user.status !== 'ACTIVE') {
      throw new ForbiddenException(
        `backend.errors.auth.account_${user.status.toLowerCase()}`
      );
    }

    if (!user.password) return null;

    const isValid = await argon2Verify(user.password, password);
    if (!isValid) return null;

    return {
      id: user.id,
      name: user.name,
      surname: user.surname,
      email: user.email,
      phone: user.phone,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      role: user.role,
    };
  }

  async login(
    validatedUser: ValidatedUser,
    metadata: RequestMetadata,
    res: Response
  ) {
    const loginMethod: 'EMAIL' | 'PHONE' = validatedUser.email
      ? 'EMAIL'
      : 'PHONE';

    const result = await this.issueTokens(validatedUser, metadata, res);

    await this.prisma.$transaction([
      this.prisma.loginHistory.create({
        data: {
          userId: validatedUser.id,
          sessionId: result.sessionId,
          deviceId: result.deviceId,
          ipAddress: metadata.ipAddress,
          userAgent: metadata.userAgent,
          loginMethod,
          status: 'SUCCESS',
        },
      }),
      this.prisma.user.update({
        where: { id: validatedUser.id },
        data: {
          lastLoginAt: new Date(),
          loginCount: { increment: 1 },
        },
      }),
      this.prisma.accountEvent.create({
        data: {
          userId: validatedUser.id,
          eventType: 'LOGIN',
          ipAddress: metadata.ipAddress,
          userAgent: metadata.userAgent,
        },
      }),
    ]);

    return result;
  }

  async refreshTokens(
    context: {
      user: TokenPayload;
      sessionId: string;
      family: string;
      tokenId: string;
    },
    res: Response
  ) {
    const payload: TokenPayload = {
      sub: context.user.sub,
      sessionId: context.sessionId,
      name: context.user.name,
      surname: context.user.surname,
      email: context.user.email,
      phone: context.user.phone,
      emailVerified: context.user.emailVerified,
      phoneVerified: context.user.phoneVerified,
      role: context.user.role,
    };

    const { rawToken } = await this.tokenService.rotateRefreshToken({
      oldTokenId: context.tokenId,
      userId: context.user.sub,
      sessionId: context.sessionId,
      family: context.family,
      payload,
    });

    const accessToken = this.tokenService.generateAccessToken(payload);

    await this.sessionService.updateSessionActivity(context.sessionId);

    setAccessTokenCookie(res, accessToken);
    setRefreshTokenCookie(res, rawToken);

    return { message: 'Tokens refreshed successfully' };
  }

  async logout(
    userId: string,
    sessionId: string | undefined,
    metadata: RequestMetadata,
    res: Response
  ) {
    if (sessionId) {
      await Promise.all([
        this.sessionService.revokeSession(sessionId, 'USER_LOGOUT'),
        this.tokenService.revokeSessionTokens(sessionId),
      ]);
    }

    await this.prisma.accountEvent.create({
      data: {
        userId,
        eventType: 'LOGOUT',
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
      },
    });

    clearAuthCookies(res);

    return { message: 'Logged out successfully' };
  }

  async logoutAll(userId: string, metadata: RequestMetadata, res: Response) {
    await Promise.all([
      this.sessionService.revokeAllSessions(userId, 'USER_REVOKED'),
      this.tokenService.revokeAllUserTokens(userId),
    ]);

    await this.prisma.accountEvent.create({
      data: {
        userId,
        eventType: 'LOGOUT',
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
        metadata: { scope: 'all_sessions' },
      },
    });

    clearAuthCookies(res);

    return { message: 'All sessions revoked' };
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    metadata: RequestMetadata,
    res: Response
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      omit: { password: false },
    });

    if (!user) {
      throw new NotFoundException('backend.errors.auth.user_not_found');
    }

    if (!user.password) {
      throw new BadRequestException('backend.errors.auth.no_password_set');
    }

    const isCurrentValid = await argon2Verify(user.password, currentPassword);
    if (!isCurrentValid) {
      throw new BadRequestException(
        'backend.errors.auth.current_password_incorrect'
      );
    }

    const hashedNewPassword = await argon2Hash(newPassword);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { password: hashedNewPassword },
      }),
      this.prisma.accountEvent.create({
        data: {
          userId,
          eventType: 'PASSWORD_CHANGE',
          ipAddress: metadata.ipAddress,
          userAgent: metadata.userAgent,
        },
      }),
    ]);

    await Promise.all([
      this.sessionService.revokeAllSessions(userId, 'PASSWORD_CHANGED'),
      this.tokenService.revokeAllUserTokens(userId),
    ]);

    clearAuthCookies(res);

    return { message: 'Password changed. Please log in again.' };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('backend.errors.auth.user_not_found');
    }

    return user;
  }

  async updateProfile(
    userId: string,
    data: { name?: string; surname?: string },
    metadata: RequestMetadata
  ) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data,
    });

    await this.prisma.accountEvent.create({
      data: {
        userId,
        eventType: 'PROFILE_UPDATED',
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
        metadata: { fields: Object.keys(data) },
      },
    });

    return user;
  }

  async getLoginHistory(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.loginHistory.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          device: { select: { deviceName: true, deviceType: true } },
        },
      }),
      this.prisma.loginHistory.count({ where: { userId } }),
    ]);

    return {
      data: items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async handleOAuthLogin(
    oauthProfile: OAuthProfile,
    metadata: RequestMetadata,
    res: Response
  ) {
    const loginMethodMap: Record<OAuthProvider, LoginMethod> = {
      GOOGLE: 'OAUTH_GOOGLE',
      FACEBOOK: 'OAUTH_FACEBOOK',
      INSTAGRAM: 'OAUTH_INSTAGRAM',
    };

    let oauthAccount = await this.prisma.oAuthAccount.findUnique({
      where: {
        provider_providerAccountId: {
          provider: oauthProfile.provider,
          providerAccountId: oauthProfile.providerAccountId,
        },
      },
      include: { user: true },
    });

    let user: Awaited<ReturnType<typeof this.prisma.user.findUniqueOrThrow>>;

    if (oauthAccount) {
      user = oauthAccount.user;
      await this.prisma.oAuthAccount.update({
        where: { id: oauthAccount.id },
        data: {
          accessToken: oauthProfile.accessToken,
          refreshToken: oauthProfile.refreshToken,
        },
      });
    } else if (oauthProfile.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: oauthProfile.email },
      });

      if (existingUser) {
        user = existingUser;
        await this.prisma.oAuthAccount.create({
          data: {
            userId: existingUser.id,
            provider: oauthProfile.provider,
            providerAccountId: oauthProfile.providerAccountId,
            accessToken: oauthProfile.accessToken,
            refreshToken: oauthProfile.refreshToken,
          },
        });
      } else {
        user = await this.prisma.$transaction(async (tx) => {
          const newUser = await tx.user.create({
            data: {
              name: oauthProfile.name,
              surname: oauthProfile.surname,
              email: oauthProfile.email,
              emailVerified: oauthProfile.emailVerified,
              avatar: oauthProfile.avatar,
            },
          });
          await tx.oAuthAccount.create({
            data: {
              userId: newUser.id,
              provider: oauthProfile.provider,
              providerAccountId: oauthProfile.providerAccountId,
              accessToken: oauthProfile.accessToken,
              refreshToken: oauthProfile.refreshToken,
            },
          });
          return newUser;
        });
      }
    } else {
      user = await this.prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            name: oauthProfile.name,
            surname: oauthProfile.surname,
            email: null,
            emailVerified: false,
            avatar: oauthProfile.avatar,
          },
        });
        await tx.oAuthAccount.create({
          data: {
            userId: newUser.id,
            provider: oauthProfile.provider,
            providerAccountId: oauthProfile.providerAccountId,
            accessToken: oauthProfile.accessToken,
            refreshToken: oauthProfile.refreshToken,
          },
        });
        return newUser;
      });
    }

    if (user.status !== 'ACTIVE') {
      throw new ForbiddenException(
        `backend.errors.auth.account_${user.status.toLowerCase()}`
      );
    }

    const validatedUser: ValidatedUser = {
      id: user.id,
      name: user.name,
      surname: user.surname,
      email: user.email,
      phone: user.phone,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      role: user.role,
    };

    const result = await this.issueTokens(validatedUser, metadata, res);

    const loginMethod = loginMethodMap[oauthProfile.provider];

    await this.prisma.$transaction([
      this.prisma.loginHistory.create({
        data: {
          userId: user.id,
          sessionId: result.sessionId,
          deviceId: result.deviceId,
          ipAddress: metadata.ipAddress,
          userAgent: metadata.userAgent,
          loginMethod,
          status: 'SUCCESS',
        },
      }),
      this.prisma.user.update({
        where: { id: user.id },
        data: {
          lastLoginAt: new Date(),
          loginCount: { increment: 1 },
        },
      }),
      this.prisma.accountEvent.create({
        data: {
          userId: user.id,
          eventType: 'LOGIN',
          ipAddress: metadata.ipAddress,
          userAgent: metadata.userAgent,
          metadata: { provider: oauthProfile.provider },
        },
      }),
    ]);

    return result;
  }

  private async issueTokens(
    validatedUser: ValidatedUser,
    metadata: RequestMetadata,
    res: Response
  ) {
    const device = await this.deviceService.findOrCreateDevice({
      userId: validatedUser.id,
      metadata,
    });

    const session = await this.sessionService.createSession({
      userId: validatedUser.id,
      deviceId: device.id,
      metadata,
    });

    const payload = this.tokenService.buildPayload(validatedUser, session.id);

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
      userId: validatedUser.id,
      sessionId: session.id,
      rawToken: rawRefreshToken,
      family,
    });

    setAccessTokenCookie(res, accessToken);
    setRefreshTokenCookie(res, rawRefreshToken);

    return {
      message: 'Authentication successful',
      user: {
        sub: payload.sub,
        name: payload.name,
        surname: payload.surname,
        email: payload.email,
        phone: payload.phone,
        emailVerified: payload.emailVerified,
        phoneVerified: payload.phoneVerified,
        role: payload.role,
      },
      sessionId: session.id,
      deviceId: device.id,
    };
  }
}
