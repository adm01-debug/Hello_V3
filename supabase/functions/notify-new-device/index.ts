import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface NewDeviceNotification {
  email: string;
  userName?: string;
  ip: string;
  country?: string;
  city?: string;
  browser?: string;
  os?: string;
  device?: string;
  timestamp: string;
  isNewIP: boolean;
  isNewBrowser: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: NewDeviceNotification = await req.json();
    
    console.log("[NEW-DEVICE] Novo login detectado:", {
      email: data.email,
      ip: data.ip,
      browser: data.browser,
      isNewIP: data.isNewIP,
      isNewBrowser: data.isNewBrowser,
    });

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    
    if (!RESEND_API_KEY) {
      console.log("[NEW-DEVICE] RESEND_API_KEY não configurada. Email não enviado.");
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Evento registrado. Email não enviado (API key não configurada).",
          logged: true,
          emailSent: false 
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const locationInfo = data.city && data.country 
      ? `${data.city}, ${data.country}` 
      : data.country || "Localização desconhecida";

    const deviceInfo = [data.browser, data.os, data.device].filter(Boolean).join(" • ");
    const loginTime = new Date(data.timestamp).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

    const alertReasons: string[] = [];
    if (data.isNewIP) alertReasons.push("Novo endereço IP");
    if (data.isNewBrowser) alertReasons.push("Novo navegador/dispositivo");

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `Sistema de Segurança <${Deno.env.get("FROM_EMAIL") || "security@resend.dev"}>`,
        to: [data.email],
        subject: "🔔 Novo login detectado na sua conta",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f5f5f5; }
              .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
              .header { background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 30px; text-align: center; }
              .header h1 { margin: 0; font-size: 24px; }
              .header p { margin: 10px 0 0; opacity: 0.9; font-size: 14px; }
              .content { padding: 30px; }
              .alert-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-bottom: 25px; border-radius: 0 8px 8px 0; }
              .alert-box strong { color: #92400e; }
              .info-card { background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 20px; }
              .info-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e2e8f0; }
              .info-row:last-child { border-bottom: none; }
              .info-label { color: #64748b; font-size: 14px; }
              .info-value { color: #1e293b; font-weight: 500; font-size: 14px; text-align: right; }
              .ip-badge { background: #dbeafe; color: #1e40af; padding: 4px 12px; border-radius: 20px; font-family: monospace; font-size: 13px; }
              .warning-section { background: #fef2f2; border-radius: 12px; padding: 20px; margin-top: 20px; }
              .warning-section h3 { color: #991b1b; margin: 0 0 10px; font-size: 16px; }
              .warning-section p { color: #7f1d1d; margin: 0; font-size: 14px; }
              .footer { background: #1e293b; color: #94a3b8; padding: 20px 30px; font-size: 12px; text-align: center; }
              .btn { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500; margin-top: 15px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🔔 Novo Login Detectado</h1>
                <p>Detectamos um acesso à sua conta de um novo dispositivo ou localização</p>
              </div>
              
              <div class="content">
                <div class="alert-box">
                  <strong>⚠️ Motivo do alerta:</strong> ${alertReasons.join(", ")}
                </div>
                
                <p style="margin-bottom: 20px;">Olá${data.userName ? `, ${data.userName}` : ''},</p>
                <p style="margin-bottom: 25px;">Detectamos um login na sua conta. Se foi você, pode ignorar este email. Caso contrário, tome medidas imediatas para proteger sua conta.</p>
                
                <div class="info-card">
                  <div class="info-row">
                    <span class="info-label">📅 Data e Hora</span>
                    <span class="info-value">${loginTime}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">🌐 Endereço IP</span>
                    <span class="ip-badge">${data.ip}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">📍 Localização</span>
                    <span class="info-value">${locationInfo}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">💻 Dispositivo</span>
                    <span class="info-value">${deviceInfo || 'Não identificado'}</span>
                  </div>
                </div>
                
                <div class="warning-section">
                  <h3>🚨 Não foi você?</h3>
                  <p>Se você não reconhece este login, recomendamos:</p>
                  <ul style="color: #7f1d1d; font-size: 14px; padding-left: 20px; margin: 10px 0 0;">
                    <li>Altere sua senha imediatamente</li>
                    <li>Ative a autenticação de dois fatores (MFA)</li>
                    <li>Revogue todas as sessões ativas</li>
                    <li>Verifique atividades suspeitas na sua conta</li>
                  </ul>
                </div>
              </div>
              
              <div class="footer">
                <p style="margin: 0;">Este é um email automático de segurança. Não responda a este email.</p>
                <p style="margin: 5px 0 0;">Se você tem dúvidas, entre em contato com nosso suporte.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      }),
    });

    const emailResult = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("[NEW-DEVICE] Erro ao enviar email:", emailResult);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: emailResult.message || "Erro ao enviar email",
          logged: true,
          emailSent: false 
        }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("[NEW-DEVICE] Email enviado com sucesso:", emailResult);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Notificação enviada com sucesso",
        logged: true,
        emailSent: true,
        emailId: emailResult.id 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("[NEW-DEVICE] Erro ao processar notificação:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        logged: true,
        emailSent: false 
      }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
