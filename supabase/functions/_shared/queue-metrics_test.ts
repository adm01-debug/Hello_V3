import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  abandonmentRate,
  averageWaitTime,
  serviceLevel,
  type QueueCallSample,
} from "./queue-metrics.ts";

// Os mesmos casos existem em src/lib/__tests__/queue-metrics.test.ts: as duas
// copias da formula precisam concordar.
const chamada = (status: string, hold: number | null): QueueCallSample => ({
  status,
  hold_time_seconds: hold,
});

Deno.test("serviceLevel: lista vazia devolve null", () => {
  assertEquals(serviceLevel([], 20), null);
});

Deno.test("serviceLevel: limiar inclusivo", () => {
  assertEquals(serviceLevel([chamada("completed", 20)], 20), 100);
  assertEquals(serviceLevel([chamada("completed", 21)], 20), 0);
});

Deno.test("serviceLevel: abandonada entra no denominador", () => {
  assertEquals(serviceLevel([chamada("completed", 10), chamada("abandoned", 30)], 20), 50);
});

Deno.test("serviceLevel: todas abandonadas = 0", () => {
  assertEquals(serviceLevel([chamada("abandoned", 5), chamada("abandoned", 50)], 20), 0);
});

Deno.test("serviceLevel: ignora espera nao mensuravel", () => {
  assertEquals(serviceLevel([chamada("completed", 5), chamada("completed", null)], 20), 100);
  assertEquals(serviceLevel([chamada("completed", null)], 20), null);
});

Deno.test("serviceLevel: limiar invalido devolve null", () => {
  assertEquals(serviceLevel([chamada("completed", 5)], -1), null);
  assertEquals(serviceLevel([chamada("completed", 5)], Number.NaN), null);
});

Deno.test("abandonmentRate: sem desfecho devolve null", () => {
  assertEquals(abandonmentRate([]), null);
  assertEquals(abandonmentRate([chamada("missed", 12)]), null);
});

Deno.test("abandonmentRate: proporcao e extremos", () => {
  assertEquals(
    abandonmentRate([
      chamada("completed", 5),
      chamada("completed", 9),
      chamada("completed", 7),
      chamada("abandoned", 40),
    ]),
    25,
  );
  assertEquals(abandonmentRate([chamada("abandoned", 5)]), 100);
  assertEquals(abandonmentRate([chamada("completed", 5)]), 0);
});

Deno.test("averageWaitTime: media, nulos e zero", () => {
  assertEquals(averageWaitTime([]), null);
  assertEquals(averageWaitTime([chamada("completed", 10), chamada("abandoned", 20)]), 15);
  assertEquals(averageWaitTime([chamada("completed", 10), chamada("completed", null)]), 10);
  assertEquals(averageWaitTime([chamada("completed", null)]), null);
  assertEquals(averageWaitTime([chamada("completed", 0)]), 0);
});
