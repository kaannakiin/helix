import type en_validation from '../locales/en/validation.json';
import type en_common from '../locales/en/common.json';

export interface Messages {
  validation: typeof en_validation;
  common: typeof en_common;
}

export type ValidationMessages = Messages['validation'];
