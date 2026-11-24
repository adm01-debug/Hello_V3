// Edge function ausente: existiam apenas os testes. As regras de negocio
// (public.check_dnc / public.dnc_list) ja estavam no banco mas nada as expunha,
// entao a checagem de "Do Not Call" nunca chegava ao front nem ao discador.
import { buildCorsHeaders } from "../_shared/cors.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { getCorrelationId, internalErrorResponse } from '../_shared/errors.ts';
import { CheckDncBodySchema } from "../_shared/numeric-body-schemas.ts";
import { validateBody } from "../_shared/validator.ts";

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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Não autorizado" }, 401, req);

    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(url, anon, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return json({ error: "Não autorizado" }, 401, req);

    const validation = await validateBody(req, CheckDncBodySchema, buildCorsHeaders(req), { endpoint: 'check-dnc' });
    if (validation.errorResponse) return validation.errorResponse;
    const body = validation.data!;
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    if (!phone) return json({ error: "phone é obrigatório" }, 400, req);

    const { data, error } = await userClient.rpc("check_dnc", { p_phone: phone });
    if (error) throw error;

    return json({ phone, blocked: data === true }, 200, req);
  } catch (err) {
    return internalErrorResponse(err, getCorrelationId(req), buildCorsHeaders(req), { fn: 'check-dnc' });
  }
});
