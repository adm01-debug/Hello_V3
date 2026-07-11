// deno-lint-ignore-file no-explicit-any
import { assertEquals, assertRejects, assert } from "https://deno.land/std@0.208.0/assert/mod.ts";
import {
  CircuitOpenError,
  _resetAllCircuits,
  computeBackoff,
  getCircuitState,
  resilientCall,
  retry,
  withCircuitBreaker,
} from "../resilience.ts";

Deno.test("retry: sucesso na primeira tentativa não dorme", async () => {
  let calls = 0;
  const sleeps: number[] = [];
  const out = await retry(async () => {
    calls++;
    return 42;
  }, { sleep: async (ms) => { sleeps.push(ms); } });
  assertEquals(out, 42);
  assertEquals(calls, 1);
  assertEquals(sleeps.length, 0);
});

Deno.test("retry: exponencial sem jitter é determinístico", async () => {
  const sleeps: number[] = [];
  let calls = 0;
  await assertRejects(() =>
    retry(async () => {
      calls++;
      throw new Error("network timeout");
    }, {
      retries: 3,
      baseDelayMs: 100,
      maxDelayMs: 10_000,
      jitter: false,
      sleep: async (ms) => { sleeps.push(ms); },
    })
  );
  assertEquals(calls, 4);
  assertEquals(sleeps, [100, 200, 400]);
});

Deno.test("retry: respeita shouldRetry (não repete em 4xx)", async () => {
  let calls = 0;
  await assertRejects(() =>
    retry(async () => {
      calls++;
      const e: any = new Error("bad request");
      e.status = 400;
      throw e;
    }, { sleep: async () => {} })
  );
  assertEquals(calls, 1);
});

Deno.test("retry: repete em 429 e 5xx", async () => {
  for (const status of [429, 500, 502, 503, 504]) {
    let calls = 0;
    await assertRejects(() =>
      retry(async () => {
        calls++;
        const e: any = new Error("x");
        e.status = status;
        throw e;
      }, { retries: 2, sleep: async () => {} })
    );
    assertEquals(calls, 3, `status ${status}`);
  }
});

Deno.test("computeBackoff: full jitter em [0, exp]", () => {
  // 500 simulated random draws — property test
  for (let i = 0; i < 500; i++) {
    const attempt = i % 6;
    const base = 100;
    const max = 5000;
    const rng = () => (i * 9301 + 49297) % 233280 / 233280;
    const v = computeBackoff(attempt, base, max, true, rng);
    const exp = Math.min(max, base * 2 ** attempt);
    assert(v >= 0 && v <= exp, `v=${v} exp=${exp}`);
  }
});

Deno.test("circuitBreaker: abre após N falhas consecutivas", async () => {
  _resetAllCircuits();
  const key = "svc-a";
  let now = 0;
  const opts = { failureThreshold: 3, openDurationMs: 1000, now: () => now };
  for (let i = 0; i < 3; i++) {
    await assertRejects(() =>
      withCircuitBreaker(key, () => Promise.reject(new Error("boom")), opts)
    );
  }
  assertEquals(getCircuitState(key), "OPEN");
  // Próxima chamada é bloqueada imediatamente
  await assertRejects(
    () => withCircuitBreaker(key, () => Promise.resolve(1), opts),
    CircuitOpenError,
  );
});

Deno.test("circuitBreaker: OPEN → HALF_OPEN → CLOSED após sucesso", async () => {
  _resetAllCircuits();
  const key = "svc-b";
  let now = 1000;
  const opts = { failureThreshold: 2, openDurationMs: 500, now: () => now };
  await assertRejects(() => withCircuitBreaker(key, () => Promise.reject(new Error("x")), opts));
  await assertRejects(() => withCircuitBreaker(key, () => Promise.reject(new Error("x")), opts));
  assertEquals(getCircuitState(key), "OPEN");
  now += 600; // cooldown elapsed
  const ok = await withCircuitBreaker(key, () => Promise.resolve("ok"), opts);
  assertEquals(ok, "ok");
  assertEquals(getCircuitState(key), "CLOSED");
});

Deno.test("circuitBreaker: HALF_OPEN falha → volta a OPEN", async () => {
  _resetAllCircuits();
  const key = "svc-c";
  let now = 0;
  const opts = { failureThreshold: 2, openDurationMs: 100, now: () => now };
  await assertRejects(() => withCircuitBreaker(key, () => Promise.reject(new Error("x")), opts));
  await assertRejects(() => withCircuitBreaker(key, () => Promise.reject(new Error("x")), opts));
  now += 200;
  await assertRejects(() => withCircuitBreaker(key, () => Promise.reject(new Error("x")), opts));
  assertEquals(getCircuitState(key), "OPEN");
});

Deno.test("resilientCall: integração retry + breaker (400 cenários aleatórios)", async () => {
  // Simula 400 cenários com padrões variados de falha
  let opened = 0, recovered = 0, permanent = 0;
  for (let scenario = 0; scenario < 400; scenario++) {
    _resetAllCircuits();
    const key = `sim-${scenario}`;
    let now = 0;
    const failUntil = scenario % 8;
    let calls = 0;
    try {
      await resilientCall(key, async () => {
        calls++;
        now += 10;
        if (calls <= failUntil) {
          const e: any = new Error("timeout");
          throw e;
        }
        return "ok";
      }, {
        retry: { retries: 5, baseDelayMs: 1, maxDelayMs: 4, jitter: false, sleep: async () => {} },
        breaker: { failureThreshold: 10, openDurationMs: 50, now: () => now },
      });
      recovered++;
    } catch (err) {
      if (err instanceof CircuitOpenError) opened++;
      else permanent++;
    }
  }
  // Todos os cenários com failUntil <=5 devem recuperar; os >5 não
  assert(recovered > 0);
  assert(permanent > 0);
  assertEquals(opened, 0, "breaker não deveria abrir com threshold=10 e max 6 falhas");
});
