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

// --- action=audit ---

interface QueryCall {
  filters: Array<[string, unknown]>;
  order?: { col: string; ascending: boolean };
  limit?: number;
}

function makeQueryFactory(rows: Array<Record<string, unknown>>, opts: { fail?: boolean } = {}) {
  const calls: QueryCall[] = [];
  const factory = () => {
    const call: QueryCall = { filters: [] };
    calls.push(call);
    const builder = {
      select: (_cols: string) => builder,
      eq: (col: string, val: unknown) => {
        call.filters.push([col, val]);
        return builder;
      },
      order: (col: string, o: { ascending: boolean }) => {
        call.order = { col, ascending: o.ascending };
        return builder;
      },
      limit: (n: number) => {
        call.limit = n;
        return Promise.resolve(
          opts.fail ? { data: null, error: { message: "db down" } } : { data: rows, error: null },
        );
      },
    };
    return {
      from: (_t: string) => builder,
      // deno-lint-ignore no-explicit-any
    } as any;
  };
  return { factory, calls };
}

Deno.test("action=audit exige x-access-key", async () => {
  const { factory: audit } = makeFactory();
  const { factory: query } = makeQueryFactory([]);
  const res = await handleRequest(
    new Request("http://x/?action=audit"),
    { auditFactory: audit, queryFactory: query },
  );
  await res.text();
  assertEquals(res.status, 401);
});

Deno.test("action=audit filtra por request_id e action_filter e retorna apenas campos não sensíveis", async () => {
  const rows = [
    {
      id: "row-1",
      action: "migrate_helper.ping",
      resource_type: "edge_function",
      resource_id: "migrate-helper",
      created_at: "2026-07-25T10:00:00Z",
      user_id: "SENSITIVE",
      user_email: "SENSITIVE",
      ip_address: "1.2.3.4",
      user_agent: "curl",
      details: {
        request_id: "rid-abc",
        action: "ping",
        status: "ok",
        duration_ms: 42,
        query: { foo: "bar" },
        caller_email: "SENSITIVE",
      },
    },
  ];
  const { factory: audit } = makeFactory();
  const { factory: query, calls } = makeQueryFactory(rows);
  const res = await handleRequest(
    new Request(
      "http://x/?action=audit&request_id=rid-abc&action_filter=ping&limit=5",
      { headers: { "x-access-key": ACCESS_KEY } },
    ),
    { auditFactory: audit, queryFactory: query },
  );
  const body = await res.json();
  assertEquals(res.status, 200);
  assertEquals(body.count, 1);
  const row = body.rows[0];
  assertEquals(row.request_id, "rid-abc");
  assertEquals(row.sub_action, "ping");
  assertEquals(row.status, "ok");
  assertEquals(row.duration_ms, 42);
  // Não pode vazar campos sensíveis
  assertEquals(row.user_id, undefined);
  assertEquals(row.user_email, undefined);
  assertEquals(row.ip_address, undefined);
  assertEquals(row.user_agent, undefined);
  assertEquals(row.details, undefined);
  // Filtros aplicados
  const filterKeys = calls[0].filters.map((f) => f[0]);
  assertEquals(filterKeys.includes("resource_id"), true);
  assertEquals(filterKeys.includes("details->>request_id"), true);
  assertEquals(filterKeys.includes("details->>action"), true);
  assertEquals(calls[0].limit, 5);
});

Deno.test("action=audit clampa limit fora do intervalo", async () => {
  const { factory: audit } = makeFactory();
  const { factory: query, calls } = makeQueryFactory([]);
  const res = await handleRequest(
    new Request("http://x/?action=audit&limit=9999", {
      headers: { "x-access-key": ACCESS_KEY },
    }),
    { auditFactory: audit, queryFactory: query },
  );
  await res.text();
  assertEquals(res.status, 200);
  assertEquals(calls[0].limit, 100);
});

Deno.test("action=audit falha graciosamente quando query retorna erro", async () => {
  const { factory: audit } = makeFactory();
  const { factory: query } = makeQueryFactory([], { fail: true });
  const res = await handleRequest(
    new Request("http://x/?action=audit", {
      headers: { "x-access-key": ACCESS_KEY },
    }),
    { auditFactory: audit, queryFactory: query },
  );
  const body = await res.json();
  assertEquals(res.status, 500);
  assertEquals(body.error, "audit_query_failed");
});
