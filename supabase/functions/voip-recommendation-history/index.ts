// Edge Function: voip-recommendation-history
// Retorna histórico auditável de ações sobre recomendações VoIP
// com agregações por categoria, outcome e por dia (últimos 14d).
// JWT obrigatório, CORS centralizado, validação via _shared/validate.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { buildCorsHeaders } from '../_shared/cors.ts';
import { validate, oneOf } from '../_shared/validate.ts';

const PERIOD_DAYS: Record<string, number> = { day: 1, week: 7, month: 30 };

export interface ActionRow {
  id: string;
  user_id: string;
  recommendation_id: string;
  category: string;
  severity: string;
  action_type: string;
  outcome: string;
  applied_at: string;
  notes: string | null;
}

export interface HistoryAggregations {
  byCategory: Record<string, number>;
  byOutcome: Record<string, number>;
  perDay: Array<{ date: string; count: number }>;
}

export function aggregate(items: ActionRow[]): HistoryAggregations {
  const byCategory: Record<string, number> = {};
  const byOutcome: Record<string, number> = {};
  const perDayMap = new Map<string, number>();

  // Inicializa últimos 14 dias com 0
  const today = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    perDayMap.set(key, 0);
  }

  for (const it of items) {
    byCategory[it.category] = (byCategory[it.category] ?? 0) + 1;
    byOutcome[it.outcome] = (byOutcome[it.outcome] ?? 0) + 1;
    const day = it.applied_at.slice(0, 10);
    if (perDayMap.has(day)) perDayMap.set(day, perDayMap.get(day)! + 1);
  }

  return {
    byCategory,
    byOutcome,
    perDay: Array.from(perDayMap.entries()).map(([date, count]) => ({ date, count })),
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
    const params = {
      period: url.searchParams.get('period') ?? 'week',
      limit: url.searchParams.get('limit') ?? '50',
    };
    const validation = validate(params, {
      period: oneOf('day', 'week', 'month'),
      limit: oneOf('10', '25', '50', '100'),
    } as never);
    if (!validation.ok) {
      return new Response(JSON.stringify({ error: 'Invalid params', details: validation.errors, requestId }), { status: 400, headers });
    }

    const period = params.period as 'day' | 'week' | 'month';
    const limit = Number(params.limit);
    const days = PERIOD_DAYS[period];
    const since = new Date(Date.now() - days * 86_400_000).toISOString();

    const { data, error } = await supabase
      .from('voip_recommendation_actions')
      .select('id, user_id, recommendation_id, category, severity, action_type, outcome, applied_at, notes')
      .gte('applied_at', since)
      .order('applied_at', { ascending: false })
      .limit(limit);

    if (error) {
      return new Response(JSON.stringify({ error: error.message, requestId }), { status: 500, headers });
    }

    const items = (data ?? []) as ActionRow[];
    const aggregations = aggregate(items);

    return new Response(JSON.stringify({
      period,
      since,
      items,
      total: items.length,
      aggregations,
      requestId,
    }), { status: 200, headers });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message, requestId }), { status: 500, headers });
  }
});
