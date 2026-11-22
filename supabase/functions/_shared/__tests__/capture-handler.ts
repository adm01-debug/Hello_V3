// Captura o handler de uma edge escrita com `Deno.serve(fn)` sem alterar
// o codigo de producao.
//
// Muitas edges registram o handler direto no modulo, entao importa-las
// subiria um servidor de verdade. Este helper substitui `Deno.serve` por
// um espião, importa o modulo e devolve o handler capturado para o teste
// chamar como funcao. Deve ser usado UMA vez por modulo, porque o cache de
// imports faz a segunda importacao reutilizar o handler ja capturado.

type Handler = (req: Request) => Response | Promise<Response>;

let capturado: Handler | null = null;

const serveOriginal = Deno.serve as unknown as (...args: unknown[]) => unknown;

/** Carrega o modulo e devolve o handler registrado via `Deno.serve`. */
export async function capturarHandler(
  importar: () => Promise<unknown>,
): Promise<Handler> {
  if (capturado) return capturado;

  const stub = (primeiro: unknown, segundo?: unknown) => {
    // Aceita tanto `Deno.serve(fn)` quanto `Deno.serve(opcoes, fn)`.
    const fn = typeof primeiro === 'function' ? primeiro : segundo;
    if (typeof fn !== 'function') {
      throw new Error('Deno.serve chamado sem handler de funcao');
    }
    capturado = fn as Handler;
    // Fecha qualquer porta/servidor que a edge tenha aberto.
    return { shutdown: () => Promise.resolve(), finished: Promise.resolve() };
  };

  (Deno as unknown as { serve: unknown }).serve = stub;
  try {
    await importar();
  } finally {
    (Deno as unknown as { serve: unknown }).serve = serveOriginal;
  }

  if (!capturado) throw new Error('nenhum handler registrado via Deno.serve');
  return capturado;
}
