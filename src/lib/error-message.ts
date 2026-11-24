/**
 * Mensagem legivel de um erro desconhecido.
 *
 * Erros do PostgREST e do supabase-js NAO sao instancias de Error: sao objetos
 * com { message, code, details, hint }. `error instanceof Error ? message : String(error)`
 * imprimia "[object Object]" na tela nesses casos.
 */
export function mensagemDeErro(erro: unknown): string {
  if (typeof erro === 'string') return erro;
  if (erro && typeof erro === 'object' && 'message' in erro) {
    const message = (erro as { message?: unknown }).message;
    if (typeof message === 'string' && message.length > 0) return message;
  }
  if (erro instanceof Error) return erro.message;
  return String(erro);
}
