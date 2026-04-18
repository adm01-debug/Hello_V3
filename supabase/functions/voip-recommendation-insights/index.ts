// Edge Function: voip-recommendation-insights
// Insights preditivos sobre o ciclo de recomendações VoIP:
// - Effectiveness: % de ações applied/auto_applied seguidas de melhoria do MOS em 2h.
// - Categorias problemáticas: mais snoozed/dismissed sem resolução posterior.
// - Padrões temporais: heatmap dia-da-semana × hora.
// - Recomendações recorrentes: mesma categoria > 3x na janela.
// JWT obrigatório, CORS centralizado, validação via _shared/validate.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { buildCorsHeaders } from '../_shared/cors.ts';
import { validate, oneOf } from '../_shared/validate.ts';

const PERIOD_DAYS: Record<string, number> = { week: 7, month: 30 };
const EFFECTIVENESS_WINDOW_MS = 2 * 60 * 60 * 1000; // 2h

export interface ActionRow {
  id: string;
  user_id: string;
  recommendation_id: string;
  category: string;
  severity: string;
  action_type: string;
  outcome: string;
  applied_at: string;
}

export interface QualityRow {
  created_at: string;
  mos_avg: number | null;
}

export interface InsightsResponse {
  period: 'week' | 'month';
  since: string;
  effectivenessPct: number | null;
  effectivenessSampleSize: number;
  recurringCategories: Array<{ category: string; count: number }>;
  topProblematic: Array<{ category: string; unresolved: number; severity: string }>;
  pendingSnoozed: number;
  heatmap: Array<{ dow: number; hour: number; count: number }>;
  totals: { applied: number; autoApplied: number; snoozed: number; dismissed: number };
  requestId: string;
}

export function buildHeatmap(items: ActionRow[]): Array<{ dow: number; hour: number; count: number }> {
  const map = new Map<string, number>();
  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h++) map.set(`${d}-${h}`, 0);
  }
  for (const it of items) {
    const dt = new Date(it.applied_at);
    const key = `${dt.getUTCDay()}-${dt.getUTCHours()}`;
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return Array.from(map.entries()).map(([k, count]) => {
    const [dow, hour] = k.split('-').map(Number);
    return { dow, hour, count };
  });
}

export function calcEffectiveness(
  actions: ActionRow[],
  quality: QualityRow[],
): { pct: number | null; sample: number } {
  const positive = actions.filter(a => a.outcome === 'applied' || a.outcome === 'auto_applied');
  if (positive.length === 0) return { pct: null, sample: 0 };

  let improved = 0;
  let evaluated = 0;
  for (const act of positive) {
    const t0 = new Date(act.applied_at).getTime();
    const before = quality.filter(q => {
      const t = new Date(q.created_at).getTime();
      return t < t0 && t >= t0 - EFFECTIVENESS_WINDOW_MS && q.mos_avg !== null;
    });
    const after = quality.filter(q => {
      const t = new Date(q.created_at).getTime();
      return t > t0 && t <= t0 + EFFECTIVENESS_WINDOW_MS && q.mos_avg !== null;
    });
    if (before.length === 0 || after.length === 0) continue;
    evaluated += 1;
    const avgBefore = before.reduce((s, q) => s + (q.mos_avg ?? 0), 0) / before.length;
    const avgAfter = after.reduce((s, q) => s + (q.mos_avg ?? 0), 0) / after.length;
    if (avgAfter > avgBefore + 0.05) improved += 1;
  }
  if (evaluated === 0) return { pct: null, sample: 0 };
  return { pct: Math.round((improved / evaluated) * 100), sample: evaluated };
}

export function computeRecurring(items: ActionRow[]): Array<{ category: string; count: number }> {
  const counts: Record<string, number> = {};
  for (const it of items) counts[it.category] = (counts[it.category] ?? 0) + 1;
  return Object.entries(counts)
    .filter(([, c]) => c > 3)
    .sort((a, b) => b[1] - a[1])
    .map(([category, count]) => ({ category, count }));
}

export function computeProblematic(items: ActionRow[]): Array<{ category: string; unresolved: number; severity: string }> {
  // Categorias com snoozed/dismissed sem applied/auto_applied posterior.
  const byCat: Record<string, { unresolved: number; topSeverity: string }> = {};
  const sorted = [...items].sort((a, b) => a.applied_at.localeCompare(b.applied_at));
  const lastApplied: Record<string, string> = {};
  for (const it of sorted) {
    if (it.outcome === 'applied' || it.outcome === 'auto_applied') {
      lastApplied[it.category] = it.applied_at;
    }
  }
  for (const it of items) {
    if (it.outcome !== 'snoozed' && it.outcome !== 'dismissed') continue;
    const lastFix = lastApplied[it.category];
    if (lastFix && lastFix > it.applied_at) continue;
    const slot = byCat[it.category] ?? { unresolved: 0, topSeverity: 'info' };
    slot.unresolved += 1;
    if (it.severity === 'critical' || (it.severity === 'warning' && slot.topSeverity === 'info')) {
      slot.topSeverity = it.severity;
    }
    byCat[it.category] = slot;
  }
  return Object.entries(byCat)
    .map(([category, v]) => ({ category, unresolved: v.unresolved, severity: v.topSeverity }))
    .sort((a, b) => b.unresolved - a.unresolved)
    .slice(0, 3);
}

export function computeTotals(items: ActionRow[]) {
  return {
    applied: items.filter(i => i.outcome === 'applied').length,
    autoApplied: items.filter(i => i.outcome === 'auto_applied').length,
    snoozed: items.filter(i => i.outcome === 'snoozed').length,
    dismissed: items.filter(i => i.outcome === 'dismissed').length,
  };
}

Deno.serve(async (req) => {
  const cors = buildCorsHeaders(req);
  const requestId = req.headers.get('x-request-id') ?? crypto.randomUUID();
  const headers = { ...cors, 'Content-Type': 'application/json', 'x-request-id': requestId };

  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized', requestId }), { status: 401, headers });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized', requestId }), { status: 401, headers });
    }

    const url = new URL(req.url);
    const params = { period: url.searchParams.get('period') ?? 'week' };
    const validation = validate(params, { period: oneOf('week', 'month') } as never);
    if (!validation.ok) {
      return new Response(JSON.stringify({ error: 'Invalid params', details: validation.errors, requestId }), { status: 400, headers });
    }

    const period = params.period as 'week' | 'month';
    const days = PERIOD_DAYS[period];
    const since = new Date(Date.now() - days * 86_400_000).toISOString();

    const [actionsRes, qualityRes] = await Promise.all([
      supabase
        .from('voip_recommendation_actions')
        .select('id, user_id, recommendation_id, category, severity, action_type, outcome, applied_at')
        .gte('applied_at', since)
        .order('applied_at', { ascending: false })
        .limit(500),
      supabase
        .from('call_quality_metrics')
        .select('created_at, mos_avg')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(2000),
    ]);

    if (actionsRes.error) {
      return new Response(JSON.stringify({ error: actionsRes.error.message, requestId }), { status: 500, headers });
    }

    const actions = (actionsRes.data ?? []) as ActionRow[];
    const quality = (qualityRes.data ?? []) as QualityRow[];

    const { pct, sample } = calcEffectiveness(actions, quality);
    const heatmap = buildHeatmap(actions);
    const recurringCategories = computeRecurring(actions);
    const topProblematic = computeProblematic(actions);
    const totals = computeTotals(actions);
    const pendingSnoozed = actions.filter(a => a.outcome === 'snoozed').length;

    const body: InsightsResponse = {
      period,
      since,
      effectivenessPct: pct,
      effectivenessSampleSize: sample,
      recurringCategories,
      topProblematic,
      pendingSnoozed,
      heatmap,
      totals,
      requestId,
    };

    return new Response(JSON.stringify(body), { status: 200, headers });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message, requestId }), { status: 500, headers });
  }
});
