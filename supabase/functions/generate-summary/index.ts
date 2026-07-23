import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildCorsHeaders } from "../_shared/cors.ts";
import { checkRateLimitDB, getClientIp } from "../_shared/rate-limit.ts";

serve(async (req) => {
  const cors = buildCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401, headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401, headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    const rl = await checkRateLimitDB(getClientIp(req), 'generate-summary', user.id);
    if (!rl.allowed) {
      return new Response(JSON.stringify({ error: 'Limite excedido', retryAfter: rl.retryAfter }), {
        status: 429, headers: { ...cors, 'Content-Type': 'application/json', 'Retry-After': String(rl.retryAfter ?? 60) }
      });
    }

    const body = await req.json();
    const callInfo = body?.callInfo;

    if (!callInfo?.transcripts || !Array.isArray(callInfo.transcripts) || callInfo.transcripts.length === 0) {
      return new Response(JSON.stringify({
        summary: "Chamada sem transcrição disponível.", mainTopics: [], overallSentiment: "neutral",
        customerSatisfaction: 5, agentPerformance: 5, nextSteps: []
      }), { headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "Serviço indisponível" }), { status: 503, headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    const transcriptText = callInfo.transcripts
      .slice(0, 100)
      .map((t: { speaker: string; text: string }) => `${String(t.speaker).slice(0, 50)}: ${String(t.text).slice(0, 500)}`)
      .join('\n');

    const safeCallerName = String(callInfo.callerName || 'Cliente').slice(0, 100);
    const safeDuration = Math.max(0, Math.min(86400, callInfo.duration || 0));

    const { resilientFetch } = await import('../_shared/resilience.ts');
    const response = await resilientFetch('ai-gateway-summary', "https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Você é um especialista em análise de chamadas. Retorne APENAS JSON válido." },
          { role: "user", content: `Analise chamada de ${safeCallerName} (${Math.floor(safeDuration / 60)}min):\n${transcriptText.slice(0, 8000)}\n\nJSON: {"summary":"","mainTopics":[],"overallSentiment":"positive|neutral|negative","customerSatisfaction":1-10,"agentPerformance":1-10,"nextSteps":[]}` }
        ],
      }),
    }, { retry: { retries: 2, baseDelayMs: 400 }, breaker: { failureThreshold: 5, openDurationMs: 30_000 } });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Limite excedido" }), { status: 429, headers: { ...cors, 'Content-Type': 'application/json' } });
      return new Response(JSON.stringify({ error: "Serviço indisponível" }), { status: 503, headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    let result;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch { result = {}; }

    const normalized = {
      summary: String(result.summary || "Resumo não disponível").slice(0, 1000),
      mainTopics: Array.isArray(result.mainTopics) ? result.mainTopics.slice(0, 10) : [],
      overallSentiment: ["positive", "neutral", "negative"].includes(result.overallSentiment) ? result.overallSentiment : "neutral",
      customerSatisfaction: Math.min(10, Math.max(1, parseInt(result.customerSatisfaction) || 5)), // safe-numeric-ok: valor já validado por schema Zod ou vindo de linha do DB tipada
      agentPerformance: Math.min(10, Math.max(1, parseInt(result.agentPerformance) || 5)), // safe-numeric-ok: valor já validado por schema Zod ou vindo de linha do DB tipada
      nextSteps: Array.isArray(result.nextSteps) ? result.nextSteps.slice(0, 10) : []
    };

    return new Response(JSON.stringify(normalized), { headers: { ...cors, 'Content-Type': 'application/json' } });
  } catch {
    return new Response(JSON.stringify({ error: "Erro interno" }), { status: 500, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } });
  }
});
