import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SentimentResult {
  overall_sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  sentiment_score: number; // -1 to 1
  emotions: {
    joy: number;
    sadness: number;
    anger: number;
    fear: number;
    surprise: number;
  };
  key_moments: {
    timestamp?: number;
    text: string;
    sentiment: string;
    emotion: string;
  }[];
  summary: string;
  customer_satisfaction_estimate: number; // 1-10
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transcription, callSessionId } = await req.json();

    if (!transcription) {
      throw new Error('Transcrição não fornecida');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY não configurada');
    }

    console.log('[Sentiment Analysis] Starting analysis for transcription...');
    console.log('[Sentiment Analysis] Transcription length:', transcription.length);

    const systemPrompt = `Você é um especialista em análise de sentimentos e emoções em conversas de atendimento ao cliente.
    
Analise a transcrição da chamada e retorne uma análise detalhada de sentimento.

Regras:
- Identifique o sentimento geral: positive, negative, neutral, ou mixed
- Calcule um score de sentimento de -1 (muito negativo) a 1 (muito positivo)
- Identifique as emoções predominantes (joy, sadness, anger, fear, surprise) com valores de 0 a 1
- Destaque momentos-chave da conversa com seu sentimento e emoção
- Forneça um resumo conciso da análise
- Estime a satisfação do cliente de 1 a 10`;

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
          { role: 'user', content: `Analise o sentimento da seguinte transcrição de chamada:\n\n${transcription}` }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'analyze_sentiment',
              description: 'Retorna a análise de sentimento estruturada da transcrição',
              parameters: {
                type: 'object',
                properties: {
                  overall_sentiment: {
                    type: 'string',
                    enum: ['positive', 'negative', 'neutral', 'mixed'],
                    description: 'Sentimento geral da conversa'
                  },
                  sentiment_score: {
                    type: 'number',
                    description: 'Score de sentimento de -1 (muito negativo) a 1 (muito positivo)'
                  },
                  emotions: {
                    type: 'object',
                    properties: {
                      joy: { type: 'number', description: 'Nível de alegria (0-1)' },
                      sadness: { type: 'number', description: 'Nível de tristeza (0-1)' },
                      anger: { type: 'number', description: 'Nível de raiva (0-1)' },
                      fear: { type: 'number', description: 'Nível de medo (0-1)' },
                      surprise: { type: 'number', description: 'Nível de surpresa (0-1)' }
                    },
                    required: ['joy', 'sadness', 'anger', 'fear', 'surprise']
                  },
                  key_moments: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        text: { type: 'string', description: 'Trecho relevante da conversa' },
                        sentiment: { type: 'string', description: 'Sentimento do momento' },
                        emotion: { type: 'string', description: 'Emoção predominante' }
                      },
                      required: ['text', 'sentiment', 'emotion']
                    },
                    description: 'Momentos-chave da conversa com análise'
                  },
                  summary: {
                    type: 'string',
                    description: 'Resumo conciso da análise de sentimento'
                  },
                  customer_satisfaction_estimate: {
                    type: 'number',
                    description: 'Estimativa de satisfação do cliente de 1 a 10'
                  }
                },
                required: ['overall_sentiment', 'sentiment_score', 'emotions', 'key_moments', 'summary', 'customer_satisfaction_estimate']
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'analyze_sentiment' } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Sentiment Analysis] API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Limite de requisições excedido. Tente novamente mais tarde.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Créditos insuficientes. Adicione créditos ao workspace.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`Erro na API: ${response.status}`);
    }

    const data = await response.json();
    console.log('[Sentiment Analysis] API response received');

    // Extract tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== 'analyze_sentiment') {
      throw new Error('Resposta inválida da API');
    }

    const sentimentResult: SentimentResult = JSON.parse(toolCall.function.arguments);
    console.log('[Sentiment Analysis] Result:', sentimentResult.overall_sentiment, 'Score:', sentimentResult.sentiment_score);

    // Save to database if callSessionId is provided
    if (callSessionId) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Update or insert call_summaries
      const { error: upsertError } = await supabase
        .from('call_summaries')
        .upsert({
          call_session_id: callSessionId,
          overall_sentiment: sentimentResult.overall_sentiment,
          customer_satisfaction: sentimentResult.customer_satisfaction_estimate,
          summary: sentimentResult.summary,
          main_topics: sentimentResult.key_moments.map(m => m.text.slice(0, 100)),
        }, { onConflict: 'call_session_id' });

      if (upsertError) {
        console.error('[Sentiment Analysis] Error saving to database:', upsertError);
      } else {
        console.log('[Sentiment Analysis] Saved to call_summaries');
      }
    }

    return new Response(JSON.stringify({
      success: true,
      ...sentimentResult,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[Sentiment Analysis] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
