// Centralized CORS configuration for all Edge Functions
// Restrict to known origins in production; fallback to first allowed origin
const ALLOWED_ORIGINS = [
  'http://localhost:8086',
  'http://localhost:8081',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:8080',
  'https://id-preview--e326811c-e59a-4850-bf9e-cfc9d6748662.lovable.app',
  'https://lovable.dev',
];

const ALLOWED_HEADERS =
  'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version, x-request-id, x-correlation-id, x-trace-id, x-trace-operation';

export function getCorsOrigin(req?: Request): string {
  if (!req) return ALLOWED_ORIGINS[0];
  const origin = req.headers.get('origin') || '';
  if (ALLOWED_ORIGINS.includes(origin)) return origin;
  // Allow any *.lovable.app subdomain
  if (/^https:\/\/[a-z0-9-]+\.lovable\.app$/.test(origin)) return origin;
  return ALLOWED_ORIGINS[0];
}

export function buildCorsHeaders(req?: Request): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': getCorsOrigin(req),
    'Access-Control-Allow-Headers': ALLOWED_HEADERS,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Max-Age': '86400',
  };
}

/** @deprecated Use buildCorsHeaders(req) instead for proper origin validation */
export const corsHeaders = buildCorsHeaders();
