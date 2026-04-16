// Send a survey trigger record (in-app notification) — channel delivery handled elsewhere
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { buildCorsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req: Request) => {
  const cors = buildCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

  try {
    const body = await req.json().catch(() => ({}));
    const { survey_id, account_id, contact_id, call_session_id, channel = 'in_app' } = body;
    if (!survey_id) {
      return new Response(JSON.stringify({ error: 'survey_id required' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Validate survey exists & active
    const { data: survey, error } = await supabase
      .from('surveys').select('id, name, is_active').eq('id', survey_id).maybeSingle();
    if (error || !survey || !survey.is_active) {
      return new Response(JSON.stringify({ error: 'survey not found or inactive' }), {
        status: 404,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    // Create a placeholder pending response so dashboards can track open rate
    const { data: response, error: insErr } = await supabase
      .from('survey_responses')
      .insert({
        survey_id,
        account_id: account_id ?? null,
        contact_id: contact_id ?? null,
        call_session_id: call_session_id ?? null,
        channel,
        answers: { _status: 'pending' },
      })
      .select()
      .single();
    if (insErr) throw insErr;

    return new Response(
      JSON.stringify({ ok: true, response_id: response.id, survey_name: survey.name }),
      { headers: { ...cors, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
