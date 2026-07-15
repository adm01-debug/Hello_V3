import { z } from 'zod';

export interface CallingHoursRegion {
  id: string;
  region_code: string;
  region_name: string;
  timezone: string;
  weekday_start: string;
  weekday_end: string;
  saturday_start: string | null;
  saturday_end: string | null;
  sunday_allowed: boolean;
  sunday_start: string | null;
  sunday_end: string | null;
  holidays_allowed: boolean;
  is_active: boolean;
}

export type CallingHoursDraft = Omit<CallingHoursRegion, 'id'> & { id?: string };

/** Timezones suportadas (subset comum LatAm/Europa). */
export const SUPPORTED_TIMEZONES = [
  'America/Sao_Paulo',
  'America/Fortaleza',
  'America/Manaus',
  'America/Cuiaba',
  'America/Bogota',
  'America/Buenos_Aires',
  'America/Mexico_City',
  'America/New_York',
  'America/Los_Angeles',
  'Europe/Lisbon',
  'Europe/Madrid',
  'UTC',
] as const;

const HHMM = /^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/;

const timeSchema = z.string().regex(HHMM, 'Horário inválido (HH:mm)');
const optionalTime = z
  .string()
  .optional()
  .nullable()
  .transform((v) => (v && v.length > 0 ? v : null))
  .refine((v) => v === null || HHMM.test(v), { message: 'Horário inválido (HH:mm)' });

/** Normaliza para HH:mm (aceita HH:mm:ss). */
export const normalizeTime = (v: string | null | undefined): string | null => {
  if (!v) return null;
  return v.length >= 5 ? v.substring(0, 5) : v;
};

const toMinutes = (t: string): number => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

export const callingHoursSchema = z
  .object({
    region_code: z
      .string()
      .trim()
      .min(2, 'Código com mínimo 2 caracteres')
      .max(10, 'Código com máximo 10 caracteres')
      .regex(/^[A-Za-z0-9_-]+$/, 'Use apenas letras, números, _ ou -')
      .transform((v) => v.toUpperCase()),
    region_name: z.string().trim().min(2, 'Nome obrigatório').max(80),
    timezone: z.string().trim().min(3, 'Timezone obrigatório').max(64),
    weekday_start: timeSchema,
    weekday_end: timeSchema,
    saturday_start: optionalTime,
    saturday_end: optionalTime,
    sunday_allowed: z.boolean(),
    sunday_start: optionalTime,
    sunday_end: optionalTime,
    holidays_allowed: z.boolean(),
    is_active: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (toMinutes(data.weekday_start) >= toMinutes(data.weekday_end)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Fim dos dias úteis deve ser após o início',
        path: ['weekday_end'],
      });
    }

    const satStart = data.saturday_start;
    const satEnd = data.saturday_end;
    if ((satStart && !satEnd) || (!satStart && satEnd)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Preencha início e fim ou deixe ambos vazios',
        path: ['saturday_end'],
      });
    } else if (satStart && satEnd && toMinutes(satStart) >= toMinutes(satEnd)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Fim de sábado deve ser após o início',
        path: ['saturday_end'],
      });
    }

    if (data.sunday_allowed) {
      if (!data.sunday_start || !data.sunday_end) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Domingo permitido exige início e fim',
          path: ['sunday_end'],
        });
      } else if (toMinutes(data.sunday_start) >= toMinutes(data.sunday_end)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Fim de domingo deve ser após o início',
          path: ['sunday_end'],
        });
      }
    }
  });

export type CallingHoursInput = z.infer<typeof callingHoursSchema>;

export const emptyDraft = (): CallingHoursDraft => ({
  region_code: '',
  region_name: '',
  timezone: 'America/Sao_Paulo',
  weekday_start: '08:00',
  weekday_end: '21:00',
  saturday_start: '09:00',
  saturday_end: '14:00',
  sunday_allowed: false,
  sunday_start: null,
  sunday_end: null,
  holidays_allowed: false,
  is_active: true,
});

export const draftFromRegion = (r: CallingHoursRegion): CallingHoursDraft => ({
  ...r,
  weekday_start: normalizeTime(r.weekday_start) ?? '08:00',
  weekday_end: normalizeTime(r.weekday_end) ?? '21:00',
  saturday_start: normalizeTime(r.saturday_start),
  saturday_end: normalizeTime(r.saturday_end),
  sunday_start: normalizeTime(r.sunday_start),
  sunday_end: normalizeTime(r.sunday_end),
});
