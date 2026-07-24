// Edge function temporária para migração de banco, com auditoria persistente.
// Toda invocação (autorizada, não autorizada, sucesso ou erro) é registrada
// em public.audit_logs via service_role, incluindo request_id, identidade
// do chamador (quando o JWT for enviado apenas para fins informativos),
// duração, IP e user agent. Nunca gravamos service_role ou db_url no detalhe.

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const ACCESS_KEY = "92894ad8f9f1b264e52c923bab8c46249e256a6ba9a80aeb";

const cors: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, apikey, content-type, x-access-key, x-request-id",
  "Access-Control-Expose-Headers": "x-request-id",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface CallerIdentity {
  id: string | null;
  email: string | null;
}

interface AuditPayload {
  requestId: string;
  action: string;
  status: "ok" | "unauthorized" | "error" | "bad_request";
  durationMs: number;
  ip: string | null;
  userAgent: string | null;
  caller: CallerIdentity;
  query: Record<string, string>;
  error?: string;
}

// Decodifica payload do JWT sem verificar assinatura (uso informativo apenas —
// o gate real é a x-access-key). Nunca lança.
function decodeJwt(authHeader: string | null): CallerIdentity {
  if (!authHeader) return { id: null, email: null };
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  const parts = token.split(".");
  if (parts.length !== 3) return { id: null, email: null };
  try {
    const padded = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(padded + "===".slice((padded.length + 3) % 4));
    const payload = JSON.parse(json) as { sub?: unknown; email?: unknown };
    const sub = typeof payload.sub === "string" ? payload.sub : null;
    const email = typeof payload.email === "string" ? payload.email : null;
    return { id: sub && UUID_RE.test(sub) ? sub : null, email };
  } catch {
    return { id: null, email: null };
  }
}

function firstIp(header: string | null): string | null {
  if (!header) return null;
  const first = header.split(",")[0]?.trim();
  return first || null;
}

function logStructured(level: "info" | "error", payload: AuditPayload): void {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    request_id: payload.requestId,
    action: payload.action,
    status: payload.status,
    duration_ms: payload.durationMs,
    caller_id: payload.caller.id,
    caller_email: payload.caller.email,
    ip: payload.ip,
    user_agent: payload.userAgent,
    query: payload.query,
    ...(payload.error ? { error: payload.error } : {}),
  });
  if (level === "error") console.error(line);
  else console.log(line);
}

// Injetável para tests.
export type AuditClientFactory = () => SupabaseClient | null;

const defaultAuditClientFactory: AuditClientFactory = () => {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
};

async function persistAudit(
  factory: AuditClientFactory,
  payload: AuditPayload,
): Promise<void> {
  try {
    const client = factory();
    if (!client) return;
    const { error } = await client.from("audit_logs").insert({
      user_id: payload.caller.id,
      user_email: payload.caller.email,
      action: `migrate_helper.${payload.action}`,
      resource_type: "edge_function",
      resource_id: "migrate-helper",
      ip_address: payload.ip,
      user_agent: payload.userAgent,
      details: {
        request_id: payload.requestId,
        action: payload.action,
        status: payload.status,
        duration_ms: payload.durationMs,
        query: payload.query,
        caller_email: payload.caller.email,
        ...(payload.error ? { error: payload.error } : {}),
      },
    });
    if (error) {
      console.error(
        JSON.stringify({
          ts: new Date().toISOString(),
          level: "error",
          request_id: payload.requestId,
          action: "audit_insert_failed",
          error: error.message,
        }),
      );
    }
  } catch (err) {
    console.error(
      JSON.stringify({
        ts: new Date().toISOString(),
        level: "error",
        request_id: payload.requestId,
        action: "audit_insert_exception",
        error: err instanceof Error ? err.message : String(err),
      }),
    );
  }
}

export interface HandlerDeps {
  auditFactory?: AuditClientFactory;
}

export async function handleRequest(
  req: Request,
  deps: HandlerDeps = {},
): Promise<Response> {
  const factory = deps.auditFactory ?? defaultAuditClientFactory;
  const started = performance.now();

  const incomingRequestId = req.headers.get("x-request-id");
  const requestId =
    incomingRequestId && incomingRequestId.length <= 128
      ? incomingRequestId
      : crypto.randomUUID();

  const baseHeaders = { ...cors, "x-request-id": requestId };

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: baseHeaders });
  }

  const url = new URL(req.url);
  const action = url.searchParams.get("action") || "ping";
  const query: Record<string, string> = {};
  for (const [k, v] of url.searchParams.entries()) {
    if (k === "action") continue;
    query[k] = v.length > 200 ? `${v.slice(0, 200)}…` : v;
  }

  const caller = decodeJwt(req.headers.get("authorization"));
  const ip = firstIp(req.headers.get("x-forwarded-for"));
  const userAgent = req.headers.get("user-agent");

  const finalize = async (
    status: AuditPayload["status"],
    httpStatus: number,
    body: unknown,
    error?: string,
  ): Promise<Response> => {
    const durationMs = Math.round(performance.now() - started);
    const audit: AuditPayload = {
      requestId,
      action,
      status,
      durationMs,
      ip,
      userAgent,
      caller,
      query,
      error,
    };
    logStructured(status === "ok" ? "info" : "error", audit);
    await persistAudit(factory, audit);
    return new Response(JSON.stringify(body), {
      status: httpStatus,
      headers: { ...baseHeaders, "Content-Type": "application/json" },
    });
  };

  const key = req.headers.get("x-access-key");
  if (key !== ACCESS_KEY) {
    return finalize(
      "unauthorized",
      401,
      { error: "unauthorized", request_id: requestId },
      "invalid_or_missing_x_access_key",
    );
  }

  try {
    if (action === "ping") {
      return await finalize("ok", 200, {
        ok: true,
        request_id: requestId,
        project_ref: Deno.env.get("SUPABASE_URL") ?? null,
      });
    }
    if (action === "health") {
      return await finalize("ok", 200, {
        ok: true,
        request_id: requestId,
        caller_id: caller.id,
        caller_email: caller.email,
      });
    }
    if (action === "credentials") {
      return await finalize("ok", 200, {
        request_id: requestId,
        url: Deno.env.get("SUPABASE_URL"),
        service_role: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
        db_url: Deno.env.get("SUPABASE_DB_URL"),
      });
    }
    return await finalize(
      "bad_request",
      400,
      { error: "unknown_action", request_id: requestId },
      `unknown_action:${action}`,
    );
  } catch (e) {
    return await finalize(
      "error",
      500,
      { error: "internal_error", request_id: requestId },
      e instanceof Error ? e.message : String(e),
    );
  }
}

Deno.serve((req) => handleRequest(req));
