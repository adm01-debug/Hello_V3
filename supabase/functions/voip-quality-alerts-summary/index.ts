// Edge Function: voip-quality-alerts-summary
// Agrega alertas de qualidade VoIP (voip_quality_alerts) por período.
// Retorna contagem por tipo, top 5 usuários afetados, MOS médio nos alertas.
// JWT obrigatório, CORS centralizado, validação via _shared/validate.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { buildCorsHeaders } from '../_shared/cors.ts';
import { validate, oneOf } from '../_shared/validate.ts';

interface AlertRow {
  user_id: string;
  alert_type: string;
  mos_at_alert: number | null;
  acknowledged_at: string | null;
  created_at: string;
}

const PERIOD_DAYS: Record<string, number> = { day: 1, week: 7, month: 30 };

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
    const token = authHeader.replace('Bearer ', '');
    const { data: claims, error: authError } = await supabase.auth.getClaims(token);
    if (authError || !claims?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized', requestId }), { status: 401, headers });
    }

    const url = new URL(req.url);
    const params = { period: url.searchParams.get('period') ?? 'week' };
    const validation = validate(params, { period: oneOf('day', 'week', 'month') } as never);
    if (!validation.ok) {
      return new Response(
        JSON.stringify({ error: 'Invalid params', details: validation.errors, requestId }),
        { status: 400, headers },
      );
    }

    const period = params.period as 'day' | 'week' | 'month';
    const since = new Date(Date.now() - PERIOD_DAYS[period] * 86_400_000).toISOString();

    const { data, error } = await supabase
      .from('voip_quality_alerts')
      .select('user_id, alert_type, mos_at_alert, acknowledged_at, created_at')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(5000);

    if (error) {
      return new Response(JSON.stringify({ error: error.message, requestId }), { status: 500, headers });
    }

    const rows = (data ?? []) as AlertRow[];
    const byType: Record<string, number> = { degrading: 0, poor: 0, offline: 0 };
    const byUser: Record<string, number> = {};
    const mosValues: number[] = [];
    let unack = 0;

    for (const r of rows) {
      byType[r.alert_type] = (byType[r.alert_type] ?? 0) + 1;
      byUser[r.user_id] = (byUser[r.user_id] ?? 0) + 1;
      if (r.mos_at_alert !== null) mosValues.push(r.mos_at_alert);
      if (!r.acknowledged_at) unack++;
    }

    const topUsers = Object.entries(byUser)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([user_id, count]) => ({ user_id, count }));

    const mosAvg = mosValues.length
      ? Number((mosValues.reduce((s, v) => s + v, 0) / mosValues.length).toFixed(2))
      : null;

    return new Response(
      JSON.stringify({
        period,
        since,
        total: rows.length,
        unacknowledged: unack,
        by_type: byType,
        top_users: topUsers,
        mos_avg_at_alert: mosAvg,
        requestId,
      }),
      { status: 200, headers },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message, requestId }), { status: 500, headers });
  }
});
