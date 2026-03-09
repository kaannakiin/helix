export interface TokenPayload {
  sub: string;
  sessionId: string;
  name: string;
  surname: string;
  email?: string | null;
  phone?: string | null;
  emailVerified?: boolean;
  phoneVerified?: boolean;
}
