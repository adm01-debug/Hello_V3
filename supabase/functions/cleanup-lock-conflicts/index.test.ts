import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { loadSync } from 'https://deno.land/std@0.224.0/dotenv/mod.ts';
loadSync({ allowEmptyValues: true, examplePath: "" });

const SUPABASE_URL = Deno.env.get('VITE_SUPABASE_URL') ?? Deno.env.get('SUPABASE_URL') ?? '';

Deno.test('cleanup-lock-conflicts rejeita requisição sem Authorization', async () => {
  if (!SUPABASE_URL || SUPABASE_URL.includes('mock.supabase.co')) {
    console.warn('SUPABASE_URL ausente — pulando smoke test');
    return;
  }

  const res = await fetch(`${SUPABASE_URL}/functions/v1/cleanup-lock-conflicts`, {
    method: 'POST',
  });
  const body = await res.text();
  assertEquals(res.status, 401, `Esperado 401, recebido ${res.status} — body: ${body}`);
});

Deno.test('cleanup-lock-conflicts responde a preflight CORS', async () => {
  if (!SUPABASE_URL || SUPABASE_URL.includes('mock.supabase.co')) return;

  const res = await fetch(`${SUPABASE_URL}/functions/v1/cleanup-lock-conflicts`, {
    method: 'OPTIONS',
    headers: { Origin: 'https://lovable.dev' },
  });
  await res.text();
  assertEquals(res.status, 200);
});
