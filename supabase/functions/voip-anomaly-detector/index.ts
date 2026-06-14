import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { buildCorsHeaders } from "../_shared/cors.ts";
import { validate, number } from "../_shared/validate.ts";

interface Anomaly {
  metric: 'mos' | 'jitter' | 'volume';
  expected: number;
  observed: number;
  std: number;
  z_score: number;
  severity: 'warning' | 'critical';
  started_at: string;
  bucket_hour: number;
  bucket_dow: number;
}

function mean(arr: number[]): number {
  if (!arr.length) return 0;
  return arr.reduce((s, n) => s + n, 0) / arr.length;
}

function stddev(arr: number[], mu: number): number {
  if (arr.length < 2) return 0;
  const variance = arr.reduce((s, n) => s + (n - mu) ** 2, 0) / (arr.length - 1);
  return Math.sqrt(variance);
}

function zScore(observed: number, mu: number, sigma: number): number {
  if (sigma === 0) return 0;
  return (observed - mu) / sigma;
}

export function detectAnomalies(
  current: { mos: number[]; jitter: number[]; volume: number },
  baseline: { mos: number[]; jitter: number[]; volumes: number[] },
  bucket: { hour: number; dow: number; started_at: string }
): Anomaly[] {
  const out: Anomaly[] = [];

  // MOS (lower is worse → negative z is bad)
  if (current.mos.length && baseline.mos.length >= 3) {
    const obs = mean(current.mos);
    const mu = mean(baseline.mos);
    const sigma = stddev(baseline.mos, mu);
    const z = zScore(obs, mu, sigma);
    if (z <= -2.5) {
      out.push({
        metric: 'mos', expected: +mu.toFixed(2), observed: +obs.toFixed(2),
        std: +sigma.toFixed(2), z_score: +z.toFixed(2),
        severity: z <= -3.5 ? 'critical' : 'warning',
        started_at: bucket.started_at, bucket_hour: bucket.hour, bucket_dow: bucket.dow,
      });
    }
  }

  // Jitter (higher is worse → positive z is bad)
  if (current.jitter.length && baseline.jitter.length >= 3) {
    const obs = mean(current.jitter);
    const mu = mean(baseline.jitter);
    const sigma = stddev(baseline.jitter, mu);
    const z = zScore(obs, mu, sigma);
    if (z >= 2.5) {
      out.push({
        metric: 'jitter', expected: +mu.toFixed(1), observed: +obs.toFixed(1),
        std: +sigma.toFixed(1), z_score: +z.toFixed(2),
        severity: z >= 3.5 ? 'critical' : 'warning',
        started_at: bucket.started_at, bucket_hour: bucket.hour, bucket_dow: bucket.dow,
      });
    }
  }

  // Volume (anomaly in either direction)
  if (baseline.volumes.length >= 3) {
    const mu = mean(baseline.volumes);
    const sigma = stddev(baseline.volumes, mu);
    const z = zScore(current.volume, mu, sigma);
    if (Math.abs(z) >= 2.5) {
      out.push({
        metric: 'volume', expected: +mu.toFixed(1), observed: current.volume,
        std: +sigma.toFixed(1), z_score: +z.toFixed(2),
        severity: Math.abs(z) >= 3.5 ? 'critical' : 'warning',
        started_at: bucket.started_at, bucket_hour: bucket.hour, bucket_dow: bucket.dow,
      });
    }
  }

  return out;
}

Deno.serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);
  const requestId = req.headers.get('x-request-id') || crypto.randomUUID();

  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized", request_id: requestId }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'x-request-id': requestId }
      });
    }

    const url = new URL(req.url);
    const parsed = validate({ window: url.searchParams.get('window') ?? 24 }, {
      window: number({ min: 1, max: 168 }),
    });
    if (!parsed.ok) {
      return new Response(JSON.stringify({ error: 'Invalid params', details: parsed.errors, request_id: requestId }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'x-request-id': requestId }
      });
    }
    const windowHours = parsed.data.window;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: auth } } }
    );

    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized", request_id: requestId }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'x-request-id': requestId }
      });
    }

    // Buscar últimos 7 dias para baseline + janela atual
    const since = new Date();
    since.setDate(since.getDate() - 7);

    const { data: rows, error } = await supabase
      .from("call_quality_metrics")
      .select("created_at, mos_avg, jitter_avg_ms")
      .gte("created_at", since.toISOString())
      .limit(10000);

    if (error) {
      return new Response(JSON.stringify({ error: error.message, request_id: requestId }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'x-request-id': requestId }
      });
    }

    // Bucketizar por (dow, hour)
    const buckets: Record<string, { mos: number[]; jitter: number[]; count: number }> = {};
    const windowStart = Date.now() - windowHours * 3600_000;
    const currentByBucket: Record<string, { mos: number[]; jitter: number[]; count: number }> = {};

    (rows || []).forEach((r: { created_at: string; mos_avg: number | null; jitter_avg_ms: number | null }) => {
      const d = new Date(r.created_at);
      const key = `${d.getDay()}-${d.getHours()}`;
      const bucket = (d.getTime() >= windowStart ? currentByBucket : buckets);
      if (!bucket[key]) bucket[key] = { mos: [], jitter: [], count: 0 };
      if (r.mos_avg != null) bucket[key].mos.push(r.mos_avg);
      if (r.jitter_avg_ms != null) bucket[key].jitter.push(r.jitter_avg_ms);
      bucket[key].count += 1;
      // Também adiciona ao baseline (todos os dados de 7d entram no baseline geral por bucket)
      if (d.getTime() < windowStart) {
        if (!buckets[key]) buckets[key] = { mos: [], jitter: [], count: 0 };
      }
    });

    // Volumes históricos por bucket: extrair counts diários
    const volumesByBucket: Record<string, number[]> = {};
    Object.keys(buckets).forEach(k => { volumesByBucket[k] = [buckets[k].count]; });

    const anomalies: Anomaly[] = [];
    for (const [key, current] of Object.entries(currentByBucket)) {
      const [dow, hour] = key.split('-').map(Number);
      const baseline = buckets[key] || { mos: [], jitter: [], count: 0 };
      const baselineVolumes = volumesByBucket[key] || [];
      const found = detectAnomalies(
        { mos: current.mos, jitter: current.jitter, volume: current.count },
        { mos: baseline.mos, jitter: baseline.jitter, volumes: baselineVolumes },
        { hour, dow, started_at: new Date(windowStart).toISOString() }
      );
      anomalies.push(...found);
    }

    return new Response(JSON.stringify({
      anomalies,
      window_hours: windowHours,
      baseline_samples: rows?.length || 0,
      request_id: requestId,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'x-request-id': requestId }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err), request_id: requestId }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'x-request-id': requestId }
    });
  }
});
