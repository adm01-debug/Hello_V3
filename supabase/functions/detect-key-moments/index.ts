import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { validate, string, optional } from "../_shared/validate.ts";

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

const SYSTEM_PROMPT = `Você é um analista especialista em vendas e atendimento. Analise a transcrição de uma chamada e identifique momentos-chave.

Retorne APENAS um JSON válido com este formato:
{
  "moments": [
    {
      "type": "price|competitor|objection|next_step|commitment|churn_risk|question|positive",
      "timestamp_seconds": <número>,
      "quote": "<citação curta exata da transcrição>",
      "speaker": "agent|customer",
      "confidence": <0.0 a 1.0>,
      "context": "<breve contexto>"
    }
  ]
}

Tipos:
- price: Menção de preço, custo, orçamento, valor
- competitor: Menção a concorrente
- objection: Objeção/resistência do cliente
- next_step: Próximo passo combinado
- commitment: Compromisso firme do cliente
- churn_risk: Sinal de churn ou insatisfação
- question: Pergunta importante não respondida
- positive: Momento positivo (entusiasmo, elogio)`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const parsed = validate(body, {
      callSessionId: string({ min: 1 }),
      transcript: string({ min: 10, max: 50000 }),
      persist: optional(string()),
    });

    if (!parsed.ok) {
      return new Response(JSON.stringify({ error: 'Invalid input', details: parsed.errors }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { callSessionId, transcript } = parsed.data;
    const persist = parsed.data.persist !== 'false';

    const aiResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Transcrição:\n\n${transcript}` },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      console.error('[detect-key-moments] AI error:', aiResp.status, errText);
      return new Response(JSON.stringify({ error: 'AI request failed', status: aiResp.status }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await aiResp.json();
    const content = aiData.choices?.[0]?.message?.content || '{"moments":[]}';
    let parsedContent: { moments: Array<Record<string, unknown>> };
    try {
      parsedContent = JSON.parse(content);
    } catch {
      parsedContent = { moments: [] };
    }
    const moments = Array.isArray(parsedContent.moments) ? parsedContent.moments : [];

    if (persist && moments.length > 0) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, serviceKey);

      const rows = moments.map((m) => ({
        call_session_id: callSessionId,
        moment_type: typeof m.type === 'string' ? m.type : 'positive',
        timestamp_seconds: typeof m.timestamp_seconds === 'number' ? m.timestamp_seconds : 0,
        quote: typeof m.quote === 'string' ? m.quote.slice(0, 1000) : '',
        speaker: typeof m.speaker === 'string' ? m.speaker : null,
        confidence: typeof m.confidence === 'number' ? m.confidence : 0.7,
        metadata: { context: m.context ?? null },
      })).filter(r => r.quote.length > 0);

      if (rows.length > 0) {
        const { error: insErr } = await supabase.from('call_key_moments').insert(rows);
        if (insErr) console.error('[detect-key-moments] insert error:', insErr);
      }
    }

    return new Response(JSON.stringify({ callSessionId, moments, count: moments.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
    });
  } catch (err) {
    console.error('[detect-key-moments] error:', err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
