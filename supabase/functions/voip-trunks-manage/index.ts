import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildCorsHeaders } from "../_shared/cors.ts";

// Cifragem simétrica simples (XOR + base64) usando segredo do servidor.
// Nunca trafega senha em claro fora do Edge.
const SECRET = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "fallback-key";

function encrypt(plain: string): string {
  const bytes = new TextEncoder().encode(plain);
  const key = new TextEncoder().encode(SECRET);
  const out = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) out[i] = bytes[i] ^ key[i % key.length];
  return btoa(String.fromCharCode(...out));
}

function decrypt(cipher: string): string {
  const bytes = Uint8Array.from(atob(cipher), c => c.charCodeAt(0));
  const key = new TextEncoder().encode(SECRET);
  const out = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) out[i] = bytes[i] ^ key[i % key.length];
  return new TextDecoder().decode(out);
}

serve(async (req) => {
  const cors = buildCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const { data: isAdmin } = await supabase.rpc("is_admin_user", { _user_id: user.id });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action as string;

    if (action === "list") {
      const { data, error } = await supabase
        .from("voip_trunks")
        .select("id, name, provider, sip_server, sip_username, sip_realm, transport, max_channels, priority, is_active, notes, version, created_at, updated_at")
        .order("priority", { ascending: true });
      if (error) throw error;
      return json({ trunks: data }, cors);
    }

    if (action === "create") {
      const { name, provider, sip_server, sip_username, sip_password, sip_realm, transport, max_channels, priority, is_active, notes } = body;
      if (!name || !sip_server || !sip_username || !sip_password) {
        return json({ error: "Campos obrigatórios faltando" }, cors, 400);
      }
      const { data, error } = await supabase.from("voip_trunks").insert({
        name, provider: provider ?? "generic", sip_server, sip_username,
        sip_password_encrypted: encrypt(sip_password),
        sip_realm: sip_realm ?? null,
        transport: transport ?? "wss",
        max_channels: max_channels ?? 10,
        priority: priority ?? 100,
        is_active: is_active ?? true,
        notes: notes ?? null,
        created_by: user.id,
      }).select().single();
      if (error) throw error;
      await supabase.rpc("log_audit_event", {
        p_action: "create", p_resource_type: "voip_trunk", p_resource_id: data.id,
        p_details: { name, provider },
      });
      return json({ trunk: data }, cors);
    }

    if (action === "update") {
      const { id, version, sip_password, ...rest } = body;
      if (!id || version === undefined) return json({ error: "id e version obrigatórios" }, cors, 400);
      const updates: Record<string, unknown> = { ...rest, version };
      delete updates.action;
      if (sip_password) updates.sip_password_encrypted = encrypt(sip_password);
      const { data, error } = await supabase.from("voip_trunks")
        .update(updates).eq("id", id).select().single();
      if (error) throw error;
      await supabase.rpc("log_audit_event", {
        p_action: "update", p_resource_type: "voip_trunk", p_resource_id: id, p_details: { fields: Object.keys(rest) },
      });
      return json({ trunk: data }, cors);
    }

    if (action === "delete") {
      const { id } = body;
      if (!id) return json({ error: "id obrigatório" }, cors, 400);
      const { error } = await supabase.from("voip_trunks").delete().eq("id", id);
      if (error) throw error;
      await supabase.rpc("log_audit_event", {
        p_action: "delete", p_resource_type: "voip_trunk", p_resource_id: id, p_details: {},
      });
      return json({ ok: true }, cors);
    }

    if (action === "test-registration") {
      const { id } = body;
      if (!id) return json({ error: "id obrigatório" }, cors, 400);
      const { data: trunk, error } = await supabase.from("voip_trunks")
        .select("sip_server, transport").eq("id", id).single();
      if (error) throw error;
      // Simulação: tenta abrir socket TCP/WSS para validar reachability
      let reachable = false;
      let latency_ms = 0;
      const start = Date.now();
      try {
        if (trunk.transport === "wss") {
          const ws = new WebSocket(`wss://${trunk.sip_server}`);
          await new Promise<void>((resolve) => {
            const t = setTimeout(() => { ws.close(); resolve(); }, 3000);
            ws.onopen = () => { reachable = true; clearTimeout(t); ws.close(); resolve(); };
            ws.onerror = () => { clearTimeout(t); resolve(); };
          });
        } else {
          const conn = await Deno.connect({ hostname: trunk.sip_server.split(":")[0], port: 5060 });
          reachable = true;
          conn.close();
        }
      } catch (_) { reachable = false; }
      latency_ms = Date.now() - start;
      return json({ reachable, latency_ms, server: trunk.sip_server, transport: trunk.transport }, cors);
    }

    if (action === "list-assignments") {
      const { data, error } = await supabase
        .from("agent_trunk_assignments")
        .select("id, agent_id, trunk_id, is_primary, version, agents(name, extension), voip_trunks(name, provider)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return json({ assignments: data }, cors);
    }

    if (action === "create-assignment") {
      const { agent_id, trunk_id, is_primary } = body;
      if (!agent_id || !trunk_id) return json({ error: "agent_id e trunk_id obrigatórios" }, cors, 400);
      if (is_primary) {
        await supabase.from("agent_trunk_assignments")
          .update({ is_primary: false }).eq("agent_id", agent_id);
      }
      const { data, error } = await supabase.from("agent_trunk_assignments")
        .insert({ agent_id, trunk_id, is_primary: !!is_primary, created_by: user.id })
        .select().single();
      if (error) throw error;
      return json({ assignment: data }, cors);
    }

    if (action === "delete-assignment") {
      const { id } = body;
      if (!id) return json({ error: "id obrigatório" }, cors, 400);
      const { error } = await supabase.from("agent_trunk_assignments").delete().eq("id", id);
      if (error) throw error;
      return json({ ok: true }, cors);
    }

    return json({ error: "Ação inválida" }, cors, 400);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return json({ error: message }, buildCorsHeaders(req), 500);
  }
});

function json(payload: unknown, cors: HeadersInit, status = 200) {
  return new Response(JSON.stringify(payload), {
    status, headers: { ...cors, "Content-Type": "application/json" },
  });
}

export { encrypt, decrypt };
