import { passwordSchema } from '../common/common-schemas.js';
import { z } from 'zod';
import { V } from '../common/validation-keys.js';
import { phoneUtil } from '../common/phone-helper.js';

export const EmailLoginSchema = z.object({
  email: z.email({ message: V.EMAIL_INVALID }),
  password: passwordSchema,
});

export const PhoneLoginSchema = z.object({
  phone: z.string({ error: V.PHONE_REQUIRED }).refine(
    (value) => {
      try {
        const phone = phoneUtil.parse(value);
        return phoneUtil.isValidNumber(phone);
      } catch (error) {
        return false;
      }
    },
    { message: V.PHONE_INVALID }
  ),
  password: passwordSchema,
});

export const LoginSchema = z.discriminatedUnion('type', [
  EmailLoginSchema.safeExtend({
    type: z.literal('email'),
  }),
  PhoneLoginSchema.safeExtend({
    type: z.literal('phone'),
  }),
]);

export type PhoneLoginSchemaInputType = z.input<typeof PhoneLoginSchema>;
export type PhoneLoginSchemaOutputType = z.output<typeof PhoneLoginSchema>;

export type EmailLoginSchemaInputType = z.input<typeof EmailLoginSchema>;
export type EmailLoginSchemaOutputType = z.output<typeof EmailLoginSchema>;

export type LoginSchemaInputType = z.input<typeof LoginSchema>;
export type LoginSchemaOutputType = z.output<typeof LoginSchema>;
