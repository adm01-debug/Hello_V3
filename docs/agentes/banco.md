# Banco de dados — referência para agentes

Ler quando for rodar SQL, criar/aplicar migration, montar Postgres local ou auditar o ledger.
Resumo das regras no `AGENTS.md`; aqui está o detalhe.

## Onde se trabalha

| Situação | Banco | Como |
|---|---|---|
| Diagnóstico | **produção, só leitura** | hoje **indisponível** por rede/MCP (abaixo) — sem acesso, o veredito é `NÃO VERIFICADO` |
| Migration nova | arquivo em `supabase/migrations/` | PR → merge → deploy do código → apply |
| Teste de comportamento de banco | **Postgres descartável** | nunca no banco oficial |
| Migration destrutiva, segredos, rotação de chaves | **só com o dono do projeto** | — |

1. **O front só fala com o banco por `VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY`**
   (`src/integrations/supabase/client.ts:5-12`) e **lança exceção** se faltarem — não há fallback nem desvio
   para banco local. O `.env` versionado no repo é o que faz o build do CI passar; o servidor de
   desenvolvimento aponta para **produção**, confira antes de testar tela.
2. **O `.env` está rastreado pelo Git** (`git ls-files .env` → `.env`; o `.gitignore` não tem entrada para
   ele). As três variáveis ali são publicáveis por design (`VITE_SUPABASE_PROJECT_ID`,
   `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_URL`) — é higiene ruim, não incidente. O incidente está
   em `scripts/` (abaixo).
3. **O ambiente não é reconstruível a partir do repositório.** `geo_settings`, `geo_restrictions` e
   `geo_access_logs` existem em `src/integrations/supabase/types.ts` e são usadas em produção
   (`src/hooks/useGeoBlocking.ts`, `supabase/functions/validate-geo/`), mas **nenhuma migration as cria**
   (`grep -riE 'CREATE TABLE[^;]*geo_' supabase/migrations/*.sql` → 0). Cinco migrations fazem
   `DROP POLICY IF EXISTS … ON public.geo_*`, que aborta contra relação inexistente. Logo `supabase db reset`
   a partir do Git **não** reproduz o banco.

## Banco OFICIAL

| O que | Valor |
|---|---|
| Projeto Supabase | **`cfmlmcdyjuotqobjapng`** — "Hello - V3" (Supabase **Cloud**) |
| Declarado em | `supabase/config.toml:1`; confirmado por `supabase/.temp/linked-project.json` |
| URL | `https://cfmlmcdyjuotqobjapng.supabase.co` |
| Dashboard | https://supabase.com/dashboard/project/cfmlmcdyjuotqobjapng |
| Organização | `ociubxjrvookukkejdfm` |
| MCP para SQL | **não existe nesta sessão** (ver abaixo) |

### Acesso ao banco — limite real, não opcional

- **Nenhum MCP carregado aponta para este projeto.** Os MCPs Supabase disponíveis respondem
  `pgxfvjmuubtbowutlide` e `doufsxqlfjyuvxuezpln` (`get_project_url`) — são **outros sistemas**. O MCP
  `SUPABASE - ZAPP WEB V2 - MCP` é de outro repositório. Conferir sempre qual MCP carregou antes de rodar SQL.
- **O host é bloqueado pela política de rede do ambiente de nuvem:**
  `curl https://cfmlmcdyjuotqobjapng.supabase.co/rest/v1/` devolve `000` (mesmo resultado para
  `dyibdjwuoibwwpidgsxu`; `api.github.com` devolve `200` no mesmo ambiente).
- **Consequência:** tudo sobre o runtime do banco — tabelas povoadas vs. vazias, RLS efetivamente ativa,
  execução e falha de jobs `pg_cron`, migrations aplicadas vs. versionadas, uso real de qualquer feature —
  é **`NÃO VERIFICADO`**. Não escreva conclusão sobre estado de banco sem acesso; diga que falta acesso.

### Bancos que NÃO são deste projeto (não escrever neles)

- **`dyibdjwuoibwwpidgsxu`** — projeto Supabase anterior (migração "Banco Lovable → Supabase Hello - V3").
  **Não é o banco atual.** Os **dois únicos** endereços de edge function em todas as 207 migrations apontam
  para ele: `supabase/migrations/20260723114001_09502153-d05c-40eb-be5f-f84f78526fb3.sql:13`
  (`/functions/v1/auto-scorecard`) e `:50` (`/functions/v1/data-lake-flush`). A mesma migration embute o JWT
  `anon` de produção em `:14` e `:53`. Decidir entre reapontar e remover é do dono.
- `pgxfvjmuubtbowutlide` e `doufsxqlfjyuvxuezpln` — bancos de **outros sistemas**, alcançáveis pelos MCPs
  desta sessão. Nunca aplicar migration neles a partir deste repo.

### 🔴 Chave `service_role` de produção versionada

Sete scripts contêm um JWT com `role=service_role` e `ref=cfmlmcdyjuotqobjapng` (decodificado do payload,
verificado nesta sessão): `scripts/check-data.mjs`, `scripts/test-api-direct.mjs`,
`scripts/test-auth-flow.mjs`, `scripts/test-authenticated-queries.mjs`, `scripts/test-call-volume-rpc.mjs`,
`scripts/test-dashboard-rpcs.mjs`, `scripts/test-validate-ip.mjs`. Oito scripts usam
`rejectUnauthorized: false`.

- Essa chave **ignora toda a RLS**. Está no histórico do Git: apagar o arquivo **não** revoga a chave —
  só rotação no painel do Supabase resolve, e isso é decisão do dono.
- Nenhum dos 17 scripts soltos em `scripts/` é chamado por `package.json`; o CI chama apenas
  `codemod-safe-number.mjs` e `guard-edge-numeric.mjs`. São órfãos: risco sem contrapartida de utilidade.
- **Não execute esses scripts e não copie o padrão.** Chave de serviço vive em secret de edge function.

## Estrutura medida (a partir do repositório, 2026-11-08)

| O que | Quanto | Fonte |
|---|---|---|
| Migrations | **207** arquivos `.sql` | `ls supabase/migrations/*.sql \| wc -l` |
| Tabelas em `types.ts` | **159** (+ 1 view, 54 functions) | `src/integrations/supabase/types.ts` |
| Tabelas distintas com `ENABLE ROW LEVEL SECURITY` | **160** | grep normalizado nas migrations |
| `CREATE POLICY` | **714** | grep nas migrations |
| Jobs `cron.schedule` | **7** (`daily-cleanup-old-logs`, `data-lake-flush-daily`, `quarterly-reset-index-stats`, `weekly-bloat-monitor`, `weekly-idle-index-monitor`, `weekly-pgss-reset`, `weekly-vacuum-analyze-hot-tables`) | grep nas migrations |

Contagem estática de RLS é **limite inferior por construção**: existe migration que cria policy em runtime
via `format('CREATE POLICY %I …')` (`supabase/migrations/20260711192700_…`).

## Regras de migration

1. **Ordem obrigatória: arquivo → PR → merge em `main` → deploy do código → apply.** Nunca DDL a partir de
   branch aberta. `REVOKE`, `DROP`, rename ou mudança de contrato de função usada pelo front/edges: **nunca**
   antes do deploy do código correspondente.
2. **Versão sem colisão:** o nome segue o padrão do CLI do Supabase (`AAAAMMDDHHMMSS_<slug>.sql`). Antes de
   criar arquivo, no mesmo turno: `ls supabase/migrations | tail`, e busca de PRs abertas tocando
   `supabase/migrations/`. Sessões paralelas (e o Lovable) commitam no mesmo repo — re-sync antes de editar.
3. **O ledger ao vivo é a verdade.** Nunca renomeie um arquivo para outra versão "para resolver" colisão: se
   o slot já foi aplicado, o arquivo fica com a versão que tem lá. Rename = delete + create em commits
   separados. O repositório **não** versiona nenhuma consulta ao ledger
   (`grep -rl supabase_migrations supabase/migrations` → 0) — confirme o estado real por
   `pg_get_functiondef`/`pg_indexes`/`pg_constraint` quando houver acesso.
4. **Toda tabela nova nasce com RLS** (`ALTER TABLE … ENABLE ROW LEVEL SECURITY` + policies por papel no
   mesmo arquivo) e com entrada em `src/integrations/supabase/types.ts` regenerada. Tabela sem migration é o
   defeito R5 deste repo — não aumente a conta.
5. **Nada de `CREATE INDEX CONCURRENTLY`** quando o DDL for aplicado por gateway que envolve em transação;
   use `CREATE INDEX` simples.
6. **Função `SECURITY DEFINER` nasce com `REVOKE ALL … FROM PUBLIC, anon`** e `GRANT EXECUTE` apenas ao papel
   que precisa — foi o trabalho do item A2 de `docs/audits/pendencias-2026-07.md`; regressão aqui reabre o
   lint 0028/0029.
7. **Não embuta URL de projeto nem JWT em migration.** É o defeito do `20260723114001_…` (cron apontando para
   outro projeto, com `anon` em texto claro). Use `current_setting`/cofre, ou deixe o agendamento fora do SQL.
8. Ao mexer em policy de tabela já existente, leia primeiro as policies vigentes nas migrations
   (`grep -rn "ON public.<tabela>" supabase/migrations/`): há tabelas com várias rodadas de reescrita, e a
   última a rodar é a que vale.

## Testes de RLS — não confie nos que existem

`src/__tests__/rls/` (7 arquivos) **não toca banco nem mock de PostgREST**: declara uma matriz literal e
asserta que a matriz contém os próprios valores (`contacts.test.ts:11-36`, `rls-policies.test.ts:28-56`).
Não podem detectar regressão de RLS. Teste de RLS que vale lê a migration ou roda contra Postgres
descartável — ao mexer em RLS, não aceite essas suítes como evidência.
