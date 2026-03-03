import type en_validation from '../locales/en/validation.json';
import type en_backend from '../locales/en/backend.json';
import type en_frontend from '../locales/en/frontend.json';

export interface Messages {
  validation: typeof en_validation;
  backend: typeof en_backend;
  frontend: typeof en_frontend;
}

export type ValidationMessages = Messages['validation'];
export type BackendMessages = Messages['backend'];
export type FrontendMessages = Messages['frontend'];
