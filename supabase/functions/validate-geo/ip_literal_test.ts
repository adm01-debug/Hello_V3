import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { isIpLiteral } from "./index.ts";

Deno.test("isIpLiteral aceita IPv4 e IPv6 validos", () => {
  assertEquals(isIpLiteral("203.0.113.10"), true);
  assertEquals(isIpLiteral("10.0.0.1"), true);
  assertEquals(isIpLiteral("2001:db8::1"), true);
});

Deno.test("isIpLiteral rejeita hostname, porta e path", () => {
  assertEquals(isIpLiteral("attacker.example/api"), false);
  assertEquals(isIpLiteral("127.0.0.1:8080"), false);
  assertEquals(isIpLiteral("1.2.3.4/../admin"), false);
  assertEquals(isIpLiteral(""), false);
});

Deno.test("isIpLiteral rejeita octeto fora da faixa e valor longo", () => {
  assertEquals(isIpLiteral("256.1.1.1"), false);
  assertEquals(isIpLiteral("a".repeat(60)), false);
});
