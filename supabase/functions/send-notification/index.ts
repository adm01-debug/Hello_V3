import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface NotificationPayload {
  user_id: string;
  title: string;
  message: string;
  type?: string;
  category?: string;
  severity?: string;
  action_url?: string;
  action_label?: string;
  metadata?: Record<string, unknown>;
  source_type?: string;
  source_id?: string;
  expires_at?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Verify caller
    const supabaseAuth = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload: NotificationPayload = await req.json();

    // Validate required fields
    if (!payload.user_id || !payload.title || !payload.message) {
      return new Response(
        JSON.stringify({ error: "Campos obrigatórios: user_id, title, message" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role to insert notification for any user
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Check user preferences (quiet hours, category enabled)
    const { data: prefs } = await supabaseAdmin
      .from("notification_preferences")
      .select("*")
      .eq("user_id", payload.user_id)
      .maybeSingle();

    if (prefs) {
      // Check category preference
      const categories = prefs.categories as Record<string, boolean>;
      const category = payload.category || "system";
      if (categories && categories[category] === false) {
        return new Response(
          JSON.stringify({ skipped: true, reason: "Categoria desativada pelo usuário" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check quiet hours
      if (prefs.quiet_hours_enabled && prefs.quiet_hours_start && prefs.quiet_hours_end) {
        const now = new Date();
        const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
        const start = prefs.quiet_hours_start;
        const end = prefs.quiet_hours_end;
        
        const inQuietHours = start <= end
          ? currentTime >= start && currentTime <= end
          : currentTime >= start || currentTime <= end;
        
        if (inQuietHours && payload.severity !== "critical") {
          return new Response(
            JSON.stringify({ skipped: true, reason: "Horário silencioso ativo" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    // Insert notification with retry logic
    let retries = 3;
    let lastError: unknown = null;
    
    while (retries > 0) {
      const { data, error } = await supabaseAdmin
        .from("notifications")
        .insert({
          user_id: payload.user_id,
          title: payload.title,
          message: payload.message,
          type: payload.type || "info",
          category: payload.category || "system",
          severity: payload.severity || "info",
          action_url: payload.action_url,
          action_label: payload.action_label,
          metadata: payload.metadata || {},
          source_type: payload.source_type,
          source_id: payload.source_id,
          expires_at: payload.expires_at,
        })
        .select()
        .single();

      if (!error) {
        return new Response(
          JSON.stringify({ success: true, notification: data }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      lastError = error;
      retries--;
      if (retries > 0) {
        await new Promise((r) => setTimeout(r, 500));
      }
    }

    console.error("Failed to send notification after retries:", lastError);
    return new Response(
      JSON.stringify({ error: "Falha ao enviar notificação" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("send-notification error:", err);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
