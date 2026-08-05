// Detect churn risk signals deterministically + persist + bump churn score
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { buildCorsHeaders } from '../_shared/cors.ts';

interface DetectedSignal {
  signal_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  score_delta: number;
  description: string;
  evidence: Record<string, unknown>;
}

Deno.serve(async (req: Request) => {
  const cors = buildCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

  try {
    const { account_id } = await req.json().catch(() => ({}));
    if (!account_id || typeof account_id !== 'string') {
      return new Response(JSON.stringify({ error: 'account_id required' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const signals: DetectedSignal[] = [];
    const since30 = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
    const since14 = new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString();

    // Signal 1: contact drop (no call in last 14 days)
    const { count: recentCalls = 0 } = await supabase
      .from('call_sessions').select('id', { count: 'exact', head: true })
      .gte('started_at', since14);
    if ((recentCalls ?? 0) === 0) {
      signals.push({
        signal_type: 'contact_drop',
        severity: 'high',
        score_delta: 25,
        description: 'Sem contato há mais de 14 dias',
        evidence: { period_days: 14, calls: recentCalls },
      });
    }

    // Signal 2: negative sentiment trend
    const { data: summaries } = await supabase
      .from('call_summaries')
      .select('overall_sentiment, created_at')
      .gte('created_at', since30)
      .order('created_at', { ascending: false })
      .limit(10);
    const negatives = (summaries ?? []).filter(
      (s) => String(s.overall_sentiment ?? '').toLowerCase() === 'negative',
    ).length;
    if (negatives >= 3) {
      signals.push({
        signal_type: 'negative_sentiment',
        severity: negatives >= 5 ? 'critical' : 'high',
        score_delta: negatives >= 5 ? 30 : 20,
        description: `${negatives} chamadas com sentimento negativo nos últimos 30 dias`,
        evidence: { negative_count: negatives, total: summaries?.length ?? 0 },
      });
    }

    // Signal 3: competitor mentions (key moments type 'competitor')
    const { count: competitorMentions = 0 } = await supabase
      .from('call_key_moments').select('id', { count: 'exact', head: true })
      .eq('moment_type', 'competitor')
      .gte('created_at', since30);
    if ((competitorMentions ?? 0) >= 2) {
      signals.push({
        signal_type: 'competitor_mention',
        severity: 'medium',
        score_delta: 15,
        description: `Concorrente mencionado ${competitorMentions} vezes`,
        evidence: { mentions: competitorMentions },
      });
    }

    // Signal 4: recurring objections
    const { count: objections = 0 } = await supabase
      .from('call_key_moments').select('id', { count: 'exact', head: true })
      .eq('moment_type', 'objection')
      .gte('created_at', since30);
    if ((objections ?? 0) >= 5) {
      signals.push({
        signal_type: 'objection_pattern',
        severity: 'medium',
        score_delta: 15,
        description: `${objections} objeções registradas no período`,
        evidence: { count: objections },
      });
    }

    // Persist new signals (skip duplicates of same type still active)
    let createdCount = 0;
    for (const sig of signals) {
      const { data: existing } = await supabase
        .from('churn_risk_signals')
        .select('id')
        .eq('account_id', account_id)
        .eq('signal_type', sig.signal_type)
        .eq('is_active', true)
        .maybeSingle();
      if (existing) continue;
      await supabase.from('churn_risk_signals').insert({
        account_id,
        signal_type: sig.signal_type,
        severity: sig.severity,
        score_delta: sig.score_delta,
        description: sig.description,
        evidence: sig.evidence,
      });
      createdCount++;
    }

    // Recompute total active churn risk score
    const { data: activeSignals } = await supabase
      .from('churn_risk_signals')
      .select('score_delta')
      .eq('account_id', account_id)
      .eq('is_active', true);
    const churnScore = Math.min(
      100,
      (activeSignals ?? []).reduce((acc, s) => acc + (s.score_delta ?? 0), 0),
    );

    const status = churnScore >= 70 ? 'at_risk' : 'active';
    await supabase
      .from('accounts')
      .update({ churn_risk_score: churnScore, status, updated_at: new Date().toISOString() })
      .eq('id', account_id);

    return new Response(
      JSON.stringify({
        churn_risk_score: churnScore,
        signals_detected: signals.length,
        signals_persisted: createdCount,
        status,
      }),
      { headers: { ...cors, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
