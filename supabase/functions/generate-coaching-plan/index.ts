// Coaching Copilot — Gera plano semanal de coaching baseado nas últimas chamadas do agente
import { buildCorsHeaders } from "../_shared/cors.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';
import { fetchComPrazo } from "../_shared/resilience.ts";
import { getCorrelationId, internalErrorResponse } from '../_shared/errors.ts';
import { validateBody } from "../_shared/validator.ts";
import { GenerateCoachingPlanBodySchema } from "../_shared/ai-body-schemas.ts";

interface CallSummary {
  agent_performance_score: number | null;
  customer_satisfaction: number | null;
  summary: string | null;
}

Deno.serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  });
}
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return json({ error: 'Unauthorized' }, 401);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const token = authHeader.replace('Bearer ', '');
    const { data: auth, error: authErr } = await supabase.auth.getClaims(token);
    if (authErr || !auth?.claims) return json({ error: 'Unauthorized' }, 401);

    const bodyParsed = await validateBody(req, GenerateCoachingPlanBodySchema, corsHeaders, { endpoint: 'generate-coaching-plan' });
    if (bodyParsed.errorResponse) return bodyParsed.errorResponse;
    const { agent_name } = bodyParsed.data!;
    if (!agent_name || typeof agent_name !== 'string') {
      return json({ error: 'agent_name required' }, 400);
    }

    // Fetch last 20 completed calls with summaries
    const { data: calls, error } = await supabase
      .from('call_sessions')
      .select('id, duration_seconds, call_summaries(agent_performance_score, customer_satisfaction, summary)')
      .eq('agent_name', agent_name)
      .eq('status', 'completed')
      .order('started_at', { ascending: false })
      .limit(20);
    if (error) throw error;

    const summaries: CallSummary[] = (calls ?? [])
      .flatMap((c: { call_summaries?: CallSummary[] }) => c.call_summaries ?? [])
      .filter((s) => s.summary);

    if (summaries.length === 0) {
      return json({
        agent_name,
        plan: 'Sem chamadas analisadas suficientes para gerar plano. Grave e transcreva pelo menos 5 chamadas.',
        generated_at: new Date().toISOString(),
      });
    }

    const avgPerf = avg(summaries.map((s) => s.agent_performance_score ?? 0));
    const avgSat = avg(summaries.map((s) => s.customer_satisfaction ?? 0));

    const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY');
    if (!OPENROUTER_API_KEY) return json({ error: 'AI key missing' }, 500);

    const prompt = `Você é um coach de vendas sênior. Baseado nas últimas ${summaries.length} chamadas do agente "${agent_name}" (performance média: ${avgPerf.toFixed(1)}/5, CSAT médio: ${avgSat.toFixed(1)}/5), gere um plano semanal de coaching em português (PT-BR) com:
1. Diagnóstico curto (2-3 pontos fortes, 2-3 pontos a melhorar)
2. Três ações específicas para a semana
3. Métrica de sucesso mensurável

Resumos das chamadas:
${summaries.slice(0, 10).map((s, i) => `${i + 1}. ${s.summary?.slice(0, 300)}`).join('\n')}

Responda em Markdown estruturado, tom motivador e direto.`;

    let aiRes: Response;
    try { aiRes = await fetchComPrazo('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: prompt }],
      }),
    }); } catch (err) {
      console.error('[generate-coaching-plan] IA sem resposta no prazo:', err);
      return json({ error: 'Serviço de IA indisponível' }, 503);
    }

    if (!aiRes.ok) {
      const body = await aiRes.text();
      console.error(`[generate-coaching-plan] AI failed [${aiRes.status}]: ${body}`);
      return json({ error: 'Serviço de IA indisponível' }, 503);
    }

    const aiData = await aiRes.json();
    const plan = aiData.choices?.[0]?.message?.content ?? 'Sem resposta da IA.';

    return json({
      agent_name,
      plan,
      metrics: { avg_performance: avgPerf, avg_csat: avgSat, sample_size: summaries.length },
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    return internalErrorResponse(err, getCorrelationId(req), corsHeaders, { fn: 'generate-coaching-plan' });
  }
});

function avg(nums: number[]): number {
  const valid = nums.filter((n) => n > 0);
  return valid.length ? valid.reduce((s, v) => s + v, 0) / valid.length : 0;
}

