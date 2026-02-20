import { passwordSchema } from '../common/common-schemas.js';
import { getPhoneCodes, phoneUtil } from '../common/phone-helper.js';
import { V } from '../common/validation-keys.js';
import { z } from 'zod';

export const RegisterSchema = z
  .object({
    name: z.string().min(2, V.NAME_MIN).max(128, V.NAME_MAX),
    surname: z.string().min(2, V.SURNAME_MIN).max(128, V.SURNAME_MAX),
    email: z.email(V.EMAIL_INVALID).nullish().or(z.literal('')),
    phone: z.string().nullish().or(z.literal('')),
    password: passwordSchema,
    checkPassword: passwordSchema,
  })
  .check(({ issues, value }) => {
    if (value.checkPassword !== value.password) {
      issues.push({
        code: 'custom',
        input: value.checkPassword,
        message: V.PASSWORDS_NOT_MATCH,
        path: ['checkPassword'],
      });
    }

    const email = value.email?.trim();
    const phone = value.phone?.trim();

    const isEmailValid = !!(
      email && z.string().email().safeParse(email).success
    );

    let isPhoneEffective = false;
    let isPhoneValid = false;

    if (phone) {
      const phoneNoPlus = phone.replace(/^\+/, '');

      const isJustCountryCode = getPhoneCodes().some(
        (c) => c.code.toString() === phoneNoPlus
      );

      if (!isJustCountryCode) {
        isPhoneEffective = true;
        try {
          const valToParse = phone.startsWith('+') ? phone : `+${phone}`;
          const parsed = phoneUtil.parse(valToParse);
          isPhoneValid = phoneUtil.isValidNumber(parsed);
        } catch {
          isPhoneValid = false;
        }
      }
    }

    if (isPhoneEffective && !isPhoneValid) {
      issues.push({
        code: 'custom',
        input: phone,
        message: V.PHONE_INVALID,
        path: ['phone'],
      });
    }

    if (!isPhoneEffective && !isEmailValid) {
      issues.push({
        code: 'custom',
        input: phone,
        message: V.EMAIL_OR_PHONE_REQUIRED,
        path: ['email'],
      });
    }
  });

export type RegisterSchemaInputType = z.input<typeof RegisterSchema>;
export type RegisterSchemaOutputType = z.output<typeof RegisterSchema>;
