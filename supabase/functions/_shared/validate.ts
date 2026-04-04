/**
 * Lightweight input validation helpers for Edge Functions.
 * Provides Zod-like schema validation without external dependencies.
 */

type Validator<T> = (value: unknown) => { ok: true; data: T } | { ok: false; error: string };

export function string(opts?: { min?: number; max?: number; pattern?: RegExp }): Validator<string> {
  return (value) => {
    if (typeof value !== 'string') return { ok: false, error: 'Expected string' };
    if (opts?.min !== undefined && value.length < opts.min) return { ok: false, error: `Min length ${opts.min}` };
    if (opts?.max !== undefined && value.length > opts.max) return { ok: false, error: `Max length ${opts.max}` };
    if (opts?.pattern && !opts.pattern.test(value)) return { ok: false, error: 'Invalid format' };
    return { ok: true, data: value };
  };
}

export function uuid(): Validator<string> {
  return string({ pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i });
}

export function number(opts?: { min?: number; max?: number }): Validator<number> {
  return (value) => {
    const n = typeof value === 'number' ? value : Number(value);
    if (isNaN(n)) return { ok: false, error: 'Expected number' };
    if (opts?.min !== undefined && n < opts.min) return { ok: false, error: `Min value ${opts.min}` };
    if (opts?.max !== undefined && n > opts.max) return { ok: false, error: `Max value ${opts.max}` };
    return { ok: true, data: n };
  };
}

export function boolean(): Validator<boolean> {
  return (value) => {
    if (typeof value !== 'boolean') return { ok: false, error: 'Expected boolean' };
    return { ok: true, data: value };
  };
}

export function optional<T>(validator: Validator<T>): Validator<T | undefined> {
  return (value) => {
    if (value === undefined || value === null) return { ok: true, data: undefined };
    return validator(value);
  };
}

export function array<T>(itemValidator: Validator<T>, opts?: { max?: number }): Validator<T[]> {
  return (value) => {
    if (!Array.isArray(value)) return { ok: false, error: 'Expected array' };
    if (opts?.max !== undefined && value.length > opts.max) return { ok: false, error: `Max items ${opts.max}` };
    const results: T[] = [];
    for (let i = 0; i < value.length; i++) {
      const r = itemValidator(value[i]);
      if (!r.ok) return { ok: false, error: `[${i}]: ${r.error}` };
      results.push(r.data);
    }
    return { ok: true, data: results };
  };
}

export function oneOf<T extends string>(...values: T[]): Validator<T> {
  return (value) => {
    if (typeof value !== 'string' || !values.includes(value as T)) {
      return { ok: false, error: `Expected one of: ${values.join(', ')}` };
    }
    return { ok: true, data: value as T };
  };
}

type Schema = Record<string, Validator<unknown>>;
type SchemaOutput<S extends Schema> = { [K in keyof S]: S[K] extends Validator<infer T> ? T : never };

export function validate<S extends Schema>(
  body: unknown,
  schema: S
): { ok: true; data: SchemaOutput<S> } | { ok: false; errors: Record<string, string> } {
  if (typeof body !== 'object' || body === null) {
    return { ok: false, errors: { _body: 'Expected object' } };
  }

  const obj = body as Record<string, unknown>;
  const errors: Record<string, string> = {};
  const data: Record<string, unknown> = {};

  for (const [key, validator] of Object.entries(schema)) {
    const result = validator(obj[key]);
    if (!result.ok) {
      errors[key] = result.error;
    } else {
      data[key] = result.data;
    }
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, data: data as SchemaOutput<S> };
}
