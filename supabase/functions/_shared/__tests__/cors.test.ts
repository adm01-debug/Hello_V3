import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { buildCorsHeaders, getCorsOrigin } from "../cors.ts";

function req(origin?: string): Request {
  return new Request("https://cfmlmcdyjuotqobjapng.supabase.co/functions/v1/x", {
    headers: origin ? { Origin: origin } : {},
  });
}

Deno.test("cors: origem de producao (Vercel) e ecoada", () => {
  const origin = "https://hello-v3.vercel.app";
  assertEquals(getCorsOrigin(req(origin)), origin);
  assertEquals(buildCorsHeaders(req(origin))["Access-Control-Allow-Origin"], origin);
});

Deno.test("cors: origem desconhecida nao recebe Access-Control-Allow-Origin", () => {
  const headers = buildCorsHeaders(req("https://atacante.example"));
  assertEquals(headers["Access-Control-Allow-Origin"], undefined);
  assertEquals(getCorsOrigin(req("https://atacante.example")), "");
});

Deno.test("cors: subdominio arbitrario de lovable.app nao e aceito por padrao", () => {
  const headers = buildCorsHeaders(req("https://qualquer-coisa.lovable.app"));
  assertEquals(headers["Access-Control-Allow-Origin"], undefined);
});

Deno.test("cors: preview da Lovable em uso continua liberado pela lista", () => {
  const origin = "https://id-preview--e326811c-e59a-4850-bf9e-cfc9d6748662.lovable.app";
  assertEquals(buildCorsHeaders(req(origin))["Access-Control-Allow-Origin"], origin);
});

Deno.test("cors: localhost segue liberado para o desenvolvimento", () => {
  for (const origin of ["http://localhost:8086", "http://localhost:5173", "http://localhost:3000"]) {
    assertEquals(buildCorsHeaders(req(origin))["Access-Control-Allow-Origin"], origin);
  }
});

Deno.test("cors: sem header Origin nao emite Access-Control-Allow-Origin", () => {
  const headers = buildCorsHeaders(req());
  assertEquals(headers["Access-Control-Allow-Origin"], undefined);
  assertEquals(headers["Access-Control-Allow-Methods"].includes("OPTIONS"), true);
});

Deno.test("cors: CORS_EXTRA_ORIGINS libera origem adicional", () => {
  const anterior = Deno.env.get("CORS_EXTRA_ORIGINS");
  Deno.env.set("CORS_EXTRA_ORIGINS", "https://app.exemplo.com, https://outro.exemplo.com");
  try {
    assertEquals(getCorsOrigin(req("https://outro.exemplo.com")), "https://outro.exemplo.com");
    assertEquals(getCorsOrigin(req("https://nao-listado.exemplo.com")), "");
  } finally {
    if (anterior === undefined) Deno.env.delete("CORS_EXTRA_ORIGINS");
    else Deno.env.set("CORS_EXTRA_ORIGINS", anterior);
  }
});

Deno.test("cors: preflight anuncia os headers usados pelo front", () => {
  const headers = buildCorsHeaders(req("https://hello-v3.vercel.app"));
  for (const esperado of ["authorization", "apikey", "content-type", "x-client-info"]) {
    assert(headers["Access-Control-Allow-Headers"].includes(esperado));
  }
});
