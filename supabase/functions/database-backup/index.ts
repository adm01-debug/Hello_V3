import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    console.log("Starting database backup metadata collection...");

    // Collect table counts for backup verification
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
    };

    // Log the backup event
    await supabase.from("audit_logs").insert({
      action: "database_backup",
      resource_type: "system",
      details: backupMetadata,
      user_email: "system",
    });

    console.log("Database backup metadata collected:", JSON.stringify(backupMetadata));

    return new Response(
      JSON.stringify({ success: true, backup: backupMetadata }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Database backup error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
