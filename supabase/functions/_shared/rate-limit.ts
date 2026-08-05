// Database-backed rate limiter for edge functions
// Uses the public.check_rate_limit() DB function for persistence across cold starts

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface RateLimitResult {
  allowed: boolean;
  remaining?: number;
  retryAfter?: number;
  reason?: string;
}

/**
 * Check rate limit using persistent DB function.
 * Falls back to allowing if DB is unreachable (fail-open for availability).
 */
export async function checkRateLimitDB(
  ipAddress: string,
  endpoint: string,
  userId?: string
): Promise<RateLimitResult> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase.rpc('check_rate_limit', {
      _ip_address: ipAddress,
      _endpoint: endpoint,
      _user_id: userId || null,
    });

    if (error) {
      console.error('[rate-limit] DB check failed:', error.message);
      return { allowed: true }; // fail-open
    }

    if (!data.allowed) {
      // Log blocked request in background
      supabase.from('rate_limit_logs').insert({
        user_id: userId || null,
        ip_address: ipAddress,
        endpoint: endpoint,
        is_blocked: true,
        block_reason: data.reason || 'Rate limit exceeded',
        request_count: data.remaining === 0 ? 1 : 0 // heuristic
      }).catch(err => console.error('[rate-limit] Log insert failed:', err));
    }

    return {
      allowed: data.allowed,
      remaining: data.remaining,
      retryAfter: data.retry_after,
      reason: data.reason,
    };
  } catch (err) {
    console.error('[rate-limit] Unexpected error:', err);
    return { allowed: true }; // fail-open
  }
}

/**
 * Extract client IP from request headers.
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  return realIp || (forwarded ? forwarded.split(',')[0].trim() : '0.0.0.0');
}
