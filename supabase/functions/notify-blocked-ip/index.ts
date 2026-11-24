import { buildCorsHeaders } from "../_shared/cors.ts";
import { createErrorResponse } from "../_shared/validator.ts";
import { checkRateLimitDB, getClientIp } from "../_shared/rate-limit.ts";
import { requireUser } from "../_shared/auth.ts";
import { escapeHtml } from "../_shared/html.ts";
import { optional, string, uuid, validate } from "../_shared/validate.ts";
import { GENERIC_INTERNAL_MESSAGE, getCorrelationId } from '../_shared/errors.ts';
import { fetchComPrazo } from "../_shared/resilience.ts";

/** Envio de e-mail nao deveria demorar: acima disso o provedor esta fora do ar. */
const PRAZO_EMAIL_MS = 8_000;

const bodySchema = {
  user_id: optional(uuid()),
  ip: string({ max: 60 }),
  email: optional(string({ max: 254 })),
  country: optional(string({ max: 100 })),
  city: optional(string({ max: 100 })),
  userAgent: optional(string({ max: 300 })),
  timestamp: string({ max: 40 }),
};

type BlockedIpData = {
  user_id?: string;
  ip: string;
  email?: string;
  country?: string;
  city?: string;
  userAgent?: string;
  timestamp: string;
};

/** Monta o HTML do alerta de IP bloqueado. Todo valor interpolado passa por escapeHtml. */
export function buildBlockedIpEmail(data: BlockedIpData): string {
  const locationInfo = data.country && data.city
    ? `${data.city}, ${data.country}`
    : data.country || "Localização desconhecida";

  const loginTime = new Date(data.timestamp).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

  return `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #dc2626, #991b1b); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0;">🚨 Acesso Bloqueado</h1>
              <p style="margin: 5px 0 0 0; opacity: 0.9;">Tentativa de login bloqueada por IP não autorizado</p>
            </div>
            <div style="background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb;">
              <p><strong>Email:</strong> ${escapeHtml(data.email)}</p>
              <p><strong>IP:</strong> <code>${escapeHtml(data.ip)}</code></p>
              <p><strong>Localização:</strong> 📍 ${escapeHtml(locationInfo)}</p>
              <p><strong>Data/Hora:</strong> ${escapeHtml(loginTime)}</p>
              <p><strong>User Agent:</strong> <small>${escapeHtml(data.userAgent) || 'N/A'}</small></p>
            </div>
            <div style="background: #1f2937; color: #9ca3af; padding: 15px; border-radius: 0 0 8px 8px; font-size: 12px;">
              <p style="margin: 0;">Email automático do sistema de segurança.</p>
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
    // Chamado em Login.tsx antes do signOut: a sessao existe no momento da chamada.
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

    // Só o próprio usuário pode disparar o alerta em nome dele.
    if (data.user_id && data.user_id !== user.id) {
      return createErrorResponse("Sem permissão para notificar outro usuário", "FORBIDDEN", undefined, 403, cors);
    }

    const rate = await checkRateLimitDB(getClientIp(req), "notify-blocked-ip", user.id, { onError: 'deny' });
    if (!rate.allowed) {
      return createErrorResponse("Muitas notificações seguidas. Tente novamente em instantes.", "RATE_LIMITED", undefined, 429, cors);
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL");

    if (!ADMIN_EMAIL) {
      console.error("[BLOCKED-IP] ADMIN_EMAIL não configurada: alerta não enviado");
      return new Response(
        JSON.stringify({ success: true, message: "ADMIN_EMAIL not configured", logged: true, emailSent: false }),
        { status: 200, headers: { "Content-Type": "application/json", ...cors } }
      );
    }

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
        to: [ADMIN_EMAIL],
        subject: "🚨 Alerta: Tentativa de Acesso Bloqueado por IP",
        html: buildBlockedIpEmail(data),
      }),
    }, PRAZO_EMAIL_MS);

    const emailResult = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("[BLOCKED-IP] Erro ao enviar email:", emailResult);
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
    console.error("[BLOCKED-IP] Erro:", error);
    return new Response(
      JSON.stringify({ success: false, code: 'internal_error', message: GENERIC_INTERNAL_MESSAGE, correlation_id: getCorrelationId(req), logged: true, emailSent: false }),
      { status: 500, headers: { "Content-Type": "application/json", ...cors } }
    );
  }
}

Deno.serve(handler);
