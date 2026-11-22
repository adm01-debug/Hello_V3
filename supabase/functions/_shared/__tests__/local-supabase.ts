// Deteccao de Supabase local para testes de edge que batem em HTTP.
//
// Antes, cada teste so perguntava "a porta 54321 responde?". Isso da falso
// positivo quando OUTRO projeto Supabase esta rodando na mesma maquina: o
// Kong responde, os testes deixam de ser ignorados, batem numa edge que nao
// existe naquele stack e falham por 404 -- foi o que aconteceu com
// check-dnc, check-calling-hours e check-queue-metrics. O verde/vermelho
// passava a depender de qual stack estava de pe, nao do codigo.
//
// Agora a checagem e por edge: se o Kong responde "Function not found"
// (404), aquela edge nao esta servida por este stack e o teste vira
// IGNORADO explicito em vez de falha falsa.

const BASE = "http://localhost:54321";

/** true se o stack local serve esta edge (e nao apenas se a porta responde). */
export async function edgeLocalDisponivel(slug: string): Promise<boolean> {
  try {
    const res = await fetch(`${BASE}/functions/v1/${slug}`, {
      method: "OPTIONS",
      signal: AbortSignal.timeout(2000),
    });
    if (res.status !== 404) return true;
    // Kong responde 404 com corpo "Function not found" para slug inexistente.
    const body = await res.text();
    return !/function not found/i.test(body);
  } catch {
    return false;
  }
}

/** Sufixo usado nos nomes de teste quando o stack local nao serve a edge. */
export const MOTIVO_IGNORADO = "edge nao servida pelo Supabase local";