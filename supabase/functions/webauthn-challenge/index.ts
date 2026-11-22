// Emite o desafio de autenticacao WebAuthn para um login SEM sessao ativa.
// A edge e publica (verify_jwt=false) e usa a service role para inserir o
// desafio em `webauthn_challenges`, contornando a RLS que exigia sessao.
// O usuario e resolvido pelo e-mail ANTES da cerimonia, pois a coluna
// `user_id` e NOT NULL e nao existe desafio orfao.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildCorsHeaders } from "../_shared/cors.ts";
import { validate, string, optional } from "../_shared/validate.ts";
import { checkRateLimitDB, getClientIp } from "../_shared/rate-limit.ts";

function base64Url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function json(body: unknown, status: number, req: Request): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: buildCorsHeaders(req) });
  }
  try {
    const ip = getClientIp(req);
    const rate = await checkRateLimitDB(ip, "webauthn-challenge");
    if (!rate.allowed) {
      return json({ success: false, error: "Muitas tentativas. Tente novamente mais tarde." }, 429, req);
    }
    const body = await req.json().catch(() => ({}));
    const result = validate(body, { email: optional(string({ max: 254 })) });
    if (!result.ok) {
      return json({ success: false, error: "Payload invalido" }, 400, req);
    }
    const email = result.data.email?.trim().toLowerCase();
    if (!email) {
      return json({ success: false, error: "Informe o e-mail para entrar com passkey" }, 400, req);
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } },
    );
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    if (!profile) {
      return json({ success: false, error: "Nenhuma passkey encontrada para este e-mail" }, 404, req);
    }
    const { data: passkeys } = await supabase
      .from("user_passkeys")
      .select("credential_id")
      .eq("user_id", profile.id);
    if (!passkeys || passkeys.length === 0) {
      return json({ success: false, error: "Nenhuma passkey encontrada para este e-mail" }, 404, req);
    }
    const challenge = base64Url(crypto.getRandomValues(new Uint8Array(32)));
    const { error: insertError } = await supabase.from("webauthn_challenges").insert({
      user_id: profile.id,
      challenge,
      type: "authentication",
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    });
    if (insertError) {
      console.error("webauthn-challenge insert error:", insertError);
      return json({ success: false, error: "Falha ao gerar desafio" }, 500, req);
    }
    return json(
      { success: true, challenge, allowCredentialIds: passkeys.map((p) => p.credential_id) },
      200,
      req,
    );
  } catch (err) {
    console.error("webauthn-challenge error:", err);
    return json({ success: false, error: err instanceof Error ? err.message : String(err) }, 500, req);
  }
});