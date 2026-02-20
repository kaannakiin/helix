import { passwordSchema } from '../common/common-schemas.js';
import { V } from '../common/validation-keys.js';
import { z } from 'zod';

export const ChangePasswordSchema = z
  .object({
    currentPassword: passwordSchema,
    newPassword: passwordSchema,
    confirmNewPassword: passwordSchema,
  })
  .check(({ issues, value }) => {
    if (value.newPassword !== value.confirmNewPassword) {
      issues.push({
        code: 'custom',
        input: value.confirmNewPassword,
        message: V.PASSWORDS_NOT_MATCH,
        path: ['confirmNewPassword'],
      });
    }
  });

export type ChangePasswordSchemaInputType = z.input<typeof ChangePasswordSchema>;
export type ChangePasswordSchemaOutputType = z.output<typeof ChangePasswordSchema>;
