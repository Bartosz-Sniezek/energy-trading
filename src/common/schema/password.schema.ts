import { z } from 'zod';

export const passwordSchema = z
  .string()
  .min(8, 'Must be at least 8 characters')
  .regex(/(?=.*[A-Z])/, 'Must contain at least one uppercase letter')
  .regex(/(?=.*[a-z])/, 'Must contain at least one lowercase letter')
  .regex(/(?=.*\d)/, 'Must contain at least one number')
  .regex(
    /(?=.*[!@#$%^&*(),.?":{}|<>])/,
    'Must contain at least one special character',
  );
