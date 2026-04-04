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

    const results: Record<string, string> = {};

    // 1. Clean expired WebAuthn challenges
    const { error: challengeErr } = await supabase.rpc("cleanup_expired_challenges");
    results.webauthn_challenges = challengeErr ? `error: ${challengeErr.message}` : "cleaned";

    // 2. Clean old rate limit logs (older than 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { error: rateErr } = await supabase
      .from("rate_limit_logs")
      .delete()
      .lt("created_at", sevenDaysAgo);
    results.rate_limit_logs = rateErr ? `error: ${rateErr.message}` : "cleaned";

    // 3. Clean resolved rate limit alerts (older than 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { error: alertErr } = await supabase
      .from("rate_limit_alerts")
      .delete()
      .eq("is_resolved", true)
      .lt("created_at", thirtyDaysAgo);
    results.rate_limit_alerts = alertErr ? `error: ${alertErr.message}` : "cleaned";

    // 4. Clean old login attempts (older than 90 days)
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const { error: loginErr } = await supabase
      .from("login_attempts")
      .delete()
      .lt("created_at", ninetyDaysAgo);
    results.login_attempts = loginErr ? `error: ${loginErr.message}` : "cleaned";

    // 5. Clean expired account lockouts
    const { error: lockoutErr } = await supabase
      .from("account_lockouts")
      .delete()
      .lt("locked_until", new Date().toISOString())
      .not("locked_until", "is", null);
    results.account_lockouts = lockoutErr ? `error: ${lockoutErr.message}` : "cleaned";

    // Log cleanup event
    await supabase.from("audit_logs").insert({
      user_id: user.id,
      user_email: user.email,
      action: "database_cleanup",
      resource_type: "system",
      details: results,
    });

    return new Response(
      JSON.stringify({ success: true, message: "Database cleanup completed", results }),
      { headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Database cleanup error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
