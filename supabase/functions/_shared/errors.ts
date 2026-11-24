/**
 * Erro interno: o cliente recebe uma mensagem generica e um id de correlacao;
 * o log recebe o erro completo (que pode citar tabela, coluna e policy).
 *
 * Nunca devolva `err.message` do supabase-js ao cliente: a mensagem do
 * PostgREST traz o nome da tabela, da coluna e da policy que recusou.
 */
import { logError } from "./observability.ts";

export interface InternalErrorBody {
  code: "internal_error";
  message: string;
  correlation_id: string;
}

/** Mensagem unica e sem detalhe tecnico que o cliente pode ver. */
export const GENERIC_INTERNAL_MESSAGE = "Erro interno";

/**
 * Id de correlacao do request: reaproveita `x-correlation-id`/`x-request-id`
 * quando o chamador manda um (permitindo seguir o rastro ponta a ponta) e cria
 * um quando nao manda.
 */
export function getCorrelationId(req?: Request): string {
  const fromHeader = req?.headers.get("x-correlation-id") ?? req?.headers.get("x-request-id") ?? "";
  const id = fromHeader.trim();
  return id.length > 0 ? id : crypto.randomUUID();
}

/**
 * Loga o erro completo com o id de correlacao e devolve o corpo publico.
 * O `correlationId` e obrigatorio de proposito: sem ele o suporte nao tem
 * como achar o erro no log.
 */
export function internalError(
  err: unknown,
  correlationId: string,
  context: Record<string, unknown> = {},
): InternalErrorBody {
  if (!correlationId) {
    throw new TypeError("correlationId e obrigatorio em internalError");
  }
  logError("internal_error", err, {
    correlation_id: correlationId,
    stack: err instanceof Error ? err.stack : undefined,
    ...context,
  });
  return {
    code: "internal_error",
    message: GENERIC_INTERNAL_MESSAGE,
    correlation_id: correlationId,
  };
}

/** Atalho para o caso comum: resposta 500 com CORS e o id de correlacao no header. */
export function internalErrorResponse(
  err: unknown,
  correlationId: string,
  cors: Record<string, string> = {},
  context: Record<string, unknown> = {},
): Response {
  const body = internalError(err, correlationId, context);
  return new Response(JSON.stringify(body), {
    status: 500,
    headers: { ...cors, "Content-Type": "application/json", "x-correlation-id": body.correlation_id },
  });
}
