import { buildCorsHeaders } from "../_shared/cors.ts";
import { validate, string, uuid, optional, oneOf } from "../_shared/validate.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const notificationSchema = {
  user_id: uuid(),
  title: string({ min: 1, max: 500 }),
  message: string({ min: 1, max: 5000 }),
  type: optional(oneOf('info', 'warning', 'error', 'success')),
  category: optional(string({ max: 100 })),
  severity: optional(oneOf('info', 'warning', 'critical')),
  action_url: optional(string({ max: 2000 })),
  action_label: optional(string({ max: 200 })),
  source_type: optional(string({ max: 100 })),
  source_id: optional(string({ max: 100 })),
  expires_at: optional(string({ max: 50 })),
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: buildCorsHeaders(req) });
  }

  const headers = { ...buildCorsHeaders(req), "Content-Type": "application/json" };

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), { status: 401, headers });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY")!;

    const supabaseAuth = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), { status: 401, headers });
    }

    // Validate input with schema
    const body = await req.json();
    const parsed = validate(body, notificationSchema);
    if (!parsed.ok) {
      return new Response(JSON.stringify({ error: "Dados inválidos", details: parsed.errors }), { status: 400, headers });
    }

    const payload = parsed.data;
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
          { headers }
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
            { headers }
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
          metadata: {},
          source_type: payload.source_type,
          source_id: payload.source_id,
          expires_at: payload.expires_at,
        })
        .select()
        .single();

      if (!error) {
        return new Response(JSON.stringify({ success: true, notification: data }), { headers });
      }

      lastError = error;
      retries--;
      if (retries > 0) await new Promise((r) => setTimeout(r, 500));
    }

    console.error("Failed to send notification after retries:", lastError);
    return new Response(JSON.stringify({ error: "Falha ao enviar notificação" }), { status: 500, headers });
  } catch (err) {
    console.error("send-notification error:", err);
    return new Response(JSON.stringify({ error: "Erro interno do servidor" }), { status: 500, headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } });
  }
});
