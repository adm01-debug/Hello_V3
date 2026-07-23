// Auto-Scorecard — Gera scorecard automático via IA para chamadas com resumo
// Invocado por trigger em call_summaries (pg_net) ou manualmente.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

interface Criterion {
  id: string;
  label: string;
  description: string | null;
  weight: number;
  max_score: number;
}

interface AIScore {
  criterion_id: string;
  score: number;
  comment: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const callSessionId: string | undefined = body.call_session_id ?? body.callSessionId;
    if (!callSessionId) return json({ error: 'call_session_id required' }, 400);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Idempotência: se já existe scorecard IA para essa sessão, retorna
    const { data: existing } = await supabase
      .from('call_scorecards')
      .select('id')
      .eq('call_session_id', callSessionId)
      .eq('ai_generated', true)
      .maybeSingle();
    if (existing) return json({ status: 'skipped', reason: 'already_scored', scorecard_id: existing.id });

    // Carrega summary + sessão
    const { data: session, error: sessErr } = await supabase
      .from('call_sessions')
      .select('id, agent_name, duration_seconds, call_summaries(summary, main_topics, overall_sentiment, customer_satisfaction, agent_performance_score)')
      .eq('id', callSessionId)
      .maybeSingle();
    if (sessErr) throw sessErr;
    if (!session) return json({ error: 'session_not_found' }, 404);

    const summaryRow = Array.isArray(session.call_summaries) ? session.call_summaries[0] : session.call_summaries;
    if (!summaryRow?.summary) return json({ status: 'skipped', reason: 'no_summary' });
    if ((session.duration_seconds ?? 0) < 10) {
      return json({ status: 'skipped', reason: 'too_short' });
    }

    // Template ativo (primeiro is_active=true)
    const { data: template, error: tplErr } = await supabase
      .from('scorecard_templates')
      .select('id, name')
      .eq('is_active', true)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();
    if (tplErr) throw tplErr;
    if (!template) return json({ status: 'skipped', reason: 'no_active_template' });

    const { data: criteria, error: critErr } = await supabase
      .from('scorecard_criteria')
      .select('id, label, description, weight, max_score')
      .eq('template_id', template.id)
      .order('display_order');
    if (critErr) throw critErr;
    if (!criteria || criteria.length === 0) return json({ status: 'skipped', reason: 'no_criteria' });

    // Chamada IA
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) return json({ error: 'AI key missing' }, 500);

    const prompt = buildPrompt(summaryRow, criteria as Criterion[]);
    const aiRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'Você é um QA sênior de call center. Avalie chamadas objetivamente, JSON estrito.' },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (!aiRes.ok) {
      const errBody = await aiRes.text();
      console.error(`[auto-scorecard] AI failed [${aiRes.status}]: ${errBody}`);
      return json({ error: 'AI request failed', status: aiRes.status, details: errBody }, aiRes.status);
    }

    const aiData = await aiRes.json();
    const content = aiData.choices?.[0]?.message?.content ?? '{}';
    const parsed = safeParse(content);
    const scores: AIScore[] = Array.isArray(parsed?.scores) ? parsed.scores : [];
    const feedback: string = typeof parsed?.feedback === 'string' ? parsed.feedback : '';

    if (scores.length === 0) return json({ status: 'skipped', reason: 'ai_no_scores' });

    // Normaliza e calcula total ponderado
    const critMap = new Map((criteria as Criterion[]).map((c) => [c.id, c]));
    let total = 0;
    let maxTotal = 0;
    const validScores: AIScore[] = [];
    for (const s of scores) {
      const c = critMap.get(s.criterion_id);
      if (!c) continue;
      const clamped = Math.max(0, Math.min(c.max_score, Number(s.score) || 0));
      total += clamped * Number(c.weight);
      maxTotal += c.max_score * Number(c.weight);
      validScores.push({ criterion_id: c.id, score: clamped, comment: (s.comment ?? '').slice(0, 500) });
    }

    if (validScores.length === 0) return json({ status: 'skipped', reason: 'no_valid_scores' });

    // Insert scorecard + responses (transacional via RPC seria ideal, mas duas queries com rollback manual)
    const { data: card, error: cardErr } = await supabase
      .from('call_scorecards')
      .insert({
        call_session_id: callSessionId,
        template_id: template.id,
        agent_name: session.agent_name,
        total_score: Number(total.toFixed(2)),
        max_total: Number(maxTotal.toFixed(2)),
        status: 'submitted',
        ai_generated: true,
        feedback: feedback.slice(0, 2000),
      })
      .select('id')
      .single();
    if (cardErr) throw cardErr;

    const { error: respErr } = await supabase.from('scorecard_responses').insert(
      validScores.map((s) => ({
        scorecard_id: card.id,
        criterion_id: s.criterion_id,
        score: s.score,
        comment: s.comment,
      })),
    );
    if (respErr) {
      await supabase.from('call_scorecards').delete().eq('id', card.id);
      throw respErr;
    }

    return json({
      status: 'created',
      scorecard_id: card.id,
      template_id: template.id,
      total_score: total,
      max_total: maxTotal,
      criteria_scored: validScores.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[auto-scorecard] error:', message);
    return json({ error: message }, 500);
  }
});

function buildPrompt(summary: {
  summary: string | null;
  main_topics: string[] | null;
  overall_sentiment: string | null;
  customer_satisfaction: number | null;
}, criteria: Criterion[]): string {
  return `Avalie a chamada abaixo em cada critério. Responda APENAS JSON no formato:
{"scores":[{"criterion_id":"uuid","score":<0..max_score>,"comment":"justificativa curta"}], "feedback":"resumo geral 2-3 frases"}

Chamada:
- Sentimento geral: ${summary.overall_sentiment ?? 'desconhecido'}
- CSAT: ${summary.customer_satisfaction ?? 'n/a'}
- Tópicos: ${(summary.main_topics ?? []).join(', ') || 'n/a'}
- Resumo: ${summary.summary?.slice(0, 1500)}

Critérios (score entre 0 e max_score, use o criterion_id EXATO):
${criteria.map((c) => `- id=${c.id} | ${c.label} | max=${c.max_score} | ${c.description ?? ''}`).join('\n')}`;
}

function safeParse(s: string): { scores?: AIScore[]; feedback?: string } | null {
  try { return JSON.parse(s); } catch { return null; }
}

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  });
}
