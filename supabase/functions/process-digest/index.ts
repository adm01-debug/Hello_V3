import { buildCorsHeaders } from "../_shared/cors.ts";
import { lerNotificacoesEmLote, montarMensagem, type LeitorNotificacoes } from "../_shared/digest.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: buildCorsHeaders(req) });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all users with digest enabled
    const { data: digestUsers, error: prefError } = await supabase
      .from("notification_preferences")
      .select("user_id, digest_frequency")
      .eq("digest_enabled", true);

    if (prefError) {
      throw prefError;
    }

    // Uma leitura por lote de usuarios (etapa 249), no lugar de um select por
    // usuario. O recorte da janela e do teto de 50 continua em memoria e a
    // mensagem do digest nao muda.
    const ler: LeitorNotificacoes = async (lote, desde, inicio, fim) => {
      const { data, error } = await supabase
        .from("notifications")
        .select("id, user_id, title, message, category, severity, created_at")
        .in("user_id", [...lote])
        .eq("is_read", false)
        .gte("created_at", desde)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .range(inicio, fim);
      return { data, error: error ? { message: error.message } : null };
    };

    const { porUsuario, lotesComFalha } = await lerNotificacoesEmLote(digestUsers || [], ler);
    if (lotesComFalha > 0) {
      console.error(`process-digest: ${lotesComFalha} lote(s) falharam na leitura de notificacoes`);
    }

    const results = [];

    for (const userPref of digestUsers || []) {
      const notifications = porUsuario.get(userPref.user_id);

      if (!notifications || notifications.length === 0) {
        continue;
      }

      const { message, metadata } = montarMensagem(notifications);

      const { error: digestErr } = await supabase.from("notifications").insert({
        user_id: userPref.user_id,
        title: `Resumo ${userPref.digest_frequency === "daily" ? "Diário" : "Semanal"}`,
        message,
        type: "digest",
        category: "system",
        severity: "info",
        metadata,
      });
      if (digestErr) console.error('process-digest: falha ao criar notificacao de resumo', digestErr);

      results.push({
        user_id: userPref.user_id,
        notifications_count: notifications.length,
      });
    }

    return new Response(
      JSON.stringify({ success: true, processed: results.length, results }),
      { headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("process-digest error:", err);
    return new Response(
      JSON.stringify({ error: "Erro ao processar digest" }),
      { status: 500, headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
