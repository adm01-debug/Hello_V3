// deno-lint-ignore-file no-explicit-any
import { assertEquals, assertRejects, assert } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { _resetAllCircuits, resilientFetch, CircuitOpenError } from "../resilience.ts";

function mockFetchSequence(responses: Array<{ status: number; body?: string } | Error>) {
  let i = 0;
  return async (_input: string | URL | Request, _init?: RequestInit): Promise<Response> => {
    const r = responses[Math.min(i, responses.length - 1)];
    i++;
    if (r instanceof Error) throw r;
    return new Response(r.body ?? "", { status: r.status });
  };
}

const originalFetch = globalThis.fetch;

Deno.test("resilientFetch: sucesso em 2xx passa direto", async () => {
  _resetAllCircuits();
  globalThis.fetch = mockFetchSequence([{ status: 200, body: "ok" }]) as typeof fetch;
  try {
    const res = await resilientFetch("t1", "https://x", undefined, {
      retry: { retries: 0, sleep: async () => {} },
    });
    assertEquals(res.status, 200);
    assertEquals(await res.text(), "ok");
  } finally { globalThis.fetch = originalFetch; }
});

Deno.test("resilientFetch: 500 é reciclado e sucede na 3ª tentativa", async () => {
  _resetAllCircuits();
  globalThis.fetch = mockFetchSequence([
    { status: 500 }, { status: 502 }, { status: 200, body: "recovered" },
  ]) as typeof fetch;
  try {
    const res = await resilientFetch("t2", "https://x", undefined, {
      retry: { retries: 3, baseDelayMs: 1, sleep: async () => {} },
    });
    assertEquals(res.status, 200);
    assertEquals(await res.text(), "recovered");
  } finally { globalThis.fetch = originalFetch; }
});

Deno.test("resilientFetch: 404 NÃO é reciclado", async () => {
  _resetAllCircuits();
  let calls = 0;
  globalThis.fetch = (async () => { calls++; return new Response("", { status: 404 }); }) as typeof fetch;
  try {
    const res = await resilientFetch("t3", "https://x", undefined, {
      retry: { retries: 3, sleep: async () => {} },
    });
    assertEquals(res.status, 404);
    assertEquals(calls, 1);
  } finally { globalThis.fetch = originalFetch; }
});

Deno.test("resilientFetch: 500 esgota retries e propaga", async () => {
  _resetAllCircuits();
  globalThis.fetch = mockFetchSequence([
    { status: 500 }, { status: 500 }, { status: 500 }, { status: 500 },
  ]) as typeof fetch;
  try {
    await assertRejects(() =>
      resilientFetch("t4", "https://x", undefined, {
        retry: { retries: 2, baseDelayMs: 1, sleep: async () => {} },
      })
    );
  } finally { globalThis.fetch = originalFetch; }
});

Deno.test("resilientFetch: erro de rede reciclado", async () => {
  _resetAllCircuits();
  globalThis.fetch = mockFetchSequence([
    new TypeError("network fetch failed"),
    { status: 200, body: "ok" },
  ]) as typeof fetch;
  try {
    const res = await resilientFetch("t5", "https://x", undefined, {
      retry: { retries: 2, baseDelayMs: 1, sleep: async () => {} },
    });
    assertEquals(res.status, 200);
    assertEquals(await res.text(), "ok");
  } finally { globalThis.fetch = originalFetch; }
});

Deno.test("resilientFetch: breaker abre após limiar e bloqueia próximas", async () => {
  _resetAllCircuits();
  let now = 0;
  globalThis.fetch = (async () => new Response("", { status: 500 })) as typeof fetch;
  try {
    // 3 falhas → abre
    for (let i = 0; i < 3; i++) {
      await assertRejects(() =>
        resilientFetch("ai-gw", "https://x", undefined, {
          retry: { retries: 0, sleep: async () => {} },
          breaker: { failureThreshold: 3, openDurationMs: 5000, now: () => now },
        })
      );
    }
    // 4ª chamada → CircuitOpenError imediato
    await assertRejects(
      () => resilientFetch("ai-gw", "https://x", undefined, {
        retry: { retries: 0, sleep: async () => {} },
        breaker: { failureThreshold: 3, openDurationMs: 5000, now: () => now },
      }),
      CircuitOpenError,
    );
  } finally { globalThis.fetch = originalFetch; }
});

Deno.test("resilientFetch: fuzz 200 cenários de status HTTP variados", async () => {
  const statuses = [200, 201, 204, 301, 400, 401, 403, 404, 409, 422, 429, 500, 502, 503, 504];
  let ok = 0, retriedOk = 0, permanent = 0;
  for (let i = 0; i < 200; i++) {
    _resetAllCircuits();
    const seq = Array.from({ length: 4 }, (_, k) => ({
      status: statuses[(i * 7 + k * 3) % statuses.length],
    }));
    globalThis.fetch = mockFetchSequence(seq) as typeof fetch;
    try {
      const res = await resilientFetch(`fuzz-${i}`, "https://x", undefined, {
        retry: { retries: 3, baseDelayMs: 1, jitter: false, sleep: async () => {} },
        breaker: { failureThreshold: 100, openDurationMs: 1000 },
      });
      await res.text();
      if (res.status < 400) ok++;
      else retriedOk++;
    } catch { permanent++; }
  }
  globalThis.fetch = originalFetch;
  assert(ok + retriedOk + permanent === 200);
  // deve haver pelo menos alguns de cada categoria
  assert(ok > 0, "esperava sucessos");
  assert(permanent > 0, "esperava falhas terminais");
});
