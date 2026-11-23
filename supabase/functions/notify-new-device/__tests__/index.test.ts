import { assertEquals, assert, assertStringIncludes } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { buildNewDeviceEmail, handler } from '../index.ts';

const URL_ = 'https://cfmlmcdyjuotqobjapng.supabase.co/functions/v1/notify-new-device';

const corpo = {
  ip: '203.0.113.10',
  country: 'Brasil',
  city: 'São Paulo',
  browser: 'Chrome',
  os: 'Windows',
  device: 'Desktop',
  timestamp: '2026-11-24T12:00:00.000Z',
  isNewIP: true,
  isNewBrowser: true,
};

Deno.test('notify-new-device: sem header Authorization devolve 401', async () => {
  const res = await handler(new Request(URL_, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(corpo),
  }));

  assertEquals(res.status, 401);
  const body = await res.json();
  assertEquals(body.code, 'UNAUTHORIZED');
  assert(res.headers.get('Content-Type')?.includes('application/json'));
});

Deno.test('notify-new-device: header Authorization vazio tambem devolve 401', async () => {
  const res = await handler(new Request(URL_, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: '' },
    body: JSON.stringify(corpo),
  }));

  assertEquals(res.status, 401);
});

Deno.test('notify-new-device: preflight OPTIONS responde com CORS da origem permitida', async () => {
  const res = await handler(new Request(URL_, {
    method: 'OPTIONS',
    headers: { Origin: 'https://hello-v3.vercel.app' },
  }));

  assertEquals(res.headers.get('Access-Control-Allow-Origin'), 'https://hello-v3.vercel.app');
  assert(res.headers.get('Access-Control-Allow-Headers')?.includes('authorization'));
});

Deno.test('notify-new-device: HTML do aviso escapa todo valor vindo do corpo', () => {
  const html = buildNewDeviceEmail({
    ...corpo,
    ip: '<script>alert(1)</script>',
    city: '<img src=x onerror=alert(2)>',
    device: '"quoted"',
  }, '<b>Invasor</b> & cia');

  assert(!html.includes('<script>'), 'script cru nao pode aparecer no HTML');
  assert(!html.includes('<img src=x'), 'tag crua nao pode aparecer no HTML');
  assertStringIncludes(html, '&lt;script&gt;alert(1)&lt;/script&gt;');
  assertStringIncludes(html, '&lt;img src=x onerror=alert(2)&gt;');
  assertStringIncludes(html, '&lt;b&gt;Invasor&lt;/b&gt; &amp; cia');
  assertStringIncludes(html, '&quot;quoted&quot;');
});

Deno.test('notify-new-device: template visual permanece igual para dados normais', () => {
  const html = buildNewDeviceEmail(corpo, 'Maria');

  assertStringIncludes(html, 'Novo Login Detectado');
  assertStringIncludes(html, 'Novo endereço IP, Novo navegador/dispositivo');
  assertStringIncludes(html, '<p>Olá, Maria,</p>');
  assertStringIncludes(html, 'São Paulo, Brasil');
  assertStringIncludes(html, 'Chrome • Windows • Desktop');
  assertStringIncludes(html, '203.0.113.10');
  assertStringIncludes(html, 'Não foi você?');
});
