// Simple in-memory rate limiter for edge functions
const requests = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  ip: string,
  maxRequests = 100,
  windowMs = 60000
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = requests.get(ip);

  if (!entry || now > entry.resetAt) {
    requests.set(ip, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  entry.count++;
  const remaining = Math.max(0, maxRequests - entry.count);
  return { allowed: entry.count <= maxRequests, remaining };
}
