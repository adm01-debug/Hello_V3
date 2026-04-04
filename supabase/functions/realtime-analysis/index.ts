import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildCorsHeaders } from "../_shared/cors.ts";


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

    const body = await req.json();
    const { latestMessage, conversationContext, speakerRole } = body;

    if (!latestMessage || typeof latestMessage !== 'string') {
      return new Response(JSON.stringify({ error: 'Dados inválidos' }), {
        status: 400,
        headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
      });
    }

    console.log('Real-time analysis for user:', user.id);

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

    const safeContext = String(conversationContext || 'Início da chamada').slice(0, 2000);
    const safeMessage = latestMessage.slice(0, 1000);
    const safeSpeaker = speakerRole === 'agent' ? 'Agente' : 'Cliente';

    const userPrompt = `Contexto da conversa:
${safeContext}

Última mensagem (${safeSpeaker}):
"${safeMessage}"

Analise e forneça feedback instantâneo.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      console.error('AI Gateway error:', response.status);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Limite excedido' }), {
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

    let analysis;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found');
      }
    } catch {
      analysis = {
        sentiment: 'neutral',
        urgency: 'low',
        emotion: 'calmo',
        suggestion: '',
        keywords: [],
        riskAlert: false,
        riskReason: ''
      };
    }

    return new Response(JSON.stringify(analysis), {
      headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Real-time analysis error:', error);
    return new Response(JSON.stringify({ error: 'Erro interno' }), {
      status: 500,
      headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
    });
  }
});
