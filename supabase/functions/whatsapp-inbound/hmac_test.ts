import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { hmacHex } from '../_shared/webhook-signature.ts';

const URL_ = 'https://cfmlmcdyjuotqobjapng.supabase.co/functions/v1/whatsapp-inbound';
const CORPO = JSON.stringify({ message_id: 'msg-hmac-1', from: '5511988887777', message: 'oi' });

function comAmbiente(vars: Record<string, string | undefined>): () => void {
  const antes: Record<string, string | undefined> = {};
  for (const k of Object.keys(vars)) {
    antes[k] = Deno.env.get(k);
    if (vars[k] === undefined) Deno.env.delete(k);
    else Deno.env.set(k, vars[k]!);
  }
  return () => {
    for (const k of Object.keys(vars)) {
      if (antes[k] === undefined) Deno.env.delete(k);
      else Deno.env.set(k, antes[k]!);
    }
  };
}

function post(headers: Record<string, string>): Request {
  return new Request(URL_, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: CORPO,
  });
}

Deno.test('whatsapp-inbound: assinatura errada com enforce ligado devolve 401 invalid_signature', async () => {
  const restaurar = comAmbiente({ WAVOIP_WEBHOOK_SECRET: 'segredo', WEBHOOK_ENFORCE_WAVOIP_SIGNATURE: 'true' });
  try {
    const { handler } = await import('./index.ts');
    const res = await handler(post({ 'x-signature': 'nao-e-a-assinatura' }));

    assertEquals(res.status, 401);
    assertEquals((await res.json()).code, 'invalid_signature');
  } finally {
    restaurar();
  }
});

Deno.test('whatsapp-inbound: sem cabecalho de assinatura e enforce ligado devolve 401', async () => {
  const restaurar = comAmbiente({ WAVOIP_WEBHOOK_SECRET: 'segredo', WEBHOOK_ENFORCE_WAVOIP_SIGNATURE: 'true' });
  try {
    const { handler } = await import('./index.ts');
    assertEquals((await handler(post({}))).status, 401);
  } finally {
    restaurar();
  }
});

Deno.test('whatsapp-inbound: sem segredo configurado o modo observacao nao bloqueia', async () => {
  const restaurar = comAmbiente({ WAVOIP_WEBHOOK_SECRET: undefined, WEBHOOK_ENFORCE_WAVOIP_SIGNATURE: undefined });
  try {
    const { handler } = await import('./index.ts');
    const res = await handler(post({ 'x-signature': 'qualquer' }));
    // Segue para validacao de schema/banco: nao e 401 de assinatura.
    assertEquals(res.status === 401, false);
  } finally {
    restaurar();
  }
});

Deno.test('whatsapp-inbound: assinatura correta passa pela verificacao', async () => {
  const restaurar = comAmbiente({ WAVOIP_WEBHOOK_SECRET: 'segredo', WEBHOOK_ENFORCE_WAVOIP_SIGNATURE: 'true' });
  try {
    const { handler } = await import('./index.ts');
    const res = await handler(post({ 'x-signature': hmacHex(CORPO, 'segredo') }));
    assertEquals(res.status === 401, false);
  } finally {
    restaurar();
  }
});
