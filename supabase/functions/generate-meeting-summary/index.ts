import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { checkRateLimitDB, getClientIp } from "../_shared/rate-limit.ts";

const SYSTEM_PROMPT = `Você é um assistente especializado em gerar notas executivas de reuniões e chamadas de atendimento em português brasileiro.
Analise a transcrição fornecida e extraia, de forma estruturada e objetiva:
- Resumo executivo (2-3 parágrafos densos)
- Pontos-chave (máx. 7)
- Itens de ação (com responsável quando mencionado e prazo sugerido)
- Decisões tomadas
- Próximos passos
- Sentimento por participante (positivo/neutro/negativo + nota 0-10)
- Tópicos discutidos (tags curtas)
- Necessidade de follow-up (boolean + razão concisa)
Seja preciso, evite repetições e use linguagem profissional.`;

const TOOL_SCHEMA = {
  type: "function" as const,
  function: {
    name: "save_meeting_summary",
    description: "Salva o resumo estruturado da reunião/chamada",
    parameters: {
      type: "object",
      properties: {
        summary: { type: "string", description: "Resumo executivo de 2-3 parágrafos" },
        key_points: { type: "array", items: { type: "string" } },
        action_items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              description: { type: "string" },
              owner: { type: "string" },
              due_suggestion: { type: "string" },
              priority: { type: "string", enum: ["low", "medium", "high"] },
            },
            required: ["description", "priority"],
          },
        },
        decisions: { type: "array", items: { type: "string" } },
        next_steps: { type: "array", items: { type: "string" } },
        participants_sentiment: {
          type: "array",
          items: {
            type: "object",
            properties: {
              speaker: { type: "string" },
              sentiment: { type: "string", enum: ["positive", "neutral", "negative"] },
              score: { type: "number" },
            },
            required: ["speaker", "sentiment", "score"],
          },
        },
        topics_discussed: { type: "array", items: { type: "string" } },
        follow_up_required: { type: "boolean" },
        follow_up_reason: { type: "string" },
        confidence: { type: "number", description: "Confiança 0-1 na qualidade do resumo" },
      },
      required: [
        "summary",
        "key_points",
        "action_items",
        "decisions",
        "next_steps",
        "participants_sentiment",
        "topics_discussed",
        "follow_up_required",
        "confidence",
      ],
    },
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY não configurada" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Auth do usuário (extrai do JWT)
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Sessão inválida" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    // Rate limit
    const ip = getClientIp(req);
    const rl = await checkRateLimitDB(ip, "generate-meeting-summary", userId);
    if (!rl.allowed) {
      return new Response(
        JSON.stringify({ error: "Limite de requisições atingido", retryAfter: rl.retryAfter }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json().catch(() => ({}));
    const callSessionId: string | undefined = body?.callSessionId;
    const force: boolean = body?.force === true;
    if (!callSessionId) {
      return new Response(JSON.stringify({ error: "callSessionId obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);

    // Verifica se já existe resumo (idempotência)
    const { data: existing } = await admin
      .from("meeting_summaries")
      .select("id, status")
      .eq("call_session_id", callSessionId)
      .maybeSingle();

    if (existing && !force && existing.status === "completed") {
      return new Response(JSON.stringify({ skipped: true, id: existing.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Busca sessão + transcrições
    const [sessionRes, transcriptsRes] = await Promise.all([
      admin.from("call_sessions").select("*").eq("id", callSessionId).single(),
      admin
        .from("call_transcriptions")
        .select("speaker, text, start_time")
        .eq("call_session_id", callSessionId)
        .order("start_time", { ascending: true, nullsFirst: false }),
    ]);

    if (sessionRes.error || !sessionRes.data) {
      return new Response(JSON.stringify({ error: "Sessão não encontrada" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const session = sessionRes.data;
    const transcripts = transcriptsRes.data ?? [];

    if (transcripts.length === 0) {
      return new Response(JSON.stringify({ error: "Sem transcrição disponível" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Marca como gerando
    await admin
      .from("meeting_summaries")
      .upsert(
        {
          call_session_id: callSessionId,
          status: "generating",
          generated_by: userId,
        },
        { onConflict: "call_session_id" }
      );

    const transcriptText = transcripts
      .map((t: { speaker: string; text: string }) => `[${t.speaker === "agent" ? "Agente" : "Cliente"}] ${t.text}`)
      .join("\n");

    const userPrompt = `Chamada com ${session.caller_name ?? "cliente"} (${session.caller_phone ?? "sem telefone"}).
Agente: ${session.agent_name ?? "não identificado"}.
Duração: ${session.duration_seconds ?? 0}s.

Transcrição completa:
${transcriptText}

Gere o resumo estruturado chamando a função save_meeting_summary.`;

    const model = "google/gemini-2.5-flash";

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        tools: [TOOL_SCHEMA],
        tool_choice: { type: "function", function: { name: "save_meeting_summary" } },
      }),
    });

    if (aiResp.status === 429) {
      await admin
        .from("meeting_summaries")
        .update({ status: "failed", error_message: "Rate limit IA" })
        .eq("call_session_id", callSessionId);
      return new Response(
        JSON.stringify({ error: "Limite de IA atingido. Tente novamente em instantes." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (aiResp.status === 402) {
      await admin
        .from("meeting_summaries")
        .update({ status: "failed", error_message: "Créditos esgotados" })
        .eq("call_session_id", callSessionId);
      return new Response(
        JSON.stringify({ error: "Créditos da IA esgotados. Adicione créditos no workspace." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("AI gateway error", aiResp.status, t);
      await admin
        .from("meeting_summaries")
        .update({ status: "failed", error_message: `AI ${aiResp.status}` })
        .eq("call_session_id", callSessionId);
      return new Response(JSON.stringify({ error: "Falha na IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiJson = await aiResp.json();
    const toolCall = aiJson?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      await admin
        .from("meeting_summaries")
        .update({ status: "failed", error_message: "Sem tool call" })
        .eq("call_session_id", callSessionId);
      return new Response(JSON.stringify({ error: "Resposta inválida da IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const args = JSON.parse(toolCall.function.arguments);

    const { data: saved, error: saveErr } = await admin
      .from("meeting_summaries")
      .upsert(
        {
          call_session_id: callSessionId,
          summary: args.summary,
          key_points: args.key_points ?? [],
          action_items: args.action_items ?? [],
          decisions: args.decisions ?? [],
          next_steps: args.next_steps ?? [],
          participants_sentiment: args.participants_sentiment ?? [],
          topics_discussed: args.topics_discussed ?? [],
          follow_up_required: args.follow_up_required ?? false,
          follow_up_reason: args.follow_up_reason ?? null,
          ai_model: model,
          ai_confidence: args.confidence ?? null,
          generated_by: userId,
          generated_at: new Date().toISOString(),
          status: "completed",
          error_message: null,
        },
        { onConflict: "call_session_id" }
      )
      .select()
      .single();

    if (saveErr) {
      console.error("save error", saveErr);
      return new Response(JSON.stringify({ error: "Falha ao salvar" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, summary: saved }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-meeting-summary fatal", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
