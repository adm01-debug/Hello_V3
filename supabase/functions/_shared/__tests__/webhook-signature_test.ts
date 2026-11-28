import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { hmacHex, verifyHmac } from '../webhook-signature.ts';

const corpo = '{"a": 1, "b": "dois"}';

function req(headers: Record<string, string> = {}): Request {
  return new Request('https://exemplo.test/webhook', { method: 'POST', headers, body: corpo });
}

function comAmbiente(vars: Record<string, string | undefined>, fn: () => Promise<void>) {
  const antes: Record<string, string | undefined> = {};
  for (const k of Object.keys(vars)) {
    antes[k] = Deno.env.get(k);
    if (vars[k] === undefined) Deno.env.delete(k);
    else Deno.env.set(k, vars[k]!);
  }
  return fn().finally(() => {
    for (const k of Object.keys(vars)) {
      if (antes[k] === undefined) Deno.env.delete(k);
      else Deno.env.set(k, antes[k]!);
    }
  });
}

Deno.test('webhook-signature: assinatura correta em x-signature', async () => {
  await comAmbiente({ EMAIL_WEBHOOK_SECRET: 's3gr3do' }, async () => {
    const sig = hmacHex(corpo, 's3gr3do');
    assertEquals(await verifyHmac(req({ 'x-signature': sig }), corpo, 'EMAIL_WEBHOOK_SECRET'), 'valid');
  });
});

Deno.test('webhook-signature: aceita o prefixo sha256=', async () => {
  await comAmbiente({ EMAIL_WEBHOOK_SECRET: 's3gr3do' }, async () => {
    const sig = hmacHex(corpo, 's3gr3do');
    assertEquals(await verifyHmac(req({ 'x-signature': `sha256=${sig}` }), corpo, 'EMAIL_WEBHOOK_SECRET'), 'valid');
  });
});

Deno.test('webhook-signature: corpo alterado invalida a assinatura', async () => {
  await comAmbiente({ EMAIL_WEBHOOK_SECRET: 's3gr3do' }, async () => {
    const sig = hmacHex(corpo, 's3gr3do');
    const adulterado = JSON.stringify(JSON.parse(corpo));
    assertEquals(await verifyHmac(req({ 'x-signature': sig }), adulterado, 'EMAIL_WEBHOOK_SECRET'), 'invalid');
  });
});

Deno.test('webhook-signature: sem cabecalho e sem segredo sao estados distintos', async () => {
  await comAmbiente({ EMAIL_WEBHOOK_SECRET: 's3gr3do' }, async () => {
    assertEquals(await verifyHmac(req(), corpo, 'EMAIL_WEBHOOK_SECRET'), 'missing');
  });
  await comAmbiente({ EMAIL_WEBHOOK_SECRET: undefined }, async () => {
    assertEquals(await verifyHmac(req({ 'x-signature': 'x' }), corpo, 'EMAIL_WEBHOOK_SECRET'), 'not_configured');
  });
});
