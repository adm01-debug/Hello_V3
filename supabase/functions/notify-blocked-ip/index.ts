import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface BlockedIPNotification {
  ip: string;
  email: string;
  country?: string;
  city?: string;
  userAgent?: string;
  timestamp: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ip, email, country, city, userAgent, timestamp }: BlockedIPNotification = await req.json();

    console.log("[BLOCKED-IP] Tentativa de acesso bloqueado:", {
      ip,
      email,
      country,
      city,
      userAgent,
      timestamp,
    });

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL") || "admin@example.com";

    if (!RESEND_API_KEY) {
      console.log("[BLOCKED-IP] RESEND_API_KEY não configurada. Email não enviado, mas evento registrado.");
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Evento registrado. Email não enviado (API key não configurada).",
          logged: true,
          emailSent: false 
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const locationInfo = country && city 
      ? `${city}, ${country}` 
      : country || "Localização desconhecida";

    // Send email using Resend API directly via fetch
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Sistema de Segurança <security@resend.dev>",
        to: [ADMIN_EMAIL],
        subject: "🚨 Alerta: Tentativa de Acesso Bloqueado por IP",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #dc2626, #991b1b); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
              .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
              .footer { background: #1f2937; color: #9ca3af; padding: 15px; border-radius: 0 0 8px 8px; font-size: 12px; }
              .info-row { display: flex; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
              .label { font-weight: bold; width: 120px; color: #6b7280; }
              .value { color: #111827; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0;">🚨 Acesso Bloqueado</h1>
                <p style="margin: 5px 0 0 0; opacity: 0.9;">Uma tentativa de login foi bloqueada por IP não autorizado</p>
              </div>
              <div class="content">
                <div class="info-row">
                  <span class="label">Email:</span>
                  <span class="value">${email}</span>
                </div>
                <div class="info-row">
                  <span class="label">Endereço IP:</span>
                  <span class="value" style="font-family: monospace; background: #fee2e2; padding: 2px 8px; border-radius: 4px;">${ip}</span>
                </div>
                <div class="info-row">
                  <span class="label">Localização:</span>
                  <span class="value">📍 ${locationInfo}</span>
                </div>
                <div class="info-row">
                  <span class="label">Data/Hora:</span>
                  <span class="value">${new Date(timestamp).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</span>
                </div>
                <div class="info-row" style="border-bottom: none;">
                  <span class="label">User Agent:</span>
                  <span class="value" style="font-size: 11px; word-break: break-all;">${userAgent || 'Não disponível'}</span>
                </div>
                <div style="margin-top: 20px; padding: 15px; background: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
                  <strong>⚠️ Ação Recomendada:</strong>
                  <p style="margin: 5px 0 0 0; font-size: 14px;">
                    Verifique se este acesso é legítimo. Se for um usuário autorizado, adicione o IP à lista de permissões.
                  </p>
                </div>
              </div>
              <div class="footer">
                <p style="margin: 0;">Este é um email automático do sistema de segurança.</p>
                <p style="margin: 5px 0 0 0;">Não responda a este email.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      }),
    });

    const emailResult = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("[BLOCKED-IP] Erro ao enviar email:", emailResult);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: emailResult.message || "Erro ao enviar email",
          logged: true,
          emailSent: false 
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("[BLOCKED-IP] Email enviado com sucesso:", emailResult);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Notificação enviada com sucesso",
        logged: true,
        emailSent: true,
        emailId: emailResult.id 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("[BLOCKED-IP] Erro ao processar notificação:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        logged: true,
        emailSent: false 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
