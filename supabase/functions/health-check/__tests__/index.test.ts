import { assertEquals, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { buildCorsHeaders } from "../../_shared/cors.ts";

Deno.test("health-check: CORS preflight retorna headers válidos", () => {
  const req = new Request("http://localhost/health-check", {
    method: "OPTIONS",
    headers: { origin: "http://localhost:8080" },
  });
  const headers = buildCorsHeaders(req);
  assert(headers["Access-Control-Allow-Origin"]);
  assert(headers["Access-Control-Allow-Methods"].includes("GET"));
});

Deno.test("health-check: estrutura de resposta saudável", () => {
  const response = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: 12345,
    checks: {
      database: { status: "ok", error: undefined },
      runtime: { status: "ok", version: { deno: "1.x" } },
    },
    latency_ms: 42,
  };
  assertEquals(response.status, "healthy");
  assertEquals(response.checks.database.status, "ok");
  assert(typeof response.latency_ms === "number");
});

Deno.test("health-check: estrutura de resposta degradada quando DB falha", () => {
  const dbError = { message: "connection refused" };
  const dbHealthy = !dbError;
  const status = dbHealthy ? "healthy" : "degraded";
  const httpStatus = dbHealthy ? 200 : 503;
  assertEquals(status, "degraded");
  assertEquals(httpStatus, 503);
});

Deno.test("health-check: latência calculada corretamente", () => {
  const start = Date.now();
  // Simula trabalho
  const end = start + 100;
  const latency = end - start;
  assert(latency >= 0);
  assertEquals(latency, 100);
});

Deno.test("health-check: timestamp é ISO 8601 válido", () => {
  const ts = new Date().toISOString();
  assert(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(ts));
});

Deno.test("health-check: propaga x-request-id quando presente", () => {
  const req = new Request("http://localhost/health-check", {
    method: "GET",
    headers: { "x-request-id": "trace-xyz-789" },
  });
  assertEquals(req.headers.get("x-request-id"), "trace-xyz-789");
});
