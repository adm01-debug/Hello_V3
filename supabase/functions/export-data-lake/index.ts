import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildCorsHeaders } from "../_shared/cors.ts";

type Dataset = 'call_sessions' | 'deals' | 'contacts' | 'audit_logs';
type Format = 'csv' | 'ndjson' | 'parquet';

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const esc = (v: unknown) => {
    if (v === null || v === undefined) return '';
    const s = typeof v === 'string' ? v : JSON.stringify(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(','), ...rows.map((r) => headers.map((h) => esc(r[h])).join(','))].join('\n');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: buildCorsHeaders(req) });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } });

    const url = Deno.env.get('SUPABASE_URL')!;
    const anon = Deno.env.get('SUPABASE_ANON_KEY')!;
    const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
    const admin = createClient(url, service);

    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } });

    const { data: profile } = await admin.from('user_profiles').select('role').eq('id', user.id).single();
    if (!profile || profile.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Apenas admin' }), { status: 403, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } });
    }

    const body = await req.json().catch(() => ({}));
    const dataset = body.dataset as Dataset;
    const format = (body.format as Format) ?? 'ndjson';
    const since = typeof body.since === 'string' ? body.since : null;
    const validDatasets: Dataset[] = ['call_sessions', 'deals', 'contacts', 'audit_logs'];
    const validFormats: Format[] = ['csv', 'ndjson', 'parquet'];

    if (!validDatasets.includes(dataset) || !validFormats.includes(format)) {
      return new Response(JSON.stringify({ error: 'dataset/format inválido' }), { status: 400, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } });
    }
    if (format === 'parquet') {
      return new Response(JSON.stringify({ error: 'Parquet ainda não suportado. Use csv ou ndjson.' }), { status: 400, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } });
    }

    // Cria registro
    const { data: expRow, error: expErr } = await admin.from('data_lake_exports').insert({
      requested_by: user.id, dataset, format, since_date: since, status: 'processing',
    }).select().single();
    if (expErr || !expRow) return new Response(JSON.stringify({ error: expErr?.message ?? 'insert falhou' }), { status: 500, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } });

    // Executa query
    let query = admin.from(dataset).select('*').limit(50000);
    if (since) query = query.gte('created_at', since);
    const { data: rows, error: qErr } = await query;

    if (qErr || !rows) {
      await admin.from('data_lake_exports').update({ status: 'failed', error_message: qErr?.message ?? 'query falhou' }).eq('id', expRow.id);
      return new Response(JSON.stringify({ error: qErr?.message ?? 'query falhou' }), { status: 500, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } });
    }

    const content = format === 'csv' ? toCsv(rows as Record<string, unknown>[]) : rows.map((r) => JSON.stringify(r)).join('\n');
    const path = `${user.id}/${expRow.id}.${format}`;
    const { error: upErr } = await admin.storage.from('data-lake-exports').upload(path, new Blob([content]), {
      contentType: format === 'csv' ? 'text/csv' : 'application/x-ndjson', upsert: true,
    });
    if (upErr) {
      await admin.from('data_lake_exports').update({ status: 'failed', error_message: upErr.message }).eq('id', expRow.id);
      return new Response(JSON.stringify({ error: upErr.message }), { status: 500, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } });
    }

    await admin.from('data_lake_exports').update({
      status: 'completed', file_path: path, row_count: rows.length, size_bytes: content.length, completed_at: new Date().toISOString(),
    }).eq('id', expRow.id);

    return new Response(JSON.stringify({ export_id: expRow.id, rows: rows.length, file_path: path }), {
      headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'unknown' }), {
      status: 500, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
    });
  }
});
