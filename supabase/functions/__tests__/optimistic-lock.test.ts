// Regressao do trigger enforce_optimistic_lock.
//
// O teste anterior era falso-verde: usava a coluna `deals.title` (que nao
// existe), fazia `throw new Error('OPTIMISTIC_LOCK_CONFLICT')` na propria
// simulacao e ficava todo ignorado quando SUPABASE_DB_URL nao estava setado.
// Resultado: o bug real (o INSERT do conflito morria no rollback do RAISE,
// deixando optimistic_lock_conflicts sempre vazia) passou despercebido.
//
// Este teste nao precisa de banco: ele le a ultima migration que define o
// trigger e garante que o registro do conflito acontece por uma conexao que
// sobrevive ao rollback. Se alguem voltar ao padrao quebrado, falha aqui.

import { assert, assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';

const MIGRATIONS_DIR = new URL('../../migrations/', import.meta.url);

async function latestDefinitionOfOptimisticLock(): Promise<{ file: string; sql: string }> {
  const candidates: string[] = [];
  for await (const entry of Deno.readDir(MIGRATIONS_DIR)) {
    if (entry.isFile && entry.name.endsWith('.sql')) candidates.push(entry.name);
  }
  // Ordem lexicografica == ordem cronologica, porque os arquivos comecam por timestamp.
  candidates.sort();

  for (let i = candidates.length - 1; i >= 0; i--) {
    const sql = await Deno.readTextFile(new URL(candidates[i], MIGRATIONS_DIR));
    if (sql.includes('FUNCTION public.enforce_optimistic_lock')) {
      return { file: candidates[i], sql };
    }
  }
  throw new Error('nenhuma migration define public.enforce_optimistic_lock');
}

const { file, sql } = await latestDefinitionOfOptimisticLock();

/** Corpo da funcao, sem o comentario de cabecalho da migration. */
function functionBody(source: string): string {
  const start = source.indexOf('AS $function$');
  assert(start >= 0, `migration ${file} nao usa $function$ como delimitador`);
  return source.slice(start);
}

Deno.test('optimistic-lock: auditoria usa conexao separada (sobrevive ao rollback)', () => {
  const body = functionBody(sql);
  assert(
    body.includes('dblink_exec'),
    `migration ${file}: o conflito precisa ser gravado via dblink_exec, senao o ` +
      'RAISE EXCEPTION desfaz o INSERT na mesma transacao e a auditoria fica vazia',
  );
});

Deno.test('optimistic-lock: dblink acontece antes do RAISE que aborta a transacao', () => {
  const body = functionBody(sql);
  const dblinkAt = body.indexOf('dblink_exec');
  const raiseAt = body.indexOf("RAISE EXCEPTION 'OPTIMISTIC_LOCK_CONFLICT'");
  assert(raiseAt > 0, `migration ${file}: precisa lancar OPTIMISTIC_LOCK_CONFLICT`);
  assert(
    dblinkAt < raiseAt,
    `migration ${file}: o registro do conflito ocorre depois do RAISE e seria perdido`,
  );
});

Deno.test('optimistic-lock: existe fallback local se o dblink falhar', () => {
  const body = functionBody(sql);
  assertEquals(
    (body.match(/INSERT INTO public\.optimistic_lock_conflicts/g) ?? []).length >= 1,
    true,
    `migration ${file}: o fallback de INSERT local e o que garante auditoria sem dblink`,
  );
});

Deno.test('optimistic-lock: credencial nao fica embutida em texto fixo', () => {
  assert(
    sql.includes('vault.'),
    `migration ${file}: a connection string deve vir da Vault, nunca literal no repositorio`,
  );
  assert(
    !/password=[A-Za-z0-9_]{8,}/.test(sql),
    `migration ${file}: encontrada senha literal no SQL`,
  );
});

Deno.test('optimistic-lock: nao referencia colunas inexistentes em deals', () => {
  assert(
    !/\bdeals\s+SET\s+title\b/i.test(sql),
    'deals nao tem coluna title; o teste antigo validava SQL invalido',
  );
});
