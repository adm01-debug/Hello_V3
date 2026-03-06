import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface TranscriptEntry {
  speaker: string;
  text: string;
}

interface CallInfo {
  callerName: string;
  duration: number;
  transcripts: TranscriptEntry[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { callInfo } = body as { callInfo: CallInfo };
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(JSON.stringify({ error: "Serviço indisponível" }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!callInfo?.transcripts || callInfo.transcripts.length === 0) {
      return new Response(JSON.stringify({
        summary: "Chamada sem transcrição disponível.",
        mainTopics: [],
        overallSentiment: "neutral",
        customerSatisfaction: 5,
        agentPerformance: 5,
        nextSteps: []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Generating summary for user:', user.id);

    const transcriptText = callInfo.transcripts
      .map(t => `${String(t.speaker).slice(0, 50)}: ${String(t.text).slice(0, 500)}`)
      .slice(0, 100)
      .join('\n');

    const systemPrompt = `Você é um especialista em análise de chamadas de atendimento ao cliente.
Analise a transcrição da chamada e gere um resumo estruturado em JSON.

RETORNE APENAS JSON VÁLIDO, sem markdown ou texto adicional.`;

    const safeCallerName = String(callInfo.callerName || 'Cliente').slice(0, 100);
    const safeDuration = Math.max(0, Math.min(86400, callInfo.duration || 0));

    const userPrompt = `Analise esta chamada de ${safeCallerName} com duração de ${Math.floor(safeDuration / 60)} minutos e ${safeDuration % 60} segundos:

TRANSCRIÇÃO:
${transcriptText.slice(0, 8000)}

Gere um JSON com:
{
  "summary": "Resumo conciso da chamada em 2-3 frases",
  "mainTopics": ["tópico1", "tópico2", "tópico3"],
  "overallSentiment": "positive" | "neutral" | "negative",
  "customerSatisfaction": 1-10,
  "agentPerformance": 1-10,
  "nextSteps": ["próximo passo 1", "próximo passo 2"]
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      console.error("AI gateway error:", response.status);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite excedido" }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ error: "Serviço indisponível" }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    let result;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch {
      result = {
        summary: "Resumo gerado automaticamente.",
        mainTopics: ["Atendimento geral"],
        overallSentiment: "neutral",
        customerSatisfaction: 5,
        agentPerformance: 5,
        nextSteps: []
      };
    }

    const normalizedResult = {
      summary: String(result.summary || "Resumo não disponível").slice(0, 1000),
      mainTopics: Array.isArray(result.mainTopics) ? result.mainTopics.slice(0, 10) : [],
      overallSentiment: ["positive", "neutral", "negative"].includes(result.overallSentiment) 
        ? result.overallSentiment 
        : "neutral",
      customerSatisfaction: Math.min(10, Math.max(1, parseInt(result.customerSatisfaction) || 5)),
      agentPerformance: Math.min(10, Math.max(1, parseInt(result.agentPerformance) || 5)),
      nextSteps: Array.isArray(result.nextSteps) ? result.nextSteps.slice(0, 10) : []
    };

    return new Response(JSON.stringify(normalizedResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating summary:', error);
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
