import { loadSync } from 'https://deno.land/std@0.224.0/dotenv/mod.ts';
loadSync({ allowEmptyValues: true, examplePath: "" });
import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';

const SUPABASE_URL = Deno.env.get('VITE_SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('VITE_SUPABASE_PUBLISHABLE_KEY')!;
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/voip-quality-heatmap`;

Deno.test('voip-quality-heatmap: rejects without auth', async () => {
  if (!SUPABASE_URL || SUPABASE_URL.includes('mock.supabase.co')) return;
  const res = await fetch(FUNCTION_URL, { method: 'GET' });
  await res.text();
  assertEquals(res.status, 401);
});

Deno.test('voip-quality-heatmap: handles OPTIONS', async () => {
  if (!SUPABASE_URL || SUPABASE_URL.includes('mock.supabase.co')) return;
  const res = await fetch(FUNCTION_URL, {
    method: 'OPTIONS',
    headers: { Origin: 'http://localhost:8080' },
  });
  await res.text();
  assertEquals(res.status, 200);
});

Deno.test('voip-quality-heatmap: rejects invalid days', async () => {
  if (!SUPABASE_URL || SUPABASE_URL.includes('mock.supabase.co')) return;
  const res = await fetch(`${FUNCTION_URL}?days=abc`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      apikey: SUPABASE_ANON_KEY,
    },
  });
  await res.text();
  // 401 (anon não tem claims) ou 400 (validação)
  assertEquals([400, 401].includes(res.status), true);
});

Deno.test('voip-quality-heatmap: returns x-request-id header', async () => {
  if (!SUPABASE_URL || SUPABASE_URL.includes('mock.supabase.co')) return;
  const res = await fetch(FUNCTION_URL, { method: 'GET' });
  await res.text();
  const reqId = res.headers.get('x-request-id');
  assertEquals(typeof reqId === 'string' && reqId.length > 0, true);
});
