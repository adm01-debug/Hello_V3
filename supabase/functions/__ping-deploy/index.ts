// Sonda de deploy: se esta resposta chega, o caminho de publicacao de edge
// function do repositorio funciona. Removida logo apos a medicao.
Deno.serve(() => new Response(JSON.stringify({ ok: true, versao: 'sonda-2026-11-28' }), {
  headers: { 'Content-Type': 'application/json' },
}));
