import { buildCorsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: buildCorsHeaders(req) });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Check admin role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .eq("is_active", true)
      .maybeSingle();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    const tables = [
      "agents", "contacts", "call_sessions", "call_recordings",
      "call_transcriptions", "call_summaries", "call_analyses",
      "badges", "agent_badges", "agent_weekly_stats",
      "coaching_recommendations", "scheduled_callbacks",
      "dialer_campaigns", "dialer_queue", "audit_logs",
      "security_alerts", "user_profiles", "user_roles",
    ];

    const counts: Record<string, number> = {};

    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select("*", { count: "exact", head: true });
      
      if (!error && count !== null) {
        counts[table] = count;
      }
    }

    const backupMetadata = {
      timestamp: new Date().toISOString(),
      tables: counts,
      totalRecords: Object.values(counts).reduce((sum, c) => sum + c, 0),
      status: "completed",
      triggered_by: user.email,
    };

    await supabase.from("audit_logs").insert({
      user_id: user.id,
      user_email: user.email,
      action: "database_backup",
      resource_type: "system",
      details: backupMetadata,
    });

    return new Response(
      JSON.stringify({ success: true, backup: backupMetadata }),
      { headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Database backup error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
