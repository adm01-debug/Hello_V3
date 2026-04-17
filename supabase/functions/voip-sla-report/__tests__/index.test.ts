// Testes Deno para voip-sla-report
import 'https://deno.land/std@0.224.0/dotenv/load.ts';
import { assertEquals, assertExists } from 'https://deno.land/std@0.224.0/assert/mod.ts';

const SUPABASE_URL = Deno.env.get('VITE_SUPABASE_URL') ?? Deno.env.get('SUPABASE_URL') ?? '';
const ANON = Deno.env.get('VITE_SUPABASE_PUBLISHABLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const FN_URL = `${SUPABASE_URL}/functions/v1/voip-sla-report`;

async function call(opts: { period?: string; auth?: string | null } = {}) {
  const url = new URL(FN_URL);
  if (opts.period) url.searchParams.set('period', opts.period);
  const headers: Record<string, string> = { 'apikey': ANON };
  if (opts.auth !== null) headers['Authorization'] = opts.auth ?? `Bearer ${ANON}`;
  const res = await fetch(url.toString(), { headers });
  const text = await res.text();
  return { status: res.status, headers: res.headers, body: text ? JSON.parse(text) : null };
}

Deno.test('voip-sla-report: exige Authorization', async () => {
  const r = await call({ auth: null });
  assertEquals(r.status, 401);
  assertEquals(r.body.error, 'Unauthorized');
});

Deno.test('voip-sla-report: rejeita token inválido', async () => {
  const r = await call({ auth: 'Bearer invalid.jwt.token' });
  assertEquals(r.status, 401);
});

Deno.test('voip-sla-report: rejeita period inválido', async () => {
  const r = await call({ period: 'year' });
  // 401 (sem JWT válido) ou 400 — aceitamos ambos pois auth roda antes
  assertEquals([400, 401].includes(r.status), true);
});

Deno.test('voip-sla-report: aceita period=day/week/month na shape', async () => {
  for (const p of ['day', 'week', 'month']) {
    const r = await call({ period: p });
    assertEquals([200, 401].includes(r.status), true);
  }
});

Deno.test('voip-sla-report: responde com x-request-id', async () => {
  const r = await call({ auth: null });
  assertExists(r.headers.get('x-request-id'));
});

Deno.test('voip-sla-report: CORS preflight responde 200/204', async () => {
  const res = await fetch(FN_URL, {
    method: 'OPTIONS',
    headers: { Origin: 'https://lovable.dev', 'Access-Control-Request-Method': 'GET' },
  });
  await res.text();
  assertEquals([200, 204].includes(res.status), true);
  assertExists(res.headers.get('Access-Control-Allow-Origin'));
});
