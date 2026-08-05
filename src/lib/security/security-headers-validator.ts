/**
 * Security headers validator - checks if expected security headers are present.
 */

export interface HeaderValidationResult {
  header: string;
  present: boolean;
  value: string | null;
  recommendation: string;
}

const EXPECTED_HEADERS: { header: string; recommendation: string }[] = [
  { header: "X-Content-Type-Options", recommendation: "Set to 'nosniff'" },
  { header: "X-Frame-Options", recommendation: "Set to 'DENY' or 'SAMEORIGIN'" },
  { header: "Strict-Transport-Security", recommendation: "Set max-age=31536000; includeSubDomains" },
  { header: "Content-Security-Policy", recommendation: "Define restrictive CSP directives" },
  { header: "Referrer-Policy", recommendation: "Set to 'strict-origin-when-cross-origin'" },
  { header: "Permissions-Policy", recommendation: "Restrict browser features" },
  { header: "X-XSS-Protection", recommendation: "Set to '0' (rely on CSP instead)" },
];

export async function validateHeaders(url: string): Promise<HeaderValidationResult[]> {
  try {
    const response = await fetch(url, { method: "HEAD" });
    return EXPECTED_HEADERS.map(({ header, recommendation }) => ({
      header,
      present: response.headers.has(header),
      value: response.headers.get(header),
      recommendation,
    }));
  } catch {
    return EXPECTED_HEADERS.map(({ header, recommendation }) => ({
      header,
      present: false,
      value: null,
      recommendation,
    }));
  }
}

export function getSecurityScore(results: HeaderValidationResult[]): number {
  const present = results.filter((r) => r.present).length;
  return Math.round((present / results.length) * 100);
}
