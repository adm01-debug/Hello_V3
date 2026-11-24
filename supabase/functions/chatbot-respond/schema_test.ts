import { assertEquals, assert } from 'https://deno.land/std@0.208.0/assert/mod.ts';
import { ChatbotRespondSchema } from './schema.ts';

const convId = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';

Deno.test('ChatbotRespondSchema aceita corpo valido', () => {
  const r = ChatbotRespondSchema.safeParse({ conversation_id: convId, user_message: 'oi', visitor_token: 'tok' });
  assertEquals(r.success, true);
});

Deno.test('ChatbotRespondSchema recusa user_message acima do teto (A-129)', () => {
  const r = ChatbotRespondSchema.safeParse({ conversation_id: convId, user_message: 'x'.repeat(4001) });
  assertEquals(r.success, false);
  assert(!r.success && r.error.errors.some((e) => e.path.join('.') === 'user_message'));
});

Deno.test('ChatbotRespondSchema recusa conversation_id que nao e uuid', () => {
  const r = ChatbotRespondSchema.safeParse({ conversation_id: 'abc', user_message: 'oi' });
  assertEquals(r.success, false);
});

Deno.test('ChatbotRespondSchema recusa visitor_token acima do teto', () => {
  const r = ChatbotRespondSchema.safeParse({ conversation_id: convId, user_message: 'oi', visitor_token: 't'.repeat(201) });
  assertEquals(r.success, false);
});
