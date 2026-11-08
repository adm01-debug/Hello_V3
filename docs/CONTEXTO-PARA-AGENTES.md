# Contexto para agentes de IA — leia ANTES de qualquer tarefa

Três produtores autônomos mantêm o estado REAL do projeto atualizado, para não refazer levantamento
(e não gastar token) a cada sessão. A saída fica na branch gerada **`contexto`** (nunca abra PR dela):

```bash
git fetch origin contexto && git show origin/contexto:docs/contexto/00-INDEX.md
```

| Preciso de… | Fonte (dona do fato) | Onde ler |
|---|---|---|
| Tabelas, colunas, RLS, funções, triggers, cron, storage — **como está em produção agora** | banco real | `docs/contexto/supabase/` |
| Rotas, páginas, módulos, hooks, edge functions, grafo, testes, convenções | código | `docs/contexto/codigo/INDEX.md` |
| O que pode/não pode: RLS por operação, estados, validações, fórmulas, prazos, lacunas | regras de negócio | `docs/contexto/regras/07-REGRAS-DE-NEGOCIO.md` |

Cada fato tem um dono: se duas fontes discordarem, vale o dono. Migration do repo é histórico,
não estado — tabela/coluna/política existe de verdade só no `banco real`.

## Como se mantém

- `.github/workflows/contexto.yml`: regenera as três fontes a cada push em `main` e a cada 10 min,
  e publica na branch `contexto` só quando algo mudou. O job do banco exige o secret
  `SUPABASE_DB_URL`; sem ele sai verde com aviso e `supabase/` fica como estava.
- `.github/workflows/inventario-estado-semanal.yml`: refaz `inventario/estado/` (rotas, edge
  functions e banco, com a lista `alertas`) toda segunda e entrega por PR. Leia antes de usar `grep`.
- Regra que só o negócio sabe: escreva em `docs/contexto/regras/manual/` na **main** — essa pasta
  nunca é sobrescrita pelo gerador e tem prioridade máxima.
- Nada em `docs/contexto/` (fora de `manual/`) é editado à mão. Para regerar localmente:

```bash
npm run contexto:ia        # docs/contexto/codigo/
npm run contexto:regras    # docs/contexto/regras/
npm run contexto:banco     # docs/contexto/supabase/ (precisa de SUPABASE_DB_URL)
npm run inventario:rotas   # inventario/estado/rotas.json
npm run inventario:edges   # inventario/estado/edges.json
npm run inventario:banco   # inventario/estado/banco.json (precisa de SUPABASE_ACCESS_TOKEN)
```

Detalhe de cada produtor: `scripts/ai-context/README.md`, `scripts/regras_negocio/README.md`,
`scripts/supabase_snapshot/README.md` e `inventario/estado/README.md`.
