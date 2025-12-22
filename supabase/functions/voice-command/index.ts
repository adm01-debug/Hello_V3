import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VoiceCommand {
  action: 'call' | 'transfer' | 'hold' | 'hangup' | 'mute' | 'unmute' | 'unknown';
  target?: string;
  confidence: number;
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

    const { transcript } = await req.json();

    if (!transcript) {
      throw new Error('No transcript provided');
    }

    console.log('Processing transcript:', transcript);

    const systemPrompt = `Você é um assistente de parsing de comandos de voz para um sistema VoIP.
Analise o texto do usuário e extraia a intenção e o alvo do comando.

Comandos suportados:
- "ligar para [nome/número]" → action: "call", target: nome ou número
- "transferir para [nome/número]" ou "transferir chamada para [nome/número]" → action: "transfer", target: nome ou número
- "colocar em espera" ou "aguarde" ou "espera" → action: "hold"
- "desligar" ou "encerrar chamada" → action: "hangup"
- "mutar" ou "silenciar" → action: "mute"
- "desmutar" ou "ativar áudio" → action: "unmute"

Responda APENAS com um JSON válido no formato:
{
  "action": "call|transfer|hold|hangup|mute|unmute|unknown",
  "target": "nome ou número extraído (apenas para call/transfer)",
  "confidence": 0.0 a 1.0
}`;

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
          { role: 'user', content: transcript }
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
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    console.log('AI response:', content);

    // Parse the JSON response
    let command: VoiceCommand;
    try {
      // Extract JSON from the response (it might be wrapped in markdown code blocks)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        command = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      command = { action: 'unknown', confidence: 0 };
    }

    console.log('Parsed command:', command);

    return new Response(JSON.stringify(command), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Command processing error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
