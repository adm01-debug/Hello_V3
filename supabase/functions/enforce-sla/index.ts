import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { buildCorsHeaders } from "../_shared/cors.ts";
import { addBusinessMinutes, scheduleFromRows, type BusinessSchedule } from "../_shared/business-hours.ts";
import { getCorrelationId, internalErrorResponse } from '../_shared/errors.ts';

Deno.serve(async (req) => {
  const cors = buildCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  const negado = await exigirSessao(req, Deno.env.get("SUPABASE_URL")!, cors);
  if (negado) return negado;

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Buscar políticas SLA ativas
    const { data: policies } = await supabase
      .from("sla_policies")
      .select("*")
      .eq("is_active", true);

    if (!policies || policies.length === 0) {
      return new Response(
        JSON.stringify({
          ok: true,
          applied: 0,
          breaches: 0,
          message: "Sem políticas ativas",
        }),
        {
          status: 200,
          headers: { ...cors, "Content-Type": "application/json" },
        },
      );
    }

    // Conversas abertas sem SLA calculado ainda
    const { data: conversations } = await supabase
      .from("conversations")
      .select(
        "id, channel, priority, status, created_at, first_response_at, sla_first_response_due_at, sla_resolution_due_at, sla_breached, assigned_agent_name",
      )
      .in("status", ["open", "pending"]);

    // Horário comercial: só carrega quando alguma política aplicável pede.
    // Sem configuração ativa, `business_hours_only` cai no prazo por tempo
    // corrido (comportamento anterior).
    const wantsBusinessHours = policies.some((p) => p.business_hours_only);
    let schedule: BusinessSchedule | null = null;
    if (wantsBusinessHours) {
      const { data: configs } = await supabase
        .from("calling_hours_config")
        .select(
          "region_code, timezone, weekday_start, weekday_end, saturday_start, saturday_end, sunday_allowed, sunday_start, sunday_end, holidays_allowed",
        )
        .eq("is_active", true);
      const lista = (configs ?? []) as Array<{ region_code: string }>;
      // Mesma preferência de `check_calling_hours`: BR, senão a primeira ativa.
      const cfg = lista.find((c) => c.region_code === "BR") ?? lista[0];
      if (cfg) {
        const { data: holidayRows } = await supabase
          .from("holidays")
          .select("date, recurring")
          .eq("region_code", cfg.region_code);
        schedule = scheduleFromRows(cfg as never, (holidayRows ?? []) as never);
      }
    }

    let applied = 0;
    let breaches = 0;
    const now = new Date();

    for (const conv of conversations || []) {
      // Encontrar política mais específica (canal exato + prioridade exata > all)
      const matched = pickPolicy(policies, conv);
      if (!matched) continue;

      const createdAt = new Date(conv.created_at);
      const updates: Record<string, unknown> = {};
      const dueFrom = (minutes: number) =>
        matched.business_hours_only && schedule
          ? addBusinessMinutes(createdAt, minutes, schedule)
          : new Date(createdAt.getTime() + minutes * 60_000);

      if (!conv.sla_first_response_due_at) {
        updates.sla_first_response_due_at = dueFrom(matched.first_response_minutes).toISOString();
        applied++;
      }
      if (!conv.sla_resolution_due_at) {
        updates.sla_resolution_due_at = dueFrom(matched.resolution_minutes).toISOString();
      }

      // Detectar breach
      const firstResponseDue = conv.sla_first_response_due_at
        ? new Date(conv.sla_first_response_due_at)
        : (updates.sla_first_response_due_at
          ? new Date(updates.sla_first_response_due_at as string)
          : null);
      const resolutionDue = conv.sla_resolution_due_at
        ? new Date(conv.sla_resolution_due_at)
        : (updates.sla_resolution_due_at
          ? new Date(updates.sla_resolution_due_at as string)
          : null);

      const firstResponseBreached = !conv.first_response_at &&
        firstResponseDue && now > firstResponseDue;
      const resolutionBreached = conv.status !== "resolved" && resolutionDue &&
        now > resolutionDue;

      if ((firstResponseBreached || resolutionBreached) && !conv.sla_breached) {
        updates.sla_breached = true;
        breaches++;

        // Criar alerta in-app
        const { error: breachNotifyErr } = await supabase.from("notifications").insert({
          user_id: null,
          type: "sla_breach",
          title: "SLA violado",
          message: `Conversa ${conv.id.slice(0, 8)} excedeu SLA (${
            firstResponseBreached ? "primeira resposta" : "resolução"
          })`,
          severity: "high",
          metadata: {
            conversation_id: conv.id,
            agent: conv.assigned_agent_name,
            type: firstResponseBreached ? "first_response" : "resolution",
          },
        });
        // Best-effort: a violacao de SLA ja esta contabilizada; o aviso fica no log.
        if (breachNotifyErr) console.error('enforce-sla: falha ao criar alerta de SLA', breachNotifyErr);
      }

      if (Object.keys(updates).length > 0) {
        const { error: convUpdateErr } = await supabase.from("conversations").update(updates).eq("id", conv.id);
        if (convUpdateErr) console.error('enforce-sla: falha ao gravar violacao de SLA', convUpdateErr);
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        applied,
        breaches,
        total_checked: conversations?.length ?? 0,
      }),
      { status: 200, headers: { ...cors, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("enforce-sla error:", error);
    return internalErrorResponse(error, getCorrelationId(req), cors, { fn: 'enforce-sla' });
  }
});

/**
 * Escolhe a política SLA mais específica para a conversa.
 *
 * O `find` anterior dependia da ordem devolvida pelo PostgREST: se a política
 * genérica `all/all` viesse primeiro, ela vencia a política específica do canal
 * e o SLA aplicado era o errado. Aqui a escolha é por pontuação (canal exato +
 * prioridade exata), independente da ordem do banco.
 */
export function pickPolicy<
  T extends { channel: string; priority: string },
>(policies: T[], conv: { channel: string | null; priority: string | null }): T | undefined {
  let best: T | undefined;
  let bestScore = -1;
  for (const p of policies) {
    if (p.channel !== conv.channel && p.channel !== "all") continue;
    if (p.priority !== conv.priority && p.priority !== "all") continue;
    const score = (p.channel === conv.channel ? 2 : 0) + (p.priority === conv.priority ? 1 : 0);
    if (score > bestScore) {
      best = p;
      bestScore = score;
    }
  }
  return best;
}

// Rejeita chamada sem JWT valido. As edges abaixo escrevem com service_role,
// entao a anon key publica nao pode ser suficiente para invoca-las.
async function exigirSessao(
  req: Request,
  supabaseUrl: string,
  headers: Record<string, string>,
): Promise<Response | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Nao autorizado" }), {
      status: 401,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }
  const comoUsuario = createClient(
    supabaseUrl,
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: { user }, error } = await comoUsuario.auth.getUser();
  if (error || !user) {
    return new Response(JSON.stringify({ error: "Nao autorizado" }), {
      status: 401,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }
  return null;
}
