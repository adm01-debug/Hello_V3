// Testes do contador do autenticador (etapa 032) e do rate limit (etapa 033)
// da edge webauthn-authenticate.
//
// Usa um stub real de PostgREST/GoTrue em porta efemera, porque o
// comportamento depende da resposta do banco: sem ele nao da para provar que
// o contador que nao avanca e recusado nem que o contador que avanca e gravado.

import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.208.0/assert/mod.ts";
import { capturarHandler } from "../../_shared/__tests__/capture-handler.ts";

Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", "service-key-de-teste");

const handler = await capturarHandler(() => import("../index.ts"));
const URL_FN = "http://localhost/functions/v1/webauthn-authenticate";
const CHALLENGE = "desafio-do-contador-1234567890";

function b64url(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

/** Assercao WebAuthn real (P-256) com o signCount pedido. */
async function criarAssercao(signCount: number) {
  const par = await crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign", "verify"],
  ) as CryptoKeyPair;
  const spki = await crypto.subtle.exportKey("spki", par.publicKey);

  const clientData = JSON.stringify({
    type: "webauthn.get",
    challenge: CHALLENGE,
    origin: "https://hello-v3.vercel.app",
  });
  const clientDataBytes = new TextEncoder().encode(clientData);

  const rpIdHash = new Uint8Array(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode("hello-v3.vercel.app")),
  );
  const authData = new Uint8Array(new ArrayBuffer(37));
  authData.set(rpIdHash, 0);
  authData[32] = 0x05; // UP + UV
  new DataView(authData.buffer).setUint32(33, signCount, false);

  const clientHash = new Uint8Array(
    await crypto.subtle.digest("SHA-256", clientDataBytes),
  );
  const assinado = new Uint8Array(authData.length + clientHash.length);
  assinado.set(authData, 0);
  assinado.set(clientHash, authData.length);

  const assinatura = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    par.privateKey,
    assinado,
  );

  return {
    publicKey: b64url(spki),
    clientDataJSON: b64url(clientDataBytes),
    authenticatorData: b64url(authData),
    signature: b64url(assinatura),
  };
}

interface Chamada {
  method: string;
  path: string;
  body: string;
}

interface Stub {
  url: string;
  chamadas: Chamada[];
  doCaminho: (path: string, method?: string) => Chamada[];
  parar: () => Promise<void>;
}

function subirStub(opts: {
  counter: number;
  publicKey: string;
  rateLimited?: boolean;
}): Stub {
  const chamadas: Chamada[] = [];
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    });

  const server = Deno.serve(
    { port: 0, hostname: "127.0.0.1", onListen: () => {} },
    async (req) => {
      const url = new URL(req.url);
      const body = await req.text();
      chamadas.push({ method: req.method, path: url.pathname, body });

      if (url.pathname === "/rest/v1/rpc/check_rate_limit") {
        return opts.rateLimited
          ? json({ allowed: false, retry_after: 42, reason: "limite" })
          : json({ allowed: true, remaining: 10 });
      }
      if (url.pathname === "/rest/v1/user_passkeys" && req.method === "GET") {
        return json({
          id: "pk-1",
          user_id: "user-1",
          public_key: opts.publicKey,
          counter: opts.counter,
        });
      }
      if (url.pathname === "/rest/v1/webauthn_challenges" && req.method === "GET") {
        return json({
          id: "ch-1",
          challenge: CHALLENGE,
          expires_at: new Date(Date.now() + 60_000).toISOString(),
        });
      }
      if (url.pathname === "/rest/v1/webauthn_challenges" && req.method === "DELETE") {
        return new Response(null, { status: 204 });
      }
      if (url.pathname === "/rest/v1/user_passkeys" && req.method === "PATCH") {
        return new Response(null, { status: 204 });
      }
      if (url.pathname.startsWith("/auth/v1/admin/users/")) {
        return json({ user: { id: "user-1", email: "dono@exemplo.com" } });
      }
      if (url.pathname === "/auth/v1/admin/generate_link") {
        return json({ properties: { hashed_token: "tok", action_link: "https://x/y" } });
      }
      if (url.pathname === "/rest/v1/audit_logs" || url.pathname === "/rest/v1/rate_limit_logs") {
        return json(null, 201);
      }
      return json({ message: "not found", code: "PGRST404" }, 404);
    },
  );

  const port = (server.addr as Deno.NetAddr).port;
  return {
    url: `http://127.0.0.1:${port}`,
    chamadas,
    doCaminho: (path, method) =>
      chamadas.filter((c) => c.path === path && (!method || c.method === method)),
    parar: () => server.shutdown(),
  };
}

async function comStub(
  opts: { counter: number; publicKey: string; rateLimited?: boolean },
  fn: (stub: Stub) => Promise<void>,
): Promise<void> {
  const stub = subirStub(opts);
  const anterior = Deno.env.get("SUPABASE_URL");
  Deno.env.set("SUPABASE_URL", stub.url);
  try {
    await fn(stub);
  } finally {
    if (anterior !== undefined) Deno.env.set("SUPABASE_URL", anterior);
    await stub.parar();
  }
}

function post(body: unknown): Request {
  return new Request(URL_FN, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

Deno.test("webauthn-authenticate: contador que nao avanca e recusado (401) e nao grava nada", async () => {
  const assercao = await criarAssercao(5);
  await comStub({ counter: 9, publicKey: assercao.publicKey }, async (stub) => {
    const res = await handler(post({ credentialId: "cred-1", ...assercao }));
    assertEquals(res.status, 401);
    assertEquals((await res.json()).success, false);

    // Nao avancou o contador: nenhuma escrita em user_passkeys e nenhum magic link.
    assertEquals(stub.doCaminho("/rest/v1/user_passkeys", "PATCH").length, 0);
    assertEquals(stub.doCaminho("/auth/v1/admin/generate_link").length, 0);
    // O evento suspeito fica auditado.
    assertEquals(stub.doCaminho("/rest/v1/audit_logs", "POST").length, 1);
    assert(stub.doCaminho("/rest/v1/audit_logs", "POST")[0].body.includes("webauthn_possible_clone"));
  });
});

Deno.test("webauthn-authenticate: contador que avanca e gravado e o login segue (200)", async () => {
  const assercao = await criarAssercao(10);
  await comStub({ counter: 5, publicKey: assercao.publicKey }, async (stub) => {
    const res = await handler(post({ credentialId: "cred-1", ...assercao }));
    assertEquals(res.status, 200);
    assertEquals((await res.json()).success, true);

    const patch = stub.doCaminho("/rest/v1/user_passkeys", "PATCH");
    assertEquals(patch.length, 1);
    assert(patch[0].body.includes("\"counter\":10"));
    assertEquals(stub.doCaminho("/auth/v1/admin/generate_link").length, 1);
  });
});

Deno.test("webauthn-authenticate: autenticador que sempre devolve zero nao e recusado", async () => {
  // Alguns Apple/Windows Hello nao tem contador confiavel: comparar aqui
  // trancaria esses usuarios para sempre.
  const assercao = await criarAssercao(0);
  await comStub({ counter: 9, publicKey: assercao.publicKey }, async (stub) => {
    const res = await handler(post({ credentialId: "cred-1", ...assercao }));
    assertEquals(res.status, 200);
    assertEquals(stub.doCaminho("/rest/v1/user_passkeys", "PATCH").length, 0);
  });
});

Deno.test("webauthn-authenticate: rate limit bloqueado devolve 429 antes de tocar a passkey", async () => {
  const assercao = await criarAssercao(10);
  await comStub(
    { counter: 5, publicKey: assercao.publicKey, rateLimited: true },
    async (stub) => {
      const res = await handler(post({ credentialId: "cred-1", ...assercao }));
      assertEquals(res.status, 429);
      const corpo = await res.json();
      assertEquals(corpo.retryAfter, 42);

      assertEquals(stub.doCaminho("/rest/v1/user_passkeys", "GET").length, 0);
      assertEquals(stub.doCaminho("/auth/v1/admin/generate_link").length, 0);
    },
  );
});