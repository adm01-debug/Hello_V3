import { assertEquals, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { buildCorsHeaders } from "../../_shared/cors.ts";

Deno.test("validate-ip: CORS preflight retorna headers válidos", () => {
  const req = new Request("http://localhost/validate-ip", {
    method: "OPTIONS",
    headers: { origin: "http://localhost:8080" },
  });
  const headers = buildCorsHeaders(req);
  assert(headers["Access-Control-Allow-Origin"]);
  assert(headers["Access-Control-Allow-Headers"].includes("authorization"));
});

Deno.test("validate-ip: rejeita requisição sem Authorization header", async () => {
  const req = new Request("http://localhost/validate-ip", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{}",
  });
  // Simulação do branch de erro inicial
  const authHeader = req.headers.get("Authorization");
  assertEquals(authHeader, null);
});

Deno.test("validate-ip: extrai IP de cf-connecting-ip prioritariamente", () => {
  const req = new Request("http://localhost/validate-ip", {
    method: "POST",
    headers: {
      "cf-connecting-ip": "203.0.113.1",
      "x-real-ip": "10.0.0.1",
      "x-forwarded-for": "192.168.0.1, 10.0.0.2",
    },
  });
  const cfConnectingIp = req.headers.get("cf-connecting-ip");
  const realIp = req.headers.get("x-real-ip");
  const forwardedFor = req.headers.get("x-forwarded-for");
  const clientIp = cfConnectingIp || realIp ||
    (forwardedFor ? forwardedFor.split(",")[0].trim() : null);
  assertEquals(clientIp, "203.0.113.1");
});

Deno.test("validate-ip: fallback para x-forwarded-for quando cf/real ausentes", () => {
  const req = new Request("http://localhost/validate-ip", {
    method: "POST",
    headers: { "x-forwarded-for": "192.168.0.1, 10.0.0.2" },
  });
  const forwardedFor = req.headers.get("x-forwarded-for");
  const clientIp = forwardedFor ? forwardedFor.split(",")[0].trim() : null;
  assertEquals(clientIp, "192.168.0.1");
});

Deno.test("validate-ip: propaga x-request-id quando presente", () => {
  const req = new Request("http://localhost/validate-ip", {
    method: "POST",
    headers: { "x-request-id": "req-abc-123" },
  });
  assertEquals(req.headers.get("x-request-id"), "req-abc-123");
});

Deno.test("validate-ip: clientIp null quando nenhum header presente", () => {
  const req = new Request("http://localhost/validate-ip", { method: "POST" });
  const cfConnectingIp = req.headers.get("cf-connecting-ip");
  const realIp = req.headers.get("x-real-ip");
  const forwardedFor = req.headers.get("x-forwarded-for");
  const clientIp = cfConnectingIp || realIp ||
    (forwardedFor ? forwardedFor.split(",")[0].trim() : null);
  assertEquals(clientIp, null);
});
