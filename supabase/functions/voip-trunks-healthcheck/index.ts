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

 export const handler = async (req: Request): Promise<Response> => {
  const cors = buildCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const isCron = authHeader.includes(Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "___");

     const supabaseUrl = Deno.env.get("SUPABASE_URL");
     const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
 
     if (!supabaseUrl || !supabaseKey) {
       throw new Error("Missing environment variables");
     }
 
     const supabase = createClient(supabaseUrl, supabaseKey, {
       auth: { persistSession: false, autoRefreshToken: false }
     });

    // Se chamada manual, valida admin
    if (!isCron) {
         const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
         if (!supabaseAnonKey) throw new Error("Missing SUPABASE_ANON_KEY");
 
         const userClient = createClient(supabaseUrl, supabaseAnonKey, {
           global: { headers: { Authorization: authHeader } },
           auth: { persistSession: false, autoRefreshToken: false }
         });
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
       .select("id, name, sip_server, transport, failover_count")
       .eq("is_active", true);

    if (error) throw error;

    const results: Array<{ id: string; name: string; reachable: boolean; latency_ms: number }> = [];

     const checks = (trunks ?? []).map(async (trunk) => {
       const result = await checkTrunk(trunk.sip_server, trunk.transport);
        const status = result.reachable ? (result.latency_ms < 300 ? "healthy" : "degraded") : "offline";
 
        // Self-Healing Logic: Se estiver offline, tenta failover automático
        if (status === "offline") {
          console.log(`Trunk ${trunk.id} (${trunk.name}) is OFFLINE. Triggering self-healing...`);
          
          // Busca melhor alternativa saudável (maior prioridade)
          const { data: backupTrunk } = await supabase
            .from("voip_trunks")
            .select("id, name")
            .eq("is_active", true)
            .eq("last_health_status", "healthy")
            .neq("id", trunk.id)
            .order("priority", { ascending: false })
            .limit(1)
            .maybeSingle();
 
          if (backupTrunk) {
            console.log(`Found backup trunk: ${backupTrunk.name} (${backupTrunk.id})`);
            
            // Substitui atribuições de agentes do tronco falho pelo reserva
            const { error: swapError } = await supabase
              .from("agent_trunk_assignments")
              .update({ trunk_id: backupTrunk.id, updated_at: new Date().toISOString() })
              .eq("trunk_id", trunk.id);
 
            if (!swapError) {
              // Registra evento de failover no tronco falho
              await supabase
                .from("voip_trunks")
                .update({ 
                  failover_count: (trunk.failover_count || 0) + 1,
                  last_failover_at: new Date().toISOString(),
                  failover_reason: "Offline status detected by auto-healthcheck"
                })
                .eq("id", trunk.id);
                
               console.log(`Failover completed successfully from ${trunk.name} to ${backupTrunk.name}`);
               
               // Dispara notificação assíncrona para os agentes
               fetch(`${supabaseUrl}/functions/v1/voip-failover-notifier`, {
                 method: 'POST',
                 headers: {
                   'Authorization': `Bearer ${supabaseKey}`,
                   'Content-Type': 'application/json'
                 },
                 body: JSON.stringify({
                   failed_trunk_id: trunk.id,
                   backup_trunk_id: backupTrunk.id,
                   reason: "Healthcheck failed (offline)"
                 })
               }).catch(err => console.error("Error triggering notification:", err));
            } else {
              console.error(`Failover failed during DB update:`, swapError);
            }
          } else {
            console.warn(`No healthy backup trunk found for failover of ${trunk.name}`);
          }
        }
 
        // Parallelize DB updates per trunk
        const [checkRes, updateRes] = await Promise.all([
          supabase.from("voip_trunk_health_checks").insert({
            trunk_id: trunk.id,
            reachable: result.reachable,
            latency_ms: result.latency_ms,
            error_message: result.error ?? null,
          }),
          supabase.from("voip_trunks")
            .update({
              last_health_status: status,
              last_health_latency_ms: result.latency_ms,
              last_health_checked_at: new Date().toISOString(),
            })
            .eq("id", trunk.id)
        ]);
 
       if (checkRes.error) console.error(`Error logging health check for trunk ${trunk.id}:`, checkRes.error);
       if (updateRes.error) console.error(`Error updating trunk status ${trunk.id}:`, updateRes.error);
 
       return { id: trunk.id, name: trunk.name, reachable: result.reachable, latency_ms: result.latency_ms };
     });
 
     const allResults = await Promise.all(checks);
     results.push(...allResults);

    return new Response(JSON.stringify({ checked: results.length, results }), {
      status: 200, headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
     return new Response(JSON.stringify({ error: (e as Error).message }), {
       status: 500, headers: { ...cors, "Content-Type": "application/json" },
     });
   }
 };
 
 if (import.meta.main) {
   serve(handler);
 }
