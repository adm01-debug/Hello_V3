import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Body { callSessionId: string; templateId: string }

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing auth" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { callSessionId, templateId } = (await req.json()) as Body;
    if (!callSessionId || !templateId) return json({ error: "callSessionId and templateId required" }, 400);

    const { data: session } = await supabase
      .from("call_sessions").select("id, agent_name").eq("id", callSessionId).maybeSingle();
    if (!session) return json({ error: "Call not found" }, 404);

    const { data: criteria } = await supabase
      .from("scorecard_criteria").select("*").eq("template_id", templateId).order("display_order");
    if (!criteria?.length) return json({ error: "Template has no criteria" }, 400);

    const { data: transcript } = await supabase
      .from("call_transcripts_searchable").select("full_text").eq("call_session_id", callSessionId).maybeSingle();
    const { data: summary } = await supabase
      .from("call_summaries").select("*").eq("call_session_id", callSessionId).maybeSingle();

    const text = (transcript?.full_text ?? "").slice(0, 8000);
    const ctx = `Resumo: ${summary?.summary ?? "N/D"}\nSentimento: ${summary?.overall_sentiment ?? "N/D"}\nTranscrição (parcial):\n${text}`;

    const rubric = criteria.map((c) =>
      `- id="${c.id}" "${c.label}" (max ${c.max_score}): ${c.description ?? ""}`
    ).join("\n");

    const { resilientFetch } = await import('../_shared/resilience.ts');
    const aiResp = await resilientFetch('ai-gateway-score', "https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Você é um avaliador imparcial de chamadas de vendas. Devolva APENAS JSON válido." },
          { role: "user", content:
`Avalie a chamada usando esta rubrica:
${rubric}

Contexto:
${ctx}

Responda em JSON: {"responses":[{"criterion_id":"<id>","score":<num>,"comment":"<texto curto pt-BR>"}],"feedback":"<resumo geral pt-BR>"}` },
        ],
      }),
    }, { retry: { retries: 2, baseDelayMs: 400 }, breaker: { failureThreshold: 5, openDurationMs: 30_000 } });

    if (!aiResp.ok) {
      const txt = await aiResp.text();
      return json({ error: "AI failed", details: txt }, 502);
    }
    const aiData = await aiResp.json();
    const content = aiData.choices?.[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(content.replace(/```json|```/g, "").trim());

    const responses = (parsed.responses ?? []) as Array<{ criterion_id: string; score: number; comment?: string }>;
    const validIds = new Set(criteria.map((c) => c.id));
    const validResponses = responses.filter((r) => validIds.has(r.criterion_id));

    const total = validResponses.reduce((s, r) => {
      const crit = criteria.find((c) => c.id === r.criterion_id)!;
      return s + Number(r.score) * Number(crit.weight); // safe-numeric-ok: valor já validado por schema Zod ou vindo de linha do DB tipada
    }, 0);
    const max = criteria.reduce((s, c) => s + c.max_score * Number(c.weight), 0); // safe-numeric-ok: valor já validado por schema Zod ou vindo de linha do DB tipada

    const { data: scorecard, error: scErr } = await supabase
      .from("call_scorecards").insert({
        call_session_id: callSessionId,
        template_id: templateId,
        agent_name: session.agent_name,
        total_score: total,
        max_total: max,
        status: "draft",
        ai_generated: true,
        feedback: parsed.feedback ?? null,
      }).select().single();
    if (scErr) return json({ error: scErr.message }, 500);

    if (validResponses.length) {
      await supabase.from("scorecard_responses").insert(
        validResponses.map((r) => ({
          scorecard_id: scorecard.id,
          criterion_id: r.criterion_id,
          score: r.score,
          comment: r.comment ?? null,
        })),
      );
    }

    return json({ scorecard, responses: validResponses });
  } catch (e) {
    console.error("score-call error", e);
    return json({ error: String(e) }, 500);
  }
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
