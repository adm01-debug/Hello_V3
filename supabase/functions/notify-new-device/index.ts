import { buildCorsHeaders } from "../_shared/cors.ts";
import { createErrorResponse } from "../_shared/validator.ts";
import { checkRateLimitDB, getClientIp } from "../_shared/rate-limit.ts";
import { requireUser } from "../_shared/auth.ts";
import { escapeHtml } from "../_shared/html.ts";
import { boolean, optional, string, uuid, validate } from "../_shared/validate.ts";
import { GENERIC_INTERNAL_MESSAGE, getCorrelationId } from '../_shared/errors.ts';
import { fetchComPrazo } from "../_shared/resilience.ts";

/** Envio de e-mail nao deveria demorar: acima disso o provedor esta fora do ar. */
const PRAZO_EMAIL_MS = 8_000;

const bodySchema = {
  user_id: optional(uuid()),
  ip: string({ max: 60 }),
  country: optional(string({ max: 100 })),
  city: optional(string({ max: 100 })),
  browser: optional(string({ max: 100 })),
  os: optional(string({ max: 100 })),
  device: optional(string({ max: 100 })),
  timestamp: string({ max: 40 }),
  isNewIP: optional(boolean()),
  isNewBrowser: optional(boolean()),
};

type NewDeviceData = {
  user_id?: string;
  ip: string;
  country?: string;
  city?: string;
  browser?: string;
  os?: string;
  device?: string;
  timestamp: string;
  isNewIP?: boolean;
  isNewBrowser?: boolean;
};

/** Monta o HTML do aviso de novo login. Todo valor interpolado passa por escapeHtml. */
export function buildNewDeviceEmail(data: NewDeviceData, userName = ""): string {
  const locationInfo = data.city && data.country
    ? `${data.city}, ${data.country}`
    : data.country || "Localização desconhecida";

  const deviceInfo = [data.browser, data.os, data.device].filter(Boolean).join(" • ");
  const loginTime = new Date(data.timestamp).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

  const alertReasons: string[] = [];
  if (data.isNewIP) alertReasons.push("Novo endereço IP");
  if (data.isNewBrowser) alertReasons.push("Novo navegador/dispositivo");

  const safeUserName = escapeHtml(userName);

  return `
          <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 30px; text-align: center;">
              <h1 style="margin: 0;">🔔 Novo Login Detectado</h1>
              <p style="margin: 10px 0 0; opacity: 0.9;">Acesso de novo dispositivo ou localização</p>
            </div>
            <div style="padding: 30px;">
              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-bottom: 25px;">
                <strong>⚠️ Motivo:</strong> ${escapeHtml(alertReasons.join(", "))}
              </div>
              <p>Olá${safeUserName ? `, ${safeUserName}` : ''},</p>
              <p>Detectamos um login na sua conta. Se foi você, ignore este email.</p>
              <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin: 20px 0;">
                <p>📅 <strong>Data:</strong> ${escapeHtml(loginTime)}</p>
                <p>🌐 <strong>IP:</strong> <code>${escapeHtml(data.ip)}</code></p>
                <p>📍 <strong>Local:</strong> ${escapeHtml(locationInfo)}</p>
                <p>💻 <strong>Dispositivo:</strong> ${escapeHtml(deviceInfo) || 'Não identificado'}</p>
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
        `;
}

export async function handler(req: Request): Promise<Response> {
  const cors = buildCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: cors });
  }

  try {
    const auth = await requireUser(req);
    if (auth instanceof Response) return auth;
    const { user } = auth;

    const parsed = validate(await req.json().catch(() => null), bodySchema);
    if (!parsed.ok) {
      return createErrorResponse(
        "Dados inválidos",
        "VALIDATION_ERROR",
        Object.entries(parsed.errors).map(([field, error]) => ({ field, error })),
        422,
        cors
      );
    }
    const data = parsed.data;

    // O destinatário é sempre o dono da sessão autenticada: o corpo nunca escolhe o e-mail.
    if (data.user_id && data.user_id !== user.id) {
      return createErrorResponse("Sem permissão para notificar outro usuário", "FORBIDDEN", undefined, 403, cors);
    }

    const emailTo = user.email;
    if (!emailTo) {
      return createErrorResponse("Usuário autenticado sem e-mail cadastrado", "NO_EMAIL", undefined, 422, cors);
    }

    const rate = await checkRateLimitDB(getClientIp(req), "notify-new-device", user.id, { onError: 'deny' });
    if (!rate.allowed) {
      return createErrorResponse("Muitas notificações seguidas. Tente novamente em instantes.", "RATE_LIMITED", undefined, 429, cors);
    }

    const userName = typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : "";
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ success: true, message: "RESEND_API_KEY not configured", logged: true, emailSent: false }),
        { status: 200, headers: { "Content-Type": "application/json", ...cors } }
      );
    }

    const emailResponse = await fetchComPrazo("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `Sistema de Segurança <${Deno.env.get("FROM_EMAIL") || "security@resend.dev"}>`,
        to: [emailTo],
        subject: "🔔 Novo login detectado na sua conta",
        html: buildNewDeviceEmail(data, userName),
      }),
    }, PRAZO_EMAIL_MS);

    const emailResult = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("[NEW-DEVICE] Erro ao enviar email:", emailResult);
      return new Response(
        JSON.stringify({ success: false, error: emailResult.message, logged: true, emailSent: false }),
        { status: 500, headers: { "Content-Type": "application/json", ...cors } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, logged: true, emailSent: true, emailId: emailResult.id }),
      { status: 200, headers: { "Content-Type": "application/json", ...cors } }
    );
  } catch (error: unknown) {
    console.error("[NEW-DEVICE] Erro:", error);
    return new Response(
      JSON.stringify({ success: false, code: 'internal_error', message: GENERIC_INTERNAL_MESSAGE, correlation_id: getCorrelationId(req), logged: true, emailSent: false }),
      { status: 500, headers: { "Content-Type": "application/json", ...cors } }
    );
  }
}

Deno.serve(handler);
