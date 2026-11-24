// Edge function ausente: existiam apenas os testes. Sem ela o discador nao tinha
// como saber se podia ligar fora da janela permitida (TCPA / LGPD).
import { buildCorsHeaders } from "../_shared/cors.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { getCorrelationId, internalErrorResponse } from '../_shared/errors.ts';
import { CheckCallingHoursBodySchema } from "../_shared/numeric-body-schemas.ts";
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

    const validation = await validateBody(req, CheckCallingHoursBodySchema, buildCorsHeaders(req), { endpoint: 'check-calling-hours' });
    if (validation.errorResponse) return validation.errorResponse;
    const body = validation.data!;
    const region = typeof body.region_code === "string" && body.region_code
      ? body.region_code
      : "BR";

    const { data, error } = await userClient.rpc("check_calling_hours", {
      p_region_code: region,
    });
    if (error) throw error;

    return json({ region_code: region, ...(data ?? {}) }, 200, req);
  } catch (err) {
    return internalErrorResponse(err, getCorrelationId(req), buildCorsHeaders(req), { fn: 'check-calling-hours' });
  }
});
