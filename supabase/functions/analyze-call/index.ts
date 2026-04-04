import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildCorsHeaders } from "../_shared/cors.ts";


interface AnalysisResult {
  summary: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  sentimentScore: number;
  keyTopics: string[];
  actionItems: string[];
  customerSatisfaction: number;
  agentPerformance: {
    clarity: number;
    empathy: number;
    resolution: number;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: buildCorsHeaders(req) });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(JSON.stringify({ error: 'Serviço indisponível' }), {
        status: 503,
        headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
      });
    }

    const { transcript, callInfo } = await req.json();

    if (!transcript || typeof transcript !== 'string') {
      return new Response(JSON.stringify({ error: 'Dados inválidos' }), {
        status: 400,
        headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
      });
    }

    console.log('Analyzing call for user:', user.id);

    const systemPrompt = `Você é um especialista em análise de chamadas de call center.
Analise a transcrição da chamada e forneça insights detalhados.

Responda APENAS com um JSON válido no seguinte formato:
{
  "summary": "Resumo conciso da chamada em 2-3 frases",
  "sentiment": "positive" | "neutral" | "negative",
  "sentimentScore": número de 0 a 100 (0=muito negativo, 100=muito positivo),
  "keyTopics": ["tópico1", "tópico2", "tópico3"],
  "actionItems": ["ação necessária 1", "ação necessária 2"],
  "customerSatisfaction": número de 0 a 100,
  "agentPerformance": {
    "clarity": número de 0 a 100,
    "empathy": número de 0 a 100,
    "resolution": número de 0 a 100
  }
}

Seja objetivo e profissional na análise.`;

    const userPrompt = `Informações da chamada:
${callInfo ? `- Contato: ${String(callInfo.contactName || '').slice(0, 100)}
- Telefone: ${String(callInfo.phone || '').slice(0, 20)}
- Duração: ${String(callInfo.duration || '').slice(0, 20)}
- Tipo: ${String(callInfo.type || '').slice(0, 50)}` : 'Não disponível'}

Transcrição:
${transcript.slice(0, 10000)}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      console.error('AI Gateway error:', response.status);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Limite de requisições excedido' }), {
          status: 429,
          headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ error: 'Serviço indisponível' }), {
        status: 503,
        headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
      });
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    let analysis: AnalysisResult;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response');
      analysis = {
        summary: 'Não foi possível analisar a chamada.',
        sentiment: 'neutral',
        sentimentScore: 50,
        keyTopics: [],
        actionItems: [],
        customerSatisfaction: 50,
        agentPerformance: { clarity: 50, empathy: 50, resolution: 50 }
      };
    }

    return new Response(JSON.stringify(analysis), {
      headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Analysis error:', error);
    return new Response(JSON.stringify({ error: 'Erro interno' }), {
      status: 500,
      headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
    });
  }
});
