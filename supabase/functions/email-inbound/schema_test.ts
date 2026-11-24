import { assertEquals, assert } from 'https://deno.land/std@0.208.0/assert/mod.ts';
import { EmailInboundSchema } from './schema.ts';

const base = {
  from: 'cliente@example.com',
  to: ['suporte@hello.example'],
  subject: 'Pedido',
  message_id: '<abc@example.com>',
};

Deno.test('EmailInboundSchema aceita corpo valido', () => {
  const r = EmailInboundSchema.safeParse({ ...base, body_text: 'ola' });
  assertEquals(r.success, true);
});

Deno.test('EmailInboundSchema recusa subject acima do teto (A-129)', () => {
  const r = EmailInboundSchema.safeParse({ ...base, subject: 'x'.repeat(999) });
  assertEquals(r.success, false);
  assert(!r.success && r.error.errors.some((e) => e.path.join('.') === 'subject'));
});

Deno.test('EmailInboundSchema recusa ausencia de message_id (idempotencia)', () => {
  const { message_id: _omit, ...semId } = base;
  const r = EmailInboundSchema.safeParse(semId);
  assertEquals(r.success, false);
  assert(!r.success && r.error.errors.some((e) => e.path.join('.') === 'message_id'));
});

Deno.test('EmailInboundSchema recusa body_html acima do teto', () => {
  const r = EmailInboundSchema.safeParse({ ...base, body_html: 'x'.repeat(500001) });
  assertEquals(r.success, false);
});

Deno.test('EmailInboundSchema recusa remetente acima do teto', () => {
  const r = EmailInboundSchema.safeParse({ ...base, from: 'a'.repeat(321) });
  assertEquals(r.success, false);
});
