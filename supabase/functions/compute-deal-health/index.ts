import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-request-id, x-correlation-id, x-trace-id, x-trace-operation",
};

interface Body { dealId: string }

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing auth" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { dealId } = (await req.json()) as Body;
    if (!dealId) return json({ error: "dealId required" }, 400);

    const { data: deal, error: dealErr } = await supabase
      .from("deals").select("*").eq("id", dealId).maybeSingle();
    if (dealErr || !deal) return json({ error: "Deal not found" }, 404);

    const { data: calls } = await supabase
      .from("call_sessions").select("id, started_at, duration_seconds")
      .eq("deal_id", dealId).order("started_at", { ascending: false }).limit(20);

    const callIds = (calls ?? []).map((c) => c.id);
    const { data: summaries } = callIds.length
      ? await supabase.from("call_summaries")
          .select("overall_sentiment, customer_satisfaction, agent_performance_score")
          .in("call_session_id", callIds)
      : { data: [] };

    const { data: moments } = callIds.length
      ? await supabase.from("call_key_moments")
          .select("moment_type").in("call_session_id", callIds)
      : { data: [] };

    // Heuristic health score
    const recencyDays = calls?.[0]?.started_at
      ? (Date.now() - new Date(calls[0].started_at).getTime()) / 86400000 : 999;
    const recencyScore = Math.max(0, 100 - recencyDays * 5);

    const sentiments = (summaries ?? []).map((s) => s.overall_sentiment);
    const positive = sentiments.filter((x) => x === "positive").length;
    const negative = sentiments.filter((x) => x === "negative").length;
    const sentimentScore = sentiments.length
      ? ((positive - negative) / sentiments.length) * 50 + 50 : 50;

    const objections = (moments ?? []).filter((m) => m.moment_type === "objection").length;
    const nextSteps = (moments ?? []).filter((m) => m.moment_type === "next_step").length;
    const competitors = (moments ?? []).filter((m) => m.moment_type === "competitor").length;
    const momentScore = Math.max(0, Math.min(100,
      50 + nextSteps * 10 - objections * 5 - competitors * 3));

    const avgSat = avg((summaries ?? []).map((s) => s.customer_satisfaction).filter(Boolean) as number[]);
    const satScore = avgSat ? avgSat * 10 : 50;

    const probabilityScore = Number(deal.probability) || 50; // safe-numeric-ok: valor já validado por schema Zod ou vindo de linha do DB tipada

    const healthScore = Math.round(
      recencyScore * 0.2 + sentimentScore * 0.25 + momentScore * 0.25 +
      satScore * 0.15 + probabilityScore * 0.15
    );

    const factors = {
      recency_score: Math.round(recencyScore),
      sentiment_score: Math.round(sentimentScore),
      moment_score: Math.round(momentScore),
      satisfaction_score: Math.round(satScore),
      probability_score: probabilityScore,
      total_calls: calls?.length ?? 0,
      objections_count: objections,
      next_steps_count: nextSteps,
      competitors_mentioned: competitors,
      days_since_last_call: Math.round(recencyDays),
    };

    await supabase.from("deals").update({
      health_score: healthScore,
      health_factors: factors,
      health_updated_at: new Date().toISOString(),
    }).eq("id", dealId);

    return json({ healthScore, factors });
  } catch (e) {
    console.error("compute-deal-health error", e);
    return json({ error: String(e) }, 500);
  }
});

function avg(arr: number[]) { return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0; }
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
