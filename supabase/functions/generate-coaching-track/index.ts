import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildCorsHeaders } from "../_shared/cors.ts";
import { buildTrackCandidates, CallSession, TrackResult } from "./track-engine.ts";

interface TrackRow {
  id: string;
  agent_name: string;
  title: string;
  priority: string;
  status: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: buildCorsHeaders(req) });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Não autorizado" }, 401, req);
    }

    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
    const admin = createClient(url, service);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return json({ error: "Não autorizado" }, 401, req);
    }

    // Somente supervisor/admin podem disparar geração em massa.
    const { data: profile } = await admin
      .from("user_profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    if (!profile || !["supervisor", "admin"].includes(profile.role)) {
      return json({ error: "Acesso negado" }, 403, req);
    }

    const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

    // Lê chamadas completas das últimas 14d com os resumos (fonte real dos scores).
    const { data: sessions, error: sessErr } = await admin
      .from("call_sessions")
      .select("id, agent_name, started_at, call_summaries(agent_performance_score, customer_satisfaction, summary)")
      .eq("status", "completed")
      .gte("started_at", since)
      .order("started_at", { ascending: false })
      .limit(2000);
    if (sessErr) throw sessErr;

    // Rate-limit: uma trilha aberta por agente (evita duplicar).
    const { data: openAssignments } = await admin
      .from("coaching_assignments")
      .select("agent_name")
      .eq("status", "open");
    const openByAgent = new Set((openAssignments ?? []).map((a) => a.agent_name));

    const { candidates, skipped } = buildTrackCandidates(
      (sessions ?? []) as CallSession[],
      openByAgent,
    );

    const tracks: TrackRow[] = [];
    for (const c of candidates) {
      const payload = {
        agent_name: c.agent_name,
        title: c.title,
        description: c.description,
        priority: c.priority,
        status: c.status,
        due_at: c.due_at,
        assigned_by: user.id,
      };

      const { data: created, error: insErr } = await admin
        .from("coaching_assignments")
        .insert(payload)
        .select("id, agent_name, title, priority, status")
        .maybeSingle();
      if (insErr) continue;
      if (created) {
        tracks.push(created as TrackRow);
        openByAgent.add(c.agent_name);

        // Notifica o agente vinculado (via user_profiles.agent_id).
        const { data: agent } = await admin
          .from("agents")
          .select("id")
          .eq("name", c.agent_name)
          .maybeSingle();
        if (agent) {
          const { data: userProfile } = await admin
            .from("user_profiles")
            .select("id")
            .eq("agent_id", agent.id)
            .maybeSingle();
          if (userProfile) {
            await admin.from("notifications").insert({
              user_id: userProfile.id,
              title: "Nova trilha de coaching",
              message: `Sugestão automática: ${c.weakness.label} abaixo do alvo (${c.weakness.avg.toFixed(1)}/5). Confira em /coaching.`,
              type: "info",
              category: "coaching",
              severity: "info",
              action_url: "/coaching",
              action_label: "Ver trilha",
              source_type: "auto_coaching",
              source_id: agent.id,
            });
          }
        }
      }
    }

    const result: TrackResult = {
      tracks_created: tracks.length,
      assignments: tracks,
      skipped,
    };
    return json(result, 200, req);
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "unknown" }, 500, req);
  }
});

function json(payload: unknown, status: number, req: Request): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" },
  });
}
