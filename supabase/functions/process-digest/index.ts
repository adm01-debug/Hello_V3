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
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all users with digest enabled
    const { data: digestUsers, error: prefError } = await supabase
      .from("notification_preferences")
      .select("user_id, digest_frequency")
      .eq("digest_enabled", true);

    if (prefError) {
      throw prefError;
    }

    const results = [];

    for (const userPref of digestUsers || []) {
      // Calculate time window based on frequency
      const hoursBack = userPref.digest_frequency === "daily" ? 24 : 168; // daily or weekly
      const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();

      // Get unread notifications in the window
      const { data: notifications, error: notifError } = await supabase
        .from("notifications")
        .select("id, title, message, category, severity, created_at")
        .eq("user_id", userPref.user_id)
        .eq("is_read", false)
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(50);

      if (notifError) {
        console.error(`Digest error for user ${userPref.user_id}:`, notifError);
        continue;
      }

      if (!notifications || notifications.length === 0) {
        continue;
      }

      // Group by category
      const grouped: Record<string, typeof notifications> = {};
      for (const n of notifications) {
        const cat = n.category || "system";
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(n);
      }

      // Create a digest notification
      const summary = Object.entries(grouped)
        .map(([cat, items]) => `${cat}: ${items.length} notificação(ões)`)
        .join(", ");

      await supabase.from("notifications").insert({
        user_id: userPref.user_id,
        title: `Resumo ${userPref.digest_frequency === "daily" ? "Diário" : "Semanal"}`,
        message: `Você tem ${notifications.length} notificações não lidas. ${summary}`,
        type: "digest",
        category: "system",
        severity: "info",
        metadata: { grouped_count: notifications.length, categories: grouped },
      });

      results.push({
        user_id: userPref.user_id,
        notifications_count: notifications.length,
      });
    }

    return new Response(
      JSON.stringify({ success: true, processed: results.length, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("process-digest error:", err);
    return new Response(
      JSON.stringify({ error: "Erro ao processar digest" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
