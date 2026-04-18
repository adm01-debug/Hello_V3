import { assertEquals, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { buildRecommendations } from "../index.ts";

const baseTs = (h: number) => new Date(Date.UTC(2025, 0, 1, h)).toISOString();

Deno.test("buildRecommendations — vazio quando não há risco", () => {
  const fc = Array.from({ length: 24 }, (_, i) => ({
    ts: baseTs(i), hour_offset: i + 1, mos_predicted: 4.2, volume_predicted: 5, is_risk: false,
  }));
  const r = buildRecommendations(fc, 5, 10);
  assertEquals(r.recommendations.length, 0);
  assertEquals(r.confidence, 100);
});

Deno.test("buildRecommendations — gera add_agents para risco de volume", () => {
  const fc = [{
    ts: baseTs(14), hour_offset: 14, mos_predicted: 4.0, volume_predicted: 50, is_risk: true,
    risk_reason: 'Volume previsto (50) > P95 histórico (10)',
  }];
  const r = buildRecommendations(fc, 5, 10);
  assert(r.recommendations.some(x => x.action_type === 'add_agents'));
});

Deno.test("buildRecommendations — gera shift_codec + pause_campaign + preheat para MOS crítico", () => {
  const fc = [{
    ts: baseTs(14), hour_offset: 14, mos_predicted: 2.8, volume_predicted: 5, is_risk: true,
    risk_reason: 'MOS previsto 2.80 < 3.5',
  }];
  const r = buildRecommendations(fc, 5, 10);
  const types = r.recommendations.map(x => x.action_type);
  assert(types.includes('shift_codec'));
  assert(types.includes('pause_campaign'));
  assert(types.includes('preheat_warmup'));
});
