import type en_validation from '../locales/en/validation.json';
import type en_backend from '../locales/en/backend.json';
import type en_portal from '../locales/en/portal.json';
import type en_b2b from '../locales/en/b2b.json';
import type en_b2c from '../locales/en/b2c.json';

// Backend-only (nestjs-i18n filter'lar kullanır, frontend'e gönderilmez)
export type BackendMessages = typeof en_backend;

// Frontend app'lerin ortak base'i — sadece validation (Zod V key'leri)
export interface BaseMessages {
  validation: typeof en_validation;
}

export interface PortalMessages extends BaseMessages {
  frontend: typeof en_portal;
}

export interface B2BMessages extends BaseMessages {
  frontend: typeof en_b2b;
}

export interface B2CMessages extends BaseMessages {
  frontend: typeof en_b2c;
}

// Backward compat
export type Messages = PortalMessages;
export type ValidationMessages = BaseMessages['validation'];
export type FrontendMessages = PortalMessages['frontend'];
