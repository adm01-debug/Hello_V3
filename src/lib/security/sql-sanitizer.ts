/**
 * SQL sanitization utility - prevents SQL injection in dynamic queries.
 * NOTE: Always prefer parameterized queries via Supabase SDK.
 */

const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|EXEC|UNION|TRUNCATE)\b)/gi,
  /(-{2}|\/\*|\*\/)/g,
  /(;\s*(DROP|DELETE|ALTER|TRUNCATE))/gi,
  /('\s*(OR|AND)\s*'?\s*\d+\s*=\s*\d+)/gi,
];

export function containsSQLInjection(input: string): boolean {
  return SQL_INJECTION_PATTERNS.some((pattern) => pattern.test(input));
}

export function sanitizeSQLInput(input: string): string {
  return input
    .replace(/'/g, "''")
    .replace(/\\/g, "\\\\")
    .replace(/\x00/g, "")
    .trim();
}

export function validateIdentifier(identifier: string): boolean {
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(identifier);
}

export function escapeForLike(input: string): string {
  return input.replace(/%/g, "\\%").replace(/_/g, "\\_");
}
