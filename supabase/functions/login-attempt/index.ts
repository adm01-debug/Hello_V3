import { buildCorsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { clientIpFromHeaders } from "../_shared/client-ip.ts";
import { checkRateLimitDB } from "../_shared/rate-limit.ts";
import { getCorrelationId, internalErrorResponse } from "../_shared/errors.ts";

// A-019: as RPCs de lockout eram SECURITY DEFINER com EXECUTE para `anon`, entao
// saber o email bastava para travar a conta de um operador (5 falhas) e para zerar
// o contador. Elas passam a ser chamadas so aqui, com service role, e o unico
// caminho publico fica limitado por IP.
const ACOES = new Set(["check", "fail", "success"]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: buildCorsHeaders(req) });
  }

  const correlationId = getCorrelationId(req);

  try {
    const ip = clientIpFromHeaders(req.headers) ?? "0.0.0.0";
    const rl = await checkRateLimitDB(ip, "login-attempt");
    if (!rl.allowed) {
      return new Response(
        JSON.stringify({ error: "Limite excedido, tente novamente em instantes." }),
        { status: 429, headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } },
      );
    }

    const body = await req.json().catch(() => null) as { email?: unknown; action?: unknown } | null;
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const action = typeof body?.action === "string" ? body.action : "";

    if (!email || email.length > 255 || !email.includes("@") || !ACOES.has(action)) {
      return new Response(
        JSON.stringify({ error: "Parametros invalidos" }),
        { status: 400, headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const userAgent = (req.headers.get("user-agent") ?? "").slice(0, 500);
    const args = { p_email: email, p_ip_address: ip, p_user_agent: userAgent };

    const rpc = action === "check"
      ? "check_login_lockout"
      : action === "fail"
        ? "record_failed_login"
        : "record_successful_login";

    const { data, error } = await supabase.rpc(rpc, action === "check" ? { p_email: email } : args);
    if (error) {
      console.error(`[login-attempt ${correlationId}] ${rpc}:`, error);
      return internalErrorResponse(req, correlationId);
    }

    return new Response(
      JSON.stringify(data ?? { locked: false, attempts: 0 }),
      { headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error(`[login-attempt ${correlationId}]`, err);
    return internalErrorResponse(req, correlationId);
  }
});