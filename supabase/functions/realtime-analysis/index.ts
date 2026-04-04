import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildCorsHeaders } from "../_shared/cors.ts";
import { validate, string, optional } from "../_shared/validate.ts";
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

    const rl = await checkRateLimitDB(getClientIp(req), 'realtime-analysis', user.id);
    if (!rl.allowed) {
      return new Response(JSON.stringify({ error: 'Limite excedido' }), { status: 429, headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'Serviço indisponível' }), { status: 503, headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    const body = await req.json();
    const parsed = validate(body, {
      latestMessage: string({ min: 1, max: 5000 }),
      conversationContext: optional(string({ max: 10000 })),
      speakerRole: optional(string({ max: 20 })),
    });

    if (!parsed.ok) {
      return new Response(JSON.stringify({ error: 'Dados inválidos', details: parsed.errors }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    const latestMessage = parsed.data.latestMessage as string;
    const conversationContext = (parsed.data.conversationContext as string) || 'Início da chamada';
    const speakerRole = (parsed.data.speakerRole as string) === 'agent' ? 'Agente' : 'Cliente';

    const systemPrompt = `Você é um assistente de análise em tempo real para agentes de call center.
Analise a última mensagem no contexto da conversa e forneça feedback instantâneo.

Responda APENAS com um JSON válido:
{
  "sentiment": "positive" | "neutral" | "negative",
  "urgency": "low" | "medium" | "high",
  "emotion": "calmo" | "satisfeito" | "frustrado" | "irritado" | "ansioso" | "confuso",
  "suggestion": "sugestão curta para o agente (máx 50 palavras)",
  "keywords": ["palavra1", "palavra2"],
  "riskAlert": true/false,
  "riskReason": "motivo do alerta se houver"
}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Contexto:\n${conversationContext.slice(0, 2000)}\n\nÚltima mensagem (${speakerRole}):\n"${latestMessage.slice(0, 1000)}"` }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: 'Limite excedido' }), { status: 429, headers: { ...cors, 'Content-Type': 'application/json' } });
      return new Response(JSON.stringify({ error: 'Serviço indisponível' }), { status: 503, headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;
    let analysis;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch {
      analysis = { sentiment: 'neutral', urgency: 'low', emotion: 'calmo', suggestion: '', keywords: [], riskAlert: false, riskReason: '' };
    }

    return new Response(JSON.stringify(analysis), { headers: { ...cors, 'Content-Type': 'application/json' } });
  } catch {
    return new Response(JSON.stringify({ error: 'Erro interno' }), { status: 500, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } });
  }
});
