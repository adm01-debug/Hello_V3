import { assertEquals, assert, assertStringIncludes } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { handler } from '../index.ts';

const URL_ = 'https://cfmlmcdyjuotqobjapng.supabase.co/functions/v1/email-inbound';

const payload = {
  from: 'cliente@exemplo.com',
  from_name: 'Cliente',
  to: ['suporte@empresa.com'],
  subject: 'Preciso de ajuda',
  body_text: 'Oi, tudo bem?',
  message_id: 'msg-abc-123',
};

function post(body: unknown): Request {
  return new Request(URL_, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

Deno.test('email-inbound: sem message_id devolve 422 (sem chave nao ha idempotencia)', async () => {
  const { message_id: _ignorado, ...semId } = payload;
  const res = await handler(post(semId));

  assertEquals(res.status, 422);
  const body = await res.json();
  assertStringIncludes(body.error, 'message_id');
});

Deno.test('email-inbound: from/subject ausentes continuam devolvendo 400', async () => {
  const res = await handler(post({ message_id: 'x' }));

  assertEquals(res.status, 400);
});

Deno.test('email-inbound: subject acima do teto devolve 422 com o campo apontado', async () => {
  const res = await handler(post({ ...payload, subject: 'x'.repeat(999) }));

  assertEquals(res.status, 422);
  const body = await res.json();
  assertEquals(body.code, 'VALIDATION_ERROR');
  assertEquals(body.fields[0].field, 'subject');
});

Deno.test('email-inbound: ticket ja existente responde 200 idempotent_replay sem escrever', async () => {
  const chamadas: { method: string; url: string }[] = [];
  const server = Deno.serve(
    { port: 0, hostname: '127.0.0.1', onListen: () => {} },
    (req) => {
      chamadas.push({ method: req.method, url: req.url });
      return new Response(JSON.stringify([{ conversation_id: 'conv-existente' }]), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
  );
  const port = (server.addr as Deno.NetAddr).port;
  const antigoUrl = Deno.env.get('SUPABASE_URL');
  const antigaKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  Deno.env.set('SUPABASE_URL', `http://127.0.0.1:${port}`);
  Deno.env.set('SUPABASE_SERVICE_ROLE_KEY', 'chave-de-teste');

  try {
    const res = await handler(post(payload));

    assertEquals(res.status, 200);
    const body = await res.json();
    assertEquals(body.idempotent_replay, true);
    assertEquals(body.conversation_id, 'conv-existente');

    // So pode haver a consulta de leitura: nenhuma escrita antes do pre-check.
    assertEquals(chamadas.length, 1);
    assertEquals(chamadas[0].method, 'GET');
    assertStringIncludes(chamadas[0].url, '/rest/v1/email_tickets');
    assertStringIncludes(chamadas[0].url, 'message_id=eq.msg-abc-123');
  } finally {
    await server.shutdown();
    if (antigoUrl === undefined) Deno.env.delete('SUPABASE_URL');
    else Deno.env.set('SUPABASE_URL', antigoUrl);
    if (antigaKey === undefined) Deno.env.delete('SUPABASE_SERVICE_ROLE_KEY');
    else Deno.env.set('SUPABASE_SERVICE_ROLE_KEY', antigaKey);
  }
});

Deno.test('email-inbound: primeira entrega cria conversa, ticket e mensagem', async () => {
  const escritas: string[] = [];
  const server = Deno.serve(
    { port: 0, hostname: '127.0.0.1', onListen: () => {} },
    async (req) => {
      const url = new URL(req.url);
      const json = (data: unknown, status = 200) =>
        new Response(JSON.stringify(data), {
          status,
          headers: { 'Content-Type': 'application/json', 'Content-Range': '0-0/0' },
        });

      if (req.method === 'GET') {
        // Nenhum ticket/contato/conversa previa: caminho de criacao.
        if (url.pathname.endsWith('/agents')) return json([{ name: 'Ana' }]);
        return json([]);
      }
      if (req.method === 'POST') {
        escritas.push(url.pathname);
        if (url.pathname.endsWith('/conversations')) return json({ id: 'conv-nova' }, 201);
        return new Response(null, { status: 201 });
      }
      return json({});
    }
  );
  const port = (server.addr as Deno.NetAddr).port;
  const antigoUrl = Deno.env.get('SUPABASE_URL');
  const antigaKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  Deno.env.set('SUPABASE_URL', `http://127.0.0.1:${port}`);
  Deno.env.set('SUPABASE_SERVICE_ROLE_KEY', 'chave-de-teste');

  try {
    const res = await handler(post(payload));

    assertEquals(res.status, 200);
    const body = await res.json();
    assertEquals(body.success, true);
    assertEquals(body.conversation_id, 'conv-nova');
    assert(!body.idempotent_replay);
    assertEquals(escritas, [
      '/rest/v1/conversations',
      '/rest/v1/email_tickets',
      '/rest/v1/conversation_messages',
    ]);
  } finally {
    await server.shutdown();
    if (antigoUrl === undefined) Deno.env.delete('SUPABASE_URL');
    else Deno.env.set('SUPABASE_URL', antigoUrl);
    if (antigaKey === undefined) Deno.env.delete('SUPABASE_SERVICE_ROLE_KEY');
    else Deno.env.set('SUPABASE_SERVICE_ROLE_KEY', antigaKey);
  }
});

Deno.test('email-inbound: preflight OPTIONS responde com CORS da origem permitida', async () => {
  const res = await handler(new Request(URL_, {
    method: 'OPTIONS',
    headers: { Origin: 'https://hello-v3.vercel.app' },
  }));

  assertEquals(res.headers.get('Access-Control-Allow-Origin'), 'https://hello-v3.vercel.app');
});

Deno.test('email-inbound: assinatura errada devolve 401 invalid_signature quando exigida', async () => {
  Deno.env.set('EMAIL_WEBHOOK_SECRET', 's3gr3do');
  Deno.env.set('WEBHOOK_ENFORCE_EMAIL_INBOUND_SIGNATURE', 'true');
  try {
    const res = await handler(new Request(URL_, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-signature': 'deadbeef' },
      body: JSON.stringify(payload),
    }));

    assertEquals(res.status, 401);
    assertEquals((await res.json()).code, 'invalid_signature');
  } finally {
    Deno.env.delete('EMAIL_WEBHOOK_SECRET');
    Deno.env.delete('WEBHOOK_ENFORCE_EMAIL_INBOUND_SIGNATURE');
  }
});

Deno.test('email-inbound: sem o segredo configurado a entrega segue aceita (modo observacao)', async () => {
  const server = Deno.serve({ port: 0, hostname: '127.0.0.1', onListen: () => {} }, () =>
    new Response('[]', { headers: { 'Content-Type': 'application/json', 'Content-Range': '0-0/0' } }));
  const port = (server.addr as Deno.NetAddr).port;
  const antigoUrl = Deno.env.get('SUPABASE_URL');
  const antigaKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  Deno.env.set('SUPABASE_URL', `http://127.0.0.1:${port}`);
  Deno.env.set('SUPABASE_SERVICE_ROLE_KEY', 'chave-de-teste');
  Deno.env.delete('EMAIL_WEBHOOK_SECRET');
  Deno.env.delete('WEBHOOK_ENFORCE_EMAIL_INBOUND_SIGNATURE');

  try {
    const res = await handler(post({ ...payload, subject: 'x'.repeat(999) }));
    assertEquals(res.status, 422);
  } finally {
    await server.shutdown();
    if (antigoUrl === undefined) Deno.env.delete('SUPABASE_URL');
    else Deno.env.set('SUPABASE_URL', antigoUrl);
    if (antigaKey === undefined) Deno.env.delete('SUPABASE_SERVICE_ROLE_KEY');
    else Deno.env.set('SUPABASE_SERVICE_ROLE_KEY', antigaKey);
  }
});
