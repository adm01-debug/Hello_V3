// Health check consolidado — endpoint público retornando status dos componentes
import { buildCorsHeaders } from '../_shared/cors.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { withRequestLog, logError } from '../_shared/observability.ts';
import { budget } from './slo-budget.ts';
import { GENERIC_INTERNAL_MESSAGE, getCorrelationId } from '../_shared/errors.ts';

export const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = buildCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();

    const [trunksRes, webhookRes, dbRes] = await Promise.allSettled([
      supabase
        .from('voip_trunk_health_checks')
        .select('reachable, latency_ms')
        .gte('checked_at', since),
      supabase
        .from('webhook_flush_metrics')
        .select('sent, failed, duration_ms')
        .gte('created_at', since),
      // Verificação real do banco: latência de uma consulta trivial (SELECT 1).
      // Usa a própria tabela de health check como canário; se a query falhar
      // (RLS, conexão, schema) o componente vira degraded.
      (async () => {
        const t0 = performance.now();
        const res = await supabase
          .from('voip_trunk_health_checks')
          .select('id')
          .limit(1);
        const latencyMs = Math.round(performance.now() - t0);
        return { error: res.error, latency_ms: latencyMs };
      })(),
    ]);

    const trunks = trunksRes.status === 'fulfilled' ? trunksRes.value.data ?? [] : [];
    const webhooks = webhookRes.status === 'fulfilled' ? webhookRes.value.data ?? [] : [];

    const trunkReachable = trunks.filter((t) => t.reachable).length;
    const trunkTotal = trunks.length;
    // Sem amostra no período => uptime desconhecido (não 100%).
    const trunkUptimePct = trunkTotal ? (trunkReachable / trunkTotal) * 100 : null;

    const webhookSent = webhooks.reduce((s, w) => s + (w.sent ?? 0), 0);
    const webhookFailed = webhooks.reduce((s, w) => s + (w.failed ?? 0), 0);
    const webhookTotal = webhookSent + webhookFailed;
    // Sem tentativa no período => taxa de erro desconhecida (não 0%).
    const webhookErrorRate = webhookTotal > 0
      ? (webhookFailed / webhookTotal) * 100
      : null;
    const webhookP95Latency = percentile(webhooks.map((w) => w.duration_ms ?? 0), 0.95);

    const trunkBudget = budget({
      total: trunkTotal,
      bad: trunkTotal - trunkReachable,
      targetPct: 99,
    });
    const webhookBudget = budget({
      total: webhookTotal,
      bad: webhookFailed,
      targetPct: 99,
    });

    // Banco: medido de verdade. Falha na query ou latência > 2000ms => degraded.
    const dbFulfilled = dbRes.status === 'fulfilled';
    const dbOk = dbFulfilled && dbRes.value.error === null;
    const dbLatencyMs = dbFulfilled ? dbRes.value.latency_ms : null;
    const databaseStatus = dbOk
      ? (dbLatencyMs !== null && dbLatencyMs > 2000 ? 'degraded' : 'operational')
      : 'degraded';

    const components = {
      trunks: {
        status: trunkUptimePct === null ? 'unknown'
          : trunkUptimePct >= 99 ? 'operational'
          : trunkUptimePct >= 95 ? 'degraded' : 'outage',
        uptime_pct: trunkUptimePct === null ? null : Number(trunkUptimePct.toFixed(2)),
        checks_15min: trunkTotal,
        error_budget: trunkBudget,
      },
      webhooks: {
        status: webhookErrorRate === null ? 'unknown'
          : webhookErrorRate < 1 ? 'operational'
          : webhookErrorRate < 5 ? 'degraded' : 'outage',
        error_rate_pct: webhookErrorRate === null ? null : Number(webhookErrorRate.toFixed(2)),
        p95_latency_ms: webhookP95Latency,
        attempts_15min: webhookTotal,
        error_budget: webhookBudget,
      },
      database: { status: databaseStatus, latency_ms: dbLatencyMs },
    };

    const values = Object.values(components);
    const overall = values.some((c) => c.status === 'outage')
      ? 'outage'
      : values.some((c) => c.status === 'degraded')
      ? 'degraded'
      : values.some((c) => c.status === 'unknown')
      ? 'unknown'
      : 'operational';

    // Budget esgotado alerta mesmo com status ainda dentro do limite: e o sinal
    // antecipado de que o SLO vai estourar antes do fim da janela.
    const exhausted = [
      ['trunks', trunkBudget],
      ['webhooks', webhookBudget],
    ].filter(([, b]) => (b as { status: string }).status === 'exhausted');

    if (overall !== 'operational') {
      // SLO violado: alerta estruturado consumível por Supabase Logs/webhook.
      logError('slo_violation_' + overall, new Error('downtime >= threshold'), { components });
    } else if (exhausted.length > 0) {
      logError('slo_budget_exhausted', new Error('error budget exhausted'), {
        exhausted: exhausted.map(([name]) => name),
        components,
      });
    }

    return new Response(JSON.stringify({
      status: overall,
      components,
      checked_at: new Date().toISOString(),
      window_minutes: 15,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err) {
    logError('health_check_failed', err);
    return new Response(JSON.stringify({ status: 'unknown', code: 'internal_error', message: GENERIC_INTERNAL_MESSAGE, correlation_id: getCorrelationId(req) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
};

Deno.serve(withRequestLog('health-check', handler));

function percentile(nums: number[], p: number): number {
  if (nums.length === 0) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor(sorted.length * p));
  return sorted[idx];
}
