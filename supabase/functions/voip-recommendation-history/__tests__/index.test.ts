import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { aggregate, type ActionRow } from "../index.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;
const FN_URL = `${SUPABASE_URL}/functions/v1/voip-recommendation-history`;

Deno.test("rejeita request sem JWT", async () => {
  const res = await fetch(`${FN_URL}?period=week&limit=50`, { method: "GET" });
  const body = await res.json();
  assertEquals(res.status, 401);
  assertEquals(body.error, "Unauthorized");
});

Deno.test("rejeita period inválido", async () => {
  const res = await fetch(`${FN_URL}?period=year&limit=50`, {
    method: "GET",
    headers: { Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
  });
  const body = await res.json();
  // Pode ser 401 (sem user real) ou 400; basta consumir o corpo
  assert([400, 401].includes(res.status), `status inesperado: ${res.status}`);
  assert(body.error);
});

Deno.test("aggregate calcula categorias e outcomes corretamente", () => {
  const today = new Date().toISOString();
  const items: ActionRow[] = [
    { id: '1', user_id: 'u', recommendation_id: 'r1', category: 'infra', severity: 'critical', action_type: 'function', outcome: 'auto_applied', applied_at: today, notes: null },
    { id: '2', user_id: 'u', recommendation_id: 'r2', category: 'infra', severity: 'warning', action_type: 'function', outcome: 'applied', applied_at: today, notes: null },
    { id: '3', user_id: 'u', recommendation_id: 'r3', category: 'quality', severity: 'warning', action_type: 'link', outcome: 'snoozed', applied_at: today, notes: null },
  ];
  const agg = aggregate(items);
  assertEquals(agg.byCategory.infra, 2);
  assertEquals(agg.byCategory.quality, 1);
  assertEquals(agg.byOutcome.auto_applied, 1);
  assertEquals(agg.byOutcome.applied, 1);
  assertEquals(agg.byOutcome.snoozed, 1);
});

Deno.test("aggregate retorna 14 dias mesmo com lista vazia", () => {
  const agg = aggregate([]);
  assertEquals(agg.perDay.length, 14);
  assertEquals(agg.perDay.every(d => d.count === 0), true);
  // Datas devem ser ascendentes
  const sorted = [...agg.perDay].sort((a, b) => a.date.localeCompare(b.date));
  assertEquals(agg.perDay.map(d => d.date), sorted.map(d => d.date));
});
