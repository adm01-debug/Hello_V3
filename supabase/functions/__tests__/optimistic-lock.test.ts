// Guarda de contrato do trigger enforce_optimistic_lock.
//
// O trigger vive em SQL e e aplicado pelo banco, nao por codigo TypeScript, entao
// nao ha como exercita-lo sem uma conexao Postgres real. A versao anterior deste
// arquivo simulava o teste (runSql devolvia `{ sql }` e a assercao era
// `typeof result === 'object'`, sempre verdadeira) e nunca tocou o banco.
//
// Este arquivo agora trava o CONTRATO da funcao lendo a migration canonica:
// se alguem remover a guarda de divergencia, o RAISE, o incremento ou a
// tolerancia a falha da auditoria, o teste falha.
//
// Contrato (validado em producao):
//   - cliente envia a versao que LEU; enviar version+1 e tratado como conflito
//   - divergencia -> OPTIMISTIC_LOCK_CONFLICT + linha em optimistic_lock_conflicts
//   - sem divergencia -> NEW.version := OLD.version + 1
//   - falha na auditoria nunca bloqueia o fluxo principal

import { assert, assertEquals, assertStringIncludes } from 'https://deno.land/std@0.224.0/assert/mod.ts';

const MIGRATIONS_DIR = new URL('../../migrations/', import.meta.url);

/** Localiza a definicao mais recente da funcao (migrations aplicam em ordem de nome). */
async function carregarDefinicaoDoTrigger(): Promise<{ arquivo: string; sql: string }> {
  const candidatos: string[] = [];

  for await (const entrada of Deno.readDir(MIGRATIONS_DIR)) {
    if (!entrada.isFile || !entrada.name.endsWith('.sql')) continue;
    const sql = await Deno.readTextFile(new URL(entrada.name, MIGRATIONS_DIR));
    if (sql.includes('FUNCTION public.enforce_optimistic_lock')) {
      candidatos.push(entrada.name);
    }
  }

  candidatos.sort();
  const arquivo = candidatos[candidatos.length - 1];
  assert(arquivo, 'nenhuma migration define public.enforce_optimistic_lock');

  const sql = await Deno.readTextFile(new URL(arquivo, MIGRATIONS_DIR));
  return { arquivo, sql };
}

Deno.test('optimistic-lock: migration canonica do trigger existe', async () => {
  const { arquivo } = await carregarDefinicaoDoTrigger();
  assertStringIncludes(arquivo, '.sql');
});

Deno.test('optimistic-lock: detecta divergencia de versao e lanca OPTIMISTIC_LOCK_CONFLICT', async () => {
  const { sql } = await carregarDefinicaoDoTrigger();

  assertStringIncludes(sql, 'NEW.version <> OLD.version');
  assertStringIncludes(sql, 'NEW.version IS NOT NULL');
  assertStringIncludes(sql, "RAISE EXCEPTION 'OPTIMISTIC_LOCK_CONFLICT'");
});

Deno.test('optimistic-lock: incrementa a versao quando nao ha divergencia', async () => {
  const { sql } = await carregarDefinicaoDoTrigger();

  assertStringIncludes(sql, 'NEW.version := OLD.version + 1');
});

Deno.test('optimistic-lock: conflito e auditado em optimistic_lock_conflicts', async () => {
  const { sql } = await carregarDefinicaoDoTrigger();

  assertStringIncludes(sql, 'INSERT INTO public.optimistic_lock_conflicts');
  assertStringIncludes(sql, 'client_version');
  assertStringIncludes(sql, 'current_version');
});

Deno.test('optimistic-lock: falha na auditoria nao bloqueia o fluxo principal', async () => {
  const { sql } = await carregarDefinicaoDoTrigger();

  const blocosTolerantes = sql.match(/EXCEPTION WHEN OTHERS THEN\s+NULL;/g) ?? [];
  assert(
    blocosTolerantes.length >= 2,
    `esperava tolerancia a falha na auditoria (dblink + fallback local); achei ${blocosTolerantes.length} bloco(s)`,
  );
});

Deno.test('optimistic-lock: trigger aplicado em deals e contacts', async () => {
  for (const tabela of ['deals', 'contacts']) {
    let encontrado = false;
    for await (const entrada of Deno.readDir(MIGRATIONS_DIR)) {
      if (!entrada.isFile || !entrada.name.endsWith('.sql')) continue;
      const texto = await Deno.readTextFile(new URL(entrada.name, MIGRATIONS_DIR));
      if (
        texto.includes('enforce_optimistic_lock') &&
        new RegExp('ON public\\.' + tabela + '\\b', 'i').test(texto)
      ) {
        encontrado = true;
        break;
      }
    }
    assertEquals(encontrado, true, `trigger enforce_optimistic_lock nao encontrado em ${tabela}`);
  }
});