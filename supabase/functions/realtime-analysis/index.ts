import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { latestMessage, conversationContext, speakerRole } = await req.json();

    if (!latestMessage) {
      throw new Error('No message provided');
    }

    console.log('Analyzing in real-time:', latestMessage.substring(0, 50) + '...');

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
}

Seja conciso e objetivo. Foque em ajudar o agente em tempo real.`;

    const userPrompt = `Contexto da conversa:
${conversationContext || 'Início da chamada'}

Última mensagem (${speakerRole === 'agent' ? 'Agente' : 'Cliente'}):
"${latestMessage}"

Analise e forneça feedback instantâneo.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite', // Fastest model for real-time
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI Gateway error: ${response.status}`);
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
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Real-time analysis error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
