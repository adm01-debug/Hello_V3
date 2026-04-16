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

    const { query, agentName } = parsed.data;
    const limit = parsed.data.limit ?? 20;

    // Sanitize query into tsquery — split words, escape, join with &
    const tsQuery = query
      .split(/\s+/)
      .map(w => w.replace(/[^\p{L}\p{N}]/gu, ''))
      .filter(w => w.length > 1)
      .map(w => `${w}:*`)
      .join(' & ');

    if (!tsQuery) {
      return new Response(JSON.stringify({ results: [], count: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
      });
    }

    let q = supabase
      .from('call_transcripts_searchable')
      .select('id, call_session_id, full_text, agent_name, duration_seconds, created_at')
      .textSearch('search_vector', tsQuery, { config: 'portuguese' })
      .limit(limit);

    if (agentName) q = q.eq('agent_name', agentName);

    const { data, error } = await q;
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build snippets
    const results = (data || []).map((row) => {
      const text = row.full_text || '';
      const lower = text.toLowerCase();
      const firstWord = query.split(/\s+/)[0]?.toLowerCase() || '';
      const idx = firstWord ? lower.indexOf(firstWord) : -1;
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
      };
    });

    return new Response(JSON.stringify({ results, count: results.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
    });
  } catch (err) {
    console.error('[search-calls] error:', err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
