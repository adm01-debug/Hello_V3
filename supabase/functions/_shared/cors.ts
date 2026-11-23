// Centralized CORS configuration for all Edge Functions
// Only known origins are echoed back; unknown origins get no CORS header
const ALLOWED_ORIGINS = [
  // Front em producao roda na Vercel; sem ela aqui o browser bloqueia toda
  // chamada de edge function por CORS (resposta saia como localhost:8086).
  'https://hello-v3.vercel.app',
  'http://localhost:8086',
  'http://localhost:8081',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:8080',
  'https://id-preview--e326811c-e59a-4850-bf9e-cfc9d6748662.lovable.app',
  'https://lovable.dev',
];

/** Origens extras declaradas em `CORS_EXTRA_ORIGINS` (lista separada por virgula). */
function originsExtras(): string[] {
  const raw = Deno.env.get('CORS_EXTRA_ORIGINS') ?? '';
  return raw.split(',').map((o) => o.trim()).filter(Boolean);
}

const ALLOWED_HEADERS =
  'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version, x-request-id, x-correlation-id, x-trace-id, x-trace-operation';

export function getCorsOrigin(req?: Request): string {
  // Sem `req` (uso legado) mantem a origem de producao fixa.
  if (!req) return ALLOWED_ORIGINS[0];
  const origin = req.headers.get('origin') || '';
  if (!origin) return '';
  if (ALLOWED_ORIGINS.includes(origin) || originsExtras().includes(origin)) return origin;
  // Origem desconhecida: sem header, em vez de devolver uma origem que nao e dela.
  return '';
}

export function buildCorsHeaders(req?: Request): Record<string, string> {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Headers': ALLOWED_HEADERS,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Max-Age': '86400',
  };
  const origin = getCorsOrigin(req);
  if (origin) headers['Access-Control-Allow-Origin'] = origin;
  return headers;
}

/** @deprecated Use buildCorsHeaders(req) instead for proper origin validation */
export const corsHeaders = buildCorsHeaders();
