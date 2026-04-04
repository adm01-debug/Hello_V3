/**
 * Zod schemas for runtime validation of API responses and form inputs.
 * Single source of truth for data shapes across frontend boundaries.
 */
import { z } from 'zod';

// ─── Primitives ─────────────────────────────────────────────────────────
export const uuidSchema = z.string().uuid();
export const emailSchema = z.string().email();
export const phoneSchema = z.string().min(8).max(20);
export const isoDateSchema = z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}T/));

// ─── Auth / Profile ─────────────────────────────────────────────────────
export const userRoleSchema = z.enum(['admin', 'supervisor', 'agent', 'viewer']);
export type UserRole = z.infer<typeof userRoleSchema>;

export const userProfileSchema = z.object({
  id: uuidSchema,
  email: z.string(),
  full_name: z.string().nullable(),
  role: userRoleSchema,
  agent_id: z.string().nullable(),
});
export type UserProfile = z.infer<typeof userProfileSchema>;

// ─── Agents ─────────────────────────────────────────────────────────────
export const agentStatusSchema = z.enum(['available', 'busy', 'break', 'offline', 'inactive']);

export const agentSchema = z.object({
  id: uuidSchema,
  name: z.string().min(1),
  status: z.string(),
  extension: z.string(),
  email: z.string().nullable(),
  avatar_url: z.string().nullable(),
  department: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Agent = z.infer<typeof agentSchema>;

// ─── Contacts ───────────────────────────────────────────────────────────
export const contactSchema = z.object({
  id: uuidSchema,
  name: z.string().min(1),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  company: z.string().nullable(),
  position: z.string().nullable(),
  notes: z.string().nullable(),
  tags: z.array(z.string()).nullable(),
  external_id: z.string().nullable(),
  source: z.string().nullable(),
  preferences: z.record(z.unknown()).nullable(),
  personality_insights: z.record(z.unknown()).nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Contact = z.infer<typeof contactSchema>;

export const createContactSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(255),
  phone: z.string().min(8).max(20).optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  company: z.string().max(255).optional(),
  position: z.string().max(255).optional(),
  notes: z.string().max(2000).optional(),
  tags: z.array(z.string()).optional(),
  external_id: z.string().optional(),
  source: z.string().optional(),
});
export type CreateContactInput = z.infer<typeof createContactSchema>;

// ─── Call Sessions ──────────────────────────────────────────────────────
export const callSessionSchema = z.object({
  id: uuidSchema,
  caller_name: z.string().nullable(),
  caller_phone: z.string().nullable(),
  agent_name: z.string().nullable(),
  contact_id: z.string().nullable(),
  status: z.string().nullable(),
  duration_seconds: z.number().nullable(),
  hold_count: z.number().nullable(),
  hold_time_seconds: z.number().nullable(),
  started_at: z.string(),
  ended_at: z.string().nullable(),
  created_at: z.string(),
});
export type CallSession = z.infer<typeof callSessionSchema>;

// ─── Call Summaries ─────────────────────────────────────────────────────
export const callSummarySchema = z.object({
  id: uuidSchema,
  call_session_id: uuidSchema,
  summary: z.string().nullable(),
  main_topics: z.array(z.string()).nullable(),
  next_steps: z.array(z.string()).nullable(),
  overall_sentiment: z.string().nullable(),
  customer_satisfaction: z.number().nullable(),
  agent_performance_score: z.number().nullable(),
  created_at: z.string(),
});
export type CallSummary = z.infer<typeof callSummarySchema>;

// ─── Scheduled Callbacks ────────────────────────────────────────────────
export const scheduledCallbackSchema = z.object({
  id: uuidSchema,
  contact_id: z.string().nullable(),
  caller_name: z.string(),
  caller_phone: z.string(),
  scheduled_at: z.string(),
  notes: z.string().nullable(),
  status: z.string(),
  priority: z.string(),
  assigned_agent: z.string().nullable(),
  created_by: z.string().nullable(),
  completed_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type ScheduledCallback = z.infer<typeof scheduledCallbackSchema>;

export const createCallbackSchema = z.object({
  caller_name: z.string().min(1, 'Nome é obrigatório'),
  caller_phone: z.string().min(8, 'Telefone inválido'),
  scheduled_at: z.string().min(1, 'Data é obrigatória'),
  contact_id: z.string().nullable().optional(),
  notes: z.string().max(2000).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  assigned_agent: z.string().optional(),
  created_by: z.string().optional(),
});
export type CreateCallbackInput = z.infer<typeof createCallbackSchema>;

// ─── Hold Events ────────────────────────────────────────────────────────
export const holdEventSchema = z.object({
  id: uuidSchema,
  call_session_id: z.string().nullable(),
  agent_name: z.string().nullable(),
  started_at: z.string(),
  ended_at: z.string().nullable(),
  duration_seconds: z.number().nullable(),
  created_at: z.string(),
});
export type HoldEvent = z.infer<typeof holdEventSchema>;

// ─── Dashboard ──────────────────────────────────────────────────────────
export const dashboardStatsSchema = z.object({
  totalCallsToday: z.number(),
  totalCallsChange: z.number(),
  avgCallDuration: z.number(),
  durationChange: z.number(),
  answeredRate: z.number(),
  rateChange: z.number(),
  activeAgents: z.number(),
  totalAgents: z.number(),
});
export type DashboardStats = z.infer<typeof dashboardStatsSchema>;

// ─── Alerts ─────────────────────────────────────────────────────────────
export const callAlertSchema = z.object({
  id: uuidSchema,
  call_session_id: uuidSchema,
  alert_type: z.string(),
  severity: z.string(),
  title: z.string(),
  message: z.string(),
  is_read: z.boolean(),
  created_at: z.string(),
});
export type CallAlert = z.infer<typeof callAlertSchema>;

// ─── Login form ─────────────────────────────────────────────────────────
export const loginFormSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
});
export type LoginFormInput = z.infer<typeof loginFormSchema>;

export const registerFormSchema = z.object({
  fullName: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').max(100),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Senhas não conferem',
  path: ['confirmPassword'],
});
export type RegisterFormInput = z.infer<typeof registerFormSchema>;

// ─── Utility: safe parse with logging ───────────────────────────────────
export function safeParse<T>(schema: z.ZodSchema<T>, data: unknown, label?: string): T | null {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.warn(`[Validation] ${label ?? 'unknown'} failed:`, result.error.flatten());
    return null;
  }
  return result.data;
}

export function safeParseArray<T>(schema: z.ZodSchema<T>, data: unknown[], label?: string): T[] {
  return data
    .map((item, i) => safeParse(schema, item, `${label}[${i}]`))
    .filter((item): item is T => item !== null);
}
