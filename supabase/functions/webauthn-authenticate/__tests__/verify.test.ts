// Prova que o verificador de assercao WebAuthn realmente barra o ataque
// que existia: antes, quem conhecesse um credential_id valido recebia um
// magic link da conta. Aqui geramos um par de chaves P-256 real, assinamos
// uma assercao valida e depois a mutamos de todas as formas relevantes.

import {
  assert,
  assertEquals,
  assertRejects,
} from "https://deno.land/std@0.208.0/assert/mod.ts";
import {
  base64UrlToBytes,
  verificarAssercao,
  WebAuthnError,
} from "../verify.ts";

const ORIGEM = "https://hello-v3.vercel.app";
const RP_ID = "hello-v3.vercel.app";
const CHALLENGE = "desafio-de-teste-1234567890";

function b64url(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

interface Fixture {
  publicKey: string;
  assertion: {
    clientDataJSON: string;
    authenticatorData: string;
    signature: string;
  };
  privateKey: CryptoKey;
}

async function criarFixture(opts?: {
  origin?: string;
  challenge?: string;
  flags?: number;
}): Promise<Fixture> {
  const par = await crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign", "verify"],
  ) as CryptoKeyPair;

  const spki = await crypto.subtle.exportKey("spki", par.publicKey);

  const clientData = JSON.stringify({
    type: "webauthn.get",
    challenge: opts?.challenge ?? CHALLENGE,
    origin: opts?.origin ?? ORIGEM,
  });
  const clientDataBytes = new TextEncoder().encode(clientData);

  const rpIdHash = new Uint8Array(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(RP_ID)),
  );
  const authData = new Uint8Array(new ArrayBuffer(37));
  authData.set(rpIdHash, 0);
  authData[32] = opts?.flags ?? 0x05; // UP + UV
  new DataView(authData.buffer).setUint32(33, 7, false);

  const clientHash = new Uint8Array(
    await crypto.subtle.digest("SHA-256", clientDataBytes),
  );
  const assinado = new Uint8Array(authData.length + clientHash.length);
  assinado.set(authData, 0);
  assinado.set(clientHash, authData.length);

  const sig = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    par.privateKey,
    assinado,
  );

  return {
    publicKey: b64url(spki),
    privateKey: par.privateKey,
    assertion: {
      clientDataJSON: b64url(clientDataBytes),
      authenticatorData: b64url(authData),
      signature: b64url(sig),
    },
  };
}

function entrada(fx: Fixture, over: Record<string, unknown> = {}) {
  return {
    ...fx.assertion,
    challengeEsperado: CHALLENGE,
    publicKey: fx.publicKey,
    origensPermitidas: [ORIGEM],
    ...over,
  };
}

Deno.test("verify: assercao legitima e aceita e devolve signCount", async () => {
  const fx = await criarFixture();
  const r = await verificarAssercao(entrada(fx));
  assertEquals(r.signCount, 7);
  assertEquals(r.origem, ORIGEM);
});

Deno.test("verify: assinatura de OUTRA chave e rejeitada", async () => {
  // O coracao do ataque antigo: possuir o credential_id nao basta.
  const legitima = await criarFixture();
  const atacante = await criarFixture();
  await assertRejects(
    () =>
      verificarAssercao(
        entrada(legitima, { signature: atacante.assertion.signature }),
      ),
    WebAuthnError,
    "assinatura invalida",
  );
});

Deno.test("verify: desafio diferente e rejeitado (replay)", async () => {
  const fx = await criarFixture();
  await assertRejects(
    () => verificarAssercao(entrada(fx, { challengeEsperado: "outro-desafio" })),
    WebAuthnError,
    "desafio nao corresponde",
  );
});

Deno.test("verify: origem estranha e rejeitada (phishing)", async () => {
  const fx = await criarFixture({ origin: "https://evil.example.com" });
  await assertRejects(
    () => verificarAssercao(entrada(fx)),
    WebAuthnError,
    "origem nao permitida",
  );
});

Deno.test("verify: sem verificacao do usuario (UV) e rejeitado", async () => {
  const fx = await criarFixture({ flags: 0x01 }); // UP sem UV
  await assertRejects(
    () => verificarAssercao(entrada(fx)),
    WebAuthnError,
    "verificacao do usuario nao confirmada",
  );
});

Deno.test("verify: tipo de cerimonia errado e rejeitado", async () => {
  const fx = await criarFixture();
  const clientData = b64url(
    new TextEncoder().encode(
      JSON.stringify({
        type: "webauthn.create",
        challenge: CHALLENGE,
        origin: ORIGEM,
      }),
    ),
  );
  await assertRejects(
    () => verificarAssercao(entrada(fx, { clientDataJSON: clientData })),
    WebAuthnError,
  );
});

Deno.test("verify: authenticatorData truncado e rejeitado", async () => {
  const fx = await criarFixture();
  await assertRejects(
    () =>
      verificarAssercao(entrada(fx, { authenticatorData: b64url(new Uint8Array(10)) })),
    WebAuthnError,
    "authenticatorData truncado",
  );
});

Deno.test("verify: chave publica ilegivel e rejeitada", async () => {
  const fx = await criarFixture();
  await assertRejects(
    () => verificarAssercao(entrada(fx, { publicKey: b64url(new Uint8Array([1, 2, 3])) })),
    WebAuthnError,
    "chave publica nao e P-256/SPKI",
  );
});

Deno.test("verify: base64url decodifica corretamente", () => {
  const bytes = base64UrlToBytes("AAECAw");
  assertEquals([...bytes], [0, 1, 2, 3]);
  assert(bytes instanceof Uint8Array);
});
