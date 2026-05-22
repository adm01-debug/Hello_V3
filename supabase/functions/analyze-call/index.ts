import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildCorsHeaders } from "../_shared/cors.ts";
import { validateBody, createErrorResponse } from "../_shared/validator.ts";
import { AnalyzeCallSchema } from "./schema.ts";
import { checkRateLimitDB, getClientIp } from "../_shared/rate-limit.ts";

interface AnalysisResult {
  summary: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  sentimentScore: number;
  keyTopics: string[];
  actionItems: string[];
  customerSatisfaction: number;
  agentPerformance: { clarity: number; empathy: number; resolution: number };
}

serve(async (req) => {
  const cors = buildCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

  try {
    // Auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return createErrorResponse('Não autorizado', 'UNAUTHORIZED', undefined, 401, cors);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return createErrorResponse('Não autorizado', 'UNAUTHORIZED', undefined, 401, cors);
    }

    // Rate limiting
    const rl = await checkRateLimitDB(getClientIp(req), 'analyze-call', user.id);
    if (!rl.allowed) {
      return createErrorResponse('Limite de requisições excedido', 'RATE_LIMIT_EXCEEDED', undefined, 429, {
        ...cors, 'Retry-After': String(rl.retryAfter ?? 60)
      });
    }

    // Input validation using standard Zod-based validator
    const validation = await validateBody(req, AnalyzeCallSchema, cors);
    if (validation.errorResponse) return validation.errorResponse;
    const { transcript, callInfo } = validation.data!;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return createErrorResponse('Serviço indisponível', 'SERVICE_UNAVAILABLE', undefined, 503, cors);
    }

    const systemPrompt = `Você é um especialista em análise de chamadas de call center.
Analise a transcrição da chamada e forneça insights detalhados.

Responda APENAS com um JSON válido no seguinte formato:
{
  "summary": "Resumo conciso da chamada em 2-3 frases",
  "sentiment": "positive" | "neutral" | "negative",
  "sentimentScore": número de 0 a 100,
  "keyTopics": ["tópico1", "tópico2"],
  "actionItems": ["ação necessária 1"],
  "customerSatisfaction": número de 0 a 100,
  "agentPerformance": { "clarity": 0-100, "empathy": 0-100, "resolution": 0-100 }
}`;

    const userPrompt = `Informações da chamada:
${callInfo ? `- Contato: ${String(callInfo.contactName || '').slice(0, 100)}
- Telefone: ${String(callInfo.phone || '').slice(0, 20)}
- Duração: ${String(callInfo.duration || '').slice(0, 20)}
- Tipo: ${String(callInfo.type || '').slice(0, 50)}` : 'Não disponível'}

Transcrição:
${transcript.slice(0, 10000)}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return createErrorResponse('Limite de requisições excedido no provedor de AI', 'AI_RATE_LIMIT', undefined, 429, cors);
      }
      return createErrorResponse('Serviço indisponível', 'AI_SERVICE_UNAVAILABLE', undefined, 503, cors);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    let analysis: AnalysisResult;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found');
      }
    } catch {
      analysis = {
        summary: 'Não foi possível analisar a chamada.',
        sentiment: 'neutral', sentimentScore: 50, keyTopics: [], actionItems: [],
        customerSatisfaction: 50, agentPerformance: { clarity: 50, empathy: 50, resolution: 50 }
      };
    }

    return new Response(JSON.stringify(analysis), { headers: { ...cors, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('analyze-call error:', error);
    return createErrorResponse('Erro interno', 'INTERNAL_ERROR', undefined, 500, cors);
  }
});

