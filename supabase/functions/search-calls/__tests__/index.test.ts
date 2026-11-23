import { assertEquals, assert } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { handler } from '../index.ts';

const URL_ = 'https://cfmlmcdyjuotqobjapng.supabase.co/functions/v1/search-calls';

Deno.test('search-calls: sem header Authorization devolve 401 antes de qualquer consulta', async () => {
  const res = await handler(new Request(URL_, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: 'cancelamento' }),
  }));

  assertEquals(res.status, 401);
  const body = await res.json();
  assertEquals(body.error, 'Não autorizado');
  assert(res.headers.get('Content-Type')?.includes('application/json'));
});

Deno.test('search-calls: header Authorization vazio tambem devolve 401', async () => {
  const res = await handler(new Request(URL_, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: '' },
    body: JSON.stringify({ query: 'cancelamento' }),
  }));

  assertEquals(res.status, 401);
});

Deno.test('search-calls: preflight OPTIONS responde com CORS da origem permitida', async () => {
  const res = await handler(new Request(URL_, {
    method: 'OPTIONS',
    headers: { Origin: 'https://hello-v3.vercel.app' },
  }));

  assertEquals(res.headers.get('Access-Control-Allow-Origin'), 'https://hello-v3.vercel.app');
  assert(res.headers.get('Access-Control-Allow-Headers')?.includes('authorization'));
});

Deno.test('search-calls: preflight OPTIONS de origem desconhecida nao emite CORS', async () => {
  const res = await handler(new Request(URL_, {
    method: 'OPTIONS',
    headers: { Origin: 'https://origem-maliciosa.example' },
  }));

  assertEquals(res.headers.get('Access-Control-Allow-Origin'), null);
});
