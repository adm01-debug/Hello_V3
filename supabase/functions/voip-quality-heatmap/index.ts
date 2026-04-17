// Edge Function: voip-quality-heatmap
// Agrega call_quality_metrics por (dow, hour) nos últimos N dias.
// Retorna matriz 7x24 com {mos_avg, count, jitter_p95}.
// JWT obrigatório, CORS centralizado, validação numérica.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { buildCorsHeaders } from '../_shared/cors.ts';
import { validate, number } from '../_shared/validate.ts';

interface MetricRow {
  created_at: string;
  mos_avg: number | null;
  jitter_avg_ms: number | null;
}

interface Bucket {
  count: number;
  mos_sum: number;
  jitters: number[];
}

function p95(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95));
  return Number(sorted[idx].toFixed(2));
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
    const params = { days: url.searchParams.get('days') ?? '7' };
    const validation = validate(params, { days: number({ min: 1, max: 30 }) } as never);
    if (!validation.ok) {
      return new Response(
        JSON.stringify({ error: 'Invalid params', details: validation.errors, requestId }),
        { status: 400, headers },
      );
    }
    const days = (validation.data as { days: number }).days;
    const since = new Date(Date.now() - days * 86_400_000).toISOString();

    const { data, error } = await supabase
      .from('call_quality_metrics')
      .select('created_at, mos_avg, jitter_avg_ms')
      .gte('created_at', since)
      .not('mos_avg', 'is', null)
      .order('created_at', { ascending: false })
      .limit(10_000);

    if (error) {
      return new Response(JSON.stringify({ error: error.message, requestId }), { status: 500, headers });
    }

    // Inicializa matriz 7x24
    const grid: Bucket[][] = Array.from({ length: 7 }, () =>
      Array.from({ length: 24 }, () => ({ count: 0, mos_sum: 0, jitters: [] })),
    );

    for (const r of (data ?? []) as MetricRow[]) {
      const d = new Date(r.created_at);
      const dow = d.getUTCDay();
      const hour = d.getUTCHours();
      const b = grid[dow][hour];
      b.count++;
      b.mos_sum += r.mos_avg ?? 0;
      if (r.jitter_avg_ms !== null) b.jitters.push(r.jitter_avg_ms);
    }

    const matrix = grid.map((row, dow) =>
      row.map((b, hour) => ({
        dow,
        hour,
        count: b.count,
        mos_avg: b.count ? Number((b.mos_sum / b.count).toFixed(2)) : null,
        jitter_p95: p95(b.jitters),
      })),
    );

    return new Response(
      JSON.stringify({
        days,
        since,
        total_samples: (data ?? []).length,
        matrix,
        requestId,
      }),
      { status: 200, headers },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message, requestId }), { status: 500, headers });
  }
});
