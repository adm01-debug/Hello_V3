// Edge Function: voip-recommendation-simulate
// Simulação what-if de impacto de uma recomendação VoIP.
// Recebe deltas hipotéticos de MOS/jitter/packet_loss e projeta:
//   - alertas evitados (alertas com mos_at_alert < threshold + delta_mos)
//   - MOS médio projetado
//   - usuários impactados estimados
// Baseline: últimos 7 dias de call_quality_metrics + voip_quality_alerts.
// JWT obrigatório, CORS centralizado, validação Zod-like via _shared/validate.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { buildCorsHeaders } from '../_shared/cors.ts';
import { validate, string, number, optional } from '../_shared/validate.ts';

const BASELINE_DAYS = 7;
const POOR_MOS_THRESHOLD = 3.6;

export interface QualityRow {
  mos_avg: number | null;
  jitter_avg_ms: number | null;
  packet_loss_pct: number | null;
  agent_name: string | null;
}

export interface AlertRow {
  mos_at_alert: number | null;
  jitter_ms: number | null;
  alert_type: string;
}

export interface SimulationDelta {
  mos?: number;
  jitter?: number;
  packetLoss?: number;
}

export interface SimulationResult {
  recommendationId: string;
  delta: SimulationDelta;
  baseline: {
    avgMos: number | null;
    avgJitter: number | null;
    avgPacketLoss: number | null;
    totalAlerts: number;
    poorAlerts: number;
    sampleSize: number;
    uniqueAgents: number;
  };
  projected: {
    avgMos: number | null;
    avgJitter: number | null;
    avgPacketLoss: number | null;
    alertsAvoided: number;
    affectedUsersPct: number;
  };
  requestId: string;
}

export function projectImpact(
  quality: QualityRow[],
  alerts: AlertRow[],
  delta: SimulationDelta,
): SimulationResult['baseline'] & { projected: SimulationResult['projected'] } {
  const validMos = quality.filter(q => q.mos_avg !== null);
  const validJit = quality.filter(q => q.jitter_avg_ms !== null);
  const validPl = quality.filter(q => q.packet_loss_pct !== null);

  const avgMos = validMos.length
    ? validMos.reduce((s, q) => s + (q.mos_avg ?? 0), 0) / validMos.length
    : null;
  const avgJitter = validJit.length
    ? validJit.reduce((s, q) => s + (q.jitter_avg_ms ?? 0), 0) / validJit.length
    : null;
  const avgPl = validPl.length
    ? validPl.reduce((s, q) => s + (q.packet_loss_pct ?? 0), 0) / validPl.length
    : null;

  const poorAlerts = alerts.filter(a =>
    (a.mos_at_alert ?? 5) < POOR_MOS_THRESHOLD
  ).length;

  const dMos = delta.mos ?? 0;
  const dJit = delta.jitter ?? 0;
  const dPl = delta.packetLoss ?? 0;

  // Projeção determinística linear: cada delta é somado ao baseline.
  const projAvgMos = avgMos === null ? null : Math.min(5, Math.max(1, avgMos + dMos));
  const projAvgJit = avgJitter === null ? null : Math.max(0, avgJitter + dJit);
  const projAvgPl = avgPl === null ? null : Math.max(0, avgPl + dPl);

  // Alertas evitados: aqueles cujo mos_at_alert + dMos passaria do threshold.
  const alertsAvoided = alerts.filter(a => {
    const m = a.mos_at_alert ?? 5;
    return m < POOR_MOS_THRESHOLD && (m + dMos) >= POOR_MOS_THRESHOLD;
  }).length;

  const uniqueAgents = new Set(
    quality.filter(q => q.agent_name).map(q => q.agent_name as string),
  ).size;

  // Usuários impactados: % das amostras cujo MOS estava abaixo do threshold
  // e seria recuperado pela projeção.
  const sub = validMos.filter(q => (q.mos_avg ?? 5) < POOR_MOS_THRESHOLD);
  const recovered = sub.filter(q => ((q.mos_avg ?? 0) + dMos) >= POOR_MOS_THRESHOLD).length;
  const affectedUsersPct = validMos.length === 0
    ? 0
    : Math.round((recovered / validMos.length) * 100);

  return {
    avgMos,
    avgJitter,
    avgPacketLoss: avgPl,
    totalAlerts: alerts.length,
    poorAlerts,
    sampleSize: quality.length,
    uniqueAgents,
    projected: {
      avgMos: projAvgMos,
      avgJitter: projAvgJit,
      avgPacketLoss: projAvgPl,
      alertsAvoided,
      affectedUsersPct,
    },
  };
}

Deno.serve(async (req) => {
  const cors = buildCorsHeaders(req);
  const requestId = req.headers.get('x-request-id') ?? crypto.randomUUID();
  const headers = { ...cors, 'Content-Type': 'application/json', 'x-request-id': requestId };

  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed', requestId }), { status: 405, headers });
  }

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

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON', requestId }), { status: 400, headers });
    }

    const v = validate(body, {
      recommendationId: string({ min: 1, max: 200 }),
      mos: optional(number({ min: -2, max: 2 })),
      jitter: optional(number({ min: -200, max: 200 })),
      packetLoss: optional(number({ min: -100, max: 100 })),
    } as never);

    if (!v.ok) {
      return new Response(JSON.stringify({ error: 'Invalid params', details: v.errors, requestId }), { status: 400, headers });
    }

    const { recommendationId, mos, jitter, packetLoss } = v.data as {
      recommendationId: string; mos?: number; jitter?: number; packetLoss?: number;
    };
    const delta: SimulationDelta = { mos, jitter, packetLoss };
    const since = new Date(Date.now() - BASELINE_DAYS * 86_400_000).toISOString();

    const [qualityRes, alertsRes] = await Promise.all([
      supabase
        .from('call_quality_metrics')
        .select('mos_avg, jitter_avg_ms, packet_loss_pct, agent_name')
        .gte('created_at', since)
        .limit(2000),
      supabase
        .from('voip_quality_alerts')
        .select('mos_at_alert, jitter_ms, alert_type')
        .gte('created_at', since)
        .limit(1000),
    ]);

    if (qualityRes.error) {
      return new Response(JSON.stringify({ error: qualityRes.error.message, requestId }), { status: 500, headers });
    }

    const quality = (qualityRes.data ?? []) as QualityRow[];
    const alerts = (alertsRes.data ?? []) as AlertRow[];
    const impact = projectImpact(quality, alerts, delta);

    const result: SimulationResult = {
      recommendationId,
      delta,
      baseline: {
        avgMos: impact.avgMos,
        avgJitter: impact.avgJitter,
        avgPacketLoss: impact.avgPacketLoss,
        totalAlerts: impact.totalAlerts,
        poorAlerts: impact.poorAlerts,
        sampleSize: impact.sampleSize,
        uniqueAgents: impact.uniqueAgents,
      },
      projected: impact.projected,
      requestId,
    };

    return new Response(JSON.stringify(result), { status: 200, headers });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message, requestId }), { status: 500, headers });
  }
});
