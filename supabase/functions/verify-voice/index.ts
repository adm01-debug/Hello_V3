import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildCorsHeaders } from "../_shared/cors.ts";
import { checkRateLimitDB, getClientIp } from "../_shared/rate-limit.ts";
import { cosineSimilarity, verifyVerdict } from "../_shared/voice-utils.ts";

serve(async (req) => {
  const cors = buildCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401, headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401, headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const rl = await checkRateLimitDB(getClientIp(req), 'verify-voice', user.id);
    if (!rl.allowed) {
      return new Response(JSON.stringify({ error: 'Limite excedido' }), {
        status: 429, headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const sample: number[] | undefined = Array.isArray(body.embedding) && !Array.isArray(body.embedding[0])
      ? body.embedding as number[]
      : undefined;
    if (!sample || sample.length < 8 || sample.length > 1024) {
      return new Response(JSON.stringify({ error: 'Embedding inválido (8-1024 dims)' }), {
        status: 400, headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }
    const callSessionId: string | null = typeof body.callSessionId === 'string' ? body.callSessionId : null;
    const label: string = typeof body.label === 'string' ? body.label : 'primary';

    const adminClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const { data: vp } = await adminClient.from('voice_prints')
      .select('id, embedding, confidence_baseline, sample_count')
      .eq('user_id', user.id).eq('label', label).eq('is_active', true).maybeSingle();

    if (!vp) {
      return new Response(JSON.stringify({ enrolled: false, message: 'Nenhuma voice print encontrada. Faça enrolamento primeiro.' }), {
        status: 404, headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const sim = cosineSimilarity(sample, vp.embedding as number[]);
    const verdict = verifyVerdict(sim, Number(vp.confidence_baseline ?? 0.85));

    // Atualiza última verificação
    await adminClient.from('voice_prints').update({ last_verified_at: new Date().toISOString() }).eq('id', vp.id);

    // Se mismatch e estiver atrelado a uma chamada, registra fraud_signal
    if (!verdict.match && callSessionId) {
      // Pega agent_name da chamada (RLS via service role permite)
      const { data: cs } = await adminClient.from('call_sessions')
        .select('agent_name').eq('id', callSessionId).maybeSingle();
      await adminClient.from('fraud_signals').insert({
        call_session_id: callSessionId,
        agent_name: cs?.agent_name ?? null,
        signal_type: 'voice_mismatch',
        risk_score: Math.round((1 - sim) * 100),
        severity: verdict.risk === 'high' ? 'high' : 'medium',
        evidence: { similarity: sim, baseline: vp.confidence_baseline, sample_count: vp.sample_count },
        description: `Similaridade ${verdict.confidence}% abaixo do baseline ${(vp.confidence_baseline * 100).toFixed(0)}%`,
      });
    }

    return new Response(JSON.stringify({ enrolled: true, similarity: sim, ...verdict }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Erro interno', message: String(e) }), {
      status: 500, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
    });
  }
});
