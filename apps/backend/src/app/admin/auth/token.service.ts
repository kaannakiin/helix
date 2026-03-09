import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { hash as argon2Hash, verify as argon2Verify } from '@node-rs/argon2';
import {
  ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY_DAYS,
} from '@org/constants/auth-constants';
import type { TokenPayload } from '@org/types/token';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import type { ValidatedUser } from './interfaces';

export interface RefreshTokenPayload extends TokenPayload {
  jti: string;
  family: string;
}

@Injectable()
export class TokenService {
  private readonly refreshSecret: string;

  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService
  ) {
    this.refreshSecret = this.config.getOrThrow<string>('JWT_REFRESH_SECRET');
  }

  buildPayload(user: ValidatedUser, sessionId: string): TokenPayload {
    return {
      sub: user.id,
      sessionId,
      name: user.name,
      surname: user.surname,
      email: user.email,
      phone: user.phone,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
    };
  }

  generateAccessToken(payload: TokenPayload): string {
    return this.jwt.sign({ ...payload }, { expiresIn: ACCESS_TOKEN_EXPIRY });
  }

  generateRefreshToken(params: {
    payload: TokenPayload;
    sessionId: string;
    family: string;
    jti: string;
  }): string {
    const { payload, sessionId, family, jti } = params;
    return this.jwt.sign(
      { ...payload, sessionId, family, jti },
      { secret: this.refreshSecret, expiresIn: REFRESH_TOKEN_EXPIRY }
    );
  }

  verifyRefreshToken(token: string): RefreshTokenPayload {
    return this.jwt.verify<RefreshTokenPayload>(token, {
      secret: this.refreshSecret,
    });
  }

  async hashToken(token: string): Promise<string> {
    return argon2Hash(token);
  }

  async verifyTokenHash(
    rawToken: string,
    hashedToken: string
  ): Promise<boolean> {
    try {
      return await argon2Verify(hashedToken, rawToken);
    } catch {
      return false;
    }
  }

  async storeRefreshToken(params: {
    userId: string;
    sessionId: string;
    rawToken: string;
    family?: string;
  }): Promise<string> {
    const family = params.family ?? randomUUID();
    const tokenHash = await this.hashToken(params.rawToken);
    const expiresAt = new Date(
      Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000
    );

    await this.prisma.refreshToken.create({
      data: {
        userId: params.userId,
        sessionId: params.sessionId,
        tokenHash,
        family,
        expiresAt,
      },
    });

    return family;
  }

  async validateRefreshToken(rawToken: string): Promise<{
    payload: RefreshTokenPayload;
    sessionId: string;
    family: string;
    tokenId: string;
  } | null> {
    let decoded: RefreshTokenPayload;
    try {
      decoded = this.verifyRefreshToken(rawToken);
    } catch {
      return null;
    }

    const storedToken = await this.prisma.refreshToken.findFirst({
      where: {
        userId: decoded.sub,
        family: decoded.family,
        isRevoked: false,
      },
      include: { session: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!storedToken) return null;

    const isValid = await this.verifyTokenHash(rawToken, storedToken.tokenHash);
    if (!isValid) {
      await this.revokeTokenFamily(storedToken.family);
      return null;
    }

    if (storedToken.expiresAt < new Date()) return null;

    if (!storedToken.session.isActive) return null;

    return {
      payload: decoded,
      sessionId: storedToken.sessionId,
      family: storedToken.family,
      tokenId: storedToken.id,
    };
  }

  async rotateRefreshToken(params: {
    oldTokenId: string;
    userId: string;
    sessionId: string;
    family: string;
    payload: TokenPayload;
  }): Promise<{ rawToken: string }> {
    const jti = randomUUID();
    const rawToken = this.generateRefreshToken({
      payload: params.payload,
      sessionId: params.sessionId,
      family: params.family,
      jti,
    });
    const tokenHash = await this.hashToken(rawToken);
    const expiresAt = new Date(
      Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000
    );

    await this.prisma.$transaction([
      this.prisma.refreshToken.update({
        where: { id: params.oldTokenId },
        data: { isRevoked: true },
      }),
      this.prisma.refreshToken.create({
        data: {
          userId: params.userId,
          sessionId: params.sessionId,
          tokenHash,
          family: params.family,
          expiresAt,
        },
      }),
    ]);

    return { rawToken };
  }

  async revokeTokenFamily(family: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { family, isRevoked: false },
      data: { isRevoked: true },
    });
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });
  }

  async revokeSessionTokens(sessionId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { sessionId, isRevoked: false },
      data: { isRevoked: true },
    });
  }
}
