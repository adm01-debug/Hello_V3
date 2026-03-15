/**
 * Secrets scanner utility - detects accidentally exposed secrets in code/text.
 */

const SECRET_PATTERNS: { name: string; pattern: RegExp }[] = [
  { name: "AWS Access Key", pattern: /AKIA[0-9A-Z]{16}/g },
  { name: "AWS Secret Key", pattern: /(?<![A-Za-z0-9/+=])[A-Za-z0-9/+=]{40}(?![A-Za-z0-9/+=])/g },
  { name: "GitHub Token", pattern: /gh[pousr]_[A-Za-z0-9_]{36,}/g },
  { name: "Slack Token", pattern: /xox[baprs]-[A-Za-z0-9-]+/g },
  { name: "Generic API Key", pattern: /(?:api[_-]?key|apikey)\s*[:=]\s*['"]?([A-Za-z0-9_-]{20,})['"]?/gi },
  { name: "Private Key", pattern: /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/g },
  { name: "JWT Token", pattern: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g },
];

export interface ScanResult {
  found: boolean;
  matches: { name: string; count: number; positions: number[] }[];
}

export function scanForSecrets(text: string): ScanResult {
  const matches: ScanResult["matches"] = [];

  for (const { name, pattern } of SECRET_PATTERNS) {
    const regex = new RegExp(pattern.source, pattern.flags);
    const found: number[] = [];
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      found.push(match.index);
    }
    if (found.length > 0) {
      matches.push({ name, count: found.length, positions: found });
    }
  }

  return { found: matches.length > 0, matches };
}

export function maskSecret(secret: string, visibleChars = 4): string {
  if (secret.length <= visibleChars * 2) return "****";
  return secret.slice(0, visibleChars) + "****" + secret.slice(-visibleChars);
}
