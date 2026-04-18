import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import 'https://deno.land/std@0.224.0/dotenv/load.ts';

const SUPABASE_URL = Deno.env.get('VITE_SUPABASE_URL') ?? Deno.env.get('SUPABASE_URL') ?? '';

Deno.test('cleanup-lock-conflicts rejeita requisição sem Authorization', async () => {
  if (!SUPABASE_URL) {
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
  if (!SUPABASE_URL) return;

  const res = await fetch(`${SUPABASE_URL}/functions/v1/cleanup-lock-conflicts`, {
    method: 'OPTIONS',
    headers: { Origin: 'https://lovable.dev' },
  });
  await res.text();
  assertEquals(res.status, 200);
});
