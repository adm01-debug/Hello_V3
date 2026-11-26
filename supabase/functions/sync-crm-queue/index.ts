import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildCorsHeaders } from "../_shared/cors.ts";
import { GENERIC_INTERNAL_MESSAGE, getCorrelationId, internalErrorResponse } from '../_shared/errors.ts';
import { tokenCronValido, tokenDoBearer } from '../_shared/cron-db-token.ts';

// Teto por execucao (etapa 083): o job roda a cada 5 min e drena a fila em lotes.
const ITENS_POR_EXECUCAO = 50;

serve(async (req) => {
  const cors = buildCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Caminho do cron (migration 20261128110000): bearer opaco do Vault conferido
  // no banco. Guardar o token tambem numa env var da edge e o modo de falha que
  // deixou a purga de optimistic_lock_conflicts anos em 401 (config.toml:1-8).
  // Sem o cron, nada consumia esta fila. Usuario logado cai na sessao abaixo.
  const veioDoCron = await tokenCronValido(
    supabase,
    tokenDoBearer(req.headers.get("Authorization")),
  );
  if (!veioDoCron) {
    const negado = await exigirSessao(req, Deno.env.get("SUPABASE_URL")!, cors);
    if (negado) return negado;
  }

  try {
    // 1. Buscar itens pendentes ou falhos na fila
    const { data: queueItems, error: fetchError } = await supabase
      .from("crm_sync_queue")
      .select("*")
      .in("status", ["pending", "failed"])
      .lte("next_retry_at", new Date().toISOString())
      .lt("attempts", 5)
      .order("created_at", { ascending: true })
      .limit(ITENS_POR_EXECUCAO);

    if (fetchError) throw fetchError;
    if (!queueItems || queueItems.length === 0) {
      return new Response(
        JSON.stringify({ message: "Nada para sincronizar" }),
        { headers: { ...cors, "Content-Type": "application/json" } },
      );
    }

    const results = [];

    for (const item of queueItems) {
      // Marcar como processando
      const { error: processingErr } = await supabase.from("crm_sync_queue").update({
        status: "processing",
        attempts: item.attempts + 1,
      }).eq("id", item.id);
      if (processingErr) console.error('sync-crm-queue: falha ao marcar item da fila como processando', processingErr);

      try {
        // Tentar chamar a função do bitrix
        const { data, error: bitrixError } = await supabase.functions.invoke(
          "bitrix-api",
          {
            body: { action: item.action, params: item.payload },
          },
        );

        if (bitrixError || (data && !data.success)) {
          throw new Error(
            bitrixError?.message || data?.error ||
              "Erro desconhecido no Bitrix",
          );
        }

        // Sucesso!
        const { error: completedErr } = await supabase.from("crm_sync_queue").update({
          status: "completed",
          last_error: null,
        }).eq("id", item.id);
        if (completedErr) console.error('sync-crm-queue: falha ao marcar item da fila como concluido', completedErr);
        results.push({ id: item.id, status: "completed" });
      } catch (error) {
        // Falha - agendar retentativa com backoff exponencial
        const delay = Math.pow(2, item.attempts) * 60; // 2, 4, 8, 16, 32 minutos
        const nextRetry = new Date(Date.now() + delay * 1000).toISOString();

        const { error: failedErr } = await supabase.from("crm_sync_queue").update({
          status: "failed",
          last_error: error instanceof Error
            ? error.message
            : "erro desconhecido",
          next_retry_at: nextRetry,
        }).eq("id", item.id);
        if (failedErr) console.error('sync-crm-queue: falha ao marcar item da fila como falho', failedErr);

        results.push({
          id: item.id,
          status: "failed",
          code: 'internal_error',
          message: "Falha ao sincronizar este item",
        });
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("sync-crm-queue error:", error);
    return internalErrorResponse(error, getCorrelationId(req), cors, { fn: 'sync-crm-queue' });
  }
});

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
