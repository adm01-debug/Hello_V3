import { assertEquals, assert, assertStringIncludes } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { buildBlockedIpEmail, handler } from '../index.ts';

const URL_ = 'https://cfmlmcdyjuotqobjapng.supabase.co/functions/v1/notify-blocked-ip';

const corpo = {
  ip: '198.51.100.7',
  email: 'alguem@empresa.com',
  country: 'Brasil',
  city: 'Rio de Janeiro',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0)',
  timestamp: '2026-11-24T12:00:00.000Z',
};

Deno.test('notify-blocked-ip: sem header Authorization devolve 401', async () => {
  const res = await handler(new Request(URL_, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(corpo),
  }));

  assertEquals(res.status, 401);
  const body = await res.json();
  assertEquals(body.code, 'UNAUTHORIZED');
});

Deno.test('notify-blocked-ip: preflight OPTIONS responde com CORS da origem permitida', async () => {
  const res = await handler(new Request(URL_, {
    method: 'OPTIONS',
    headers: { Origin: 'https://hello-v3.vercel.app' },
  }));

  assertEquals(res.headers.get('Access-Control-Allow-Origin'), 'https://hello-v3.vercel.app');
});

Deno.test('notify-blocked-ip: HTML do alerta escapa todo valor vindo do corpo', () => {
  const html = buildBlockedIpEmail({
    ...corpo,
    userAgent: '<img src=x onerror=alert(1)>',
    email: '"><script>alert(2)</script>',
    ip: '<script>alert(3)</script>',
  });

  assert(!html.includes('<script>'), 'script cru nao pode aparecer no HTML');
  assert(!html.includes('<img src=x'), 'tag crua nao pode aparecer no HTML');
  assertStringIncludes(html, '&lt;script&gt;alert(3)&lt;/script&gt;');
  assertStringIncludes(html, '&lt;img src=x onerror=alert(1)&gt;');
  assertStringIncludes(html, '&quot;&gt;&lt;script&gt;alert(2)');
});

Deno.test('notify-blocked-ip: template do alerta permanece igual para dados normais', () => {
  const html = buildBlockedIpEmail(corpo);

  assertStringIncludes(html, 'Acesso Bloqueado');
  assertStringIncludes(html, '<strong>Email:</strong> alguem@empresa.com');
  assertStringIncludes(html, '<p><strong>IP:</strong> <code>198.51.100.7</code></p>');
  assertStringIncludes(html, 'Rio de Janeiro, Brasil');
  assertStringIncludes(html, 'Mozilla/5.0 (Windows NT 10.0)');
});
