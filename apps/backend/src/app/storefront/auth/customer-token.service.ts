import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { hash as argon2Hash, verify as argon2Verify } from '@node-rs/argon2';
import {
  CUSTOMER_ACCESS_TOKEN_EXPIRY,
  CUSTOMER_REFRESH_TOKEN_EXPIRY,
  CUSTOMER_REFRESH_TOKEN_EXPIRY_DAYS,
} from '@org/constants/auth-constants';
import type {
  CustomerRefreshTokenPayload,
  CustomerTokenPayload,
} from '@org/types/storefront';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import type { ValidatedCustomer } from './interfaces';

@Injectable()
export class CustomerTokenService {
  private readonly refreshSecret: string;

  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.refreshSecret = this.config.getOrThrow<string>(
      'CUSTOMER_JWT_REFRESH_SECRET',
    );
  }

  buildPayload(
    customer: ValidatedCustomer,
    sessionId: string
  ): CustomerTokenPayload {
    return {
      sub: customer.id,
      sessionId,
      storeId: customer.storeId,
      name: customer.name,
      surname: customer.surname,
      email: customer.email,
      phone: customer.phone,
      aud: 'storefront',
    };
  }

  generateAccessToken(payload: CustomerTokenPayload): string {
    return this.jwt.sign(
      { ...payload },
      { expiresIn: CUSTOMER_ACCESS_TOKEN_EXPIRY },
    );
  }

  generateRefreshToken(params: {
    payload: CustomerTokenPayload;
    sessionId: string;
    family: string;
    jti: string;
  }): string {
    const { payload, sessionId, family, jti } = params;
    return this.jwt.sign(
      { ...payload, sessionId, family, jti },
      { secret: this.refreshSecret, expiresIn: CUSTOMER_REFRESH_TOKEN_EXPIRY },
    );
  }

  verifyRefreshToken(token: string): CustomerRefreshTokenPayload {
    return this.jwt.verify<CustomerRefreshTokenPayload>(token, {
      secret: this.refreshSecret,
    });
  }

  async hashToken(token: string): Promise<string> {
    return argon2Hash(token);
  }

  async verifyTokenHash(
    rawToken: string,
    hashedToken: string,
  ): Promise<boolean> {
    try {
      return await argon2Verify(hashedToken, rawToken);
    } catch {
      return false;
    }
  }

  async storeRefreshToken(params: {
    customerId: string;
    sessionId: string;
    rawToken: string;
    family?: string;
  }): Promise<string> {
    const family = params.family ?? randomUUID();
    const tokenHash = await this.hashToken(params.rawToken);
    const expiresAt = new Date(
      Date.now() + CUSTOMER_REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    );

    await this.prisma.customerRefreshToken.create({
      data: {
        customerId: params.customerId,
        sessionId: params.sessionId,
        tokenHash,
        family,
        expiresAt,
      },
    });

    return family;
  }

  async validateRefreshToken(rawToken: string): Promise<{
    payload: CustomerRefreshTokenPayload;
    sessionId: string;
    family: string;
    tokenId: string;
  } | null> {
    let decoded: CustomerRefreshTokenPayload;
    try {
      decoded = this.verifyRefreshToken(rawToken);
    } catch {
      return null;
    }

    const storedToken = await this.prisma.customerRefreshToken.findFirst({
      where: {
        customerId: decoded.sub,
        family: decoded.family,
        isRevoked: false,
      },
      include: { session: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!storedToken) return null;

    const isValid = await this.verifyTokenHash(
      rawToken,
      storedToken.tokenHash,
    );
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
    customerId: string;
    sessionId: string;
    family: string;
    payload: CustomerTokenPayload;
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
      Date.now() + CUSTOMER_REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    );

    await this.prisma.$transaction([
      this.prisma.customerRefreshToken.update({
        where: { id: params.oldTokenId },
        data: { isRevoked: true },
      }),
      this.prisma.customerRefreshToken.create({
        data: {
          customerId: params.customerId,
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
    await this.prisma.customerRefreshToken.updateMany({
      where: { family, isRevoked: false },
      data: { isRevoked: true },
    });
  }

  async revokeAllCustomerTokens(customerId: string): Promise<void> {
    await this.prisma.customerRefreshToken.updateMany({
      where: { customerId, isRevoked: false },
      data: { isRevoked: true },
    });
  }

  async revokeSessionTokens(sessionId: string): Promise<void> {
    await this.prisma.customerRefreshToken.updateMany({
      where: { sessionId, isRevoked: false },
      data: { isRevoked: true },
    });
  }
}
