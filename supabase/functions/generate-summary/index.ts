import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    const { callInfo } = await req.json() as { callInfo: CallInfo };
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!callInfo.transcripts || callInfo.transcripts.length === 0) {
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

    const transcriptText = callInfo.transcripts
      .map(t => `${t.speaker}: ${t.text}`)
      .join('\n');

    const systemPrompt = `Você é um especialista em análise de chamadas de atendimento ao cliente.
Analise a transcrição da chamada e gere um resumo estruturado em JSON.

RETORNE APENAS JSON VÁLIDO, sem markdown ou texto adicional.`;

    const userPrompt = `Analise esta chamada de ${callInfo.callerName} com duração de ${Math.floor(callInfo.duration / 60)} minutos e ${callInfo.duration % 60} segundos:

TRANSCRIÇÃO:
${transcriptText}

Gere um JSON com:
{
  "summary": "Resumo conciso da chamada em 2-3 frases",
  "mainTopics": ["tópico1", "tópico2", "tópico3"],
  "overallSentiment": "positive" | "neutral" | "negative",
  "customerSatisfaction": 1-10,
  "agentPerformance": 1-10,
  "nextSteps": ["próximo passo 1", "próximo passo 2"]
}`;

    console.log('Generating summary for call with', callInfo.transcripts.length, 'transcript entries');

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
      if (response.status === 429) {
        console.error("Rate limit exceeded");
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        console.error("Payment required");
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    console.log('AI response:', content);

    // Parse JSON from response
    let result;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      result = {
        summary: content.slice(0, 200) || "Resumo gerado automaticamente.",
        mainTopics: ["Atendimento geral"],
        overallSentiment: "neutral",
        customerSatisfaction: 5,
        agentPerformance: 5,
        nextSteps: []
      };
    }

    // Validate and normalize the result
    const normalizedResult = {
      summary: result.summary || "Resumo não disponível",
      mainTopics: Array.isArray(result.mainTopics) ? result.mainTopics : [],
      overallSentiment: ["positive", "neutral", "negative"].includes(result.overallSentiment) 
        ? result.overallSentiment 
        : "neutral",
      customerSatisfaction: Math.min(10, Math.max(1, parseInt(result.customerSatisfaction) || 5)),
      agentPerformance: Math.min(10, Math.max(1, parseInt(result.agentPerformance) || 5)),
      nextSteps: Array.isArray(result.nextSteps) ? result.nextSteps : []
    };

    console.log('Generated summary:', normalizedResult);

    return new Response(JSON.stringify(normalizedResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating summary:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
