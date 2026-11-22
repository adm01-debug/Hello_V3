/**
 * Verificacao de assercao WebAuthn (ES256) no servidor.
 *
 * Antes desta correcao a edge apenas conferia se o `credential_id` existia
 * na tabela e emitia um magic link. Nao verificava assinatura, desafio nem
 * origem — ou seja, quem conhecesse um `credential_id` valido entrava na
 * conta correspondente sem possuir a passkey. Aqui a assercao precisa
 * fechar criptograficamente contra a chave publica registrada.
 */

export class WebAuthnError extends Error {
  constructor(message: string, readonly code: string) {
    super(message);
    this.name = "WebAuthnError";
  }
}

export function base64UrlToBytes(value: string): Uint8Array<ArrayBuffer> {
  const b64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
  const bin = atob(padded);
  const out = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export interface AssertionInput {
  clientDataJSON: string;
  authenticatorData: string;
  signature: string;
  /** Desafio esperado, em base64url, exatamente como foi enviado ao browser. */
  challengeEsperado: string;
  /** Chave publica registrada (SPKI DER em base64url). */
  publicKey: string;
  /** Origens aceitas (ex.: https://hello-v3.vercel.app). */
  origensPermitidas: string[];
}

export interface AssertionResultado {
  signCount: number;
  origem: string;
}

/**
 * Valida a assercao e lanca `WebAuthnError` em qualquer desvio.
 * Retorna o signCount para detectar clonagem de autenticador.
 */
export async function verificarAssercao(
  input: AssertionInput,
): Promise<AssertionResultado> {
  const clientDataBytes = base64UrlToBytes(input.clientDataJSON);
  let clientData: { type?: string; challenge?: string; origin?: string };
  try {
    clientData = JSON.parse(new TextDecoder().decode(clientDataBytes));
  } catch {
    throw new WebAuthnError("clientDataJSON invalido", "client_data_malformado");
  }

  if (clientData.type !== "webauthn.get") {
    throw new WebAuthnError(
      `tipo de cerimonia inesperado: ${clientData.type}`,
      "tipo_invalido",
    );
  }

  const challenge = clientData.challenge ?? "";
  if (!constantTimeEqual(challenge, input.challengeEsperado)) {
    throw new WebAuthnError("desafio nao corresponde", "challenge_invalido");
  }

  const origem = clientData.origin ?? "";
  if (!input.origensPermitidas.includes(origem)) {
    throw new WebAuthnError(`origem nao permitida: ${origem}`, "origem_invalida");
  }

  const authData = base64UrlToBytes(input.authenticatorData);
  if (authData.length < 37) {
    throw new WebAuthnError("authenticatorData truncado", "auth_data_invalido");
  }

  // rpIdHash (32 bytes) deve bater com o RP configurado (o host).
  const rpIdHash = authData.slice(0, 32);
  const hostEsperado = hostDaOrigem(origem);
  const hashEsperado = new Uint8Array(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(hostEsperado)),
  );
  if (!bufEqual(rpIdHash, hashEsperado)) {
    throw new WebAuthnError("rpIdHash nao corresponde", "rp_id_invalido");
  }

  const flags = authData[32];
  const userPresent = (flags & 0x01) !== 0;
  const userVerified = (flags & 0x04) !== 0;
  if (!userPresent) {
    throw new WebAuthnError("presenca do usuario nao confirmada", "up_ausente");
  }
  if (!userVerified) {
    throw new WebAuthnError(
      "verificacao do usuario nao confirmada",
      "uv_ausente",
    );
  }

  const view = new DataView(authData.buffer, authData.byteOffset, authData.byteLength);
  const signCount = view.getUint32(33, false);

  // Assinatura cobre authenticatorData || SHA256(clientDataJSON).
  const clientDataHash = new Uint8Array(
    await crypto.subtle.digest("SHA-256", clientDataBytes),
  );
  const assinado = new Uint8Array(authData.length + clientDataHash.length);
  assinado.set(authData, 0);
  assinado.set(clientDataHash, authData.length);

  const chave = await importarChavePublica(input.publicKey);
  const valida = await crypto.subtle.verify(
    { name: "ECDSA", hash: "SHA-256" },
    chave,
    base64UrlToBytes(input.signature),
    assinado,
  );
  if (!valida) {
    throw new WebAuthnError("assinatura invalida", "assinatura_invalida");
  }

  return { signCount, origem };
}

async function importarChavePublica(publicKey: string): Promise<CryptoKey> {
  let spki: Uint8Array<ArrayBuffer>;
  try {
    spki = base64UrlToBytes(publicKey);
  } catch {
    throw new WebAuthnError("chave publica ilegivel", "public_key_invalida");
  }
  if (spki.length === 0) {
    throw new WebAuthnError("chave publica vazia", "public_key_invalida");
  }
  try {
    return await crypto.subtle.importKey(
      "spki",
      spki,
      { name: "ECDSA", namedCurve: "P-256" },
      false,
      ["verify"],
    );
  } catch {
    throw new WebAuthnError("chave publica nao e P-256/SPKI", "public_key_invalida");
  }
}

function hostDaOrigem(origem: string): string {
  try {
    return new URL(origem).hostname;
  } catch {
    throw new WebAuthnError(`origem malformada: ${origem}`, "origem_invalida");
  }
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function bufEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}
