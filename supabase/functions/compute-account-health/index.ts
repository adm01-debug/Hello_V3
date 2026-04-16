// Compute account health score 0-100 from deterministic signals
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { buildCorsHeaders } from '../_shared/cors.ts';

interface HealthFactors {
  contact_frequency: number;
  sentiment: number;
  nps: number;
  open_signals: number;
  renewal_proximity: number;
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

    const { data: account, error: accErr } = await supabase
      .from('accounts').select('*').eq('id', account_id).maybeSingle();
    if (accErr || !account) throw accErr ?? new Error('account not found');

    // 1) Contact frequency (last 30 days)
    const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
    const { count: callCount = 0 } = await supabase
      .from('call_sessions')
      .select('id', { count: 'exact', head: true })
      .gte('started_at', since)
      .eq('contact_id', account.id); // best-effort if linked via contact

    const contactFreq = Math.min(100, (callCount ?? 0) * 10);

    // 2) Avg sentiment from recent summaries
    const { data: summaries } = await supabase
      .from('call_summaries')
      .select('overall_sentiment, customer_satisfaction, created_at')
      .gte('created_at', since)
      .limit(50);

    let sentiment = 50;
    if (summaries && summaries.length > 0) {
      const map: Record<string, number> = { positive: 100, neutral: 50, negative: 0 };
      const vals = summaries
        .map((s) => map[String(s.overall_sentiment ?? 'neutral').toLowerCase()] ?? 50);
      sentiment = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
    }

    // 3) NPS aggregate
    const { data: surveys } = await supabase
      .from('survey_responses')
      .select('score, category')
      .eq('account_id', account_id)
      .not('score', 'is', null);

    let nps = 50;
    if (surveys && surveys.length > 0) {
      const promoters = surveys.filter((s) => (s.score ?? 0) >= 9).length;
      const detractors = surveys.filter((s) => (s.score ?? 0) <= 6).length;
      const score = ((promoters - detractors) / surveys.length) * 100;
      nps = Math.max(0, Math.min(100, Math.round((score + 100) / 2)));
    }

    // 4) Open churn signals penalty
    const { count: openSignals = 0 } = await supabase
      .from('churn_risk_signals')
      .select('id', { count: 'exact', head: true })
      .eq('account_id', account_id)
      .eq('is_active', true);
    const openSignalsScore = Math.max(0, 100 - (openSignals ?? 0) * 20);

    // 5) Renewal proximity (closer renewal with low probability hurts)
    let renewalProximity = 70;
    if (account.contract_end_date) {
      const daysToEnd = Math.ceil(
        (new Date(account.contract_end_date).getTime() - Date.now()) / 86400000,
      );
      if (daysToEnd < 30) renewalProximity = 30;
      else if (daysToEnd < 90) renewalProximity = 50;
      else renewalProximity = 80;
    }

    const factors: HealthFactors = {
      contact_frequency: contactFreq,
      sentiment,
      nps,
      open_signals: openSignalsScore,
      renewal_proximity: renewalProximity,
    };

    // Weighted average
    const weights = { contact_frequency: 0.2, sentiment: 0.25, nps: 0.25, open_signals: 0.2, renewal_proximity: 0.1 };
    const health = Math.round(
      Object.entries(factors).reduce((acc, [k, v]) => acc + v * (weights as Record<string, number>)[k], 0),
    );

    await supabase
      .from('accounts')
      .update({
        health_score: health,
        health_factors: factors,
        updated_at: new Date().toISOString(),
      })
      .eq('id', account_id);

    return new Response(JSON.stringify({ health_score: health, factors }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
