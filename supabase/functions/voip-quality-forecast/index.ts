import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { buildCorsHeaders } from "../_shared/cors.ts";
import { validate, number } from "../_shared/validate.ts";

export interface QualitySample {
  created_at: string;
  mos_avg: number | null;
  jitter_avg_ms: number | null;
}

export interface ForecastPoint {
  ts: string;             // ISO timestamp
  hour_offset: number;    // +1, +2, ...
  mos_predicted: number;
  mos_lower: number;
  mos_upper: number;
  jitter_predicted: number;
  volume_predicted: number;
  is_risk: boolean;
  risk_reason?: string;
}

export interface ForecastResult {
  horizon_hours: number;
  generated_at: string;
  history_points: number;
  forecast: ForecastPoint[];
  summary: {
    avg_mos_predicted: number;
    risk_windows: number;
    p95_volume_historical: number;
    trend_slope_mos: number;
  };
}

interface Bucket {
  dow: number;
  hour: number;
  mos: number[];
  jitter: number[];
  volume: number;
}

const MOS_RISK_THRESHOLD = 3.5;

/** Linear regression slope over Y values (X = índices). */
export function linearSlope(values: number[]): number {
  const n = values.length;
  if (n < 2) return 0;
  const meanX = (n - 1) / 2;
  const meanY = values.reduce((s, v) => s + v, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - meanX) * (values[i] - meanY);
    den += (i - meanX) ** 2;
  }
  return den === 0 ? 0 : num / den;
}

export function buildBuckets(samples: QualitySample[]): Map<string, Bucket> {
  const buckets = new Map<string, Bucket>();
  samples.forEach(s => {
    if (s.mos_avg === null) return;
    const d = new Date(s.created_at);
    const dow = d.getUTCDay();
    const hour = d.getUTCHours();
    const key = `${dow}-${hour}`;
    let b = buckets.get(key);
    if (!b) { b = { dow, hour, mos: [], jitter: [], volume: 0 }; buckets.set(key, b); }
    b.mos.push(s.mos_avg);
    if (s.jitter_avg_ms !== null) b.jitter.push(s.jitter_avg_ms);
    b.volume += 1;
  });
  return buckets;
}

function avg(arr: number[]): number {
  return arr.length === 0 ? 0 : arr.reduce((s, v) => s + v, 0) / arr.length;
}

function stddev(arr: number[]): number {
  if (arr.length < 2) return 0;
  const m = avg(arr);
  return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length);
}

function percentile(arr: number[], p: number): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
}

export function forecast(samples: QualitySample[], horizonHours: number): ForecastResult {
  const generatedAt = new Date();
  const buckets = buildBuckets(samples);

  // Tendência linear sobre MOS ordenados temporalmente
  const sortedMos = [...samples]
    .filter(s => s.mos_avg !== null)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map(s => s.mos_avg as number);
  const trend = linearSlope(sortedMos);
  const volumes = Array.from(buckets.values()).map(b => b.volume);
  const p95Vol = percentile(volumes, 95);

  const out: ForecastPoint[] = [];
  for (let h = 1; h <= horizonHours; h++) {
    const target = new Date(generatedAt.getTime() + h * 3600_000);
    const dow = target.getUTCDay();
    const hour = target.getUTCHours();
    const key = `${dow}-${hour}`;
    const b = buckets.get(key);

    if (!b || b.mos.length === 0) {
      out.push({
        ts: target.toISOString(),
        hour_offset: h,
        mos_predicted: 0, mos_lower: 0, mos_upper: 0,
        jitter_predicted: 0, volume_predicted: 0,
        is_risk: false,
      });
      continue;
    }

    const mosAvg = avg(b.mos);
    const sd = stddev(b.mos);
    const trendAdjust = trend * h;
    const mosPred = Math.max(1, Math.min(5, mosAvg + trendAdjust));
    const jitterPred = avg(b.jitter);
    const volPred = b.volume;

    let risk = false;
    let reason: string | undefined;
    if (mosPred < MOS_RISK_THRESHOLD) {
      risk = true; reason = `MOS previsto ${mosPred.toFixed(2)} < ${MOS_RISK_THRESHOLD}`;
    } else if (p95Vol > 0 && volPred > p95Vol) {
      risk = true; reason = `Volume previsto (${volPred}) > P95 histórico (${p95Vol})`;
    }

    out.push({
      ts: target.toISOString(),
      hour_offset: h,
      mos_predicted: +mosPred.toFixed(2),
      mos_lower: +(mosPred - sd).toFixed(2),
      mos_upper: +(mosPred + sd).toFixed(2),
      jitter_predicted: +jitterPred.toFixed(1),
      volume_predicted: volPred,
      is_risk: risk,
      risk_reason: reason,
    });
  }

  const validForecast = out.filter(p => p.mos_predicted > 0);
  const avgMos = validForecast.length === 0
    ? 0
    : validForecast.reduce((s, p) => s + p.mos_predicted, 0) / validForecast.length;

  return {
    horizon_hours: horizonHours,
    generated_at: generatedAt.toISOString(),
    history_points: samples.length,
    forecast: out,
    summary: {
      avg_mos_predicted: +avgMos.toFixed(2),
      risk_windows: out.filter(p => p.is_risk).length,
      p95_volume_historical: p95Vol,
      trend_slope_mos: +trend.toFixed(4),
    },
  };
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

    const url = new URL(req.url);
    const parsed = validate({ horizon: url.searchParams.get('horizon') ?? 24 }, {
      horizon: number({ min: 1, max: 168 }),
    });
    if (!parsed.ok) {
      return new Response(JSON.stringify({ error: 'Invalid params', details: parsed.errors, request_id: requestId }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'x-request-id': requestId },
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

    const since = new Date();
    since.setDate(since.getDate() - 30);

    const { data: samples, error } = await supabase
      .from('call_quality_metrics')
      .select('created_at, mos_avg, jitter_avg_ms')
      .gte('created_at', since.toISOString())
      .limit(10000);

    if (error) {
      return new Response(JSON.stringify({ error: error.message, request_id: requestId }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'x-request-id': requestId },
      });
    }

    if (!samples || samples.length < 24) {
      return new Response(JSON.stringify({
        horizon_hours: parsed.data.horizon,
        generated_at: new Date().toISOString(),
        history_points: samples?.length ?? 0,
        forecast: [],
        summary: { avg_mos_predicted: 0, risk_windows: 0, p95_volume_historical: 0, trend_slope_mos: 0 },
        insufficient_data: true,
        request_id: requestId,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'x-request-id': requestId },
      });
    }

    const result = forecast(samples as QualitySample[], parsed.data.horizon);
    return new Response(JSON.stringify({ ...result, request_id: requestId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'x-request-id': requestId },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err), request_id: requestId }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'x-request-id': requestId },
    });
  }
});
