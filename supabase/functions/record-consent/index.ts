import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { buildCorsHeaders } from '../_shared/cors.ts';
import { validate, string, oneOf, optional, boolean } from '../_shared/validate.ts';

Deno.serve(async (req) => {
  const cors = buildCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing auth' }), { status: 401, headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    const body = await req.json();
    const result = validate(body, {
      contact_id: optional(string()),
      phone: optional(string({ max: 30 })),
      channel: oneOf('voice', 'sms', 'whatsapp', 'email'),
      consent_type: oneOf('marketing', 'transactional', 'recording', 'data_processing'),
      granted: optional(boolean()),
      source: optional(string({ max: 60 })),
      notes: optional(string({ max: 500 })),
    });

    if (!result.ok) {
      return new Response(JSON.stringify({ error: 'Validation failed', details: result.errors }), {
        status: 400, headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const data = result.data;
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0] ?? null;
    const userAgent = req.headers.get('user-agent') ?? null;

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('email, role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'supervisor'].includes(profile.role)) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    const granted = data.granted ?? true;
    const insertPayload = {
      contact_id: data.contact_id ?? null,
      phone: data.phone ?? null,
      channel: data.channel,
      consent_type: data.consent_type,
      granted,
      revoked_at: granted ? null : new Date().toISOString(),
      source: data.source ?? 'manual',
      notes: data.notes ?? null,
      recorded_by: profile.email,
      ip_address: ipAddress,
      user_agent: userAgent,
      evidence: { recorded_via: 'edge_function', timestamp: new Date().toISOString() },
    };

    const { data: inserted, error } = await supabase
      .from('consent_records')
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    await supabase.rpc('log_audit_event', {
      p_action: granted ? 'consent_granted' : 'consent_revoked',
      p_resource_type: 'consent_record',
      p_resource_id: inserted.id,
      p_details: { channel: data.channel, consent_type: data.consent_type, contact_id: data.contact_id },
    });

    return new Response(JSON.stringify({ success: true, record: inserted }), {
      status: 200, headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 500, headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
