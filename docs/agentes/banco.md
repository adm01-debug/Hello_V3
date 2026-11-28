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
  **Não é o banco atual.** Os endereços de edge function que apontavam para ele (migration
  `20260723114001_…:13/:50`) foram reapontados para `cfmlmcdyjuotqobjapng` — ver migration
  `20261114090557_03f46714-a672-4d6b-8aff-1092a99dfdd8` (aguarda aplicação).
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

## Migrations conhecidas como não reaplicáveis (etapa 131)

Um banco novo a partir do repositório exige que a sequência rode do zero. As migrations abaixo não
rodam sozinhas num banco vazio e **não podem ser editadas** — já foram aplicadas, e o ledger guarda a
versão, não o conteúdo:

- `20260404151943_4d4acd99-….sql:87-90` — quatro `ALTER POLICY` em `geo_*`. Na sequência atual os alvos
  existem (`20260315143858` cria três delas, `20260315143859:8` cria a quarta e `20260404153313:22` a
  remove depois), então a ordem de timestamp resolve; a guarda idempotente é
  `20261127270000_geo_policies_idempotente.sql`, que passa também em banco sem as tabelas. A lista
  completa e o harness de banco descartável são as etapas 134 e 053.
- `ALTER POLICY` **não** tem `IF EXISTS`; `DROP POLICY`, `CREATE TABLE` e `CREATE INDEX` têm — usar
  sempre, e nunca escrever DDL contra o estado de produção como se ele fosse a sequência versionada.

## Exclusão de conta (LGPD) — apurado em 2026-11-24

Etapa 132 do plano. Desfecho **(a)**: a correção de FK de
`supabase/migrations/20261123010000_fix_user_delete_cascade.sql` **está aplicada** no projeto oficial
(`cfmlmcdyjuotqobjapng`). O que sobra do A-092 é só `src/integrations/supabase/types.ts` — etapa 136.

| Verificação | Resultado |
|---|---|
| `to_regclass` das 6 tabelas do A-092 (`call_records`, `entity_versions`, `migration_rollbacks`, `queue_items`, `saved_filters`, `schema_migrations`) | todas existem em `public` |
| `SELECT version FROM supabase_migrations.schema_migrations WHERE version='20261123010000'` | `20261123010000` presente no ledger |
| FK de `saved_filters` para `auth.users` | `saved_filters_user_id_fkey` com `ON DELETE CASCADE` |
| FK de `entity_versions` para `auth.users` | `entity_versions_changed_by_fkey` com `ON DELETE SET NULL` |
| `auth.users` | 10 usuários (baseline antes e depois do teste) |

Teste funcional do caminho de exclusão — usuário de teste `4a56062b-1fdb-42e2-bce4-e158d75b3bb5` com
1 `user_profiles`, 1 `saved_filters` e 1 `entity_versions.changed_by` apontando para ele:

1. `DELETE FROM auth.users WHERE id = …` → **sem erro** (não devolve 500);
2. depois: `auth.users` 0, `user_profiles` **0** e `saved_filters` **0** (CASCADE), e a linha de
   `entity_versions` **sobreviveu** com `changed_by IS NULL` (SET NULL — a trilha de auditoria é
   preservada, que é o comportamento desejado);
3. linhas de teste apagadas e baseline restaurado (10 usuários, 5 perfis, 0 versões de teste).

Consultas feitas pela Management API (`POST /v1/projects/<ref>/database/query`), que roda sem RLS. Esta
apuração libera as etapas 133 e 136.

Reconferido em 2026-11-26 com gate que fica no repositório, para não depender de consulta avulsa:
`supabase/tests/probe_132_lgpd_entity_versions_rls_test.sql` (somente leitura) roda no
`migrations.yml modo=verificar`. Ele reconfirma o desfecho **(a)**, confirma que as 7 FKs do arquivo
estão `SET NULL` e mede o que a apuração anterior não mediu: **nenhuma FK apontando para `auth.users`
em schema nenhum do banco bloqueia o DELETE** (`NO ACTION`/`RESTRICT`: 0; 22 `CASCADE` + 18 `SET NULL`).
Como a sonda roda em todo `modo=verificar`, essa condição vira regressão detectável no CI.

## Testes de RLS — não confie nos que existem

`src/__tests__/rls/` (7 arquivos) **não toca banco nem mock de PostgREST**: declara uma matriz literal e
asserta que a matriz contém os próprios valores (`contacts.test.ts:11-36`, `rls-policies.test.ts:28-56`).
Não podem detectar regressão de RLS. Teste de RLS que vale lê a migration ou roda contra Postgres
descartável — ao mexer em RLS, não aceite essas suítes como evidência.

## Placar semanal da gamificação — contrato medido em 2026-11-27

O placar de `agent_weekly_stats` é escrito por **uma** RPC, `public.increment_weekly_stats(...)`
(migration `20261127250000` + correção `20261127260000`), nunca por `insert`/`update` no cliente:
duas gravações simultâneas da mesma semana colidiam no `UNIQUE(agent_id, week_start)`, o `23505` era
descartado e os pontos da semana se perdiam.

| Situação | Resultado |
|---|---|
| Primeira gravação da semana | 1 linha; médias ausentes viram **0** (mesmo contrato do DEFAULT) |
| Gravação seguinte | mesmos contadores **somam** na linha existente (1 instrução, sem leitura antes) |
| Média enviada | **substitui** o valor da linha |
| Média ausente (`null`) | **preserva** o valor da linha — no ramo de update o que decide é o parâmetro, não o valor inserido |
| Incremento negativo | erro `increment_weekly_stats: incremento negativo nao e aceito` |
| `anon` | sem `EXECUTE` (só `authenticated` e `service_role`) |

Gate: `supabase/tests/increment_weekly_stats_rpc_rls_test.sql` (6 passos) pelo `migrations.yml modo=verificar`.
**Aberto:** as policies da tabela seguem `FOR INSERT/UPDATE USING (true)` — um autenticado ainda escreve
a estatística de qualquer agente por fora da RPC.


## Ponteiros polimórficos — contrato medido em 2026-11-27

Etapa 129 do plano (achado A-127). Três colunas apontam para tabelas diferentes conforme a coluna de tipo
ao lado, e essas colunas de tipo eram `text` sem `CHECK` (A-125). O contrato vivia só no código que
escreve; agora está no banco (`COMMENT ON COLUMN`, migration `20261127220000_polymorphic_pointer_comments.sql`)
e aqui. Os conjuntos abaixo são os **valores reais em produção**, levantados pela sonda
`supabase/tests/probe_129_polymorphic_rls_test.sql` (run 45865868536) — não o que o TypeScript promete.

### `audit_logs.resource_type` → `audit_logs.resource_id`

`resource_id` é `text` e **não tem FK**: o tipo escolhe a tabela. Quem grava é
`public.log_audit_event(p_action, p_resource_type, p_resource_id, p_details)`, sem validar nada.

| `resource_type` | Linhas | Destino de `resource_id` |
|---|---:|---|
| `contacts` | 107 | `public.contacts.id` |
| `SYSTEM` | 100 | sem tabela — evento de sistema |
| `user_profiles` | 78 | `public.user_profiles.id` |
| `agents` | 20 | `public.agents.id` |
| `contact` | 8 | `public.contacts.id` — **mesma tabela**, grafia antiga |
| `user_roles` | 6 | linha de `public.user_roles` |
| `consent_record` | 3 | `public.consent_records.id` (o tipo é singular, a tabela é plural) |
| `webhook` | 3 | sem tabela (`webhook_secrets` é config, não o alvo) |
| `edge_function` | 3 | sem tabela — nome da função |
| `call_recordings` | 3 | `public.call_recordings.id` |
| `api_endpoint` | 2 | sem tabela — rota |
| `voip_trunks` | 2 | `public.voip_trunks.id` |
| `system` | 2 | sem tabela — **mesma ideia de `SYSTEM`**, grafia minúscula |
| `call_transcription` | 1 | `public.call_transcriptions.id` (singular × plural) |
| `call_analysis` | 1 | `public.call_analyses.id` (singular × plural) |

Duas inconsistências reais aparecem aí e **não foram normalizadas** (a normalização é a etapa 139, que só
então pode pôr o `CHECK`): `contacts` × `contact` e `SYSTEM` × `system`. Qualquer consulta que cruze
`resource_id` com a tabela de destino precisa tolerar as duas grafias.

**Não ponha `CHECK` em `audit_logs.resource_type` nem em `notifications.source_type`** (etapa 139). O valor é
texto livre em toda a cadeia: `logAuditEvent({ resourceType: string })` (`src/lib/audit/index.ts:23`) e o RPC
`log_audit_event` gravam sem validar. Já existem valores usados pelo código que **nunca** apareceram no banco
porque a tela correspondente não rodou ainda: `extension_bulk` (`src/hooks/useExtensionAudit.ts:31`) e
`system_maintenance` (`src/components/settings/SystemMaintenancePanel.tsx:32`). Um `CHECK` derivado do que foi
observado faria esses dois caminhos falharem, e o erro é só registrado no console (`src/lib/audit/index.ts:38`)
— a trilha de auditoria desapareceria em silêncio. Se algum dia houver restrição aqui, ela tem de ser
alimentada por uma tabela de tipos (`audit_resource_types`), não por um `IN (...)` fixo.

### `notifications.source_type` → `notifications.source_id`

Aqui o tipo **não é nome de tabela**: é o marcador do produtor da notificação.

| `source_type` | Linhas | Significado de `source_id` |
|---|---:|---|
| `cron_health` | 16 | nome do job monitorado |
| `optimistic_lock_hotspot` | 3 | tabela com conflito de versão |
| `idle_index_hotspot` | 1 | nome do índice sem uso |

### `optimistic_lock_conflicts.table_name` → `optimistic_lock_conflicts.record_id`

| `table_name` | Linhas | `record_id` |
|---|---:|---|
| `deals` | 4 | PK da linha de `public.deals` |
| `contacts` | 3 | PK da linha de `public.contacts` |

O gate `supabase/tests/polymorphic_pointer_comments_rls_test.sql` falha se algum desses comentários sumir e
também se alguém criar `CHECK` nessas colunas antes da etapa 139.




## Feriado e horário de discagem — contrato medido em 2026-11-27

`public.check_calling_hours(p_region_code text default 'BR')` decide se a discagem é permitida agora
(`SECURITY DEFINER`, `search_path = public`). O comentário da própria função carrega o contrato; o
resumo:

| Situação | Resultado |
|---|---|
| Sem `calling_hours_config` ativa para a região nem `BR` | `can_call: false` — **fail-closed** (etapa 035) |
| `holidays.date` = hoje, com `is_national` ou `region_code` da região | bloqueia se `holidays_allowed = false` |
| `holidays.recurring = true` com **mesmo mês e dia** de qualquer ano | bloqueia igual (etapa 122) |
| `holidays.recurring = false` de outro ano | **não** bloqueia — a data exata manda |
| Feriado móvel (Carnaval, Páscoa, Corpus Christi) | **não é calculado** — precisa ser cadastrado por ano com `recurring = false` |

Gate: `supabase/tests/recurring_holidays_rls_test.sql` (prova os 4 primeiros casos e que o contrato está
escrito na função e na coluna). Não confunda com `calling_hours_fail_closed_rls_test.sql`, que prova o
fail-closed da 035.


## Fila do CRM — gatilho medido em 2026-11-26 (etapa 083)

`public.crm_sync_queue` é a fila que a tela de integração do Bitrix alimenta (produtores: `useBitrix.ts`
createLead e registerCall). A **única** processadora é a edge `sync-crm-queue`; até a etapa 083 nada a
agendava, então o item ficava em `pending` para sempre.

Contrato do job (migration `20261128123000_crm_sync_queue_cron_guard.sql`, ajuste da
`20261128110000_crm_sync_queue_cron.sql`):

| Peça | Valor |
|---|---|
| Job | `cron.schedule('crm-sync-queue', '*/5 * * * *', ...)` |
| Condição | só faz `net.http_post` se existe linha com `status in ('pending','failed')` e `next_retry_at <= now()` e `attempts < 5` — mesma condição que a edge aplica |
| URL | `public.edge_function_url('sync-crm-queue')` (host vem do Vault; nunca literal) |
| Autorização | `Authorization: Bearer <crm_sync_cron_token do Vault>`; a edge confere com `public.token_cron_valido(text,text)` usando a service_role dela |
| Verificação | `verify_jwt = false` em `supabase/config.toml` — o bearer do cron é opaco, o gateway recusaria antes da edge |
| Rotação | `vault.update_secret(...)`; **não** existe cópia em env var da edge, então não há par fora de sincronia |

Por que o token vive só no Vault: os 5 crons de 2026-11-22 guardam o mesmo segredo no Vault **e** numa env
var da edge; um par desalinhado derruba o job em 401 silencioso (foi assim que a purga de
`optimistic_lock_conflicts` ficou anos parada — `supabase/config.toml:1-8`). Aqui a edge pergunta ao banco,
então rotacionar não exige redeploy.

Gates: `supabase/tests/crm_sync_queue_cron_rls_test.sql` (segredo + função + grants + job + RLS da fila) e
`supabase/tests/cron_credentials_rls_test.sql`, que passa a listar `job: crm-sync-queue jwt=f host=f`.

Estado em produção em 2026-11-26: os dois jobs estão aplicados e o tick roda (`cron.job_run_details`,
`succeeded`), mas a versão da edge em produção ainda é a anterior (exige sessão de usuário) — o deploy
depende de `SUPABASE_ACCESS_TOKEN` válido, que estava inválido ("Invalid access token"). Até esse deploy,
item vencido na fila resulta em 401, não em sincronização.
## Motor das cadências — contrato medido em 2026-11-27 (etapa 085)

Antes da migration `20261128100000_cadence_tick_motor.sql`, nenhum objeto do banco nem edge function
tocava `cadence_enrollments`: a inscrição nascia em `/cadences` com `next_action_at = now()` e ficava
em "etapa 1" para sempre. O motor é **SQL puro**, não edge function.

| Objeto | Papel |
|---|---|
| `public.cadence_tick(p_limit integer default 50) → jsonb` | Executa a fila. `SECURITY DEFINER`, `search_path = public`, lê as inscrições `status = 'active' and next_action_at <= now()` com `order by next_action_at, id ... for update of e skip locked` |
| `public.cadence_step_runs` | Histórico por etapa: `status in ('done','skipped','failed')` + `detail`. Só o motor escreve |
| `cron.job` → `cadence-tick` | `*/15 * * * *` chamando `select public.cadence_tick(200)` |

Fluxo por inscrição: acha a próxima etapa (`step_order > current_step`); se não houver, conclui
(`status = 'completed'`, `completed_at = now()`, `next_action_at = null`); resolve o destinatário em
`user_profiles up join agents a on a.id = up.agent_id where a.name = cadence_enrollments.agent_name`.

| Situação | Efeito medido no gate |
|---|---|
| Destinatário encontrado | Notificação (`category = 'cadence'`, `source_type = 'cadence'`, `action_url = '/cadences'`) + `current_step` avança + `next_action_at = now() + delay_days/delay_hours` da **próxima** etapa |
| Agente sem usuário em `agents` | `status = 'paused'` + `paused_reason` escrito; `next_action_at` **não** muda, então retomar processa na hora |
| `step_type` fora de call/whatsapp/task/email | `paused` com o tipo no motivo — a coluna é `text` sem CHECK (A-125); o motor não inventa canal |
| Erro inesperado na etapa | `paused` + `failed` no histórico (sem retry infinito e sem notificar a cada tick) |
| Cadência sem nenhuma etapa | `completed` na primeira varredura |

Permissões: `anon` não lê a tabela nem executa a função; `authenticated` lê (dono da inscrição ou
admin/supervisor) e **não** escreve; `cadence_tick` só para `postgres` e `service_role`.

O motor só entrega notificação. Envio automático de e-mail/WhatsApp não entra aqui: exige provedor e
consentimento.

Por que SQL e não edge function: uma transação só (a edge precisaria de lease entre reivindicar e
gravar), sem token no Vault nem env var para replicar — o modo de falha que deixou 7 crons sem rodar —
e testável em transação revertida.

Gates: `supabase/tests/cadence_tick_rls_test.sql` (S1–S8, `begin`/`rollback`) e
`supabase/tests/probe_085_cadence_motor_rls_test.sql` (sonda read-only, não afirma nada).

