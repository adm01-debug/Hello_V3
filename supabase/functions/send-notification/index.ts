import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    // Verify caller
    const supabaseAuth = createClient(supabaseUrl, supabaseAnon, {
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

    // Input length validation
    if (payload.title.length > 500 || payload.message.length > 5000) {
      return new Response(
        JSON.stringify({ error: "Title or message exceeds max length" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Check user preferences
    const { data: prefs } = await supabaseAdmin
      .from("notification_preferences")
      .select("*")
      .eq("user_id", payload.user_id)
      .maybeSingle();

    if (prefs) {
      const categories = prefs.categories as Record<string, boolean>;
      const category = payload.category || "system";
      if (categories && categories[category] === false) {
        return new Response(
          JSON.stringify({ skipped: true, reason: "Categoria desativada pelo usuário" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

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

    // Insert notification with retry
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
