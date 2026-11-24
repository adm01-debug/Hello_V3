import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { ipMatchesAny, ipMatchesRange } from "./ip-range.ts";

Deno.test("IPv4: endereco puro casa so com ele mesmo", () => {
  assertEquals(ipMatchesRange("203.0.113.7", "203.0.113.7"), true);
  assertEquals(ipMatchesRange("203.0.113.8", "203.0.113.7"), false);
});

Deno.test("IPv4: dentro e fora da faixa /24", () => {
  assertEquals(ipMatchesRange("203.0.113.7", "203.0.113.0/24"), true);
  assertEquals(ipMatchesRange("203.0.113.255", "203.0.113.0/24"), true);
  assertEquals(ipMatchesRange("203.0.114.1", "203.0.113.0/24"), false);
});

Deno.test("IPv4: /32 e exato", () => {
  assertEquals(ipMatchesRange("198.51.100.4", "198.51.100.4/32"), true);
  assertEquals(ipMatchesRange("198.51.100.5", "198.51.100.4/32"), false);
});

Deno.test("IPv4: /0 casa qualquer endereco da familia", () => {
  assertEquals(ipMatchesRange("8.8.8.8", "0.0.0.0/0"), true);
});

Deno.test("IPv4: prefixo que nao cai em octeto cheio", () => {
  // 10.0.0.0/12 cobre 10.0.0.0 - 10.15.255.255
  assertEquals(ipMatchesRange("10.15.255.254", "10.0.0.0/12"), true);
  assertEquals(ipMatchesRange("10.16.0.1", "10.0.0.0/12"), false);
  // 192.168.0.0/17 cobre 192.168.0.0 - 192.168.127.255
  assertEquals(ipMatchesRange("192.168.127.255", "192.168.0.0/17"), true);
  assertEquals(ipMatchesRange("192.168.128.0", "192.168.0.0/17"), false);
});

Deno.test("IPv4: a faixa e mascarada pelo prefixo, como no inet", () => {
  // No Postgres `10.0.0.5/24` e a mesma rede de `10.0.0.0/24`.
  assertEquals(ipMatchesRange("10.0.0.9", "10.0.0.5/24"), true);
});

Deno.test("IPv6: /64 dentro e fora", () => {
  assertEquals(ipMatchesRange("2001:db8:abcd:12::1", "2001:db8:abcd:12::/64"), true);
  assertEquals(ipMatchesRange("2001:db8:abcd:13::1", "2001:db8:abcd:12::/64"), false);
});

Deno.test("IPv6: /128 e endereco literal", () => {
  assertEquals(ipMatchesRange("2001:db8::1", "2001:db8::1/128"), true);
  assertEquals(ipMatchesRange("2001:db8::2", "2001:db8::1/128"), false);
  assertEquals(ipMatchesRange("2001:db8::1", "2001:db8::1"), true);
});

Deno.test("IPv6: ::/0 casa qualquer endereco da familia", () => {
  assertEquals(ipMatchesRange("2001:db8::dead:beef", "::/0"), true);
  assertEquals(ipMatchesRange("::1", "::/0"), true);
});

Deno.test("IPv6: prefixo /10 de link-local", () => {
  assertEquals(ipMatchesRange("fe80::1", "fe80::/10"), true);
  assertEquals(ipMatchesRange("fec0::1", "fe80::/10"), false);
});

Deno.test("IPv6: maiusculas e zona nao mudam o resultado", () => {
  assertEquals(ipMatchesRange("2001:DB8::1", "2001:db8::/32"), true);
  assertEquals(ipMatchesRange("fe80::1%eth0", "fe80::/10"), true);
});

Deno.test("familia diferente nunca casa", () => {
  assertEquals(ipMatchesRange("192.0.2.1", "::/0"), false);
  assertEquals(ipMatchesRange("2001:db8::1", "0.0.0.0/0"), false);
  // Igual ao inet: IPv4-mapeado e familia IPv6 e nao casa com faixa IPv4.
  assertEquals(ipMatchesRange("::ffff:192.0.2.1", "192.0.2.0/24"), false);
  assertEquals(ipMatchesRange("::ffff:192.0.2.1", "::ffff:192.0.2.0/120"), true);
});

Deno.test("entrada invalida casa com nada, em vez de estourar", () => {
  assertEquals(ipMatchesRange("999.0.0.1", "0.0.0.0/0"), false);
  assertEquals(ipMatchesRange("203.0.113.7", "203.0.113.0/33"), false);
  assertEquals(ipMatchesRange("203.0.113.7", "203.0.113.0/"), false);
  assertEquals(ipMatchesRange("203.0.113.7", ""), false);
  assertEquals(ipMatchesRange("", "0.0.0.0/0"), false);
  assertEquals(ipMatchesRange("203.0.113.7", "203.0.113.0/24/8"), false);
  assertEquals(ipMatchesRange("2001:db8::1", "2001:db8::/129"), false);
  assertEquals(ipMatchesRange(":::", "::/0"), false);
  assertEquals(ipMatchesRange("2001:db8::1", "2001:db8:::1"), false);
});

Deno.test("lista de 50 faixas: uma passada, sem ida ao banco por faixa", () => {
  const entradas = [
    { ip_address: "203.0.113.0/24", is_cidr: true },
    ...Array.from({ length: 48 }, (_, i) => ({ ip_address: `198.51.${i}.0/24`, is_cidr: true })),
    { ip_address: "192.0.2.77", is_cidr: false },
  ];
  assertEquals(entradas.length, 50);
  assertEquals(ipMatchesAny("203.0.113.9", entradas), true);
  assertEquals(ipMatchesAny("198.51.42.10", entradas), true);
  assertEquals(ipMatchesAny("192.0.2.77", entradas), true);
  assertEquals(ipMatchesAny("192.0.2.78", entradas), false);
});

Deno.test("lista ausente ou vazia nao autoriza ninguem", () => {
  assertEquals(ipMatchesAny("203.0.113.9", null), false);
  assertEquals(ipMatchesAny("203.0.113.9", []), false);
  assertEquals(ipMatchesAny(null, [{ ip_address: "0.0.0.0/0" }]), false);
});