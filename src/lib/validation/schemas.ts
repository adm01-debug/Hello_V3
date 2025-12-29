import { z } from 'zod';

// User schemas
export const userSchema = z.object({
  id: z.string().uuid().optional(),
  email: z
    .string()
    .email('Invalid email format')
    .min(5, 'Email must be at least 5 characters')
    .max(255, 'Email must be less than 255 characters')
    .toLowerCase()
    .trim(),
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .trim()
    .optional(),
  role: z
    .enum(['user', 'admin', 'moderator'], {
      errorMap: () => ({ message: 'Invalid role' }),
    })
    .default('user'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email').toLowerCase().trim(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const registerSchema = loginSchema.extend({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name is too long'),
  passwordConfirm: z.string(),
}).refine((data) => data.password === data.passwordConfirm, {
  message: 'Passwords do not match',
  path: ['passwordConfirm'],
});

// Contact schemas
export const contactSchema = z.object({
  id: z.string().uuid().optional(),
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name is too long')
    .trim(),
  email: z
    .string()
    .email('Invalid email')
    .max(255, 'Email is too long')
    .optional()
    .or(z.literal('')),
  phone: z
    .string()
    .regex(
      /^\+?[1-9]\d{1,14}$/,
      'Invalid phone number (E.164 format required)'
    )
    .optional()
    .or(z.literal('')),
  company: z
    .string()
    .max(100, 'Company name is too long')
    .optional()
    .or(z.literal('')),
  notes: z
    .string()
    .max(1000, 'Notes are too long')
    .optional()
    .or(z.literal('')),
}).refine(
  (data) => data.email || data.phone,
  {
    message: 'Either email or phone is required',
    path: ['email'],
  }
);

// Call schemas
export const callSchema = z.object({
  id: z.string().uuid().optional(),
  contactId: z.string().uuid('Invalid contact ID').optional(),
  status: z.enum(['active', 'completed', 'failed', 'cancelled']),
  duration: z.number().int().nonnegative().optional(),
  metadata: z.record(z.any()).optional(),
});

export const startCallSchema = z.object({
  contactId: z.string().uuid('Invalid contact ID').optional(),
  metadata: z.record(z.any()).optional(),
});

export const endCallSchema = z.object({
  id: z.string().uuid('Invalid call ID'),
  status: z.enum(['completed', 'failed', 'cancelled']).default('completed'),
});

// Search schemas
export const searchSchema = z.object({
  query: z
    .string()
    .min(1, 'Search query is required')
    .max(100, 'Search query is too long')
    .trim(),
  limit: z
    .number()
    .int()
    .positive()
    .max(100, 'Limit must be 100 or less')
    .default(50),
  offset: z.number().int().nonnegative().default(0),
});

// Pagination schema
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Date range schema
export const dateRangeSchema = z.object({
  startDate: z.coerce
    .date()
    .optional()
    .refine((date) => !date || date <= new Date(), {
      message: 'Start date cannot be in the future',
    }),
  endDate: z.coerce
    .date()
    .optional()
    .refine((date) => !date || date <= new Date(), {
      message: 'End date cannot be in the future',
    }),
}).refine(
  (data) => {
    if (!data.startDate || !data.endDate) return true;
    return data.startDate <= data.endDate;
  },
  {
    message: 'Start date must be before end date',
    path: ['endDate'],
  }
);

// Export types
export type User = z.infer<typeof userSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;
export type Contact = z.infer<typeof contactSchema>;
export type Call = z.infer<typeof callSchema>;
export type StartCall = z.infer<typeof startCallSchema>;
export type EndCall = z.infer<typeof endCallSchema>;
export type SearchParams = z.infer<typeof searchSchema>;
export type PaginationParams = z.infer<typeof paginationSchema>;
export type DateRange = z.infer<typeof dateRangeSchema>;

// Validation utilities
export function validateOrThrow<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): T {
  return schema.parse(data);
}

export function validateSafe<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { success: false, errors: result.error };
  }
}

export function getValidationErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  error.errors.forEach((err) => {
    const path = err.path.join('.');
    errors[path] = err.message;
  });
  return errors;
}
