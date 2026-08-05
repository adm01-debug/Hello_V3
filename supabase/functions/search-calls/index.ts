import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { validate, string, optional, number } from "../_shared/validate.ts";

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const parsed = validate(body, {
      query: string({ min: 1, max: 200 }),
      agentName: optional(string({ max: 100 })),
      limit: optional(number({ min: 1, max: 100 })),
      offset: optional(number({ min: 0, max: 10000 })),
      dateFrom: optional(string({ max: 40 })),
      dateTo: optional(string({ max: 40 })),
      minDurationSeconds: optional(number({ min: 0, max: 36000 })),
      momentType: optional(string({ max: 50 })),
    });

    if (!parsed.ok) {
      return new Response(JSON.stringify({ error: 'Invalid input', details: parsed.errors }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const authHeader = req.headers.get('Authorization');

    const supabase = createClient(supabaseUrl, serviceKey, {
      global: { headers: { Authorization: authHeader || '' } },
    });

    const { query, agentName, dateFrom, dateTo, minDurationSeconds, momentType } = parsed.data;
    const limit = parsed.data.limit ?? 20;
    const offset = parsed.data.offset ?? 0;

    const tsQuery = query
      .split(/\s+/)
      .map((w: string) => w.replace(/[^\p{L}\p{N}]/gu, ''))
      .filter((w: string) => w.length > 1)
      .map((w: string) => `${w}:*`)
      .join(' & ');

    if (!tsQuery) {
      return new Response(JSON.stringify({ results: [], count: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
      });
    }

    let sessionIdsFromMoments: string[] | null = null;
    if (momentType) {
      const { data: km } = await supabase
        .from('call_key_moments')
        .select('call_session_id')
        .eq('moment_type', momentType);
      sessionIdsFromMoments = Array.from(new Set((km || []).map((m: { call_session_id: string }) => m.call_session_id)));
      if (sessionIdsFromMoments.length === 0) {
        return new Response(JSON.stringify({ results: [], count: 0 }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
        });
      }
    }

    let q = supabase
      .from('call_transcripts_searchable')
      .select('id, call_session_id, full_text, agent_name, duration_seconds, created_at', { count: 'exact' })
      .textSearch('search_vector', tsQuery, { config: 'portuguese' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (agentName) q = q.eq('agent_name', agentName);
    if (dateFrom) q = q.gte('created_at', dateFrom);
    if (dateTo) q = q.lte('created_at', dateTo);
    if (minDurationSeconds) q = q.gte('duration_seconds', minDurationSeconds);
    if (sessionIdsFromMoments) q = q.in('call_session_id', sessionIdsFromMoments);

    const { data, error, count } = await q;
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const queryWords = query
      .split(/\s+/)
      .map((w: string) => w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, ''))
      .filter((w: string) => w.length > 1);

    const results = (data || []).map((row: { id: string; call_session_id: string; full_text: string; agent_name: string | null; duration_seconds: number | null; created_at: string }) => {
      const text = row.full_text || '';
      const lower = text.toLowerCase();
      let idx = -1;
      for (const w of queryWords) {
        const found = lower.indexOf(w);
        if (found >= 0) { idx = found; break; }
      }
      const start = Math.max(0, idx - 80);
      const end = Math.min(text.length, (idx >= 0 ? idx : 0) + 200);
      const snippet = (start > 0 ? '…' : '') + text.slice(start, end) + (end < text.length ? '…' : '');
      return {
        id: row.id,
        call_session_id: row.call_session_id,
        agent_name: row.agent_name,
        duration_seconds: row.duration_seconds,
        created_at: row.created_at,
        snippet,
        highlight_terms: queryWords,
      };
    });

    return new Response(JSON.stringify({ results, count: count ?? results.length, offset, limit }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
    });
  } catch (err) {
    console.error('[search-calls] error:', err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
