export interface CustomerTokenPayload {
  sub: string;
  sessionId: string;
  storeId: string;
  name: string;
  surname: string;
  email?: string | null;
  phone?: string | null;
  aud: 'storefront';
}

export interface CustomerRefreshTokenPayload extends CustomerTokenPayload {
  jti: string;
  family: string;
}
