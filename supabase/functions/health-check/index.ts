// Health check consolidado — endpoint público retornando status dos componentes
import { buildCorsHeaders } from '../_shared/cors.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { withRequestLog, logError } from '../_shared/observability.ts';
import { budget } from './slo-budget.ts';

export const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = buildCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();

    const [trunksRes, webhookRes] = await Promise.allSettled([
      supabase
        .from('voip_trunk_health_checks')
        .select('reachable, latency_ms')
        .gte('checked_at', since),
      supabase
        .from('webhook_flush_metrics')
        .select('sent, failed, duration_ms')
        .gte('created_at', since),
    ]);

    const trunks = trunksRes.status === 'fulfilled' ? trunksRes.value.data ?? [] : [];
    const webhooks = webhookRes.status === 'fulfilled' ? webhookRes.value.data ?? [] : [];

    const trunkReachable = trunks.filter((t) => t.reachable).length;
    const trunkTotal = trunks.length;
    const trunkUptimePct = trunkTotal ? (trunkReachable / trunkTotal) * 100 : 100;

    const webhookSent = webhooks.reduce((s, w) => s + (w.sent ?? 0), 0);
    const webhookFailed = webhooks.reduce((s, w) => s + (w.failed ?? 0), 0);
    const webhookErrorRate = webhookSent + webhookFailed > 0
      ? (webhookFailed / (webhookSent + webhookFailed)) * 100
      : 0;
    const webhookP95Latency = percentile(webhooks.map((w) => w.duration_ms ?? 0), 0.95);

    const trunkBudget = budget({
      total: trunkTotal,
      bad: trunkTotal - trunkReachable,
      targetPct: 99,
    });
    const webhookBudget = budget({
      total: webhookSent + webhookFailed,
      bad: webhookFailed,
      targetPct: 99,
    });

    const components = {
      trunks: {
        status: trunkUptimePct >= 99 ? 'operational' : trunkUptimePct >= 95 ? 'degraded' : 'outage',
        uptime_pct: Number(trunkUptimePct.toFixed(2)),
        checks_15min: trunkTotal,
        error_budget: trunkBudget,
      },
      webhooks: {
        status: webhookErrorRate < 1 ? 'operational' : webhookErrorRate < 5 ? 'degraded' : 'outage',
        error_rate_pct: Number(webhookErrorRate.toFixed(2)),
        p95_latency_ms: Math.round(webhookP95Latency),
        attempts_15min: webhookSent + webhookFailed,
        error_budget: webhookBudget,
      },
      database: { status: 'operational' },
    };

    const overall = Object.values(components).some((c) => c.status === 'outage')
      ? 'outage'
      : Object.values(components).some((c) => c.status === 'degraded')
      ? 'degraded'
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
    const message = err instanceof Error ? err.message : String(err);
    logError('health_check_failed', err);
    return new Response(JSON.stringify({ status: 'unknown', error: message }), {
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
