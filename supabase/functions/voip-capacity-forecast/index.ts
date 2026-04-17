import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { buildCorsHeaders } from "../_shared/cors.ts";
import { validate, number } from "../_shared/validate.ts";

const CONCURRENT_CAP = 3;

export interface ForecastDay {
  date: string;
  predicted_calls: number;
  predicted_peak_hour: number;
  predicted_peak_concurrent: number;
  confidence_pct: number;
  exceeds_capacity: boolean;
}

export interface HistoryDay {
  date: string;
  total_calls: number;
  peak_hour: number;
  peak_concurrent: number;
}

interface RawSession {
  started_at: string;
  duration_seconds: number | null;
}

export function buildHistory(sessions: RawSession[]): HistoryDay[] {
  const byDate: Record<string, { count: number; hourCounts: number[] }> = {};
  sessions.forEach(s => {
    const d = new Date(s.started_at);
    const dateKey = d.toISOString().slice(0, 10);
    if (!byDate[dateKey]) byDate[dateKey] = { count: 0, hourCounts: new Array(24).fill(0) };
    byDate[dateKey].count += 1;
    byDate[dateKey].hourCounts[d.getHours()] += 1;
  });
  return Object.entries(byDate)
    .map(([date, v]) => {
      let peak = 0, peakHour = 0;
      v.hourCounts.forEach((c, h) => { if (c > peak) { peak = c; peakHour = h; } });
      return { date, total_calls: v.count, peak_hour: peakHour, peak_concurrent: peak };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function forecastNextDays(history: HistoryDay[], daysAhead = 7): ForecastDay[] {
  if (history.length < 7) return [];

  // Média ponderada por dia da semana (últimas 4 ocorrências, peso decrescente)
  const byDow: Record<number, HistoryDay[]> = {};
  history.forEach(h => {
    const dow = new Date(h.date + 'T12:00:00Z').getUTCDay();
    if (!byDow[dow]) byDow[dow] = [];
    byDow[dow].push(h);
  });

  const out: ForecastDay[] = [];
  const lastDate = new Date(history[history.length - 1].date + 'T12:00:00Z');

  for (let i = 1; i <= daysAhead; i++) {
    const target = new Date(lastDate);
    target.setUTCDate(target.getUTCDate() + i);
    const dow = target.getUTCDay();
    const samples = (byDow[dow] || []).slice(-4);

    if (samples.length === 0) {
      out.push({
        date: target.toISOString().slice(0, 10),
        predicted_calls: 0, predicted_peak_hour: 12, predicted_peak_concurrent: 0,
        confidence_pct: 0, exceeds_capacity: false,
      });
      continue;
    }

    // Pesos: mais recente tem peso maior
    const weights = samples.map((_, idx) => idx + 1);
    const totalWeight = weights.reduce((s, w) => s + w, 0);
    const weightedAvg = samples.reduce((s, h, idx) => s + h.total_calls * weights[idx], 0) / totalWeight;
    const weightedPeak = samples.reduce((s, h, idx) => s + h.peak_concurrent * weights[idx], 0) / totalWeight;

    // Hora de pico mais frequente
    const hourFreq: Record<number, number> = {};
    samples.forEach(s => { hourFreq[s.peak_hour] = (hourFreq[s.peak_hour] || 0) + 1; });
    const peakHour = +Object.entries(hourFreq).sort((a, b) => b[1] - a[1])[0][0];

    // Confiança proporcional ao nº de amostras
    const confidence = Math.min(100, Math.round((samples.length / 4) * 100));
    const peakConcurrent = Math.round(weightedPeak);

    out.push({
      date: target.toISOString().slice(0, 10),
      predicted_calls: Math.round(weightedAvg),
      predicted_peak_hour: peakHour,
      predicted_peak_concurrent: peakConcurrent,
      confidence_pct: confidence,
      exceeds_capacity: peakConcurrent > CONCURRENT_CAP,
    });
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
    const parsed = validate({ days: url.searchParams.get('days') ?? 14 }, {
      days: number({ min: 7, max: 60 }),
    });
    if (!parsed.ok) {
      return new Response(JSON.stringify({ error: 'Invalid params', details: parsed.errors, request_id: requestId }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'x-request-id': requestId }
      });
    }

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

    const since = new Date();
    since.setDate(since.getDate() - parsed.data.days);

    const { data: sessions, error } = await supabase
      .from("call_sessions")
      .select("started_at, duration_seconds")
      .gte("started_at", since.toISOString())
      .limit(10000);

    if (error) {
      return new Response(JSON.stringify({ error: error.message, request_id: requestId }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'x-request-id': requestId }
      });
    }

    const history = buildHistory((sessions || []) as RawSession[]);
    const forecast = forecastNextDays(history, 7);
    const exceedsAny = forecast.some(f => f.exceeds_capacity);

    return new Response(JSON.stringify({
      history, forecast,
      capacity_cap: CONCURRENT_CAP,
      exceeds_capacity_in_forecast: exceedsAny,
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
