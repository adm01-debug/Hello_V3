import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { buildCorsHeaders } from "../_shared/cors.ts";
import { validate, string, optional } from "../_shared/validate.ts";
import { checkRateLimitDB, getClientIp } from "../_shared/rate-limit.ts";

serve(async (req) => {
  const cors = buildCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401, headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401, headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    const rl = await checkRateLimitDB(getClientIp(req), 'analyze-sentiment', user.id);
    if (!rl.allowed) {
      return new Response(JSON.stringify({ error: 'Limite excedido' }), { status: 429, headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    const body = await req.json();
    const parsed = validate(body, {
      transcription: string({ min: 1, max: 50000 }),
      callSessionId: optional(string({ max: 100 })),
    });

    if (!parsed.ok) {
      return new Response(JSON.stringify({ error: 'Dados inválidos', details: parsed.errors }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'Serviço indisponível' }), { status: 503, headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    const transcription = parsed.data.transcription as string;
    const callSessionId = parsed.data.callSessionId as string | undefined;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{
          role: 'user',
          content: `Analise o sentimento desta transcrição:\n${transcription.slice(0, 5000)}\n\nRetorne JSON: {"overall_sentiment":"positive|negative|neutral","sentiment_score":-1 a 1,"customer_satisfaction_estimate":1-10,"summary":""}`
        }],
      }),
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ error: 'Serviço indisponível' }), { status: 503, headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    const data = await response.json();
    let result;
    try {
      const jsonMatch = data.choices?.[0]?.message?.content?.match(/\{[\s\S]*\}/);
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : { overall_sentiment: 'neutral', sentiment_score: 0, customer_satisfaction_estimate: 5 };
    } catch { result = { overall_sentiment: 'neutral', sentiment_score: 0, customer_satisfaction_estimate: 5 }; }

    if (callSessionId) {
      const supabaseAdmin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
      await supabaseAdmin.from('call_summaries').upsert({
        call_session_id: callSessionId,
        overall_sentiment: result.overall_sentiment,
        customer_satisfaction: result.customer_satisfaction_estimate,
        summary: result.summary,
      }, { onConflict: 'call_session_id' });
    }

    return new Response(JSON.stringify({ success: true, ...result }), { headers: { ...cors, 'Content-Type': 'application/json' } });
  } catch {
    return new Response(JSON.stringify({ error: 'Erro interno' }), { status: 500, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } });
  }
});
