import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildCorsHeaders } from "../_shared/cors.ts";

export const handler = async (req: Request): Promise<Response> => {
  const cors = buildCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { failed_trunk_id, backup_trunk_id, reason } = await req.json();

    // 1. Busca detalhes dos troncos
    const { data: failedTrunk } = await supabase.from("voip_trunks").select("name").eq("id", failed_trunk_id).single();
    const { data: backupTrunk } = await supabase.from("voip_trunks").select("name").eq("id", backup_trunk_id).single();

    // 2. Busca agentes afetados
    const { data: assignments } = await supabase
      .from("agent_trunk_assignments")
      .select("agent_id")
      .eq("trunk_id", backup_trunk_id); 

    const agentIds = assignments?.map(a => a.agent_id) || [];

    if (agentIds.length > 0) {
      // 3. Insere notificações na tabela (que deve disparar Realtime)
      const notifications = agentIds.map(id => ({
        user_id: id,
        title: "⚠️ Failover VoIP Ativo",
        message: `Linha "${failedTrunk?.name}" falhou (${reason}). Você foi migrado automaticamente para "${backupTrunk?.name}".`,
        type: "warning",
        category: "voip_failover",
        metadata: { failed_trunk_id, backup_trunk_id }
      }));

      await supabase.from("notifications").insert(notifications);
    }

    return new Response(JSON.stringify({ success: true, notified_count: agentIds.length }), {
      headers: { ...cors, "Content-Type": "application/json" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" }
    });
  }
};

serve(handler);
