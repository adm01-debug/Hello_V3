import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { clientIpFromHeaders, isIpLiteral } from "./client-ip.ts";

Deno.test("isIpLiteral aceita IPv4 e IPv6 validos", () => {
  assertEquals(isIpLiteral("203.0.113.10"), true);
  assertEquals(isIpLiteral("10.0.0.1"), true);
  assertEquals(isIpLiteral("2001:db8::1"), true);
  assertEquals(isIpLiteral("  10.0.0.1  "), true);
});

Deno.test("isIpLiteral rejeita hostname, porta, path e query", () => {
  assertEquals(isIpLiteral("attacker.example/api"), false);
  assertEquals(isIpLiteral("127.0.0.1:8080"), false);
  assertEquals(isIpLiteral("1.2.3.4/../admin"), false);
  assertEquals(isIpLiteral("1.2.3.4?q=1"), false);
  assertEquals(isIpLiteral(""), false);
});

Deno.test("isIpLiteral rejeita octeto fora da faixa e valor longo", () => {
  assertEquals(isIpLiteral("256.1.1.1"), false);
  assertEquals(isIpLiteral("999.999.999.999"), false);
  assertEquals(isIpLiteral("a".repeat(60)), false);
});

Deno.test("clientIpFromHeaders prioriza cf-connecting-ip e valida o valor", () => {
  const ok = new Headers({ 'cf-connecting-ip': '203.0.113.10', 'x-forwarded-for': 'evil/host' });
  assertEquals(clientIpFromHeaders(ok), '203.0.113.10');

  const hostileCf = new Headers({ 'cf-connecting-ip': 'evil/host', 'x-real-ip': '203.0.113.11' });
  assertEquals(clientIpFromHeaders(hostileCf), '203.0.113.11');

  const onlyHostile = new Headers({ 'x-forwarded-for': 'attacker.example/api, 10.0.0.1' });
  assertEquals(clientIpFromHeaders(onlyHostile), null);

  const list = new Headers({ 'x-forwarded-for': ' 198.51.100.7 ,10.0.0.1' });
  assertEquals(clientIpFromHeaders(list), '198.51.100.7');

  assertEquals(clientIpFromHeaders(new Headers()), null);
});
