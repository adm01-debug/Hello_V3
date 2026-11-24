import { assertEquals, assert } from 'https://deno.land/std@0.208.0/assert/mod.ts';
import { ChatWidgetSessionSchema } from './schema.ts';

Deno.test('ChatWidgetSessionSchema aceita corpo vazio (create sem body)', () => {
  assertEquals(ChatWidgetSessionSchema.safeParse({}).success, true);
});

Deno.test('ChatWidgetSessionSchema aceita as tres acoes', () => {
  for (const action of ['create', 'send_message', 'fetch_messages']) {
    assertEquals(ChatWidgetSessionSchema.safeParse({ action }).success, true);
  }
});

Deno.test('ChatWidgetSessionSchema recusa message acima do teto (A-129)', () => {
  const r = ChatWidgetSessionSchema.safeParse({ action: 'send_message', visitor_token: 'v', message: 'x'.repeat(4001) });
  assertEquals(r.success, false);
  assert(!r.success && r.error.errors.some((e) => e.path.join('.') === 'message'));
});

Deno.test('ChatWidgetSessionSchema recusa visitor_email acima do teto', () => {
  const r = ChatWidgetSessionSchema.safeParse({ visitor_email: 'a'.repeat(255) });
  assertEquals(r.success, false);
});

Deno.test('ChatWidgetSessionSchema recusa acao desconhecida', () => {
  assertEquals(ChatWidgetSessionSchema.safeParse({ action: 'delete_all' }).success, false);
});
