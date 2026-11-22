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

Deno.test("cors: origem desconhecida nao e ecoada (cai no default)", () => {
  const headers = buildCorsHeaders(req("https://atacante.example"));
  assert(headers["Access-Control-Allow-Origin"] !== "https://atacante.example");
  assertEquals(headers["Access-Control-Allow-Origin"], "https://hello-v3.vercel.app");
});

Deno.test("cors: sem header Origin nao quebra", () => {
  assertEquals(buildCorsHeaders(req())["Access-Control-Allow-Origin"], "https://hello-v3.vercel.app");
});

Deno.test("cors: CORS_EXTRA_ORIGINS libera origem adicional", () => {
  const anterior = Deno.env.get("CORS_EXTRA_ORIGINS");
  Deno.env.set("CORS_EXTRA_ORIGINS", "https://app.exemplo.com, https://outro.exemplo.com");
  try {
    assertEquals(getCorsOrigin(req("https://outro.exemplo.com")), "https://outro.exemplo.com");
    assertEquals(getCorsOrigin(req("https://nao-listado.exemplo.com")), "https://hello-v3.vercel.app");
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

Deno.test("cors: deprecado corsHeaders reflete origem de producao", async () => {
  // `corsHeaders` e avaliado uma unica vez no import; por isso o modulo e
  // importado com cache-buster para cada cenario.
  const mod = await import(`../cors.ts?v=${Date.now()}`);
  assertEquals(mod.corsHeaders["Access-Control-Allow-Origin"], "https://hello-v3.vercel.app");
});
