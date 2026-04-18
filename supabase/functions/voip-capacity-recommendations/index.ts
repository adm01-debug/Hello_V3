import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { buildCorsHeaders } from "../_shared/cors.ts";

export interface CapacityRecommendation {
  id: string;
  action_type: 'add_agents' | 'pause_campaign' | 'shift_codec' | 'preheat_warmup';
  title: string;
  description: string;
  window_start: string;
  window_end: string;
  severity: 'info' | 'warning' | 'critical';
  confidence: number;
  evidence: { mos_predicted?: number; volume_predicted?: number; risk_reason?: string };
}

export interface CapacityResult {
  recommendations: CapacityRecommendation[];
  confidence: number;
  generated_at: string;
}

interface ForecastPoint {
  ts: string;
  hour_offset: number;
  mos_predicted: number;
  volume_predicted: number;
  is_risk: boolean;
  risk_reason?: string;
}

export function buildRecommendations(forecast: ForecastPoint[], activeAgents: number, p95Volume: number): CapacityResult {
  const recs: CapacityRecommendation[] = [];
  const riskyPoints = forecast.filter(p => p.is_risk);

  // Agrupa janelas contíguas
  const windows: ForecastPoint[][] = [];
  let current: ForecastPoint[] = [];
  riskyPoints.forEach((p, i) => {
    if (i === 0 || p.hour_offset === riskyPoints[i - 1].hour_offset + 1) {
      current.push(p);
    } else {
      if (current.length) windows.push(current);
      current = [p];
    }
  });
  if (current.length) windows.push(current);

  windows.forEach((win, idx) => {
    const start = win[0];
    const end = win[win.length - 1];
    const reason = start.risk_reason ?? '';
    const isVolumeRisk = reason.includes('Volume');
    const isMosRisk = reason.includes('MOS');

    if (isVolumeRisk && p95Volume > 0) {
      const extra = Math.max(1, Math.ceil((start.volume_predicted - p95Volume) / Math.max(1, p95Volume) * activeAgents));
      recs.push({
        id: `cap-add-${idx}`,
        action_type: 'add_agents',
        title: `Adicionar ${extra} agente(s) entre ${formatHour(start.ts)}-${formatHour(end.ts)}`,
        description: `Volume previsto (${start.volume_predicted}) excede P95 histórico (${p95Volume}). Reforço evita filas e degradação.`,
        window_start: start.ts,
        window_end: end.ts,
        severity: extra >= 3 ? 'critical' : 'warning',
        confidence: 78,
        evidence: { volume_predicted: start.volume_predicted, risk_reason: reason },
      });
    }

    if (isMosRisk) {
      recs.push({
        id: `cap-codec-${idx}`,
        action_type: 'shift_codec',
        title: `Forçar codec Opus low entre ${formatHour(start.ts)}-${formatHour(end.ts)}`,
        description: `MOS previsto degradado (${start.mos_predicted}). Codec resiliente preserva inteligibilidade.`,
        window_start: start.ts,
        window_end: end.ts,
        severity: start.mos_predicted < 3.0 ? 'critical' : 'warning',
        confidence: 72,
        evidence: { mos_predicted: start.mos_predicted, risk_reason: reason },
      });
      recs.push({
        id: `cap-pause-${idx}`,
        action_type: 'pause_campaign',
        title: `Pausar campanhas outbound entre ${formatHour(start.ts)}-${formatHour(end.ts)}`,
        description: `Reduz pressão sobre rede e libera capacidade para chamadas críticas.`,
        window_start: start.ts,
        window_end: end.ts,
        severity: 'warning',
        confidence: 68,
        evidence: { mos_predicted: start.mos_predicted, risk_reason: reason },
      });
    }
  });

  // Sempre sugere pré-aquecimento se houver janela crítica
  if (recs.some(r => r.severity === 'critical')) {
    recs.unshift({
      id: 'cap-warmup',
      action_type: 'preheat_warmup',
      title: 'Pré-aquecer pool SIP 30min antes do pico previsto',
      description: 'Estabelece sessões TLS antecipadamente, reduz latência de setup durante o pico.',
      window_start: forecast[0]?.ts ?? new Date().toISOString(),
      window_end: forecast[Math.min(forecast.length - 1, 1)]?.ts ?? new Date().toISOString(),
      severity: 'info',
      confidence: 85,
      evidence: { risk_reason: 'Janela crítica detectada' },
    });
  }

  const overall = recs.length === 0 ? 100 : Math.round(recs.reduce((s, r) => s + r.confidence, 0) / recs.length);

  return {
    recommendations: recs,
    confidence: overall,
    generated_at: new Date().toISOString(),
  };
}

function formatHour(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getUTCHours()).padStart(2, '0')}:00`;
}

Deno.serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);
  const requestId = req.headers.get('x-request-id') || crypto.randomUUID();
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const auth = req.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized', request_id: requestId }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'x-request-id': requestId },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: auth } } },
    );

    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized', request_id: requestId }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'x-request-id': requestId },
      });
    }

    const url = new URL(req.url);
    const horizon = Math.min(168, Math.max(1, Number(url.searchParams.get('horizon') ?? 24)));

    // Reusa edge function de forecast via invoke interno
    const forecastUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/voip-quality-forecast?horizon=${horizon}`;
    const fcResp = await fetch(forecastUrl, { headers: { Authorization: auth } });
    const fcData = await fcResp.json();

    if (!fcResp.ok || !fcData.forecast) {
      return new Response(JSON.stringify({
        recommendations: [], confidence: 0,
        generated_at: new Date().toISOString(),
        insufficient_data: true,
        request_id: requestId,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'x-request-id': requestId },
      });
    }

    const { count: agentsCount } = await supabase
      .from('agents')
      .select('id', { count: 'exact', head: true })
      .neq('status', 'inactive');

    const result = buildRecommendations(
      fcData.forecast as ForecastPoint[],
      agentsCount ?? 5,
      fcData.summary?.p95_volume_historical ?? 0,
    );

    return new Response(JSON.stringify({ ...result, request_id: requestId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'x-request-id': requestId },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err), request_id: requestId }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'x-request-id': requestId },
    });
  }
});
