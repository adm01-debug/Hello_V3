import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { buildCorsHeaders } from '../_shared/cors.ts';

interface Body {
  callSessionId: string;
  text: string;
  speaker: 'agent' | 'customer';
  sourceLang?: string;
  targetLang: string;
  segmentId?: string;
}

const SUPPORTED = ['pt','en','es','fr','it','de','ja','zh'];

Deno.serve(async (req) => {
  const cors = buildCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

  const startedAt = Date.now();
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
    if (!body?.callSessionId || !body?.text || !body?.targetLang) {
      return new Response(JSON.stringify({ error: 'callSessionId, text e targetLang obrigatórios' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });
    }
    if (!SUPPORTED.includes(body.targetLang)) {
      return new Response(JSON.stringify({ error: `Idioma não suportado: ${body.targetLang}` }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    const sourceLangHint = body.sourceLang ?? 'auto';
    const sys = `Você é um tradutor profissional para call centers. Responda APENAS com a tradução, sem comentários, sem aspas, sem prefixos. Preserve nomes próprios, números e tom.`;
    const usr = `Idioma de origem: ${sourceLangHint}\nIdioma de destino: ${body.targetLang}\nTexto: ${body.text}`;

    const aiRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [{ role: 'system', content: sys }, { role: 'user', content: usr }],
      }),
    });

    if (aiRes.status === 429) {
      return new Response(JSON.stringify({ error: 'Rate limit excedido, tente novamente.' }), { status: 429, headers: { ...cors, 'Content-Type': 'application/json' } });
    }
    if (aiRes.status === 402) {
      return new Response(JSON.stringify({ error: 'Créditos esgotados.' }), { status: 402, headers: { ...cors, 'Content-Type': 'application/json' } });
    }
    if (!aiRes.ok) {
      const t = await aiRes.text();
      console.error('AI error', aiRes.status, t);
      return new Response(JSON.stringify({ error: 'AI gateway error' }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    const json = await aiRes.json();
    const translated: string = (json.choices?.[0]?.message?.content ?? '').trim();
    const latency = Date.now() - startedAt;

    const service = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    await service.from('call_translations').insert({
      call_session_id: body.callSessionId,
      segment_id: body.segmentId ?? null,
      speaker: body.speaker,
      source_lang: body.sourceLang ?? 'auto',
      target_lang: body.targetLang,
      original_text: body.text,
      translated_text: translated,
      confidence: 0.92,
      detected_lang: body.sourceLang ?? null,
      model_used: 'google/gemini-2.5-flash-lite',
      latency_ms: latency,
    });

    return new Response(JSON.stringify({ translated, latency_ms: latency, target_lang: body.targetLang }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('translate-utterance error', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } });
  }
});
