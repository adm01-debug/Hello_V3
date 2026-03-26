import { corsHeaders } from "../_shared/cors.ts";

interface BlockedIPNotification {
  ip: string;
  email: string;
  country?: string;
  city?: string;
  userAgent?: string;
  timestamp: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: BlockedIPNotification = await req.json();
    
    // Input validation
    if (!data.ip || !data.email || !data.timestamp) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: ip, email, timestamp" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("[BLOCKED-IP] Tentativa de acesso bloqueado:", {
      ip: data.ip,
      email: data.email,
      country: data.country,
      city: data.city,
      timestamp: data.timestamp,
    });

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL");
    
    if (!ADMIN_EMAIL) {
      return new Response(
        JSON.stringify({ success: true, message: "ADMIN_EMAIL not configured", logged: true, emailSent: false }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ success: true, message: "RESEND_API_KEY not configured", logged: true, emailSent: false }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const locationInfo = data.country && data.city 
      ? `${data.city}, ${data.country}` 
      : data.country || "Localização desconhecida";

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `Sistema de Segurança <${Deno.env.get("FROM_EMAIL") || "security@resend.dev"}>`,
        to: [ADMIN_EMAIL],
        subject: "🚨 Alerta: Tentativa de Acesso Bloqueado por IP",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #dc2626, #991b1b); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0;">🚨 Acesso Bloqueado</h1>
              <p style="margin: 5px 0 0 0; opacity: 0.9;">Tentativa de login bloqueada por IP não autorizado</p>
            </div>
            <div style="background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb;">
              <p><strong>Email:</strong> ${data.email}</p>
              <p><strong>IP:</strong> <code>${data.ip}</code></p>
              <p><strong>Localização:</strong> 📍 ${locationInfo}</p>
              <p><strong>Data/Hora:</strong> ${new Date(data.timestamp).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</p>
              <p><strong>User Agent:</strong> <small>${data.userAgent || 'N/A'}</small></p>
            </div>
            <div style="background: #1f2937; color: #9ca3af; padding: 15px; border-radius: 0 0 8px 8px; font-size: 12px;">
              <p style="margin: 0;">Email automático do sistema de segurança.</p>
            </div>
          </div>
        `,
      }),
    });

    const emailResult = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("[BLOCKED-IP] Erro ao enviar email:", emailResult);
      return new Response(
        JSON.stringify({ success: false, error: emailResult.message, logged: true, emailSent: false }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, logged: true, emailSent: true, emailId: emailResult.id }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("[BLOCKED-IP] Erro:", errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage, logged: true, emailSent: false }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
