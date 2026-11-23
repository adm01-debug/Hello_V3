import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { checkRateLimitDB } from "../rate-limit.ts";

const ENDPOINT = "endpoint-de-teste";
const SERVICE_KEY = "service-role-de-teste";

/** Stub do PostgREST para controlar a resposta da RPC e a indisponibilidade do banco. */
async function startStub(payload: unknown, status = 200) {
  let resolvePort: (p: number) => void = () => {};
  const portPromise = new Promise<number>((resolve) => {
    resolvePort = resolve;
  });
  const server = Deno.serve({
    port: 0,
    hostname: "127.0.0.1",
    onListen: (addr) => resolvePort((addr as Deno.NetAddr).port),
  }, () =>
    new Response(JSON.stringify(payload), {
      status,
      headers: { "Content-Type": "application/json" },
    }));
  return { server, port: await portPromise };
}

function apontarPara(port: number) {
  Deno.env.set("SUPABASE_URL", `http://127.0.0.1:${port}`);
  Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", SERVICE_KEY);
}

Deno.test("rate-limit: DB liberado devolve allowed", async () => {
  const stub = await startStub({ allowed: true, remaining: 5 });
  apontarPara(stub.port);
  try {
    const rate = await checkRateLimitDB("1.2.3.4", ENDPOINT);
    assertEquals(rate.allowed, true);
    assertEquals(rate.remaining, 5);
  } finally {
    await stub.server.shutdown();
  }
});

Deno.test("rate-limit: DB bloqueando devolve allowed=false com motivo", async () => {
  const stub = await startStub({
    allowed: false,
    reason: "IP blocked due to rate limit violation",
    retry_after: 3600,
  });
  apontarPara(stub.port);
  try {
    const rate = await checkRateLimitDB("1.2.3.4", ENDPOINT, undefined, { onError: "deny" });
    assertEquals(rate.allowed, false);
    assertEquals(rate.retryAfter, 3600);
  } finally {
    await stub.server.shutdown();
  }
});

Deno.test("rate-limit: erro do banco segue fail-open por padrao", async () => {
  const stub = await startStub({ message: "boom" }, 400);
  apontarPara(stub.port);
  try {
    assertEquals((await checkRateLimitDB("1.2.3.4", ENDPOINT)).allowed, true);
    assertEquals((await checkRateLimitDB("1.2.3.4", ENDPOINT, undefined, {})).allowed, true);
  } finally {
    await stub.server.shutdown();
  }
});

Deno.test("rate-limit: erro do banco nega quando onError=deny", async () => {
  const stub = await startStub({ message: "boom" }, 400);
  apontarPara(stub.port);
  try {
    const rate = await checkRateLimitDB("1.2.3.4", ENDPOINT, undefined, { onError: "deny" });
    assertEquals(rate.allowed, false);
    assertEquals(rate.reason, "rate_limit_unavailable");
    assert(typeof rate.retryAfter === "number");
  } finally {
    await stub.server.shutdown();
  }
});

Deno.test("rate-limit: banco inalcancavel nega quando onError=deny e libera sem a opcao", async () => {
  apontarPara(9); // porta 9 (discard): conexao recusada
  const negado = await checkRateLimitDB("1.2.3.4", ENDPOINT, undefined, { onError: "deny" });
  assertEquals(negado.allowed, false);
  assertEquals(negado.reason, "rate_limit_unavailable");

  const liberado = await checkRateLimitDB("1.2.3.4", ENDPOINT);
  assertEquals(liberado.allowed, true);
});
