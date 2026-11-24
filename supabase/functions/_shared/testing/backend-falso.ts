// Harness de teste das edges: backend Supabase falso + injeção de falha no terceiro.
// Não é arquivo de teste (não declara Deno.test) — é utilitário compartilhado.
//
// Uso: comBackendFalso({ tabelas, rpc, falhas }, async (registro) => { ... })

export type Registro = { metodo: string; url: string; corpo: string | null };

export type Falha = {
  /** Trecho da URL que dispara a falha (ex.: "api.resend.com"). */
  contem: string;
  /** "timeout" derruba o fetch; "corpo-invalido" devolve 200 sem JSON; ausente = resposta normal. */
  tipo?: "timeout" | "abort" | "corpo-invalido";
  status?: number;
  body?: unknown;
  headers?: Record<string, string>;
};

export type Cenario = {
  tabelas?: Record<string, { status?: number; body?: unknown }>;
  /** Resposta de INSERT/PATCH por tabela (ex.: a linha criada com o id). */
  insercoes?: Record<string, unknown>;
  rpc?: Record<string, { status?: number; body?: unknown }>;
  usuario?: { id: string; email?: string; user_metadata?: Record<string, unknown> };
  /** Caminhos chamados pela edge no terceiro. O primeiro que casa com a URL responde. */
  falhas?: Falha[];
};

export function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

function urlDe(input: unknown): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.href;
  if (input instanceof Request) return input.url;
  return String(input);
}

/**
 * Troca `globalThis.fetch` por um roteador de teste, roda `fn` e restaura o fetch
 * original no `finally` (sem isso os testes seguintes herdam o mock).
 */
export async function comBackendFalso<T>(
  cenario: Cenario,
  fn: (registro: Registro[]) => Promise<T>,
): Promise<T> {
  const original = globalThis.fetch;
  const registro: Registro[] = [];
  const usuario = cenario.usuario ?? {
    id: "u-teste-1",
    email: "dono@exemplo.com",
    user_metadata: { full_name: "Dono Teste" },
  };

  const router = async (input: unknown, init?: RequestInit): Promise<Response> => {
    const url = urlDe(input);
    const metodo = (init?.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase();
    registro.push({
      metodo,
      url,
      corpo: typeof init?.body === "string" ? init.body : null,
    });

    const falha = cenario.falhas?.find((f) => url.includes(f.contem));
    if (falha) {
      if (falha.tipo === "timeout") {
        throw new DOMException("The operation was aborted due to timeout", "TimeoutError");
      }
      if (falha.tipo === "abort") {
        throw new DOMException("The user aborted a request.", "AbortError");
      }
      if (falha.tipo === "corpo-invalido") {
        return new Response("isto nao e json", {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      return json(falha.body ?? { error: "falha simulada" }, falha.status ?? 500, falha.headers ?? {});
    }

    if (/\/auth\/v1\/user/.test(url)) return json(usuario);

    const rpc = /\/rest\/v1\/rpc\/([\w.-]+)/.exec(url);
    if (rpc) {
      const r = cenario.rpc?.[rpc[1]] ?? { body: { allowed: true, remaining: 9 } };
      return json(r.body ?? {}, r.status ?? 200);
    }

    const tabela = /\/rest\/v1\/([\w.-]+)/.exec(url);
    if (tabela) {
      const inserida = cenario.insercoes?.[tabela[1]];
      if (inserida !== undefined && metodo !== "GET") return json(inserida, 201);
      const r = cenario.tabelas?.[tabela[1]];
      if (!r) return json([], 200);
      return json(r.body ?? [], r.status ?? 200);
    }

    return json({}, 200);
  };

  globalThis.fetch = router as unknown as typeof fetch;
  try {
    return await fn(registro);
  } finally {
    globalThis.fetch = original;
  }
}

/** Escritas de negócio (tabelas), sem contar as RPCs de controle como o rate limit. */
export function escritasDeNegocio(registro: Registro[]): Registro[] {
  return registro.filter(
    (r) =>
      ["POST", "PATCH", "PUT", "DELETE"].includes(r.metodo) &&
      /\/rest\/v1\//.test(r.url) &&
      !/\/rest\/v1\/rpc\//.test(r.url),
  );
}

/** Chamadas feitas ao terceiro cuja URL contém o trecho informado. */
export function chamadasDe(registro: Registro[], contem: string): Registro[] {
  return registro.filter((r) => r.url.includes(contem));
}