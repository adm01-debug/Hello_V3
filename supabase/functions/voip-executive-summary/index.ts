// Edge Function: voip-executive-summary
// Agrega em UMA única chamada todos os sinais VoIP (SLA, MOS, alertas, anomalias,
// forecast e ranking) em um Health Score 0-100 + breakdown.
// Fórmula: 0.4*SLA + 0.3*MOS_norm + 0.2*Alertas_norm + 0.1*Capacidade_norm
// JWT obrigatório, CORS centralizado, validação via _shared/validate.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { buildCorsHeaders } from '../_shared/cors.ts';
import { validate, oneOf } from '../_shared/validate.ts';

const PERIOD_DAYS: Record<string, number> = { day: 1, week: 7, month: 30 };
const CONCURRENT_CAP = 3;

interface QualityRow {
  agent_name: string | null;
  mos_avg: number | null;
  jitter_avg_ms: number | null;
  rtt_avg_ms: number | null;
  packet_loss_pct: number | null;
  created_at: string;
}

interface AlertRow {
  alert_type: string;
  acknowledged_at: string | null;
  created_at: string;
}

interface SessionRow {
  started_at: string;
  ended_at: string | null;
}

function avg(values: number[]): number | null {
  if (!values.length) return null;
  return Number((values.reduce((s, v) => s + v, 0) / values.length).toFixed(2));
}

function slaPct(rows: QualityRow[]): number | null {
  const mos = rows.map(r => r.mos_avg).filter((v): v is number => v !== null);
  if (!mos.length) return null;
  const ok = mos.filter(m => m >= 4.0).length;
  return Number(((ok / mos.length) * 100).toFixed(1));
}

export interface HealthBreakdown {
  sla_score: number;        // 0-100
  mos_score: number;        // 0-100 (MOS 1-5 → normalizado)
  alerts_score: number;     // 0-100 (penalty por alertas não-reconhecidos)
  capacity_score: number;   // 0-100 (penalty por exceder cap)
}

export function computeHealthScore(b: HealthBreakdown): number {
  const score = 0.4 * b.sla_score + 0.3 * b.mos_score + 0.2 * b.alerts_score + 0.1 * b.capacity_score;
  return Math.round(Math.max(0, Math.min(100, score)));
}

export function normalizeMos(mosAvg: number | null): number {
  if (mosAvg === null) return 75; // neutro quando sem dados
  // MOS 1-5 → 0-100, com MOS=4 valendo 80
  return Math.round(Math.max(0, Math.min(100, ((mosAvg - 1) / 4) * 100)));
}

export function normalizeAlerts(unackCount: number, totalCalls: number): number {
  if (totalCalls === 0) return 100;
  const ratio = unackCount / Math.max(totalCalls, 1);
  // 0% alertas = 100, 10%+ = 0
  return Math.round(Math.max(0, Math.min(100, 100 - ratio * 1000)));
}

export function normalizeCapacity(peakConcurrent: number): number {
  if (peakConcurrent <= CONCURRENT_CAP * 0.6) return 100;
  if (peakConcurrent >= CONCURRENT_CAP) return 30;
  // linear entre 60% e 100% do cap
  const ratio = (peakConcurrent - CONCURRENT_CAP * 0.6) / (CONCURRENT_CAP * 0.4);
  return Math.round(100 - ratio * 70);
}

function computePeakConcurrent(sessions: SessionRow[]): number {
  if (!sessions.length) return 0;
  const events: Array<{ t: number; delta: number }> = [];
  for (const s of sessions) {
    const start = new Date(s.started_at).getTime();
    const end = s.ended_at ? new Date(s.ended_at).getTime() : Date.now();
    if (Number.isNaN(start) || Number.isNaN(end) || end <= start) continue;
    events.push({ t: start, delta: 1 });
    events.push({ t: end, delta: -1 });
  }
  events.sort((a, b) => a.t - b.t || a.delta - b.delta);
  let cur = 0, peak = 0;
  for (const e of events) {
    cur += e.delta;
    if (cur > peak) peak = cur;
  }
  return peak;
}

interface AgentStat {
  agent_name: string;
  calls: number;
  mos_avg: number;
}

function worstAgents(rows: QualityRow[], limit = 3): AgentStat[] {
  const map = new Map<string, number[]>();
  for (const r of rows) {
    if (!r.agent_name || r.mos_avg === null) continue;
    if (!map.has(r.agent_name)) map.set(r.agent_name, []);
    map.get(r.agent_name)!.push(r.mos_avg);
  }
  const stats: AgentStat[] = [];
  for (const [name, mos] of map) {
    if (mos.length < 3) continue;
    stats.push({ agent_name: name, calls: mos.length, mos_avg: Number((mos.reduce((s, v) => s + v, 0) / mos.length).toFixed(2)) });
  }
  stats.sort((a, b) => a.mos_avg - b.mos_avg);
  return stats.slice(0, limit);
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
    const token = authHeader.replace('Bearer ', '');
    const { data: claims, error: authError } = await supabase.auth.getClaims(token);
    if (authError || !claims?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized', requestId }), { status: 401, headers });
    }

    const url = new URL(req.url);
    const params = { period: url.searchParams.get('period') ?? 'week' };
    const validation = validate(params, { period: oneOf('day', 'week', 'month') } as never);
    if (!validation.ok) {
      return new Response(JSON.stringify({ error: 'Invalid params', details: validation.errors, requestId }), { status: 400, headers });
    }

    const period = params.period as 'day' | 'week' | 'month';
    const days = PERIOD_DAYS[period];
    const since = new Date(Date.now() - days * 86_400_000).toISOString();
    const previousSince = new Date(Date.now() - 2 * days * 86_400_000).toISOString();
    const since24h = new Date(Date.now() - 86_400_000).toISOString();

    const [qualityRes, alertRes, sessionsRes] = await Promise.all([
      supabase.from('call_quality_metrics')
        .select('agent_name, mos_avg, jitter_avg_ms, rtt_avg_ms, packet_loss_pct, created_at')
        .gte('created_at', previousSince).limit(2000),
      supabase.from('voip_quality_alerts')
        .select('alert_type, acknowledged_at, created_at')
        .gte('created_at', since).limit(500),
      supabase.from('call_sessions')
        .select('started_at, ended_at')
        .gte('started_at', since).limit(2000),
    ]);

    if (qualityRes.error) return new Response(JSON.stringify({ error: qualityRes.error.message, requestId }), { status: 500, headers });

    const allQuality = (qualityRes.data ?? []) as QualityRow[];
    const current = allQuality.filter(r => r.created_at >= since);
    const previous = allQuality.filter(r => r.created_at < since);
    const last24h = allQuality.filter(r => r.created_at >= since24h);
    const alerts = (alertRes.data ?? []) as AlertRow[];
    const sessions = (sessionsRes.data ?? []) as SessionRow[];

    const currentSla = slaPct(current);
    const previousSla = slaPct(previous);
    const currentMos = avg(current.map(r => r.mos_avg).filter((v): v is number => v !== null));
    const unackAlerts = alerts.filter(a => !a.acknowledged_at).length;
    const peak = computePeakConcurrent(sessions);

    const breakdown: HealthBreakdown = {
      sla_score: currentSla ?? 75,
      mos_score: normalizeMos(currentMos),
      alerts_score: normalizeAlerts(unackAlerts, current.length),
      capacity_score: normalizeCapacity(peak),
    };
    const healthScore = computeHealthScore(breakdown);

    return new Response(JSON.stringify({
      period,
      since,
      health_score: healthScore,
      breakdown,
      sla: {
        current_pct: currentSla,
        previous_pct: previousSla,
        delta_pct: currentSla !== null && previousSla !== null ? Number((currentSla - previousSla).toFixed(1)) : null,
        total_calls: current.length,
      },
      mos_avg: currentMos,
      alerts: {
        total: alerts.length,
        unacknowledged: unackAlerts,
      },
      capacity: {
        peak_concurrent: peak,
        cap: CONCURRENT_CAP,
        utilization_pct: Number(((peak / CONCURRENT_CAP) * 100).toFixed(1)),
      },
      worst_agents: worstAgents(last24h),
      requestId,
    }), { status: 200, headers });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message, requestId }), { status: 500, headers });
  }
});
