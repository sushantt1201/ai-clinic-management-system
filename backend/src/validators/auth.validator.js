import { z } from 'zod';

const emailSchema = z.string().trim().toLowerCase().email('Enter a valid email address');
const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[1-9]\d{9,14}$/, 'Enter a valid phone number with 10 to 15 digits');
const passwordSchema = z
  .string()
  .min(8, 'Password must contain at least 8 characters')
  .max(72, 'Password cannot exceed 72 characters')
  .regex(/[a-z]/, 'Password must include a lowercase letter')
  .regex(/[A-Z]/, 'Password must include an uppercase letter')
  .regex(/\d/, 'Password must include a number');

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(2).max(80),
    email: emailSchema,
    phone: phoneSchema,
    password: passwordSchema,
  })
  .strict();

export const loginSchema = z
  .object({
    identifier: z.string().trim().min(1, 'Email or phone is required'),
    password: z.string().min(1, 'Password is required'),
  })
  .strict();

export function parseRequest(schema, body) {
  const result = schema.safeParse(body);

  if (result.success) return result.data;

  return {
    validationErrors: result.error.issues.map((issue) => ({
      field: issue.path.join('.') || 'request',
      message: issue.message,
    })),
  };
}
