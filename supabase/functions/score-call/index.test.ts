import { assertEquals, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { computeWeightedTotal } from "./index.ts";

const criteria = [
  { id: "a", max_score: 10, weight: 2 },
  { id: "b", max_score: 5, weight: 1 },
];

// A-029: a IA pode devolver nota acima do max_score do critério; o total
// exibido não pode passar de 100% (mesma regra de auto-scorecard/index.ts).
Deno.test("computeWeightedTotal — limita a nota ao max_score do critério", () => {
  const { total, max } = computeWeightedTotal(
    [{ criterion_id: "a", score: 100 }, { criterion_id: "b", score: 5 }],
    criteria,
  );
  assertEquals(total, 25); // 10*2 + 5*1, não 100*2 + 5*1
  assertEquals(max, 25);
  assert(total <= max, `total ${total} não pode passar de max ${max}`);
});

Deno.test("computeWeightedTotal — nota negativa vira zero", () => {
  const { total } = computeWeightedTotal([{ criterion_id: "a", score: -5 }], criteria);
  assertEquals(total, 0);
});

Deno.test("computeWeightedTotal — soma ponderada normal", () => {
  const { total, max } = computeWeightedTotal(
    [{ criterion_id: "a", score: 8 }, { criterion_id: "b", score: 3 }],
    criteria,
  );
  assertEquals(total, 19); // 8*2 + 3*1
  assertEquals(max, 25);
});

Deno.test("computeWeightedTotal — critério desconhecido é ignorado", () => {
  const { total } = computeWeightedTotal([{ criterion_id: "zzz", score: 999 }], criteria);
  assertEquals(total, 0);
});

Deno.test("computeWeightedTotal — denominador permanece max_score ponderado", () => {
  const { max } = computeWeightedTotal([], criteria);
  assertEquals(max, 25);
});