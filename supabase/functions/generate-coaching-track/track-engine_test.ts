import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import {
  aggregateStats,
  buildTrackCandidates,
  computeWeaknesses,
  MIN_SAMPLES,
  SCORE_THRESHOLD,
  CallSession,
} from "./track-engine.ts";

const now = new Date("2026-01-01T12:00:00Z");

function session(agent: string, summaries: Array<{ p: number | null; s: number | null }>): CallSession {
  return {
    id: `s-${agent}-${summaries.length}`,
    agent_name: agent,
    started_at: "2025-12-28T00:00:00Z",
    call_summaries: summaries.map((m, i) => ({
      agent_performance_score: m.p,
      customer_satisfaction: m.s,
      summary: `summary ${i}`,
    })),
  };
}

Deno.test("aggregateStats agrega por agente", () => {
  const stats = aggregateStats([
    session("A", [{ p: 4, s: 3 }, { p: 2, s: 1 }]),
    session("B", [{ p: 5, s: 5 }]),
  ]);
  assertEquals(stats.size, 2);
  const a = stats.get("A")!;
  assertEquals(a.perfSum, 6);
  assertEquals(a.satSum, 4);
  assertEquals(a.count, 2);
});

Deno.test("computeWeaknesses identifica só satisfação abaixo do alvo", () => {
  // avgPerf = 8/2 = 4 (ok); avgSat = 2/2 = 1 (abaixo)
  const w = computeWeaknesses({ agent_name: "A", perfSum: 8, satSum: 2, count: 2 });
  assertEquals(w.length, 1);
  assertEquals(w[0].key, "satisfacao");
});

Deno.test("computeWeaknesses considera null como 0", () => {
  const w = computeWeaknesses({ agent_name: "A", perfSum: 0, satSum: 0, count: 2 });
  assertEquals(w.length, 2);
});

Deno.test("computeWeaknesses não gera fraqueza quando dentro do alvo", () => {
  // avgPerf = 8/2 = 4; avgSat = 8/2 = 4
  const w = computeWeaknesses({ agent_name: "A", perfSum: 8, satSum: 8, count: 2 });
  assertEquals(w.length, 0);
});

Deno.test("buildTrackCandidates respeita mínimo de amostras", () => {
  const { candidates, skipped } = buildTrackCandidates(
    [session("A", [{ p: 1, s: 1 }, { p: 1, s: 1 }])],
    new Set(),
    now,
  );
  assertEquals(candidates.length, 0);
  assertEquals(skipped.length, 1);
  assertEquals(skipped[0].reason.includes(`mínimo ${MIN_SAMPLES}`), true);
});

Deno.test("buildTrackCandidates cria trilha para desempenho baixo", () => {
  const sessions = [
    session("A", [{ p: 1, s: 4 }, { p: 2, s: 4 }, { p: 2, s: 4 }]),
  ];
  const { candidates, skipped } = buildTrackCandidates(sessions, new Set(), now);
  assertEquals(skipped.length, 0);
  assertEquals(candidates.length, 1);
  const c = candidates[0];
  assertEquals(c.agent_name, "A");
  assertEquals(c.priority, "high");
  assertEquals(c.status, "open");
  assertEquals(c.title.includes("desempenho geral"), true);
});

Deno.test("buildTrackCandidates pula agente com trilha aberta", () => {
  const sessions = [
    session("A", [{ p: 1, s: 1 }, { p: 1, s: 1 }, { p: 1, s: 1 }]),
  ];
  const { candidates, skipped } = buildTrackCandidates(sessions, new Set(["A"]), now);
  assertEquals(candidates.length, 0);
  assertEquals(skipped[0].reason, "já possui trilha aberta");
});

Deno.test("buildTrackCandidates pula agente dentro do alvo", () => {
  const sessions = [
    session("A", [{ p: 4, s: 4 }, { p: 5, s: 5 }, { p: 4, s: 4 }]),
  ];
  const { candidates, skipped } = buildTrackCandidates(sessions, new Set(), now);
  assertEquals(candidates.length, 0);
  assertEquals(skipped[0].reason, "desempenho e satisfação dentro do alvo");
});
