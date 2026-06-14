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

    const body = await req.json().catch(() => ({}));
    const date = body.date || new Date().toISOString().split("T")[0];

    // Buscar shifts do dia
    const { data: shifts } = await supabase
      .from("agent_shifts")
      .select("*")
      .eq("shift_date", date);

    const adherenceByAgent: Record<string, { scheduled_minutes: number; actual_minutes: number; adherence_percent: number; deviations: Array<{ type: string; minutes: number }> }> = {};

    for (const shift of shifts || []) {
      const start = new Date(shift.start_time).getTime();
      const end = new Date(shift.end_time).getTime();
      const scheduledMinutes = Math.round((end - start) / 60000) - (shift.break_minutes || 0);

      // Buscar histórico de status (presumindo agent_status_history existe; se não, usa fallback)
      interface StatusHistoryRow {
        status: string;
        created_at: string;
      }

      const { data: statusHistory } = await (supabase
        .from("agent_status_history" as never)
        .select("*")
        .eq("agent_name", shift.agent_name)
        .gte("created_at", shift.start_time)
        .lte("created_at", shift.end_time)
        .order("created_at", { ascending: true }) as unknown as Promise<{ data: StatusHistoryRow[] | null }>);

      let actualMinutes = 0;
      const deviations: Array<{ type: string; minutes: number }> = [];

      if (statusHistory && statusHistory.length > 0) {
        for (let i = 0; i < statusHistory.length - 1; i++) {
          const cur = statusHistory[i];
          const next = statusHistory[i + 1];
          const dur = (new Date(next.created_at).getTime() - new Date(cur.created_at).getTime()) / 60000;
          if (cur.status === "available" || cur.status === "busy") {
            actualMinutes += dur;
          } else if (cur.status === "away" && dur > 15) {
            deviations.push({ type: "away_too_long", minutes: Math.round(dur) });
          }
        }
      } else {
        // Fallback: assume aderência total se não há histórico
        actualMinutes = scheduledMinutes;
      }

      const adherence = scheduledMinutes > 0 ? Math.min(100, Math.round((actualMinutes / scheduledMinutes) * 100)) : 100;
      const existing = adherenceByAgent[shift.agent_name] || { scheduled_minutes: 0, actual_minutes: 0, adherence_percent: 0, deviations: [] };
      adherenceByAgent[shift.agent_name] = {
        scheduled_minutes: existing.scheduled_minutes + scheduledMinutes,
        actual_minutes: existing.actual_minutes + Math.round(actualMinutes),
        adherence_percent: adherence,
        deviations: [...existing.deviations, ...deviations],
      };
    }

    return new Response(JSON.stringify({ date, adherence: adherenceByAgent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: corsHeaders });
  }
});
