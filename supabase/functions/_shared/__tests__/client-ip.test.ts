// Resgate do teste de IP literal (branch claude/fix-validate-geo-ip-261122-0500).
// O modulo de validacao foi incorporado a _shared/client-ip.ts, mas o teste dele
// nunca entrou: validate-geo deixava o header do cliente chegar cru na URL do
// provedor de geo (hostname, porta, path). Estes casos travam essa regressao.
import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { isIpLiteral, clientIpFromHeaders } from '../client-ip.ts';

Deno.test('isIpLiteral aceita IPv4 e IPv6 validos', () => {
  assertEquals(isIpLiteral('203.0.113.10'), true);
  assertEquals(isIpLiteral('10.0.0.1'), true);
  assertEquals(isIpLiteral('2001:db8::1'), true);
});

Deno.test('isIpLiteral rejeita hostname, porta e path', () => {
  assertEquals(isIpLiteral('attacker.example/api'), false);
  assertEquals(isIpLiteral('127.0.0.1:8080'), false);
  assertEquals(isIpLiteral('1.2.3.4/../admin'), false);
  assertEquals(isIpLiteral(''), false);
});

Deno.test('isIpLiteral rejeita octeto fora da faixa e valor longo', () => {
  assertEquals(isIpLiteral('256.1.1.1'), false);
  assertEquals(isIpLiteral('a'.repeat(60)), false);
});

Deno.test('clientIpFromHeaders so devolve IP literal valido', () => {
  assertEquals(clientIpFromHeaders(new Headers({ 'cf-connecting-ip': '203.0.113.10' })), '203.0.113.10');
  assertEquals(clientIpFromHeaders(new Headers({ 'x-forwarded-for': '203.0.113.7, 10.0.0.1' })), '203.0.113.7');
  assertEquals(clientIpFromHeaders(new Headers({ 'cf-connecting-ip': 'attacker.example/api' })), null);
  assertEquals(clientIpFromHeaders(new Headers({ 'x-real-ip': '1.2.3.4/../admin' })), null);
  assertEquals(clientIpFromHeaders(new Headers()), null);
});
