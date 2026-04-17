// Edge Function: voip-sla-report
// Agrega métricas de qualidade VoIP (call_quality_metrics) e retorna SLA, MOS médio,
// p95 de jitter/RTT por período (day/week/month). JWT obrigatório, CORS centralizado,
// validação Zod-like via _shared/validate, tracing via x-request-id.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { buildCorsHeaders } from '../_shared/cors.ts';
import { validate, string as vstring, oneOf } from '../_shared/validate.ts';

interface QualityRow {
  mos_avg: number | null;
  jitter_avg_ms: number | null;
  rtt_avg_ms: number | null;
  packet_loss_pct: number | null;
  created_at: string;
}

const PERIOD_DAYS: Record<string, number> = { day: 1, week: 7, month: 30 };

function percentile(values: number[], p: number): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return Number(sorted[idx].toFixed(2));
}

function avg(values: number[]): number | null {
  if (!values.length) return null;
  return Number((values.reduce((s, v) => s + v, 0) / values.length).toFixed(2));
}

function buildStats(subset: QualityRow[]) {
  const mos = subset.map(r => r.mos_avg).filter((v): v is number => v !== null);
  const jitter = subset.map(r => r.jitter_avg_ms).filter((v): v is number => v !== null);
  const rtt = subset.map(r => r.rtt_avg_ms).filter((v): v is number => v !== null);
  const loss = subset.map(r => r.packet_loss_pct).filter((v): v is number => v !== null);
  const slaCount = mos.filter(m => m >= 4.0).length;
  return {
    total_calls: subset.length,
    sla_pct: mos.length ? Number(((slaCount / mos.length) * 100).toFixed(1)) : null,
    mos_avg: avg(mos),
    jitter_p95_ms: percentile(jitter, 95),
    rtt_p95_ms: percentile(rtt, 95),
    packet_loss_avg_pct: avg(loss),
  };
}

Deno.serve(async (req) => {
  const cors = buildCorsHeaders(req);
  const requestId = req.headers.get('x-request-id') ?? crypto.randomUUID();
  const baseHeaders = { ...cors, 'Content-Type': 'application/json', 'x-request-id': requestId };

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: cors });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized', requestId }), { status: 401, headers: baseHeaders });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const token = authHeader.replace('Bearer ', '');
    const { data: claims, error: authError } = await supabase.auth.getClaims(token);
    if (authError || !claims?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized', requestId }), { status: 401, headers: baseHeaders });
    }

    const url = new URL(req.url);
    const params = { period: url.searchParams.get('period') ?? 'week' };
    const validation = validate(params, {
      period: oneOf('day', 'week', 'month'),
    } as never);
    if (!validation.ok) {
      return new Response(
        JSON.stringify({ error: 'Invalid params', details: validation.errors, requestId }),
        { status: 400, headers: baseHeaders },
      );
    }

    const period = params.period as 'day' | 'week' | 'month';
    const days = PERIOD_DAYS[period];
    const since = new Date(Date.now() - days * 86_400_000).toISOString();
    const previousSince = new Date(Date.now() - 2 * days * 86_400_000).toISOString();

    const { data, error } = await supabase
      .from('call_quality_metrics')
      .select('mos_avg, jitter_avg_ms, rtt_avg_ms, packet_loss_pct, created_at')
      .gte('created_at', previousSince)
      .order('created_at', { ascending: false })
      .limit(2000);

    if (error) {
      return new Response(JSON.stringify({ error: error.message, requestId }), { status: 500, headers: baseHeaders });
    }

    const rows = (data ?? []) as QualityRow[];
    const current = rows.filter(r => r.created_at >= since);
    const previous = rows.filter(r => r.created_at < since);

    return new Response(
      JSON.stringify({
        period,
        since,
        current: buildStats(current),
        previous: buildStats(previous),
        requestId,
      }),
      { status: 200, headers: baseHeaders },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message, requestId }), { status: 500, headers: baseHeaders });
  }
});
