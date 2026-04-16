import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Body { period?: "week" | "month" | "quarter" }

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing auth" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { period = "month" } = ((await req.json().catch(() => ({}))) as Body);
    const days = period === "week" ? 7 : period === "quarter" ? 90 : 30;
    const horizon = new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);

    const { data: deals } = await supabase
      .from("deals")
      .select("id, name, value_cents, probability, stage, expected_close_date, health_score, currency")
      .eq("status", "open")
      .lte("expected_close_date", horizon);

    const list = deals ?? [];
    const totalPipeline = list.reduce((s, d) => s + Number(d.value_cents), 0);
    const weightedForecast = list.reduce((s, d) => {
      const prob = Number(d.probability) / 100;
      const health = d.health_score != null ? Number(d.health_score) / 100 : 0.6;
      const composite = (prob * 0.7) + (health * 0.3);
      return s + Number(d.value_cents) * composite;
    }, 0);

    const bestCase = list.reduce((s, d) =>
      s + Number(d.value_cents) * (Number(d.probability) / 100), 0);
    const commit = list
      .filter((d) => Number(d.probability) >= 70 && (d.health_score ?? 0) >= 60)
      .reduce((s, d) => s + Number(d.value_cents), 0);

    const confidence = list.length
      ? Math.round(
          list.reduce((s, d) => s + (d.health_score != null ? Number(d.health_score) : 50), 0) / list.length
        ) : 0;

    const byStage: Record<string, { count: number; value: number }> = {};
    list.forEach((d) => {
      byStage[d.stage] = byStage[d.stage] ?? { count: 0, value: 0 };
      byStage[d.stage].count++;
      byStage[d.stage].value += Number(d.value_cents);
    });

    return json({
      period, horizon,
      total_deals: list.length,
      total_pipeline_cents: totalPipeline,
      weighted_forecast_cents: Math.round(weightedForecast),
      best_case_cents: Math.round(bestCase),
      commit_cents: Math.round(commit),
      confidence,
      by_stage: byStage,
    });
  } catch (e) {
    console.error("forecast-deals error", e);
    return json({ error: String(e) }, 500);
  }
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
