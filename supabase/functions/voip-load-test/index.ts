import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { buildCorsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    // Exige admin: sem isso qualquer requisicao anonima inseria 10 registros
    // em call_quality_metrics a cada chamada, falsificando as metricas de qualidade.
    const negado = await exigirAdmin(req, supabaseUrl, serviceKey, corsHeaders);
    if (negado) return negado;

    const supabaseClient = createClient(supabaseUrl, serviceKey);

    const startTime = performance.now();
    const metrics = [];
    const batchSize = 10;

    // Teste de Carga: Inserção em Lote
    const insertStart = performance.now();
    for (let i = 0; i < batchSize; i++) {
      const { data, error } = await supabaseClient
        .from("call_quality_metrics")
        .insert({
          agent_name: "Load Test Bot",
          channel: "SIP",
          mos_avg: 4.2 + (Math.random() * 0.5),
          jitter_avg_ms: 10 + (Math.random() * 20),
          packet_loss_pct: Math.random() * 2,
          rtt_avg_ms: 50 + (Math.random() * 30),
          quality_label: "good",
        })
        .select();

      if (error) throw error;
      if (data) metrics.push(data[0].id);
    }
    const insertEnd = performance.now();

    // Teste de Busca (Bottleneck check)
    const selectStart = performance.now();
    const { data: selectData, error: selectError } = await supabaseClient
      .from("call_quality_metrics")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (selectError) throw selectError;
    const selectEnd = performance.now();

    // Limpeza (opcional, mas bom para não poluir)
    // No load test real não deletaríamos, mas aqui vamos manter os logs por 1 hora

    // Limpeza: as amostras do teste nao podem se acumular no historico de qualidade.
    if (metrics.length) {
      await supabaseClient.from("call_quality_metrics").delete().in(
        "id",
        metrics,
      );
    }

    const totalTime = performance.now() - startTime;

    return new Response(
      JSON.stringify({
        success: true,
        stats: {
          total_duration_ms: totalTime,
          insert_latency_avg_ms: (insertEnd - insertStart) / batchSize,
          select_latency_ms: selectEnd - selectStart,
          batch_size: batchSize,
          records_processed: metrics.length,
          supabase_health: "healthy",
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "erro desconhecido",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
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
