import { buildCorsHeaders } from "../_shared/cors.ts";

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: buildCorsHeaders(req) });
  }

  try {
    const data: NewDeviceNotification = await req.json();
    
    // Input validation
    if (!data.email || !data.ip || !data.timestamp) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: email, ip, timestamp" }),
        { status: 400, headers: { "Content-Type": "application/json", ...buildCorsHeaders(req) } }
      );
    }
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    
    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ success: true, message: "RESEND_API_KEY not configured", logged: true, emailSent: false }),
        { status: 200, headers: { "Content-Type": "application/json", ...buildCorsHeaders(req) } }
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
          <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 30px; text-align: center;">
              <h1 style="margin: 0;">🔔 Novo Login Detectado</h1>
              <p style="margin: 10px 0 0; opacity: 0.9;">Acesso de novo dispositivo ou localização</p>
            </div>
            <div style="padding: 30px;">
              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-bottom: 25px;">
                <strong>⚠️ Motivo:</strong> ${alertReasons.join(", ")}
              </div>
              <p>Olá${data.userName ? `, ${data.userName}` : ''},</p>
              <p>Detectamos um login na sua conta. Se foi você, ignore este email.</p>
              <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin: 20px 0;">
                <p>📅 <strong>Data:</strong> ${loginTime}</p>
                <p>🌐 <strong>IP:</strong> <code>${data.ip}</code></p>
                <p>📍 <strong>Local:</strong> ${locationInfo}</p>
                <p>💻 <strong>Dispositivo:</strong> ${deviceInfo || 'Não identificado'}</p>
              </div>
              <div style="background: #fef2f2; border-radius: 12px; padding: 20px;">
                <h3 style="color: #991b1b; margin: 0 0 10px;">🚨 Não foi você?</h3>
                <ul style="color: #7f1d1d; font-size: 14px;">
                  <li>Altere sua senha imediatamente</li>
                  <li>Ative autenticação de dois fatores</li>
                  <li>Revogue sessões ativas</li>
                </ul>
              </div>
            </div>
            <div style="background: #1e293b; color: #94a3b8; padding: 20px; font-size: 12px; text-align: center;">
              <p style="margin: 0;">Email automático de segurança. Não responda.</p>
            </div>
          </div>
        `,
      }),
    });

    const emailResult = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("[NEW-DEVICE] Erro ao enviar email:", emailResult);
      return new Response(
        JSON.stringify({ success: false, error: emailResult.message, logged: true, emailSent: false }),
        { status: 500, headers: { "Content-Type": "application/json", ...buildCorsHeaders(req) } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, logged: true, emailSent: true, emailId: emailResult.id }),
      { status: 200, headers: { "Content-Type": "application/json", ...buildCorsHeaders(req) } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("[NEW-DEVICE] Erro:", errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage, logged: true, emailSent: false }),
      { status: 500, headers: { "Content-Type": "application/json", ...buildCorsHeaders(req) } }
    );
  }
});
