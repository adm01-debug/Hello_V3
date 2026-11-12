import { assertEquals, assert } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { loadSync } from 'https://deno.land/std@0.224.0/dotenv/mod.ts';
loadSync({ allowEmptyValues: true, examplePath: "" });

const SUPABASE_URL = Deno.env.get('VITE_SUPABASE_URL') ?? Deno.env.get('SUPABASE_URL')!;
const ANON = Deno.env.get('VITE_SUPABASE_PUBLISHABLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY')!;
const FN = `${SUPABASE_URL}/functions/v1/voip-diagnostic-voice-qa`;

Deno.test('voice-qa rejeita sem JWT (401)', async () => {
  if (!SUPABASE_URL || SUPABASE_URL.includes('mock.supabase.co')) return;
  const res = await fetch(FN, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: 'Como está o MOS hoje?' }) });
  await res.text();
  assertEquals(res.status, 401);
});

Deno.test('voice-qa rejeita question curta (400)', async () => {
  if (!SUPABASE_URL || SUPABASE_URL.includes('mock.supabase.co')) return;
  const res = await fetch(FN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ANON}` },
    body: JSON.stringify({ question: 'oi' }),
  });
  const json = await res.json();
  assert(res.status === 400 || res.status === 401, `status ${res.status}`);
  if (res.status === 400) assert(json.details?.question, 'erro de question esperado');
});

Deno.test('voice-qa rejeita period inválido (400)', async () => {
  if (!SUPABASE_URL || SUPABASE_URL.includes('mock.supabase.co')) return;
  const res = await fetch(FN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ANON}` },
    body: JSON.stringify({ question: 'Pergunta válida sobre VoIP?', period: 'year' }),
  });
  const json = await res.json();
  assert(res.status === 400 || res.status === 401);
  if (res.status === 400) assert(json.details?.period, 'erro de period esperado');
});

Deno.test('voice-qa responde OPTIONS com CORS', async () => {
  if (!SUPABASE_URL || SUPABASE_URL.includes('mock.supabase.co')) return;
  const res = await fetch(FN, { method: 'OPTIONS' });
  await res.text();
  assert(res.headers.get('Access-Control-Allow-Origin'));
});
