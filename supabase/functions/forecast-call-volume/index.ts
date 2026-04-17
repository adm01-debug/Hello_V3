import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: userData, error: authErr } = await supabase.auth.getUser();
    if (authErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    // Buscar últimos 28 dias de call_sessions
    const since = new Date();
    since.setDate(since.getDate() - 28);

    const { data: sessions, error } = await supabase
      .from("call_sessions")
      .select("started_at, duration_seconds")
      .gte("started_at", since.toISOString())
      .limit(10000);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
    }

    // Agregar por dia da semana × hora
    const grid: Record<string, number[]> = {};
    for (let dow = 0; dow < 7; dow++) {
      grid[dow] = new Array(24).fill(0);
    }
    const counts: Record<string, number> = {};

    (sessions || []).forEach((s: any) => {
      const d = new Date(s.started_at);
      const dow = d.getDay();
      const hour = d.getHours();
      const key = `${dow}-${hour}`;
      grid[dow][hour] += 1;
      counts[key] = (counts[key] || 0) + 1;
    });

    // Calcular média por slot dividindo por nº de semanas (4)
    const forecast: Array<{ day_of_week: number; hour: number; expected_calls: number; required_agents: number }> = [];
    const AHT = 240; // tempo médio de atendimento em segundos (heurística)
    const TARGET_SL = 0.8; // 80% atendidas em 30s

    for (let dow = 0; dow < 7; dow++) {
      for (let hour = 0; hour < 24; hour++) {
        const expected = Math.round(grid[dow][hour] / 4);
        // Erlang C simplificado: agentes ≈ ceil((calls × AHT) / 3600 / SL)
        const trafficErlang = (expected * AHT) / 3600;
        const requiredAgents = expected > 0 ? Math.max(1, Math.ceil(trafficErlang / TARGET_SL)) : 0;
        forecast.push({ day_of_week: dow, hour, expected_calls: expected, required_agents: requiredAgents });
      }
    }

    const summary = {
      total_calls_28d: sessions?.length || 0,
      avg_daily: Math.round((sessions?.length || 0) / 28),
      peak_hour: forecast.reduce((a, b) => (b.expected_calls > a.expected_calls ? b : a), forecast[0]),
      total_required_agent_hours: forecast.reduce((sum, s) => sum + s.required_agents, 0),
    };

    return new Response(JSON.stringify({ forecast, summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: corsHeaders });
  }
});
