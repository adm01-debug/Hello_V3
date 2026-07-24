import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { handleRequest } from "./index.ts";

const ACCESS_KEY = "92894ad8f9f1b264e52c923bab8c46249e256a6ba9a80aeb";

interface CapturedInsert {
  row: Record<string, unknown>;
}

function makeFactory(opts: { fail?: boolean } = {}) {
  const inserts: CapturedInsert[] = [];
  const factory = () =>
    ({
      from: (_table: string) => ({
        insert: (row: Record<string, unknown>) => {
          inserts.push({ row });
          return Promise.resolve(
            opts.fail ? { error: { message: "boom" } } : { error: null },
          );
        },
      }),
      // deno-lint-ignore no-explicit-any
    }) as any;
  return { factory, inserts };
}

// JWT informativo — payload { sub: <uuid>, email: "u@x.com" }, sem assinatura válida.
const JWT_SUB = "11111111-1111-4111-8111-111111111111";
const JWT = `eyJhbGciOiJIUzI1NiJ9.${
  btoa(JSON.stringify({ sub: JWT_SUB, email: "u@x.com" }))
    .replace(/=+$/, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
}.sig`;

Deno.test("401 sem x-access-key e audita como unauthorized", async () => {
  const { factory, inserts } = makeFactory();
  const res = await handleRequest(
    new Request("http://x/?action=ping"),
    { auditFactory: factory },
  );
  await res.text();
  assertEquals(res.status, 401);
  assertExists(res.headers.get("x-request-id"));
  assertEquals(inserts.length, 1);
  assertEquals(inserts[0].row.action, "migrate_helper.ping");
  const details = inserts[0].row.details as Record<string, unknown>;
  assertEquals(details.status, "unauthorized");
});

Deno.test("200 em ping com chave válida e caller do JWT", async () => {
  const { factory, inserts } = makeFactory();
  const res = await handleRequest(
    new Request("http://x/?action=ping", {
      headers: { "x-access-key": ACCESS_KEY, authorization: `Bearer ${JWT}` },
    }),
    { auditFactory: factory },
  );
  await res.text();
  assertEquals(res.status, 200);
  assertEquals(inserts[0].row.user_id, JWT_SUB);
  assertEquals(inserts[0].row.user_email, "u@x.com");
  const details = inserts[0].row.details as Record<string, unknown>;
  assertEquals(details.status, "ok");
});

Deno.test("propaga x-request-id fornecido pelo cliente", async () => {
  const { factory } = makeFactory();
  const rid = "client-provided-rid-123";
  const res = await handleRequest(
    new Request("http://x/?action=health", {
      headers: { "x-access-key": ACCESS_KEY, "x-request-id": rid },
    }),
    { auditFactory: factory },
  );
  const body = await res.json();
  assertEquals(res.headers.get("x-request-id"), rid);
  assertEquals(body.request_id, rid);
});

Deno.test("falha no insert de auditoria não altera status HTTP", async () => {
  const { factory } = makeFactory({ fail: true });
  const res = await handleRequest(
    new Request("http://x/?action=ping", {
      headers: { "x-access-key": ACCESS_KEY },
    }),
    { auditFactory: factory },
  );
  await res.text();
  assertEquals(res.status, 200);
});

Deno.test("ação desconhecida retorna 400 e é auditada", async () => {
  const { factory, inserts } = makeFactory();
  const res = await handleRequest(
    new Request("http://x/?action=nope", {
      headers: { "x-access-key": ACCESS_KEY },
    }),
    { auditFactory: factory },
  );
  await res.text();
  assertEquals(res.status, 400);
  const details = inserts[0].row.details as Record<string, unknown>;
  assertEquals(details.status, "bad_request");
});
