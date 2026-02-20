import { z } from 'zod';
import { V } from './validation-keys.js';

export const passwordSchema = z
  .string({ error: V.PASSWORD_REQUIRED })
  .min(6, { error: V.PASSWORD_MIN })
  .max(128, { error: V.PASSWORD_MAX });
