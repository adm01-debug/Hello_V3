import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const sipServer = Deno.env.get('SIP_SERVER');
    const sipUsername = Deno.env.get('SIP_USERNAME');
    const sipPassword = Deno.env.get('SIP_PASSWORD');

    if (!sipServer || !sipUsername || !sipPassword) {
      return new Response(
        JSON.stringify({ configured: false, error: 'SIP credentials not configured' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action } = await req.json().catch(() => ({ action: 'check' }));

    if (action === 'check') {
      return new Response(
        JSON.stringify({ configured: true, server: sipServer, username: sipUsername }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'connect') {
      // Return full credentials for SIP registration
      return new Response(
        JSON.stringify({
          configured: true,
          server: sipServer,
          username: sipUsername,
          password: sipPassword,
          transport: 'wss',
          realm: sipServer,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
