import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildCorsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: buildCorsHeaders(req) });
  }

  try {
    // Validate JWT - only authenticated users can access SIP config
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    const sipServer = Deno.env.get('SIP_SERVER');
    const sipUsername = Deno.env.get('SIP_USERNAME');
    const sipPassword = Deno.env.get('SIP_PASSWORD');

    if (!sipServer || !sipUsername || !sipPassword) {
      return new Response(
        JSON.stringify({ configured: false, error: 'SIP credentials not configured' }),
        { status: 200, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    const { action } = await req.json().catch(() => ({ action: 'check' }));

    if (action === 'check') {
      return new Response(
        JSON.stringify({ configured: true, server: sipServer, username: sipUsername }),
        { status: 200, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'connect') {
      return new Response(
        JSON.stringify({
          configured: true,
          server: sipServer,
          username: sipUsername,
          password: sipPassword,
          transport: 'wss',
          realm: sipServer,
        }),
        { status: 200, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
