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

    console.log("Starting database cleanup...");

    // 1. Clean expired WebAuthn challenges
    const { error: challengeErr } = await supabase.rpc("cleanup_expired_challenges");
    if (challengeErr) console.error("Challenge cleanup error:", challengeErr);
    else console.log("Expired WebAuthn challenges cleaned");

    // 2. Clean old rate limit logs (older than 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { error: rateErr } = await supabase
      .from("rate_limit_logs")
      .delete()
      .lt("created_at", sevenDaysAgo);
    if (rateErr) console.error("Rate limit cleanup error:", rateErr);
    else console.log("Old rate limit logs cleaned");

    // 3. Clean resolved rate limit alerts (older than 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { error: alertErr } = await supabase
      .from("rate_limit_alerts")
      .delete()
      .eq("is_resolved", true)
      .lt("created_at", thirtyDaysAgo);
    if (alertErr) console.error("Alert cleanup error:", alertErr);
    else console.log("Old resolved alerts cleaned");

    // 4. Clean old login attempts (older than 90 days)
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const { error: loginErr } = await supabase
      .from("login_attempts")
      .delete()
      .lt("created_at", ninetyDaysAgo);
    if (loginErr) console.error("Login attempts cleanup error:", loginErr);
    else console.log("Old login attempts cleaned");

    // 5. Clean expired account lockouts
    const { error: lockoutErr } = await supabase
      .from("account_lockouts")
      .delete()
      .lt("locked_until", new Date().toISOString())
      .not("locked_until", "is", null);
    if (lockoutErr) console.error("Lockout cleanup error:", lockoutErr);
    else console.log("Expired lockouts cleaned");

    console.log("Database cleanup completed successfully");

    return new Response(
      JSON.stringify({ success: true, message: "Database cleanup completed" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Database cleanup error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
