import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildCorsHeaders } from "../_shared/cors.ts";

// Health check WSS/TCP simulado via fetch HEAD/HTTP. Para WSS, fazemos GET HTTP no host.
async function checkTrunk(server: string, transport: string): Promise<{ reachable: boolean; latency_ms: number; error?: string }> {
  const start = Date.now();
  try {
    const proto = transport === "wss" ? "https" : "http";
    const host = server.replace(/^(wss?|sip|tls):\/\//, "").split(/[:/]/)[0];
    const url = `${proto}://${host}`;
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch(url, { method: "HEAD", signal: ctrl.signal }).catch(() => null);
    clearTimeout(timeout);
    const latency = Date.now() - start;
    // Qualquer resposta HTTP (mesmo 404/501) indica host alcançável
    if (res) return { reachable: true, latency_ms: latency };
    return { reachable: false, latency_ms: latency, error: "no response" };
  } catch (e) {
    return { reachable: false, latency_ms: Date.now() - start, error: (e as Error).message };
  }
}

serve(async (req) => {
  const cors = buildCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const isCron = authHeader.includes(Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "___");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Se chamada manual, valida admin
    if (!isCron) {
      const userClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } },
      );
      const { data: { user } } = await userClient.auth.getUser();
      if (!user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...cors, "Content-Type": "application/json" },
        });
      }
      const { data: isAdmin } = await userClient.rpc("is_admin_user", { _user_id: user.id });
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403, headers: { ...cors, "Content-Type": "application/json" },
        });
      }
    }

    const { data: trunks, error } = await supabase
      .from("voip_trunks")
      .select("id, name, sip_server, transport")
      .eq("is_active", true);

    if (error) throw error;

    const results: Array<{ id: string; name: string; reachable: boolean; latency_ms: number }> = [];

    for (const trunk of trunks ?? []) {
      const result = await checkTrunk(trunk.sip_server, trunk.transport);
      const status = result.reachable ? (result.latency_ms < 300 ? "healthy" : "degraded") : "offline";

      await supabase.from("voip_trunk_health_checks").insert({
        trunk_id: trunk.id,
        reachable: result.reachable,
        latency_ms: result.latency_ms,
        error_message: result.error ?? null,
      });

      await supabase.from("voip_trunks")
        .update({
          last_health_status: status,
          last_health_latency_ms: result.latency_ms,
          last_health_checked_at: new Date().toISOString(),
        })
        .eq("id", trunk.id);

      results.push({ id: trunk.id, name: trunk.name, reachable: result.reachable, latency_ms: result.latency_ms });
    }

    return new Response(JSON.stringify({ checked: results.length, results }), {
      status: 200, headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
