/**
 * SQL sanitization utility - prevents SQL injection in dynamic queries.
 * NOTE: Always prefer parameterized queries via Supabase SDK.
 */

const SQL_INJECTION_PATTERNS: RegExp[] = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|EXEC|UNION|TRUNCATE)\b)/i,
  /(-{2}|\/\*|\*\/)/,
  /(;\s*(DROP|DELETE|ALTER|TRUNCATE))/i,
  /('\s*(OR|AND)\s*'?\s*\d+\s*=\s*\d+)/i,
];

export function containsSQLInjection(input: string): boolean {
  return SQL_INJECTION_PATTERNS.some((pattern) => pattern.test(input));
}

export function sanitizeSQLInput(input: string): string {
  return input
    .replace(/'/g, "''")
    .replace(/\\/g, "\\\\")
    // eslint-disable-next-line no-control-regex -- intentionally strips NUL bytes to prevent null-byte injection
    .replace(/\x00/g, "")
    .trim();
}

export function validateIdentifier(identifier: string): boolean {
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(identifier);
}

export function escapeForLike(input: string): string {
  return input.replace(/%/g, "\\%").replace(/_/g, "\\_");
}
