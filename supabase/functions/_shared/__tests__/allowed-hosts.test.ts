import { assertEquals, assertThrows, assert } from "https://deno.land/std@0.208.0/assert/mod.ts";
import {
  assertSafeOutboundUrl,
  classifyHost,
  isHostAllowed,
  SsrfBlockedError,
} from "../allowed-hosts.ts";

Deno.test("aceita hosts públicos https", () => {
  const url = assertSafeOutboundUrl("https://api.bitrix24.com.br/rest/x.json");
  assertEquals(url.hostname, "api.bitrix24.com.br");
  assert(isHostAllowed("https://hello-v3.vercel.app/"));
});

Deno.test("bloqueia loopback, metadata e esquemas perigosos", () => {
  for (const target of [
    "http://localhost:5432/",
    "http://127.0.0.1/",
    "http://127.1.2.3/",
    "http://169.254.169.254/latest/meta-data/",
    "http://[::1]/",
    "http://[fe80::1]/",
    "file:///etc/passwd",
    "gopher://example.com/",
    "https://user:pass@example.com/",
  ]) {
    assertThrows(() => assertSafeOutboundUrl(target), SsrfBlockedError, undefined, target);
  }
});

Deno.test("faixas privadas são liberáveis apenas com allowPrivate", () => {
  for (const target of ["http://10.1.2.3/", "http://192.168.0.10/", "http://172.20.0.1/", "http://[fd00::1]/"]) {
    assert(classifyHost(new URL(target).hostname) !== null, `esperava bloqueio para ${target}`);
    assertSafeOutboundUrl(target, { allowPrivate: true });
  }
});

Deno.test("metadata continua bloqueada mesmo com allowPrivate", () => {
  assertThrows(
    () => assertSafeOutboundUrl("http://169.254.169.254/", { allowPrivate: true }),
    SsrfBlockedError,
  );
});

Deno.test("whitelist de sufixo e portas", () => {
  assertSafeOutboundUrl("https://api.bitrix24.com.br/rest/", { allowedHostSuffixes: ["bitrix24.com.br"] });
  assertThrows(
    () => assertSafeOutboundUrl("https://evil.com.br/", { allowedHostSuffixes: ["bitrix24.com.br"] }),
    SsrfBlockedError,
  );
  assertSafeOutboundUrl("https://example.com:8443/", { allowedPorts: [8443] });
  assertThrows(
    () => assertSafeOutboundUrl("https://example.com:22/", { allowedPorts: [443] }),
    SsrfBlockedError,
  );
});

Deno.test("classifyHost trata host vazio e domínios internos", () => {
  assertEquals(classifyHost(""), "host vazio");
  assertEquals(classifyHost("db.internal"), "domínio interno");
  assertEquals(classifyHost("api.example.com"), null);
});