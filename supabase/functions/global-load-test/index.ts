import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { buildCorsHeaders } from "../_shared/cors.ts";
import { getCorrelationId, internalErrorResponse } from '../_shared/errors.ts';

serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    // Exige admin: esta edge insere 200 registros com service_role e sem isso
    // qualquer requisicao anonima poluia call_sessions/contacts/deals/audit_logs.
    const negado = await exigirAdmin(req, supabaseUrl, serviceKey, corsHeaders);
    if (negado) return negado;

    const supabaseClient = createClient(supabaseUrl, serviceKey);

    const scenarios = [
      {
        table: "call_sessions",
        data: {
          agent_name: "Load Test Bot",
          duration_seconds: 120,
          direction: "inbound",
          status: "completed",
        },
      },
      {
        table: "contacts",
        data: {
          name: "Load Test Contact",
          email: `test_${Date.now()}@example.com`,
          phone: "+5511999999999",
          source: "load_test",
        },
      },
      {
        table: "deals",
        data: {
          name: "Load Test Deal",
          value_cents: 1000000,
          currency: "BRL",
          stage: "proposal",
          status: "open",
        },
      },
      {
        table: "audit_logs",
        data: {
          action: "LOAD_TEST_EVENT",
          resource_type: "SYSTEM",
          details: { msg: "Global load test automated run" },
        },
      },
    ];

    const results = [];
    const iterations = 50;

    const startTime = performance.now();

    for (const scenario of scenarios) {
      const batchStart = performance.now();
      const payload = Array.from({ length: iterations }, () => ({
        ...scenario.data,
      }));

      const { data, error } = await supabaseClient
        .from(scenario.table)
        .insert(payload)
        .select("id");

      results.push({
        entity: scenario.table,
        count: iterations,
        latency_ms: performance.now() - batchStart,
        success: !error,
        error: error?.message,
      });
    }

    const totalTime = performance.now() - startTime;

    return new Response(
      JSON.stringify({
        status: "completed",
        total_scenarios: scenarios.length,
        total_records: scenarios.length * iterations,
        total_duration_ms: totalTime,
        breakdown: results,
        system_status: totalTime < 5000 ? "optimal" : "degraded",
        latency_p50_ms: totalTime / (scenarios.length * iterations),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    return internalErrorResponse(error, getCorrelationId(req), corsHeaders, { fn: 'global-load-test' });
  }
});

// 401 sem JWT valido; 403 se o perfil nao for admin/supervisor.
async function exigirAdmin(
  req: Request,
  supabaseUrl: string,
  serviceKey: string,
  headers: Record<string, string>,
): Promise<Response | null> {
  const negar = (status: number, msg: string) =>
    new Response(JSON.stringify({ error: msg }), {
      status,
      headers: { ...headers, "Content-Type": "application/json" },
    });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return negar(401, "Nao autorizado");

  const comoUsuario = createClient(
    supabaseUrl,
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    {
      global: { headers: { Authorization: authHeader } },
    },
  );
  const { data: { user }, error } = await comoUsuario.auth.getUser();
  if (error || !user) return negar(401, "Nao autorizado");

  const admin = createClient(supabaseUrl, serviceKey);
  const { data: isAdmin } = await admin.rpc("is_admin_user", { _user_id: user.id });
  if (!isAdmin) {
    return negar(403, "Acesso negado");
  }
  return null;
}
