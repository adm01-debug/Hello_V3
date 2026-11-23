import { assertEquals, assert } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { contemHtml, handler } from '../index.ts';

const URL_ = 'https://cfmlmcdyjuotqobjapng.supabase.co/functions/v1/send-notification';

Deno.test('send-notification: sem header Authorization devolve 401', async () => {
  const res = await handler(new Request(URL_, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: '00000000-0000-0000-0000-000000000000', title: 'oi', message: 'oi' }),
  }));

  assertEquals(res.status, 401);
});

Deno.test('send-notification: preflight OPTIONS responde com CORS da origem permitida', async () => {
  const res = await handler(new Request(URL_, {
    method: 'OPTIONS',
    headers: { Origin: 'https://hello-v3.vercel.app' },
  }));

  assertEquals(res.headers.get('Access-Control-Allow-Origin'), 'https://hello-v3.vercel.app');
});

Deno.test('send-notification: contemHtml barra markup e libera texto comum', () => {
  assertEquals(contemHtml('<b>negrito</b>'), true);
  assertEquals(contemHtml('linha < script >alert(1)</script>'), true);
  assertEquals(contemHtml('<img src=x onerror=alert(1)>'), true);
  assertEquals(contemHtml('5 < 10 > 3'), false);
  assertEquals(contemHtml('Chamada de 12 min concluída'), false);
  assertEquals(contemHtml('Nota 9/10'), false);
  assert(contemHtml('</div>'));
});
