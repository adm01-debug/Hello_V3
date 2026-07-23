// Data Lake Flush — Exporta incremental de datasets críticos em NDJSON para o bucket data-lake-exports.
// Invocado por cron diário (03:00 UTC) ou manualmente por admin.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

type Dataset = 'call_sessions' | 'call_summaries' | 'deals';
const DATASETS: Dataset[] = ['call_sessions', 'call_summaries', 'deals'];
const PAGE_SIZE = 1000;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const body = await req.json().catch(() => ({}));
    const only: Dataset[] = Array.isArray(body.datasets) && body.datasets.length
      ? (body.datasets as Dataset[]).filter((d) => DATASETS.includes(d))
      : DATASETS;

    const results: unknown[] = [];
    for (const ds of only) {
      results.push(await flushDataset(supabase, ds));
    }

    return json({ status: 'ok', results, ran_at: new Date().toISOString() });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[data-lake-flush] error:', message);
    return json({ error: message }, 500);
  }
});

async function flushDataset(
  supabase: ReturnType<typeof createClient>,
  dataset: Dataset,
): Promise<Record<string, unknown>> {
  // last exported timestamp: max(since_date) do último export completed do mesmo dataset
  const { data: last } = await supabase
    .from('data_lake_exports')
    .select('completed_at, since_date')
    .eq('dataset', dataset)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const sinceISO = last?.completed_at ?? new Date(Date.now() - 24 * 3600 * 1000).toISOString();

  // Cria job pending
  const { data: job, error: jobErr } = await supabase
    .from('data_lake_exports')
    .insert({
      requested_by: '00000000-0000-0000-0000-000000000000',
      dataset,
      format: 'ndjson',
      since_date: sinceISO,
      status: 'processing',
    })
    .select('id')
    .single();
  if (jobErr) throw jobErr;

  try {
    // Pagina resultados incrementais
    const chunks: string[] = [];
    let rowCount = 0;
    let from = 0;
    // deno-lint-ignore no-constant-condition
    while (true) {
      const { data, error } = await supabase
        .from(dataset)
        .select('*')
        .gt('created_at', sinceISO)
        .order('created_at', { ascending: true })
        .range(from, from + PAGE_SIZE - 1);
      if (error) throw error;
      if (!data || data.length === 0) break;
      for (const row of data) chunks.push(JSON.stringify(row));
      rowCount += data.length;
      if (data.length < PAGE_SIZE) break;
      from += PAGE_SIZE;
      if (rowCount > 200000) break; // safeguard
    }

    const ndjson = chunks.join('\n') + (chunks.length ? '\n' : '');
    const now = new Date();
    const y = now.getUTCFullYear();
    const m = String(now.getUTCMonth() + 1).padStart(2, '0');
    const d = String(now.getUTCDate()).padStart(2, '0');
    const filePath = `${y}/${m}/${d}/${dataset}-${job.id}.ndjson`;

    if (rowCount > 0) {
      const { error: upErr } = await supabase.storage
        .from('data-lake-exports')
        .upload(filePath, new Blob([ndjson], { type: 'application/x-ndjson' }), {
          contentType: 'application/x-ndjson',
          upsert: true,
        });
      if (upErr) throw upErr;
    }

    await supabase
      .from('data_lake_exports')
      .update({
        status: 'completed',
        file_path: rowCount > 0 ? filePath : null,
        row_count: rowCount,
        size_bytes: ndjson.length,
        completed_at: new Date().toISOString(),
      })
      .eq('id', job.id);

    return { dataset, job_id: job.id, rows: rowCount, file_path: rowCount > 0 ? filePath : null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await supabase
      .from('data_lake_exports')
      .update({ status: 'failed', error_message: message, completed_at: new Date().toISOString() })
      .eq('id', job.id);
    return { dataset, job_id: job.id, error: message };
  }
}

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  });
}
