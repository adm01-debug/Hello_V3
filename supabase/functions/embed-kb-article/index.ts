import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildCorsHeaders } from "../_shared/cors.ts";
import { resilientFetch } from "../_shared/resilience.ts";
import { requireRole } from "../_shared/auth.ts";
import { string, optional, uuid, validate } from "../_shared/validate.ts";
import { createErrorResponse } from "../_shared/validator.ts";
import { checkRateLimitDB, getClientIp } from "../_shared/rate-limit.ts";

const MAX_TEXT = 20_000;

type KbRecord = { id: string; title?: string; excerpt?: string; content?: string };

/** Aceita o `record` vindo do webhook: so `record.id` e obrigatorio, e precisa ser UUID. */
export function recordKb(value: unknown): { ok: true; data: KbRecord } | { ok: false; error: string } {
  if (typeof value !== "object" || value === null) return { ok: false, error: "Expected object" };
  const rec = value as Record<string, unknown>;
  const id = uuid()(rec.id);
  return id.ok ? { ok: true, data: rec as KbRecord } : { ok: false, error: `id: ${id.error}` };
}

export async function handler(req: Request): Promise<Response> {
  const cors = buildCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

  // Quem escreve na base de conhecimento e staff (E008).
  const auth = await requireRole(req, ["supervisor", "admin"]);
  if (auth instanceof Response) return auth;

  const rate = await checkRateLimitDB(getClientIp(req), "embed-kb-article", auth.user.id);
  if (!rate.allowed) {
    return createErrorResponse("Limite de requisicoes excedido", "RATE_LIMITED", undefined, 429, cors);
  }

  const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
  if (!OPENROUTER_API_KEY) return json({ error: "OPENROUTER_API_KEY missing" }, 500);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const body = await req.json().catch(() => null);
    const parsed = validate(body, {
      text: optional(string({ max: MAX_TEXT })),
      record: optional(recordKb),
    });
    if (!parsed.ok) {
      return createErrorResponse(
        "Validation failed",
        "VALIDATION_ERROR",
        Object.entries(parsed.errors).map(([field, error]) => ({ field, error })),
        422,
        cors,
      );
    }

    const { record, text } = parsed.data;

    // Suporte a dois modos: trigger (record) ou busca direta (text)
    const textToEmbed = text || (record ? `${record.title}\n\n${record.excerpt || ""}\n\n${record.content}` : null);

    if (!textToEmbed) {
      return json({ error: "Missing input" }, 400);
    }

    if (textToEmbed.length > MAX_TEXT) {
      return createErrorResponse(
        "Validation failed",
        "VALIDATION_ERROR",
        [{ field: "text", error: `Max length ${MAX_TEXT}` }],
        422,
        cors,
      );
    }

    // 1. Gerar embedding via Open Router
    const embedResp = await resilientFetch(
      "openrouter:embeddings",
      "https://openrouter.ai/api/v1/embeddings",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "openai/text-embedding-3-small",
          input: textToEmbed,
        }),
      },
      { retry: { retries: 2, baseDelayMs: 400 }, breaker: { failureThreshold: 5, openDurationMs: 30_000 } },
    );

    if (!embedResp.ok) throw new Error(`Gateway error: ${await embedResp.text()}`);
    const { data } = await embedResp.json();
    const embedding = data[0].embedding;

    // 2. Se for trigger, atualizar o banco. Se for busca, apenas retornar.
    if (record?.id) {
      const { error: updateError } = await supabase
        .from("kb_articles")
        .update({ embedding })
        .eq("id", record.id);
      if (updateError) throw updateError;
    }

    return json({ success: true, embedding });
  } catch (error) {
    console.error("embed-kb-article error:", error);
    return json({ error: error instanceof Error ? error.message : String(error) }, 500);
  }
}

Deno.serve(handler);
