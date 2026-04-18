// Edge Function: voip-recommendations
// Transforma sinais VoIP (health score breakdown, alertas, capacidade, qualidade por agente)
// em recomendações priorizadas e acionáveis com 1 clique.
// JWT obrigatório, CORS centralizado, validação via _shared/validate.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { buildCorsHeaders } from '../_shared/cors.ts';
import { validate, oneOf } from '../_shared/validate.ts';

const PERIOD_DAYS: Record<string, number> = { day: 1, week: 7 };
const CONCURRENT_CAP = 3;

export type RecommendationCategory = 'capacity' | 'quality' | 'infra' | 'process';
export type RecommendationSeverity = 'info' | 'warning' | 'critical';
export type RecommendationActionType = 'link' | 'function' | 'acknowledge';

export interface Recommendation {
  id: string;
  severity: RecommendationSeverity;
  category: RecommendationCategory;
  title: string;
  description: string;
  impact_estimate: string;
  action_type: RecommendationActionType;
  action_label: string;
  action_payload: Record<string, unknown>;
  priority_score: number; // 0-100, maior = mais urgente
}

interface QualityRow {
  agent_name: string | null;
  mos_avg: number | null;
  jitter_avg_ms: number | null;
  rtt_avg_ms: number | null;
  created_at: string;
}

interface AlertRow {
  id: string;
  alert_type: string;
  acknowledged_at: string | null;
  created_at: string;
}

interface SessionRow {
  started_at: string;
  ended_at: string | null;
}

export interface SignalContext {
  slaPct: number | null;
  avgMos: number | null;
  avgJitter: number | null;
  unackAlerts: number;
  totalAlerts: number;
  peakConcurrent: number;
  worstAgent: { name: string; mos: number; calls: number } | null;
  totalCalls: number;
}

function avg(values: number[]): number | null {
  if (!values.length) return null;
  return Number((values.reduce((s, v) => s + v, 0) / values.length).toFixed(2));
}

function computePeak(sessions: SessionRow[]): number {
  const events: Array<{ t: number; d: number }> = [];
  for (const s of sessions) {
    const start = new Date(s.started_at).getTime();
    const end = s.ended_at ? new Date(s.ended_at).getTime() : Date.now();
    if (Number.isNaN(start) || Number.isNaN(end) || end <= start) continue;
    events.push({ t: start, d: 1 });
    events.push({ t: end, d: -1 });
  }
  events.sort((a, b) => a.t - b.t || a.d - b.d);
  let cur = 0, peak = 0;
  for (const e of events) { cur += e.d; if (cur > peak) peak = cur; }
  return peak;
}

function findWorstAgent(rows: QualityRow[]): SignalContext['worstAgent'] {
  const map = new Map<string, number[]>();
  for (const r of rows) {
    if (!r.agent_name || r.mos_avg === null) continue;
    if (!map.has(r.agent_name)) map.set(r.agent_name, []);
    map.get(r.agent_name)!.push(r.mos_avg);
  }
  let worst: SignalContext['worstAgent'] = null;
  for (const [name, mos] of map) {
    if (mos.length < 3) continue;
    const m = Number((mos.reduce((s, v) => s + v, 0) / mos.length).toFixed(2));
    if (!worst || m < worst.mos) worst = { name, mos: m, calls: mos.length };
  }
  return worst;
}

export function buildRecommendations(ctx: SignalContext): Recommendation[] {
  const recs: Recommendation[] = [];

  // 1) Capacidade — pico próximo do cap
  if (ctx.peakConcurrent >= CONCURRENT_CAP) {
    recs.push({
      id: 'cap-saturated',
      severity: 'critical',
      category: 'capacity',
      title: 'Capacidade simultânea saturada',
      description: `Pico de ${ctx.peakConcurrent} chamadas simultâneas atingiu o limite de ${CONCURRENT_CAP}. Risco de chamadas perdidas.`,
      impact_estimate: 'Alto — possível perda de até 15% das chamadas em pico',
      action_type: 'link',
      action_label: 'Ver previsão de capacidade',
      action_payload: { route: '/network-diagnostics#capacity-forecast' },
      priority_score: 95,
    });
  } else if (ctx.peakConcurrent >= CONCURRENT_CAP * 0.8) {
    recs.push({
      id: 'cap-near-limit',
      severity: 'warning',
      category: 'capacity',
      title: 'Capacidade próxima do limite',
      description: `Pico de ${ctx.peakConcurrent}/${CONCURRENT_CAP} chamadas. Considere aumentar o cap antes do próximo pico previsto.`,
      impact_estimate: 'Médio — degradação se volume crescer',
      action_type: 'link',
      action_label: 'Revisar forecast',
      action_payload: { route: '/network-diagnostics#capacity-forecast' },
      priority_score: 70,
    });
  }

  // 2) Qualidade — agente com MOS baixo
  if (ctx.worstAgent && ctx.worstAgent.mos < 3.6) {
    recs.push({
      id: `quality-agent-${ctx.worstAgent.name}`,
      severity: ctx.worstAgent.mos < 3.0 ? 'critical' : 'warning',
      category: 'quality',
      title: `Coaching para ${ctx.worstAgent.name}`,
      description: `MOS médio ${ctx.worstAgent.mos.toFixed(2)} em ${ctx.worstAgent.calls} chamadas — abaixo da meta (4.0).`,
      impact_estimate: `Recuperar ~${Math.round((4.0 - ctx.worstAgent.mos) * 25)}% de qualidade percebida`,
      action_type: 'link',
      action_label: 'Abrir ranking',
      action_payload: { route: '/network-diagnostics#agent-ranking', agent: ctx.worstAgent.name },
      priority_score: ctx.worstAgent.mos < 3.0 ? 90 : 65,
    });
  }

  // 3) Infra — jitter alto persistente
  if (ctx.avgJitter !== null && ctx.avgJitter > 30) {
    recs.push({
      id: 'infra-high-jitter',
      severity: ctx.avgJitter > 50 ? 'critical' : 'warning',
      category: 'infra',
      title: 'Jitter elevado na rede',
      description: `Jitter médio ${ctx.avgJitter.toFixed(1)}ms acima do limite recomendado (30ms). Verifique STUN/TURN e qualidade do uplink.`,
      impact_estimate: 'Alto — afeta clareza de voz em todas as chamadas',
      action_type: 'function',
      action_label: 'Testar conexão',
      action_payload: { action: 'run_connectivity_test' },
      priority_score: ctx.avgJitter > 50 ? 85 : 60,
    });
  }

  // 4) Processo — alertas pendentes
  if (ctx.unackAlerts >= 3) {
    recs.push({
      id: 'process-unack-alerts',
      severity: ctx.unackAlerts >= 10 ? 'critical' : 'warning',
      category: 'process',
      title: `${ctx.unackAlerts} alerta(s) sem reconhecimento`,
      description: 'Alertas acumulados podem indicar falha no processo de monitoramento. Reconheça ou escalone.',
      impact_estimate: 'Médio — atrasa resposta a degradações',
      action_type: 'link',
      action_label: 'Abrir central de alertas',
      action_payload: { route: '/network-diagnostics#quality-alerts' },
      priority_score: ctx.unackAlerts >= 10 ? 80 : 50,
    });
  }

  // 5) Qualidade — SLA abaixo da meta
  if (ctx.slaPct !== null && ctx.slaPct < 90) {
    recs.push({
      id: 'quality-sla-breach',
      severity: ctx.slaPct < 75 ? 'critical' : 'warning',
      category: 'quality',
      title: 'SLA de qualidade abaixo da meta',
      description: `Apenas ${ctx.slaPct.toFixed(1)}% das chamadas com MOS ≥ 4.0 (meta: 90%).`,
      impact_estimate: `Gap de ${Math.round(90 - ctx.slaPct)}pp para atingir meta`,
      action_type: 'link',
      action_label: 'Ver heatmap',
      action_payload: { route: '/network-diagnostics#quality-heatmap' },
      priority_score: ctx.slaPct < 75 ? 88 : 55,
    });
  }

  // Ordenar por prioridade descendente e limitar a 5
  return recs.sort((a, b) => b.priority_score - a.priority_score).slice(0, 5);
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
    const validation = validate(params, { period: oneOf('day', 'week') } as never);
    if (!validation.ok) {
      return new Response(JSON.stringify({ error: 'Invalid params', details: validation.errors, requestId }), { status: 400, headers });
    }

    const period = params.period as 'day' | 'week';
    const days = PERIOD_DAYS[period];
    const since = new Date(Date.now() - days * 86_400_000).toISOString();
    const since24h = new Date(Date.now() - 86_400_000).toISOString();

    const [qualityRes, alertRes, sessionsRes] = await Promise.all([
      supabase.from('call_quality_metrics')
        .select('agent_name, mos_avg, jitter_avg_ms, rtt_avg_ms, created_at')
        .gte('created_at', since).limit(2000),
      supabase.from('voip_quality_alerts')
        .select('id, alert_type, acknowledged_at, created_at')
        .gte('created_at', since).limit(500),
      supabase.from('call_sessions')
        .select('started_at, ended_at')
        .gte('started_at', since).limit(2000),
    ]);

    if (qualityRes.error) {
      return new Response(JSON.stringify({ error: qualityRes.error.message, requestId }), { status: 500, headers });
    }

    const quality = (qualityRes.data ?? []) as QualityRow[];
    const alerts = (alertRes.data ?? []) as AlertRow[];
    const sessions = (sessionsRes.data ?? []) as SessionRow[];
    const last24h = quality.filter(r => r.created_at >= since24h);

    const mosVals = quality.map(r => r.mos_avg).filter((v): v is number => v !== null);
    const jitterVals = quality.map(r => r.jitter_avg_ms).filter((v): v is number => v !== null);
    const slaPct = mosVals.length ? Number(((mosVals.filter(m => m >= 4.0).length / mosVals.length) * 100).toFixed(1)) : null;

    const ctx: SignalContext = {
      slaPct,
      avgMos: avg(mosVals),
      avgJitter: avg(jitterVals),
      unackAlerts: alerts.filter(a => !a.acknowledged_at).length,
      totalAlerts: alerts.length,
      peakConcurrent: computePeak(sessions),
      worstAgent: findWorstAgent(last24h),
      totalCalls: quality.length,
    };

    const recommendations = buildRecommendations(ctx);

    return new Response(JSON.stringify({
      period,
      since,
      context: ctx,
      recommendations,
      total: recommendations.length,
      requestId,
    }), { status: 200, headers });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message, requestId }), { status: 500, headers });
  }
});
