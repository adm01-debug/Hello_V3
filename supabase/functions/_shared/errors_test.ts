import { assertEquals, assertMatch, assertThrows } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { GENERIC_INTERNAL_MESSAGE, getCorrelationId, internalError, internalErrorResponse } from "./errors.ts";

/** Erro no formato que o supabase-js devolve quando uma policy recusa. */
function postgrestError(): Error {
  return new Error(
    "new row violates row-level security policy for table \"dialer_queue\" (policy \"Users can insert own\")",
  );
}

interface Captura<T> {
  resultado: T;
  linhas: string[];
}

function capturarConsoleError<T>(fn: () => T): Captura<T> {
  const original = console.error;
  const linhas: string[] = [];
  console.error = (...args: unknown[]) => {
    linhas.push(args.map((a) => (typeof a === "string" ? a : JSON.stringify(a))).join(" "));
  };
  try {
    return { resultado: fn(), linhas };
  } finally {
    console.error = original;
  }
}

Deno.test("getCorrelationId: reaproveita x-correlation-id do chamador", () => {
  const req = new Request("https://exemplo.test", { headers: { "x-correlation-id": "abc-123" } });
  assertEquals(getCorrelationId(req), "abc-123");
});

Deno.test("getCorrelationId: aceita x-request-id como alternativa", () => {
  const req = new Request("https://exemplo.test", { headers: { "x-request-id": "req-9" } });
  assertEquals(getCorrelationId(req), "req-9");
});

Deno.test("getCorrelationId: cria um id quando nao vem header", () => {
  const id = getCorrelationId(new Request("https://exemplo.test"));
  assertMatch(id, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  assertEquals(getCorrelationId() === "", false);
});

Deno.test("internalError: corpo publico nao vaza tabela, policy nem a mensagem do banco", () => {
  const { resultado: body } = capturarConsoleError(() => internalError(postgrestError(), "corr-1"));
  assertEquals(Object.keys(body).sort(), ["code", "correlation_id", "message"]);
  assertEquals(body.code, "internal_error");
  assertEquals(body.message, GENERIC_INTERNAL_MESSAGE);
  assertEquals(body.correlation_id, "corr-1");
  const serializado = JSON.stringify(body);
  assertEquals(serializado.includes("row-level security"), false);
  assertEquals(serializado.includes("dialer_queue"), false);
  assertEquals(serializado.includes("Users can insert own"), false);
});

Deno.test("internalError: o log traz o erro completo com o mesmo correlation_id devolvido", () => {
  const { resultado: body, linhas } = capturarConsoleError(() =>
    internalError(postgrestError(), "corr-2", { fn: "chat-widget-session" })
  );
  assertEquals(linhas.length, 1);
  const log = JSON.parse(linhas[0]) as Record<string, unknown>;
  assertEquals(log.level, "error");
  assertEquals(log.event, "internal_error");
  assertEquals(log.correlation_id, "corr-2");
  assertEquals(String(log.error).includes("dialer_queue"), true);
  assertEquals(typeof log.stack, "string");
  assertEquals(log.fn, "chat-widget-session");
  // O que o cliente recebe continua sem detalhe, mesmo com o log completo.
  assertEquals(JSON.stringify(body).includes("dialer_queue"), false);
});

Deno.test("internalError: correlationId e obrigatorio", () => {
  assertThrows(() => internalError(postgrestError(), ""), TypeError);
});

Deno.test("internalErrorResponse: 500, CORS e id de correlacao no header", () => {
  const cors = { "Access-Control-Allow-Origin": "https://hello-v3.vercel.app" };
  const { resultado: res } = capturarConsoleError(() =>
    internalErrorResponse(postgrestError(), "corr-3", cors, { fn: "ocr-virtual-fax" })
  );
  assertEquals(res.status, 500);
  assertEquals(res.headers.get("x-correlation-id"), "corr-3");
  assertEquals(res.headers.get("Access-Control-Allow-Origin"), cors["Access-Control-Allow-Origin"]);
  assertEquals(res.headers.get("Content-Type"), "application/json");
  return res.json().then((body: Record<string, unknown>) => {
    assertEquals(body.message, GENERIC_INTERNAL_MESSAGE);
    assertEquals(JSON.stringify(body).includes("row-level security"), false);
  });
});
