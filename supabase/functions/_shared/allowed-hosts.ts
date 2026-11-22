/**
 * Guarda contra SSRF para chamadas de saída feitas por Edge Functions.
 *
 * Regra: nenhum `fetch` com URL derivada de dado do usuário ou de configuração
 * deve sair sem passar por `assertSafeOutboundUrl`.
 *
 * Bloqueios sempre ativos: esquemas não HTTP(S), loopback, link-local
 * (inclui 169.254.169.254 - metadata dos provedores de nuvem), multicast e
 * nomes internos resolvidos localmente.
 * Bloqueios opcionais: faixas privadas RFC1918/IPv6 ULA, liberáveis por
 * `allowPrivate` quando o alvo legítimo é um servidor interno (SIP/PBX).
 */

export class SsrfBlockedError extends Error {
  readonly code = "SSRF_BLOCKED";
  constructor(reason: string, readonly target: string) {
    super(`Destino não permitido (${reason}): ${target}`);
    this.name = "SsrfBlockedError";
  }
}

export interface OutboundUrlOptions {
  /** Aceita hosts em faixas privadas (RFC1918 / IPv6 ULA). Padrão: false. */
  allowPrivate?: boolean;
  /** Portas permitidas. Ausente = qualquer porta. */
  allowedPorts?: readonly number[];
  /** Sufixos de host permitidos. Ausente = qualquer host público. */
  allowedHostSuffixes?: readonly string[];
}

const LOOPBACK = new Set(["localhost", "localhost.localdomain", "ip6-localhost", "ip6-loopback"]);
const INTERNAL_SUFFIXES = [".local", ".localhost", ".internal", ".home.arpa"];

function isIpv4(host: string): boolean {
  const parts = host.split(".");
  if (parts.length !== 4) return false;
  return parts.every((p) => /^\d{1,3}$/.test(p) && Number(p) <= 255);
}

function ipv4ToInt(host: string): number {
  return host
    .split(".")
    .reduce((acc, part) => (acc << 8) + Number(part), 0) >>> 0;
}

const IPV4_BLOCKS: Array<{ cidr: string; base: number; bits: number; reason: string }> = [
  { cidr: "0.0.0.0/8", base: ipv4ToInt("0.0.0.0"), bits: 8, reason: "rede 0/8" },
  { cidr: "127.0.0.0/8", base: ipv4ToInt("127.0.0.1"), bits: 8, reason: "loopback" },
  { cidr: "169.254.0.0/16", base: ipv4ToInt("169.254.0.0"), bits: 16, reason: "link-local/metadata" },
  { cidr: "224.0.0.0/4", base: ipv4ToInt("224.0.0.0"), bits: 4, reason: "multicast" },
  { cidr: "240.0.0.0/4", base: ipv4ToInt("240.0.0.0"), bits: 4, reason: "reservado" },
];

const IPV4_PRIVATE_BLOCKS: Array<{ base: number; bits: number; reason: string }> = [
  { base: ipv4ToInt("10.0.0.0"), bits: 8, reason: "privado 10/8" },
  { base: ipv4ToInt("172.16.0.0"), bits: 12, reason: "privado 172.16/12" },
  { base: ipv4ToInt("192.168.0.0"), bits: 16, reason: "privado 192.168/16" },
  { base: ipv4ToInt("100.64.0.0"), bits: 10, reason: "CGNAT 100.64/10" },
];

function inBlock(value: number, base: number, bits: number): boolean {
  if (bits === 0) return true;
  const mask = (0xffffffff << (32 - bits)) >>> 0;
  return (value & mask) >>> 0 === (base & mask) >>> 0;
}

function normalizeHost(hostname: string): string {
  return hostname.trim().toLowerCase().replace(/^\[|\]$/g, "");
}

/**
 * Classifica um host e devolve o motivo do bloqueio, ou `null` se for público.
 * `allowPrivate` remove apenas o bloqueio de faixas privadas.
 */
export function classifyHost(rawHost: string, options: OutboundUrlOptions = {}): string | null {
  const host = normalizeHost(rawHost);
  if (!host) return "host vazio";
  if (LOOPBACK.has(host)) return "loopback";
  if (INTERNAL_SUFFIXES.some((suffix) => host.endsWith(suffix))) return "domínio interno";

  if (isIpv4(host)) {
    const value = ipv4ToInt(host);
    for (const block of IPV4_BLOCKS) {
      if (inBlock(value, block.base, block.bits)) return block.reason;
    }
    if (!options.allowPrivate) {
      for (const block of IPV4_PRIVATE_BLOCKS) {
        if (inBlock(value, block.base, block.bits)) return block.reason;
      }
    }
    return null;
  }

  if (host.includes(":")) {
    if (host === "::" || host === "::1") return "loopback";
    if (/^fe80:/.test(host)) return "link-local";
    if (/^f[cd][0-9a-f]{2}:/.test(host)) {
      return options.allowPrivate ? null : "IPv6 ULA (privado)";
    }
    if (/^ff[0-9a-f]{2}:/.test(host)) return "multicast";
    return null;
  }

  return null;
}

export function isHostAllowed(rawUrl: string, options: OutboundUrlOptions = {}): boolean {
  try {
    assertSafeOutboundUrl(rawUrl, options);
    return true;
  } catch {
    return false;
  }
}

export function assertSafeOutboundUrl(rawUrl: string, options: OutboundUrlOptions = {}): URL {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new SsrfBlockedError("URL inválida", rawUrl);
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new SsrfBlockedError(`esquema ${url.protocol}`, rawUrl);
  }
  if (url.username || url.password) {
    throw new SsrfBlockedError("credenciais na URL", rawUrl);
  }

  const reason = classifyHost(url.hostname, options);
  if (reason) throw new SsrfBlockedError(reason, rawUrl);

  if (options.allowedPorts && options.allowedPorts.length > 0) {
    const port = url.port ? Number(url.port) : url.protocol === "https:" ? 443 : 80;
    if (!options.allowedPorts.includes(port)) {
      throw new SsrfBlockedError(`porta ${port}`, rawUrl);
    }
  }

  if (options.allowedHostSuffixes && options.allowedHostSuffixes.length > 0) {
    const host = normalizeHost(url.hostname);
    const matches = options.allowedHostSuffixes.some(
      (suffix) => host === suffix || host.endsWith(`.${suffix}`),
    );
    if (!matches) throw new SsrfBlockedError("host fora da whitelist", rawUrl);
  }

  return url;
}