import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildCorsHeaders } from "../_shared/cors.ts";

// Cifragem simétrica (mesma lógica de voip-trunks-manage)
const SECRET = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "fallback-key";

function decrypt(cipher: string): string {
  const bytes = Uint8Array.from(atob(cipher), c => c.charCodeAt(0));
  const key = new TextEncoder().encode(SECRET);
  const out = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) out[i] = bytes[i] ^ key[i % key.length];
  return new TextDecoder().decode(out);
}

serve(async (req) => {
  const cors = buildCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    const { action } = await req.json().catch(() => ({ action: 'check' }));

    // 1) Tenta buscar trunk primário do agente via service role
    const adminClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const { data: profile } = await adminClient
      .from('user_profiles')
      .select('agent_id')
      .eq('id', user.id)
      .maybeSingle();

    let trunk: {
      sip_server: string; sip_username: string; sip_password_encrypted: string;
      sip_realm: string | null; transport: string;
    } | null = null;

    if (profile?.agent_id) {
      const { data: assignment } = await adminClient
        .from('agent_trunk_assignments')
        .select('trunk_id, voip_trunks!inner(sip_server, sip_username, sip_password_encrypted, sip_realm, transport, is_active)')
        .eq('agent_id', profile.agent_id)
        .eq('is_primary', true)
        .maybeSingle();

      const t = (assignment as any)?.voip_trunks;
      if (t && t.is_active) trunk = t;
    }

    // 2) Fallback: secrets legados
    if (!trunk) {
      const sipServer = Deno.env.get('SIP_SERVER');
      const sipUsername = Deno.env.get('SIP_USERNAME');
      const sipPassword = Deno.env.get('SIP_PASSWORD');

      if (!sipServer || !sipUsername || !sipPassword) {
        return new Response(JSON.stringify({ configured: false, error: 'Nenhum trunk atribuído e secrets legados ausentes' }),
          { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } });
      }

      if (action === 'check') {
        return new Response(JSON.stringify({ configured: true, server: sipServer, username: sipUsername, source: 'legacy' }),
          { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } });
      }

      return new Response(JSON.stringify({
        configured: true, server: sipServer, username: sipUsername,
        password: sipPassword, transport: 'wss', realm: sipServer, source: 'legacy',
      }), { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    // 3) Trunk encontrado
    if (action === 'check') {
      return new Response(JSON.stringify({
        configured: true, server: trunk.sip_server, username: trunk.sip_username, source: 'trunk',
      }), { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    let plainPwd = '';
    try { plainPwd = decrypt(trunk.sip_password_encrypted); }
    catch { plainPwd = trunk.sip_password_encrypted; }

    return new Response(JSON.stringify({
      configured: true,
      server: trunk.sip_server,
      username: trunk.sip_username,
      password: plainPwd,
      transport: trunk.transport,
      realm: trunk.sip_realm ?? trunk.sip_server,
      source: 'trunk',
    }), { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } });
  }
});
