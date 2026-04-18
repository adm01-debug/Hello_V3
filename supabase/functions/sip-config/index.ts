import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildCorsHeaders } from "../_shared/cors.ts";

const SECRET = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "fallback-key";

function decrypt(cipher: string): string {
  const bytes = Uint8Array.from(atob(cipher), c => c.charCodeAt(0));
  const key = new TextEncoder().encode(SECRET);
  const out = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) out[i] = bytes[i] ^ key[i % key.length];
  return new TextDecoder().decode(out);
}

interface TrunkRow {
  id: string;
  name: string;
  sip_server: string;
  sip_username: string;
  sip_password_encrypted: string;
  sip_realm: string | null;
  transport: string;
  is_active: boolean;
  last_health_status: string | null;
}

function log(level: 'info' | 'warn' | 'error', msg: string, meta: Record<string, unknown> = {}) {
  console.log(JSON.stringify({ level, msg, fn: 'sip-config', ts: new Date().toISOString(), ...meta }));
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
    const adminClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const { data: profile } = await adminClient
      .from('user_profiles').select('agent_id').eq('id', user.id).maybeSingle();

    let chosenTrunk: TrunkRow | null = null;
    let originalTrunk: TrunkRow | null = null;
    let failover = false;
    let failoverReason: string | null = null;

    if (profile?.agent_id) {
      // Buscar TODAS as atribuições do agente, primárias primeiro
      const { data: assignments } = await adminClient
        .from('agent_trunk_assignments')
        .select('trunk_id, is_primary, voip_trunks!inner(id, name, sip_server, sip_username, sip_password_encrypted, sip_realm, transport, is_active, last_health_status)')
        .eq('agent_id', profile.agent_id)
        .order('is_primary', { ascending: false });

      const trunks: TrunkRow[] = (assignments ?? [])
        .map((a: any) => a.voip_trunks)
        .filter((t: TrunkRow) => t && t.is_active);

      if (trunks.length > 0) {
        const primary = trunks[0];
        if (primary.last_health_status === 'offline') {
          // Tenta failover para próximo trunk não-offline
          const fallback = trunks.slice(1).find(t => t.last_health_status !== 'offline');
          if (fallback) {
            originalTrunk = primary;
            chosenTrunk = fallback;
            failover = true;
            failoverReason = `Trunk primário "${primary.name}" offline`;
            log('warn', 'trunk_failover', {
              agent_id: profile.agent_id,
              from_trunk: primary.id,
              to_trunk: fallback.id,
              reason: failoverReason,
            });
          } else {
            // Nenhum fallback → usa primário mesmo offline (melhor tentar do que falhar)
            chosenTrunk = primary;
            log('warn', 'no_failover_available', { agent_id: profile.agent_id, trunk_id: primary.id });
          }
        } else {
          chosenTrunk = primary;
        }
      }
    }

    // Fallback: secrets legados
    if (!chosenTrunk) {
      const sipServer = Deno.env.get('SIP_SERVER');
      const sipUsername = Deno.env.get('SIP_USERNAME');
      const sipPassword = Deno.env.get('SIP_PASSWORD');

      if (!sipServer || !sipUsername || !sipPassword) {
        return new Response(JSON.stringify({ configured: false, error: 'Nenhum trunk atribuído e secrets legados ausentes' }),
          { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } });
      }

      const payload: Record<string, unknown> = {
        configured: true, server: sipServer, username: sipUsername, source: 'legacy',
      };
      if (action !== 'check') {
        payload.password = sipPassword;
        payload.transport = 'wss';
        payload.realm = sipServer;
      }
      return new Response(JSON.stringify(payload),
        { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    // Trunk escolhido (primário ou failover)
    const baseResp: Record<string, unknown> = {
      configured: true,
      server: chosenTrunk.sip_server,
      username: chosenTrunk.sip_username,
      source: 'trunk',
      trunk_id: chosenTrunk.id,
      trunk_name: chosenTrunk.name,
      failover,
      original_trunk_id: originalTrunk?.id ?? null,
      failover_reason: failoverReason,
    };

    if (action === 'check') {
      return new Response(JSON.stringify(baseResp),
        { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    let plainPwd = '';
    try { plainPwd = decrypt(chosenTrunk.sip_password_encrypted); }
    catch { plainPwd = chosenTrunk.sip_password_encrypted; }

    return new Response(JSON.stringify({
      ...baseResp,
      password: plainPwd,
      transport: chosenTrunk.transport,
      realm: chosenTrunk.sip_realm ?? chosenTrunk.sip_server,
    }), { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } });
  } catch (error) {
    log('error', 'sip-config exception', { error: (error as Error).message });
    return new Response(JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } });
  }
});
