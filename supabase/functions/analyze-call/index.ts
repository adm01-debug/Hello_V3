import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { transcript, callInfo } = await req.json();

    if (!transcript) {
      throw new Error('No transcript provided');
    }

    console.log('Analyzing call transcript:', transcript.substring(0, 100) + '...');

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
${callInfo ? `- Contato: ${callInfo.contactName}
- Telefone: ${callInfo.phone}
- Duração: ${callInfo.duration}
- Tipo: ${callInfo.type}` : 'Não disponível'}

Transcrição:
${transcript}`;

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
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded, please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required, please add credits.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    console.log('AI response:', content);

    // Parse the JSON response
    let analysis: AnalysisResult;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
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
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Analysis error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
