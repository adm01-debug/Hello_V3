import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { buildCorsHeaders } from '../_shared/cors.ts';

interface Body {
  callSessionId: string;
  targetLang: string;
}

const SUPPORTED = ['pt','en','es','fr','it','de','ja','zh'];

Deno.serve(async (req) => {
  const cors = buildCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    const body = (await req.json()) as Body;
    if (!body?.callSessionId || !body?.targetLang) {
      return new Response(JSON.stringify({ error: 'callSessionId e targetLang obrigatórios' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });
    }
    if (!SUPPORTED.includes(body.targetLang)) {
      return new Response(JSON.stringify({ error: 'Idioma não suportado' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    const { data: summary, error: sumErr } = await supabase
      .from('call_summaries')
      .select('*')
      .eq('call_session_id', body.callSessionId)
      .maybeSingle();
    if (sumErr || !summary) {
      return new Response(JSON.stringify({ error: 'Resumo não encontrado' }), { status: 404, headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    const existing = (summary.translated_summary ?? {}) as Record<string, unknown>;
    if (existing[body.targetLang]) {
      return new Response(JSON.stringify({ translation: existing[body.targetLang], cached: true }), {
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    const payload = {
      summary: summary.summary,
      main_topics: summary.main_topics,
      next_steps: summary.next_steps,
      overall_sentiment: summary.overall_sentiment,
    };

    const sys = `Traduza o resumo de chamada abaixo para o idioma alvo. Responda em JSON com as MESMAS chaves: summary (string), main_topics (array string), next_steps (array string), overall_sentiment (string). Sem markdown, sem comentários.`;
    const usr = `Idioma alvo: ${body.targetLang}\nResumo:\n${JSON.stringify(payload)}`;

    const aiRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'system', content: sys }, { role: 'user', content: usr }],
        response_format: { type: 'json_object' },
      }),
    });

    if (aiRes.status === 429) return new Response(JSON.stringify({ error: 'Rate limit' }), { status: 429, headers: { ...cors, 'Content-Type': 'application/json' } });
    if (aiRes.status === 402) return new Response(JSON.stringify({ error: 'Créditos esgotados' }), { status: 402, headers: { ...cors, 'Content-Type': 'application/json' } });
    if (!aiRes.ok) {
      const t = await aiRes.text();
      console.error('AI error', aiRes.status, t);
      return new Response(JSON.stringify({ error: 'AI gateway error' }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    const json = await aiRes.json();
    let translation: unknown = {};
    try {
      translation = JSON.parse(json.choices?.[0]?.message?.content ?? '{}');
    } catch {
      translation = { summary: json.choices?.[0]?.message?.content ?? '' };
    }

    const service = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const merged = { ...existing, [body.targetLang]: translation };
    await service.from('call_summaries').update({ translated_summary: merged }).eq('id', summary.id);

    return new Response(JSON.stringify({ translation, cached: false }), { headers: { ...cors, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('translate-summary error', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } });
  }
});
