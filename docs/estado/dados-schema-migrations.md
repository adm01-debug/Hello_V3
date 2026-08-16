<!-- Gerado pela auditoria de estado. Fonte: lote M1. -->

> **Procedência:** lote `M1` da auditoria de estado (branch `claude/system-status-features-boms0f`).
> **Recontagem de cobertura (Fase D):** 125/207 migrations citadas (60%) — compatível com o método de altitude declarado no próprio documento.
> **Limitação global:** sem acesso ao banco/runtime (rede bloqueada pela política do ambiente) — nenhuma linha desta página é verificada contra produção.

# Lote M1 — Camada de dados

Auditoria somente-leitura de `/home/user/hello-v3`. Nenhum comando foi executado contra
banco de dados algum — todo o conteúdo abaixo vem de leitura estática do repositório.
Denominador do lote: **207 arquivos** em `supabase/migrations/` (13.329 linhas somadas,
conferido por `cat supabase/migrations/*.sql | wc -l`) + `src/integrations/supabase/types.ts`
(7.787 linhas).

## Método (o que foi lido integralmente vs. extraído por grep)

| Seção | Método | Detalhe |
|---|---|---|
| Inventário de objetos | **grep/awk agregado** | `grep -ihoE "create table ..." supabase/migrations/*.sql \| sort -u`, com filtro `!/^[[:space:]]*--/` para descartar comentários (ver ressalva abaixo) |
| SECURITY DEFINER / search_path | **awk + python sobre statements** | cada arquivo teve as quebras de linha colapsadas e foi cortado em `CREATE [OR REPLACE] FUNCTION`; a flag foi buscada no cabeçalho (antes do primeiro `$$`) **e** nos 250 caracteres após o fechamento do corpo, porque parte das funções declara os atributos depois do corpo |
| Políticas por tabela | **perl sobre statements** | statements reconstruídos por `sed 's/--.*$//' \| tr '\n' ' ' \| tr ';' '\n'`; o nome entre aspas é removido antes de procurar o ` ON <tabela>`, senão políticas cujo nome contém a palavra "on" (ex.: `"Admin/supervisor full access on churn signals"`) produzem tabelas fantasma |
| Cron | **grep -A 22** nas 6 migrations que contêm `cron.schedule(` | lidas integralmente as janelas relevantes |
| DRIFT types.ts × migrations | **sed + grep + comm** | chaves de tabela extraídas do bloco `Tables:` (linhas 16–7443 de `types.ts`), indentação de 6 espaços |
| Consumidores no código | **loop bash** sobre as 162 tabelas | para cada tabela: `grep -rlF "from('<t>')" src supabase/functions` e `grep -rlF "'<t>'"` / `"<t>"` |
| Migrations lidas **integralmente** | 5 maiores + 5 mais recentes | ver lista abaixo |

**Lidas na íntegra (10 arquivos, 2.527 linhas):**

*5 maiores* — `supabase/migrations/20251231115936_0cbef64e-8440-4db5-8f3d-164a7da98921.sql` (495),
`20251224124524_38968a99-a0bc-4cff-a5c2-2fd2590d2e8e.sql` (421),
`20260416235642_e9fe6fa3-4307-49a3-9253-09718c07703d.sql` (391),
`20260417001411_2f77b480-8ec1-46a5-af32-2904e651a55a.sql` (382),
`20260103145030_b2c1f366-245b-4264-9139-4def0d930fd6.sql` (352).

*5 mais recentes* — `20260726200037_ddb39a7d-1e45-4c97-be01-1923e0caea6d.sql` (99),
`20260726201157_da4cb47a-5f61-4783-9786-eb99a7ee6bfc.sql` (130),
`20260726202218_619850bb-a4f2-4112-96d7-872649f70b37.sql` (191),
`20260726202240_6938071f-1811-40eb-89c4-336a42768f7d.sql` (14),
`20260805130000_fix_user_profiles_recursion.sql` (52).

As outras **197 migrations não foram lidas linha a linha** — apenas varridas por padrões. Toda
afirmação sobre elas é sustentada por `arquivo:linha` extraído mecanicamente, e limitações do
método estão declaradas onde existem.

**Ressalva de precisão do método (declarada, não escondida):** o grep ingênuo por
`create table` capturou 164 nomes, dois dos quais eram falsos positivos vindos de comentários
(`-- Create table for call sessions` em `supabase/migrations/20251222153717_0868819c-c2a1-4f51-abcd-34ae49b599ed.sql:1`
e `-- Create table to track recordings metadata` em
`supabase/migrations/20251223203951_8b86adf3-98b4-4cf4-8154-b1efb3cde4bd.sql:21`). O número
correto, após filtrar linhas de comentário, é **162**.

## Inventário de objetos (contagens com denominador)

Denominador: 207 arquivos `.sql` / 13.329 linhas.

| Objeto | Ocorrências | Distintos | Observação |
|---|---:|---:|---|
| `CREATE TABLE` | 176 statements | **162 tabelas** | 13 tabelas são criadas em mais de uma migration (ver "Migrations suspeitas") |
| `CREATE FUNCTION` | 105 statements | **93 funções** | 73 (78%) são `SECURITY DEFINER` |
| `CREATE TRIGGER` | **120** | — | maior concentração: `supabase/migrations/20250103000000_triggers.sql` (12) |
| `CREATE VIEW` | **5** | 5 | nenhuma `MATERIALIZED VIEW` no repositório |
| `CREATE POLICY` | **714** | sobre 164 relações | 160 das 162 tabelas do repo têm ao menos 1 política |
| `CREATE INDEX` | 440 statements | **383 nomes distintos** | 47 índices são explicitamente derrubados depois (45 deles criados pelo próprio repo) |
| `CREATE EXTENSION` | 9 statements | **5 extensões** | ver abaixo |
| `cron.schedule(` | **7 jobs** | 6 migrations | ver seção dedicada |

### Views declaradas (5/5)

| View | Evidência |
|---|---|
| `migration_status` | `supabase/migrations/20250101000000_versioning.sql:77` |
| `index_usage` | `supabase/migrations/20250102000000_performance_indexes.sql:135` |
| `unused_indexes` | `supabase/migrations/20250102000000_performance_indexes.sql:148` |
| `slow_queries` | `supabase/migrations/20250104000000_query_monitoring.sql:4` |
| `public.financial_impact_daily` | `supabase/migrations/20260711153050_e3d3822b-d711-42cf-8514-1f348c336641.sql:101` |

Apenas **1 das 5** aparece em `types.ts` (`financial_impact_daily`, bloco `Views:` em
`src/integrations/supabase/types.ts:7444-7457`). As outras 4 são objetos de diagnóstico
não expostos ao cliente — aceitável, mas registra-se que o `types.ts` não descreve o schema completo.

### Extensões (5 distintas, 9 declarações)

| Extensão | Evidência | Nota |
|---|---|---|
| `pg_cron` | `supabase/migrations/20251224134357_08ef4955-ebfb-4dc3-b63b-9d247050951f.sql:2`; redeclarada em `20260711194708_...:2` e `20260723114001_...:3` | **sim**, presente |
| `pg_net` | `supabase/migrations/20251224134357_08ef4955-ebfb-4dc3-b63b-9d247050951f.sql:3`; redeclarada em `20260723114001_...:2` | **sim**, presente — usada para chamar edge function via cron |
| `vector` (pgvector) | `supabase/migrations/20260507220756_3754305d-eebb-4a27-b26c-d3841747c295.sql:2` | **sim**, presente |
| `pg_trgm` | `supabase/migrations/20260515172829_e3c28053-3fce-46b7-89d5-fee835d0b1de.sql:2`; redeclarada em `20260717133840_fbddc254-bbd8-43ff-ad12-74c7a9dec44a.sql:1` | |
| `pg_stat_statements` | `supabase/migrations/20260711194708_409831f1-bcdb-4529-ae31-eece4fe2a6e2.sql:3` | |

Nota de esquema: `pg_cron` é instalada em `pg_catalog` na primeira declaração
(`20251224134357_...:2`) e **sem `WITH SCHEMA` na segunda** (`20260711194708_...:2`), o que em
banco limpo instala no schema padrão. Duas declarações divergentes da mesma extensão.

### Tabelas (162/162) — origem, políticas, presença em types.ts, consumo no código

| Tabela | Migration de origem (primeira criação) | # policies | em types.ts | consumo em src/ + functions/ |
|---|---|---:|---|---|
| `account_journey_history` | supabase/migrations/20260416235642_e9fe6fa3-4307-49a3-9253-09718c07703d.sql:184 | 4 | sim | NENHUM |
| `account_lockouts` | supabase/migrations/20251231132751_524f6c03-6c9f-4b16-aae7-d38bb6903fda.sql:16 | 5 | sim | literal |
| `accounts` | supabase/migrations/20260416235642_e9fe6fa3-4307-49a3-9253-09718c07703d.sql:3 | 3 | sim | from() |
| `active_sessions` | supabase/migrations/20251231115936_0cbef64e-8440-4db5-8f3d-164a7da98921.sql:85 | 3 | sim | from() |
| `agent_badges` | supabase/migrations/20251224023654_29935900-12bb-4c40-bb31-a061340c76eb.sql:16 | 5 | sim | from() |
| `agent_devices` | supabase/migrations/20260315200451_a246f656-4ac8-454c-82f0-11503932b7af.sql:3 | 5 | sim | from() |
| `agent_goals` | supabase/migrations/20251222172653_e31b25fa-1495-47dc-a70e-59351aae7386.sql:11 | 5 | sim | from() |
| `agent_ring_settings` | supabase/migrations/20260315200451_a246f656-4ac8-454c-82f0-11503932b7af.sql:18 | 5 | sim | from() |
| `agent_shifts` | supabase/migrations/20260417000338_f03874c1-f8d9-4f2d-bf5c-20ad794cce6f.sql:21 | 2 | sim | from() |
| `agent_skills` | supabase/migrations/20260417000338_f03874c1-f8d9-4f2d-bf5c-20ad794cce6f.sql:83 | 3 | sim | from() |
| `agent_trunk_assignments` | supabase/migrations/20260418141900_bac7392a-79fd-4a8d-8497-2144c6f23337.sql:46 | 3 | sim | from() |
| `agent_weekly_stats` | supabase/migrations/20251224023654_29935900-12bb-4c40-bb31-a061340c76eb.sql:25 | 6 | sim | from() |
| `agents` | supabase/migrations/20250102000000_hello_production.sql:51 | 9 | sim | from() |
| `audit_logs` | supabase/migrations/20251225185236_a4c86a9f-4ff8-4f94-b7a7-3970e2787ae0.sql:2 | 8 | sim | from() |
| `badges` | supabase/migrations/20251224023654_29935900-12bb-4c40-bb31-a061340c76eb.sql:2 | 4 | sim | from() |
| `barge_in_sessions` | supabase/migrations/20251224022103_aa00248e-f07a-4edc-8c76-96e520ba31a9.sql:2 | 7 | sim | from() |
| `battle_card_triggers` | supabase/migrations/20260416225701_7a49a0bb-be31-4054-98f2-87f16a3fcbe8.sql:84 | 3 | sim | from() |
| `battle_cards` | supabase/migrations/20260416225701_7a49a0bb-be31-4054-98f2-87f16a3fcbe8.sql:52 | 3 | sim | from() |
| `bitrix_departments` | supabase/migrations/20260515171135_134e605d-28e8-4d47-9aa1-1e7c4247c819.sql:27 | 1 | sim | from() |
| `bitrix_users` | supabase/migrations/20260515171135_134e605d-28e8-4d47-9aa1-1e7c4247c819.sql:15 | 1 | sim | from() |
| `blocked_access_logs` | supabase/migrations/20251225193248_4613adbc-ca55-48c4-94aa-3aec14e8d9de.sql:34 | 4 | sim | from() |
| `bot_conversations` | supabase/migrations/20260417001411_2f77b480-8ec1-46a5-af32-2904e651a55a.sql:275 | 4 | sim | from() |
| `cadence_enrollments` | supabase/migrations/20260416234921_cc18cae3-c0a2-4ffd-a96e-7bc43be82ec5.sql:161 | 5 | sim | literal |
| `cadence_steps` | supabase/migrations/20260416234921_cc18cae3-c0a2-4ffd-a96e-7bc43be82ec5.sql:148 | 2 | sim | literal |
| `cadences` | supabase/migrations/20260416234921_cc18cae3-c0a2-4ffd-a96e-7bc43be82ec5.sql:138 | 2 | sim | literal |
| `call_alerts` | supabase/migrations/20251222165402_c515f03e-0bf3-4c17-a56b-b209d783515a.sql:2 | 12 | sim | from() |
| `call_analyses` | supabase/migrations/20251222153717_0868819c-c2a1-4f51-abcd-34ae49b599ed.sql:26 | 7 | sim | from() |
| `call_control_audit_logs` | supabase/migrations/20260509184955_dfe329e5-9241-40ed-8f9d-28cef0cffb1f.sql:19 | 6 | sim | from() |
| `call_flows` | supabase/migrations/20260315194850_5c156b99-5d85-4b43-9e09-74edf363cd91.sql:3 | 3 | sim | from() |
| `call_key_moments` | supabase/migrations/20260416225701_7a49a0bb-be31-4054-98f2-87f16a3fcbe8.sql:13 | 5 | sim | from() |
| `call_park_orbits` | supabase/migrations/20260726202218_619850bb-a4f2-4112-96d7-872649f70b37.sql:2 | 4 | sim | from() |
| `call_playlists` | supabase/migrations/20260416234921_cc18cae3-c0a2-4ffd-a96e-7bc43be82ec5.sql:259 | 6 | sim | literal |
| `call_quality_metrics` | supabase/migrations/20260417164448_f2a7d0e1-ed11-4f31-9ec2-8717486ecf5d.sql:2 | 6 | sim | from() |
| `call_queue_members` | supabase/migrations/20260726195450_0ffeebc4-7139-4dfa-8465-d41d8193ea38.sql:69 | 2 | sim | from() |
| `call_queues` | supabase/migrations/20260726195450_0ffeebc4-7139-4dfa-8465-d41d8193ea38.sql:7 | 2 | sim | from() |
| `call_recordings` | supabase/migrations/20251223203951_8b86adf3-98b4-4cf4-8154-b1efb3cde4bd.sql:22 | 10 | sim | from() |
| `call_records` | supabase/migrations/20250102000000_hello_production.sql:20 | 1 | NAO | NENHUM |
| `call_scorecards` | supabase/migrations/20260416234921_cc18cae3-c0a2-4ffd-a96e-7bc43be82ec5.sql:74 | 2 | sim | from() |
| `call_sessions` | supabase/migrations/20251222153717_0868819c-c2a1-4f51-abcd-34ae49b599ed.sql:2 | 12 | sim | from() |
| `call_summaries` | supabase/migrations/20251222153717_0868819c-c2a1-4f51-abcd-34ae49b599ed.sql:40 | 7 | sim | from() |
| `call_transcriptions` | supabase/migrations/20251222153717_0868819c-c2a1-4f51-abcd-34ae49b599ed.sql:15 | 9 | sim | from() |
| `call_transcripts_searchable` | supabase/migrations/20260416225701_7a49a0bb-be31-4054-98f2-87f16a3fcbe8.sql:110 | 5 | sim | from() |
| `call_translations` | supabase/migrations/20260417115220_5f984153-6650-4d10-ad92-88678b974261.sql:2 | 5 | sim | from() |
| `calling_hours_config` | supabase/migrations/20260103145030_b2c1f366-245b-4264-9139-4def0d930fd6.sql:39 | 2 | sim | from() |
| `chat_sessions` | supabase/migrations/20260417001411_2f77b480-8ec1-46a5-af32-2904e651a55a.sql:134 | 3 | sim | from() |
| `churn_risk_signals` | supabase/migrations/20260416235642_e9fe6fa3-4307-49a3-9253-09718c07703d.sql:53 | 3 | sim | from() |
| `coaching_assignments` | supabase/migrations/20260417000338_f03874c1-f8d9-4f2d-bf5c-20ad794cce6f.sql:115 | 4 | sim | from() |
| `coaching_recommendations` | supabase/migrations/20251224024429_6c4f4a9d-c7f9-4cd3-a57e-c4b8659a6776.sql:2 | 10 | sim | from() |
| `coaching_timestamps` | supabase/migrations/20260416225701_7a49a0bb-be31-4054-98f2-87f16a3fcbe8.sql:160 | 4 | sim | from() |
| `compliance_rules` | supabase/migrations/20260417110551_0cb1418b-1c9a-4cf2-9164-7d7f523213d8.sql:90 | 2 | sim | from() |
| `compliance_settings` | supabase/migrations/20260103145030_b2c1f366-245b-4264-9139-4def0d930fd6.sql:88 | 2 | sim | from() |
| `consent_history` | supabase/migrations/20260103145030_b2c1f366-245b-4264-9139-4def0d930fd6.sql:70 | 3 | sim | from() |
| `consent_records` | supabase/migrations/20260417113731_0610041c-71b2-497f-974e-2f62b20b3415.sql:2 | 4 | sim | from() |
| `contact_alerts` | supabase/migrations/20251223014743_829d5071-0f42-4ea3-bd3d-eb8bd994a318.sql:2 | 12 | sim | from() |
| `contact_engagement_patterns` | supabase/migrations/20260417113731_0610041c-71b2-497f-974e-2f62b20b3415.sql:42 | 2 | sim | from() |
| `contact_interactions` | supabase/migrations/20251223013407_14e5788a-757b-4c1a-b447-ee6048bee1b3.sql:55 | 13 | sim | from() |
| `contacts` | supabase/migrations/20250102000000_hello_production.sql:4 | 16 | sim | from() |
| `conversation_messages` | supabase/migrations/20260417001411_2f77b480-8ec1-46a5-af32-2904e651a55a.sql:56 | 6 | sim | from() |
| `conversations` | supabase/migrations/20260417001411_2f77b480-8ec1-46a5-af32-2904e651a55a.sql:7 | 5 | sim | from() |
| `crm_field_suggestions` | supabase/migrations/20260417110551_0cb1418b-1c9a-4cf2-9164-7d7f523213d8.sql:124 | 8 | sim | from() |
| `crm_sync_queue` | supabase/migrations/20260507220616_3feba3f7-8e03-47ff-b2a3-b4e860beb5e0.sql:2 | 4 | sim | from() |
| `cultural_hints` | supabase/migrations/20260417115220_5f984153-6650-4d10-ad92-88678b974261.sql:43 | 2 | sim | from() |
| `customer_journey_stages` | supabase/migrations/20260416235642_e9fe6fa3-4307-49a3-9253-09718c07703d.sql:146 | 3 | sim | NENHUM |
| `dashboard_goals` | supabase/migrations/20251224142716_d2c04aae-f048-4e7c-b447-1d6e3a840412.sql:2 | 2 | sim | from() |
| `data_lake_exports` | supabase/migrations/20260711153050_e3d3822b-d711-42cf-8514-1f348c336641.sql:76 | 1 | sim | from() |
| `deal_revenue_snapshots` | supabase/migrations/20260711153050_e3d3822b-d711-42cf-8514-1f348c336641.sql:5 | 1 | sim | NENHUM |
| `deals` | supabase/migrations/20260416234921_cc18cae3-c0a2-4ffd-a96e-7bc43be82ec5.sql:3 | 5 | sim | literal |
| `dialer_campaigns` | supabase/migrations/20251224023203_b0186fe4-1181-4b5d-a9cc-460f3738b952.sql:2 | 6 | sim | from() |
| `dialer_favorites` | supabase/migrations/20260726160049_14fac8e9-52d1-4daf-b825-2005ac32e981.sql:1 | 1 | sim | from() |
| `dialer_queue` | supabase/migrations/20251224023203_b0186fe4-1181-4b5d-a9cc-460f3738b952.sql:23 | 9 | sim | from() |
| `dnc_import_logs` | supabase/migrations/20260103145030_b2c1f366-245b-4264-9139-4def0d930fd6.sql:23 | 2 | sim | from() |
| `dnc_list` | supabase/migrations/20260103145030_b2c1f366-245b-4264-9139-4def0d930fd6.sql:7 | 2 | sim | from() |
| `email_tickets` | supabase/migrations/20260417001411_2f77b480-8ec1-46a5-af32-2904e651a55a.sql:96 | 3 | sim | from() |
| `email_verification_tokens` | supabase/migrations/20251231115936_0cbef64e-8440-4db5-8f3d-164a7da98921.sql:111 | 6 | sim | NENHUM |
| `entity_versions` | supabase/migrations/20241231000001_entity_versions.sql:2 | 2 | NAO | NENHUM |
| `fraud_signals` | supabase/migrations/20260417113024_b37afec8-ce2c-47c3-9009-50ef0e86b65c.sql:35 | 3 | sim | from() |
| `goal_violations` | supabase/migrations/20251224143457_dcc666f8-bf68-4077-86f4-4a0ad7dd27b3.sql:2 | 4 | sim | from() |
| `hold_alert_settings` | supabase/migrations/20251223220228_f4ebbaa7-ea1c-447d-a07b-e1c0f583963d.sql:3 | 5 | sim | from() |
| `hold_events` | supabase/migrations/20251223211907_9badc1f9-c450-4801-b56f-7cac4cabf237.sql:7 | 11 | sim | from() |
| `holidays` | supabase/migrations/20260103145030_b2c1f366-245b-4264-9139-4def0d930fd6.sql:59 | 2 | sim | from() |
| `hot_desking_stations` | supabase/migrations/20260315194850_5c156b99-5d85-4b43-9e09-74edf363cd91.sql:104 | 4 | sim | from() |
| `index_drop_audit` | supabase/migrations/20260712115343_8332dd3d-29a2-4017-954c-edc625f7029b.sql:3 | 1 | sim | literal |
| `ip_whitelist` | supabase/migrations/20251225193248_4613adbc-ca55-48c4-94aa-3aec14e8d9de.sql:2 | 3 | sim | from() |
| `kb_article_history` | supabase/migrations/20260507221454_8ee1f1c8-e52c-42d1-93f5-136662aa8772.sql:2 | 1 | sim | NENHUM |
| `kb_article_views` | supabase/migrations/20260417001411_2f77b480-8ec1-46a5-af32-2904e651a55a.sql:253 | 6 | sim | from() |
| `kb_articles` | supabase/migrations/20260417001411_2f77b480-8ec1-46a5-af32-2904e651a55a.sql:197 | 3 | sim | from() |
| `kb_categories` | supabase/migrations/20260417001411_2f77b480-8ec1-46a5-af32-2904e651a55a.sql:171 | 2 | sim | from() |
| `learning_completions` | supabase/migrations/20260417000338_f03874c1-f8d9-4f2d-bf5c-20ad794cce6f.sql:164 | 3 | sim | from() |
| `learning_modules` | supabase/migrations/20260417000338_f03874c1-f8d9-4f2d-bf5c-20ad794cce6f.sql:142 | 2 | sim | from() |
| `live_assist_signals` | supabase/migrations/20260417110551_0cb1418b-1c9a-4cf2-9164-7d7f523213d8.sql:6 | 6 | sim | from() |
| `live_sentiment_snapshots` | supabase/migrations/20260416225701_7a49a0bb-be31-4054-98f2-87f16a3fcbe8.sql:195 | 3 | sim | from() |
| `login_attempts` | supabase/migrations/20251231132751_524f6c03-6c9f-4b16-aae7-d38bb6903fda.sql:2 | 9 | sim | from() |
| `manager_alerts` | supabase/migrations/20260315194850_5c156b99-5d85-4b43-9e09-74edf363cd91.sql:60 | 3 | sim | from() |
| `meeting_summaries` | supabase/migrations/20260417002302_ac16e3fa-c0c4-4a84-958e-c3936f9e9034.sql:2 | 8 | sim | from() |
| `migration_rollbacks` | supabase/migrations/20250101000000_versioning.sql:18 | 0 | NAO | NENHUM |
| `notification_preferences` | supabase/migrations/20260315144312_5b41e5e7-ff57-40a1-ad7e-68133720c86c.sql:25 | 3 | sim | from() |
| `notifications` | supabase/migrations/20260315144312_5b41e5e7-ff57-40a1-ad7e-68133720c86c.sql:3 | 6 | sim | from() |
| `number_porting_requests` | supabase/migrations/20260315194850_5c156b99-5d85-4b43-9e09-74edf363cd91.sql:148 | 3 | sim | from() |
| `objection_library` | supabase/migrations/20260417110551_0cb1418b-1c9a-4cf2-9164-7d7f523213d8.sql:52 | 2 | sim | from() |
| `optimistic_lock_conflicts` | supabase/migrations/20260418132329_194c7950-0787-43d5-a46a-f204640ee74a.sql:6 | 1 | sim | from() |
| `parked_calls` | supabase/migrations/20260726202218_619850bb-a4f2-4112-96d7-872649f70b37.sql:24 | 6 | sim | from() |
| `password_reset_requests` | supabase/migrations/20251231131323_f5848ea5-ae7d-4e46-ac63-aba88d5f35bc.sql:2 | 5 | sim | from() |
| `password_reset_tokens` | supabase/migrations/20251231115936_0cbef64e-8440-4db5-8f3d-164a7da98921.sql:100 | 6 | sim | NENHUM |
| `performance_metrics` | supabase/migrations/20260507221246_8cb863b7-2e5f-4003-adb0-fa3597e71bf8.sql:13 | 2 | sim | from() |
| `permissions` | supabase/migrations/20251231115936_0cbef64e-8440-4db5-8f3d-164a7da98921.sql:27 | 2 | sim | from() |
| `playlist_items` | supabase/migrations/20260416234921_cc18cae3-c0a2-4ffd-a96e-7bc43be82ec5.sql:273 | 2 | sim | literal |
| `queue_audio_prompts` | supabase/migrations/20260726201157_da4cb47a-5f61-4783-9786-eb99a7ee6bfc.sql:1 | 2 | sim | from() |
| `queue_items` | supabase/migrations/20250102000000_hello_production.sql:37 | 1 | NAO | NENHUM |
| `queue_metrics_settings` | supabase/migrations/20251224134826_e7324447-c07d-4e94-b603-52bf4efa2773.sql:2 | 2 | sim | from() |
| `queue_skill_requirements` | supabase/migrations/20260417000338_f03874c1-f8d9-4f2d-bf5c-20ad794cce6f.sql:101 | 3 | sim | NENHUM |
| `rate_limit_alerts` | supabase/migrations/20251231115936_0cbef64e-8440-4db5-8f3d-164a7da98921.sql:122 | 5 | sim | from() |
| `rate_limit_logs` | supabase/migrations/20251231115936_0cbef64e-8440-4db5-8f3d-164a7da98921.sql:46 | 4 | sim | from() |
| `rate_limit_settings` | supabase/migrations/20251231115936_0cbef64e-8440-4db5-8f3d-164a7da98921.sql:60 | 3 | sim | from() |
| `redaction_log` | supabase/migrations/20260417113024_b37afec8-ce2c-47c3-9009-50ef0e86b65c.sql:76 | 1 | sim | from() |
| `renewals` | supabase/migrations/20260416235642_e9fe6fa3-4307-49a3-9253-09718c07703d.sql:96 | 3 | sim | from() |
| `ring_group_members` | supabase/migrations/20260726200037_ddb39a7d-1e45-4c97-be01-1923e0caea6d.sql:36 | 2 | sim | from() |
| `ring_groups` | supabase/migrations/20260726200037_ddb39a7d-1e45-4c97-be01-1923e0caea6d.sql:1 | 2 | sim | from() |
| `rls_audit_logs` | supabase/migrations/20260522202120_9602a6a5-b48f-402b-a194-f1c009763fbc.sql:2 | 2 | sim | from() |
| `role_permissions` | supabase/migrations/20251231115936_0cbef64e-8440-4db5-8f3d-164a7da98921.sql:37 | 2 | sim | from() |
| `routing_rules` | supabase/migrations/20260417001411_2f77b480-8ec1-46a5-af32-2904e651a55a.sql:311 | 2 | sim | from() |
| `saved_filters` | supabase/migrations/20241231000000_saved_filters.sql:8 | 4 | NAO | NENHUM |
| `scheduled_callbacks` | supabase/migrations/20251224022711_bcf91fc6-4c52-42e8-b02c-c63b4f495a64.sql:2 | 13 | sim | from() |
| `schema_migrations` | supabase/migrations/20250101000000_versioning.sql:7 | 0 | NAO | NENHUM |
| `scorecard_criteria` | supabase/migrations/20260416234921_cc18cae3-c0a2-4ffd-a96e-7bc43be82ec5.sql:63 | 2 | sim | from() |
| `scorecard_responses` | supabase/migrations/20260416234921_cc18cae3-c0a2-4ffd-a96e-7bc43be82ec5.sql:90 | 2 | sim | from() |
| `scorecard_templates` | supabase/migrations/20260416234921_cc18cae3-c0a2-4ffd-a96e-7bc43be82ec5.sql:53 | 2 | sim | from() |
| `security_alerts` | supabase/migrations/20251225192806_31f73fb3-ef04-442d-b4bd-cc6cce94cdb8.sql:5 | 7 | sim | from() |
| `shift_swap_suggestions` | supabase/migrations/20260711153050_e3d3822b-d711-42cf-8514-1f348c336641.sql:25 | 1 | sim | from() |
| `shift_templates` | supabase/migrations/20260417000338_f03874c1-f8d9-4f2d-bf5c-20ad794cce6f.sql:2 | 3 | sim | from() |
| `skills` | supabase/migrations/20260417000338_f03874c1-f8d9-4f2d-bf5c-20ad794cce6f.sql:68 | 3 | sim | from() |
| `sla_policies` | supabase/migrations/20260417001411_2f77b480-8ec1-46a5-af32-2904e651a55a.sql:342 | 2 | sim | from() |
| `success_plan_milestones` | supabase/migrations/20260416235642_e9fe6fa3-4307-49a3-9253-09718c07703d.sql:333 | 3 | sim | from() |
| `success_plans` | supabase/migrations/20260416235642_e9fe6fa3-4307-49a3-9253-09718c07703d.sql:284 | 3 | sim | from() |
| `survey_responses` | supabase/migrations/20260416235642_e9fe6fa3-4307-49a3-9253-09718c07703d.sql:245 | 6 | sim | from() |
| `surveys` | supabase/migrations/20260416235642_e9fe6fa3-4307-49a3-9253-09718c07703d.sql:216 | 2 | sim | from() |
| `system_settings` | supabase/migrations/20260507220325_dcddf456-0d72-414d-b77a-68839a03a706.sql:2 | 2 | sim | from() |
| `time_off_requests` | supabase/migrations/20260417000338_f03874c1-f8d9-4f2d-bf5c-20ad794cce6f.sql:43 | 4 | sim | from() |
| `toll_free_numbers` | supabase/migrations/20260315194850_5c156b99-5d85-4b43-9e09-74edf363cd91.sql:171 | 3 | sim | from() |
| `topic_detections` | supabase/migrations/20260315194850_5c156b99-5d85-4b43-9e09-74edf363cd91.sql:42 | 5 | sim | from() |
| `topic_trends` | supabase/migrations/20260315194850_5c156b99-5d85-4b43-9e09-74edf363cd91.sql:190 | 2 | sim | from() |
| `tracker_matches` | supabase/migrations/20260416234921_cc18cae3-c0a2-4ffd-a96e-7bc43be82ec5.sql:225 | 4 | sim | literal |
| `trackers` | supabase/migrations/20260416234921_cc18cae3-c0a2-4ffd-a96e-7bc43be82ec5.sql:211 | 2 | sim | literal |
| `user_allowed_ips` | supabase/migrations/20251225193248_4613adbc-ca55-48c4-94aa-3aec14e8d9de.sql:23 | 2 | sim | from() |
| `user_ip_restrictions` | supabase/migrations/20251225193248_4613adbc-ca55-48c4-94aa-3aec14e8d9de.sql:13 | 2 | sim | from() |
| `user_mfa_settings` | supabase/migrations/20251231115936_0cbef64e-8440-4db5-8f3d-164a7da98921.sql:72 | 5 | sim | from() |
| `user_passkeys` | supabase/migrations/20251231125803_b47a2b11-3915-463a-9c94-57b741b7e4ab.sql:2 | 4 | sim | from() |
| `user_profiles` | supabase/migrations/20251224124237_40fde4e2-d0ab-4b62-8898-4171393988c4.sql:2 | 26 | sim | from() |
| `user_roles` | supabase/migrations/20251231115936_0cbef64e-8440-4db5-8f3d-164a7da98921.sql:13 | 3 | sim | from() |
| `video_conferences` | supabase/migrations/20260315194850_5c156b99-5d85-4b43-9e09-74edf363cd91.sql:80 | 7 | sim | from() |
| `virtual_fax` | supabase/migrations/20260315194850_5c156b99-5d85-4b43-9e09-74edf363cd91.sql:125 | 6 | sim | from() |
| `voice_prints` | supabase/migrations/20260417113024_b37afec8-ce2c-47c3-9009-50ef0e86b65c.sql:2 | 2 | sim | from() |
| `voicemail_messages` | supabase/migrations/20260315194850_5c156b99-5d85-4b43-9e09-74edf363cd91.sql:21 | 4 | sim | from() |
| `voip_monitoring_settings` | supabase/migrations/20260509184955_dfe329e5-9241-40ed-8f9d-28cef0cffb1f.sql:2 | 2 | sim | from() |
| `voip_quality_alerts` | supabase/migrations/20260417193624_c504362a-a440-413e-9f5e-2bedb08a01a0.sql:2 | 4 | sim | from() |
| `voip_recommendation_actions` | supabase/migrations/20260418011716_3af60ac2-4c97-49a3-9070-de71020046dd.sql:2 | 3 | sim | from() |
| `voip_trunk_health_checks` | supabase/migrations/20260418143532_ce6a3be9-4e9b-4d97-85ba-276c8ee1354c.sql:9 | 2 | sim | from() |
| `voip_trunk_usage_metrics` | supabase/migrations/20260418144103_3396eae6-b7f0-4fd0-8596-ee6276d550c1.sql:2 | 4 | sim | from() |
| `voip_trunks` | supabase/migrations/20260418141900_bac7392a-79fd-4a8d-8497-2144c6f23337.sql:7 | 5 | sim | from() |
| `webauthn_challenges` | supabase/migrations/20251231125803_b47a2b11-3915-463a-9c94-57b741b7e4ab.sql:17 | 12 | sim | from() |
| `webhook_flush_metrics` | supabase/migrations/20260712195727_e87753b7-3685-42d0-b3c6-5fee033d22cf.sql:2 | 3 | sim | from() |
| `webhook_secrets` | supabase/migrations/20260523172256_ea1ae0b2-2688-4a63-aaf0-242d16a570e9.sql:2 | 2 | sim | from() |
| `whisper_messages` | supabase/migrations/20251224021814_cc2dbdc3-ab3c-4fd9-aa8d-7af71ae39f75.sql:2 | 10 | sim | from() |

### Funções (93/93) — SECURITY DEFINER e search_path

`search_path` avaliado na **última** definição de cada função (as migrations são ordenadas
cronologicamente pelo nome do arquivo).

| Função | Modo | `SET search_path` | Última definição |
|---|---|---|---|
| `add_to_dnc` | SECURITY DEFINER | sim | supabase/migrations/20260103145030_b2c1f366-245b-4264-9139-4def0d930fd6.sql |
| `apply_migration` | INVOKER | **NAO** | supabase/migrations/20250101000000_versioning.sql |
| `apply_predictive_pacing` | SECURITY DEFINER | sim | supabase/migrations/20260722213602_011fe9c6-e570-4180-be7a-d9a276c66f2e.sql |
| `audit_role_change` | SECURITY DEFINER | sim | supabase/migrations/20260723125329_cfbefc57-81be-44d7-a62b-adf192232b7a.sql |
| `audit_table_change` | SECURITY DEFINER | sim | supabase/migrations/20260515173641_1acef862-aca2-4f33-8dfa-1b4a506b9a2b.sql |
| `audit_trigger_func` | INVOKER | **NAO** | supabase/migrations/20250103000000_triggers.sql |
| `bridge_voip_alert_to_notification` | SECURITY DEFINER | sim | supabase/migrations/20260417194803_3f7e2538-de99-493b-99f0-23ddf2349f2d.sql |
| `calculate_call_duration` | INVOKER | **NAO** | supabase/migrations/20250103000000_triggers.sql |
| `calculate_predictive_pace` | SECURITY DEFINER | sim | supabase/migrations/20260722213602_011fe9c6-e570-4180-be7a-d9a276c66f2e.sql |
| `can_access_agent_data` | SECURITY DEFINER | sim | supabase/migrations/20251225183119_7313996d-e875-4c04-a6ff-89415df9f212.sql |
| `cascade_user_deletion` | INVOKER | **NAO** | supabase/migrations/20250103000000_triggers.sql |
| `check_all_tables_rls_status` | SECURITY DEFINER | sim | supabase/migrations/20260515173713_956eede7-264d-4ead-8440-33022635c0d9.sql |
| `check_calling_hours` | SECURITY DEFINER | sim | supabase/migrations/20260103145030_b2c1f366-245b-4264-9139-4def0d930fd6.sql |
| `check_dnc` | SECURITY DEFINER | sim | supabase/migrations/20260103145030_b2c1f366-245b-4264-9139-4def0d930fd6.sql |
| `check_idle_indexes` | SECURITY DEFINER | sim | supabase/migrations/20260712112627_4ad8101d-5e02-4b1c-a570-f8338fc90f70.sql |
| `check_ip_allowed` | SECURITY DEFINER | sim | supabase/migrations/20251225193248_4613adbc-ca55-48c4-94aa-3aec14e8d9de.sql |
| `check_ip_in_cidr` | SECURITY DEFINER | sim | supabase/migrations/20251225193519_5687c33d-e757-4f87-b3c2-e4648db83a9c.sql |
| `check_login_lockout` | SECURITY DEFINER | sim | supabase/migrations/20251231132751_524f6c03-6c9f-4b16-aae7-d38bb6903fda.sql |
| `check_rate_limit` | SECURITY DEFINER | sim | supabase/migrations/20251231115936_0cbef64e-8440-4db5-8f3d-164a7da98921.sql |
| `check_rls_enabled` | SECURITY DEFINER | **NAO** | supabase/migrations/20260515172240_fa26b542-4abd-4df6-8bf6-37088ffbe1cb.sql |
| `check_suspicious_activity` | SECURITY DEFINER | sim | supabase/migrations/20251225192806_31f73fb3-ef04-442d-b4bd-cc6cce94cdb8.sql |
| `check_table_bloat` | SECURITY DEFINER | sim | supabase/migrations/20260712110237_ae094d69-c026-433d-b7b1-232eb615e4cd.sql |
| `cleanup_expired_challenges` | SECURITY DEFINER | sim | supabase/migrations/20251231125803_b47a2b11-3915-463a-9c94-57b741b7e4ab.sql |
| `cleanup_old_data` | SECURITY DEFINER | sim | supabase/migrations/20260515172829_e3c28053-3fce-46b7-89d5-fee835d0b1de.sql |
| `cleanup_old_logs` | SECURITY DEFINER | sim | supabase/migrations/20260711184851_d9161e14-4b44-49da-a117-f0770fc40585.sql |
| `enforce_optimistic_lock` | SECURITY DEFINER | sim | supabase/migrations/20260418132329_194c7950-0787-43d5-a46a-f204640ee74a.sql |
| `ensure_single_default_filter` | INVOKER | **NAO** | supabase/migrations/20241231000000_saved_filters.sql |
| `expire_parked_calls` | SECURITY DEFINER | sim | supabase/migrations/20260726202218_619850bb-a4f2-4112-96d7-872649f70b37.sql |
| `get_agent_financial_leaderboard` | SECURITY DEFINER | sim | supabase/migrations/20260713123720_67f0e2ad-4146-47ff-8972-4597117ba0b5.sql |
| `get_agent_performance` | SECURITY DEFINER | sim | supabase/migrations/20260507210530_523fc480-d6dd-4353-bdf9-809396a2fd57.sql |
| `get_agents_with_active_calls` | SECURITY DEFINER | sim | supabase/migrations/20260507210947_d778a772-2c9d-490b-ad07-4c019a6eaa44.sql |
| `get_auth_agent_id` | SECURITY DEFINER | sim | supabase/migrations/20260515174404_622b2b39-59f3-4490-9288-52ab9048d547.sql |
| `get_call_history_with_summaries` | SECURITY DEFINER | sim | supabase/migrations/20260507210614_dd491d22-0316-4bcd-bc79-f62325aa845e.sql |
| `get_call_queues_overview` | SECURITY DEFINER | sim | supabase/migrations/20260726195450_0ffeebc4-7139-4dfa-8465-d41d8193ea38.sql |
| `get_call_volume_stats` | SECURITY DEFINER | sim | supabase/migrations/20260507210817_17861cb9-6603-40aa-841e-9a130923b865.sql |
| `get_dashboard_stats` | SECURITY DEFINER | sim | supabase/migrations/20260507204806_d4ef5bf0-8935-4563-953e-d67f11a70981.sql |
| `get_database_health_snapshot` | SECURITY DEFINER | sim | supabase/migrations/20260712110926_e4196a49-0eea-4932-a184-5aa2a5ac53e4.sql |
| `get_profile_role` | SECURITY DEFINER | sim | supabase/migrations/20260326182838_760cfe64-1c2a-4917-8d2b-ffb9a9d84706.sql |
| `get_queue_stats` | SECURITY DEFINER | sim | supabase/migrations/20260507204501_97c5b796-36b7-4722-b1ec-68f44672030d.sql |
| `get_top_slow_queries` | SECURITY DEFINER | sim | supabase/migrations/20260712110926_e4196a49-0eea-4932-a184-5aa2a5ac53e4.sql |
| `get_user_agent_id` | SECURITY DEFINER | sim | supabase/migrations/20260404160553_5fa5fe0f-ba07-42df-803c-bc7f244e6ac1.sql |
| `get_user_agent_name` | SECURITY DEFINER | sim | supabase/migrations/20251225183119_7313996d-e875-4c04-a6ff-89415df9f212.sql |
| `get_user_role` | SECURITY DEFINER | sim | supabase/migrations/20251224124524_38968a99-a0bc-4cff-a5c2-2fd2590d2e8e.sql |
| `get_user_roles` | SECURITY DEFINER | sim | supabase/migrations/20251231115936_0cbef64e-8440-4db5-8f3d-164a7da98921.sql |
| `handle_kb_article_change` | INVOKER | **NAO** | supabase/migrations/20260507220818_0e9bddfe-b428-4410-9a46-19d6bca9f4f3.sql |
| `handle_kb_article_history` | SECURITY DEFINER | sim | supabase/migrations/20260507221454_8ee1f1c8-e52c-42d1-93f5-136662aa8772.sql |
| `handle_new_user` | SECURITY DEFINER | sim | supabase/migrations/20260403173933_5a9601f2-c73d-440f-a5ec-6bec06c2c21f.sql |
| `has_permission` | SECURITY DEFINER | sim | supabase/migrations/20251231115936_0cbef64e-8440-4db5-8f3d-164a7da98921.sql |
| `has_role` | SECURITY DEFINER | sim | supabase/migrations/20251231115936_0cbef64e-8440-4db5-8f3d-164a7da98921.sql |
| `is_active_agent` | SECURITY DEFINER | sim | supabase/migrations/20260403173646_6cd26a7c-d9a5-46fd-a088-d45d6a7899b8.sql |
| `is_admin` | SECURITY DEFINER | sim | supabase/migrations/20260515172623_f11560d3-feec-4354-b7bb-4be22995f835.sql |
| `is_admin_or_supervisor` | SECURITY DEFINER | sim | supabase/migrations/20260522151925_2ea5f47f-57b0-43c1-b9dd-af080ecf9e6b.sql |
| `is_admin_user` | SECURITY DEFINER | sim | supabase/migrations/20260326182838_760cfe64-1c2a-4917-8d2b-ffb9a9d84706.sql |
| `is_supervisor` | SECURITY DEFINER | sim | supabase/migrations/20260515172623_f11560d3-feec-4354-b7bb-4be22995f835.sql |
| `log_audit_event` | SECURITY DEFINER | sim | supabase/migrations/20260507204618_0b29d87e-fa11-4a14-b87d-ea3943062795.sql |
| `log_critical_rls_event` | SECURITY DEFINER | **NAO** | supabase/migrations/20260522194835_bedfae5d-959f-47e1-be6a-e9bb2bbe380e.sql |
| `log_index_drop_copy` | SECURITY DEFINER | sim | supabase/migrations/20260712115343_8332dd3d-29a2-4017-954c-edc625f7029b.sql |
| `log_rls_event` | SECURITY DEFINER | **NAO** | supabase/migrations/20260522202120_9602a6a5-b48f-402b-a194-f1c009763fbc.sql |
| `match_kb_articles` | INVOKER | **NAO** | supabase/migrations/20260507220756_3754305d-eebb-4a27-b26c-d3841747c295.sql |
| `notify_bloat_hotspots` | SECURITY DEFINER | sim | supabase/migrations/20260712110237_ae094d69-c026-433d-b7b1-232eb615e4cd.sql |
| `notify_critical_event` | INVOKER | **NAO** | supabase/migrations/20250103000000_triggers.sql |
| `notify_idle_indexes` | SECURITY DEFINER | sim | supabase/migrations/20260712112627_4ad8101d-5e02-4b1c-a570-f8338fc90f70.sql |
| `notify_lock_conflict_hotspot` | SECURITY DEFINER | sim | supabase/migrations/20260418134513_8f99e4ad-bf44-4a71-b2ac-bc59c555a283.sql |
| `notify_suspicious_index_drop_activity` | SECURITY DEFINER | sim | supabase/migrations/20260712115542_c8c86e0b-f57f-45aa-a5d4-d11855cbc993.sql |
| `notify_trunk_offline` | SECURITY DEFINER | sim | supabase/migrations/20260418143532_ce6a3be9-4e9b-4d97-85ba-276c8ee1354c.sql |
| `notify_webhook_failure_spike` | SECURITY DEFINER | sim | supabase/migrations/20260712195929_25a722b8-6454-47c7-993c-ca936114bac7.sql |
| `prevent_active_call_deletion` | INVOKER | **NAO** | supabase/migrations/20250103000000_triggers.sql |
| `prevent_role_escalation` | SECURITY DEFINER | sim | supabase/migrations/20260403173838_bac4beba-8928-466e-bf28-80f2bcc5f31a.sql |
| `process_audit_log` | SECURITY DEFINER | **NAO** | supabase/migrations/20260522152441_40b20906-baeb-4a9d-b7eb-d230a616e845.sql |
| `recalc_deal_health` | SECURITY DEFINER | sim | supabase/migrations/20260722213827_7ee185db-587f-4046-8507-474be04327a8.sql |
| `record_failed_login` | SECURITY DEFINER | sim | supabase/migrations/20251231132751_524f6c03-6c9f-4b16-aae7-d38bb6903fda.sql |
| `record_successful_login` | SECURITY DEFINER | sim | supabase/migrations/20251231132751_524f6c03-6c9f-4b16-aae7-d38bb6903fda.sql |
| `record_trunk_usage` | SECURITY DEFINER | sim | supabase/migrations/20260418144103_3396eae6-b7f0-4fd0-8596-ee6276d550c1.sql |
| `reset_public_index_stats` | SECURITY DEFINER | sim | supabase/migrations/20260712115343_8332dd3d-29a2-4017-954c-edc625f7029b.sql |
| `rollback_migration` | INVOKER | **NAO** | supabase/migrations/20250101000000_versioning.sql |
| `snapshot_deals_daily` | SECURITY DEFINER | sim | supabase/migrations/20260722213827_7ee185db-587f-4046-8507-474be04327a8.sql |
| `trg_recalc_deals_on_interaction` | SECURITY DEFINER | sim | supabase/migrations/20260722213827_7ee185db-587f-4046-8507-474be04327a8.sql |
| `trigger_auto_scorecard` | SECURITY DEFINER | sim | supabase/migrations/20260723114001_09502153-d05c-40eb-be5f-f84f78526fb3.sql |
| `update_kb_article_search_vector` | INVOKER | sim | supabase/migrations/20260417001411_2f77b480-8ec1-46a5-af32-2904e651a55a.sql |
| `update_saved_filters_updated_at` | INVOKER | **NAO** | supabase/migrations/20241231000000_saved_filters.sql |
| `update_security_updated_at` | INVOKER | sim | supabase/migrations/20251231115936_0cbef64e-8440-4db5-8f3d-164a7da98921.sql |
| `update_timestamp` | INVOKER | **NAO** | supabase/migrations/20250103000000_triggers.sql |
| `update_transcript_search_vector` | INVOKER | sim | supabase/migrations/20260416225701_7a49a0bb-be31-4054-98f2-87f16a3fcbe8.sql |
| `update_updated_at_column` | INVOKER | sim | supabase/migrations/20251222172653_e31b25fa-1495-47dc-a70e-59351aae7386.sql |
| `update_virtual_fax_ocr_vector` | INVOKER | sim | supabase/migrations/20260711153050_e3d3822b-d711-42cf-8514-1f348c336641.sql |
| `validate_audit_insert` | SECURITY DEFINER | sim | supabase/migrations/20251225190920_52373a9f-fb31-4f5d-9fcd-3aeb2db90f94.sql |
| `validate_call_queue` | SECURITY DEFINER | sim | supabase/migrations/20260726195450_0ffeebc4-7139-4dfa-8465-d41d8193ea38.sql |
| `validate_email` | INVOKER | **NAO** | supabase/migrations/20250103000000_triggers.sql |
| `validate_park_orbit` | SECURITY DEFINER | sim | supabase/migrations/20260726202218_619850bb-a4f2-4112-96d7-872649f70b37.sql |
| `validate_parked_call` | SECURITY DEFINER | sim | supabase/migrations/20260726202218_619850bb-a4f2-4112-96d7-872649f70b37.sql |
| `validate_phone` | INVOKER | **NAO** | supabase/migrations/20250103000000_triggers.sql |
| `validate_queue_audio_slots` | SECURITY DEFINER | sim | supabase/migrations/20260726201157_da4cb47a-5f61-4783-9786-eb99a7ee6bfc.sql |
| `validate_ring_group` | INVOKER | sim | supabase/migrations/20260726200037_ddb39a7d-1e45-4c97-be01-1923e0caea6d.sql |

## Jobs agendados (cron)

7 jobs, todos declarados via `SELECT cron.schedule(`. Nenhum `cron.unschedule` correspondente
existe no repositório.

| Job | Expressão | O que chama | Evidência arquivo:linha |
|---|---|---|---|
| `daily-cleanup-old-logs` | `15 3 * * *` | SQL: `SELECT public.cleanup_old_logs();` | `supabase/migrations/20260711185006_44492a26-e136-43de-93b9-066bed1b40a8.sql:10-14` |
| `weekly-pgss-reset` | `0 4 * * 0` | SQL: `SELECT pg_stat_statements_reset();` | `supabase/migrations/20260711194708_409831f1-bcdb-4529-ae31-eece4fe2a6e2.sql:19-23` |
| `weekly-vacuum-analyze-hot-tables` | `30 4 * * 0` | SQL: `VACUUM (ANALYZE)` em 10 tabelas (`audit_logs`, `performance_metrics`, `call_quality_metrics`, `rate_limit_logs`, `notifications`, `call_sessions`, `dialer_queue`, `voip_quality_alerts`, `login_attempts`, `call_control_audit_logs`) | `supabase/migrations/20260711194708_409831f1-bcdb-4529-ae31-eece4fe2a6e2.sql:26-41` |
| `weekly-bloat-monitor` | `0 5 * * 0` | SQL: `SELECT public.notify_bloat_hotspots();` | `supabase/migrations/20260712110237_ae094d69-c026-433d-b7b1-232eb615e4cd.sql:107-111` |
| `weekly-idle-index-monitor` | `30 5 * * 0` | SQL: `SELECT public.notify_idle_indexes();` | `supabase/migrations/20260712112627_4ad8101d-5e02-4b1c-a570-f8338fc90f70.sql:93-97` |
| `quarterly-reset-index-stats` | `0 6 1 1,4,7,10 *` | SQL: `SELECT public.reset_public_index_stats();` | `supabase/migrations/20260712115343_8332dd3d-29a2-4017-954c-edc625f7029b.sql:105-109` |
| `data-lake-flush-daily` | `0 3 * * *` | **Edge function** via `net.http_post` → `https://dyibdjwuoibwwpidgsxu.supabase.co/functions/v1/data-lake-flush`, body `{'trigger':'cron'}` | `supabase/migrations/20260723114001_09502153-d05c-40eb-be5f-f84f78526fb3.sql:46-57` |

**Achado crítico neste bloco:** o job `data-lake-flush-daily` carrega um **JWT anon completo
hardcoded** no header `Authorization` (`supabase/migrations/20260723114001_09502153-d05c-40eb-be5f-f84f78526fb3.sql:53`),
e a mesma chave aparece de novo numa variável da própria migration
(`...20260723114001_...:14`, `v_key TEXT := 'eyJhbGciOi...'`). O `ref` do projeto
(`dyibdjwuoibwwpidgsxu`) também está fixo na URL — a migration não é portável entre ambientes,
e o segredo está versionado em git em texto claro.

## DRIFT types.ts × migrations

- Tabelas declaradas em `supabase/migrations/*.sql`: **162**
- Tabelas tipadas em `src/integrations/supabase/types.ts` (bloco `Tables:`, linhas 16–7443): **159**
- Interseção: **156**

### (A) Em `types.ts` SEM migration correspondente — 3

O ambiente tem objetos que o repositório **não cria**.

| Tabela | Evidência em types.ts | Referência no repo |
|---|---|---|
| `geo_access_logs` | `src/integrations/supabase/types.ts` (bloco `Tables:`) | políticas manipuladas em `supabase/migrations/20260315143859_53accc1d-5241-481f-bb43-a20c0123dede.sql:7-9`, `20260404152930_a0c485a8-be6e-4585-9210-965230883732.sql:58-60`, `20260404153313_5b939cc2-dab9-4e2c-a217-37944746d340.sql:22-23` — **nenhum `CREATE TABLE`** |
| `geo_restrictions` | idem | `supabase/migrations/20260404152930_a0c485a8-be6e-4585-9210-965230883732.sql:76-78`, `20260417124027_d4a7b08a-d968-4234-b8c2-3f30e9e7bcad.sql:11-13` — **nenhum `CREATE TABLE`** |
| `geo_settings` | idem | `supabase/migrations/20260404151943_4d4acd99-8f24-419a-b876-9385032bcac4.sql:90`, `20260418123303_f221bac1-e35e-4ab2-a93e-3dc4e1e16600.sql:17-25` — **nenhum `CREATE TABLE`** |

Consequência direta: **o ambiente não é reconstruível a partir do repositório.** Não é só que
as tabelas faltam — 8 migrations executam `CREATE POLICY` / `ALTER POLICY` / `DROP POLICY ...
ON public.geo_*`, e `DROP POLICY IF EXISTS ... ON <relação inexistente>` **aborta com erro**
em Postgres (o `IF EXISTS` cobre a política, não a tabela). Um `supabase db reset` a partir
deste repositório falha. As três tabelas são efetivamente usadas em produção:
`src/hooks/useGeoBlocking.ts` e `supabase/functions/validate-geo/index.ts` leem/escrevem nelas.

### (B) Em migrations SEM entrada em `types.ts` — 6

`types.ts` desatualizado, ou objetos que existem só no repositório e nunca foram aplicados.

| Tabela | Migration de origem |
|---|---|
| `call_records` | `supabase/migrations/20250102000000_hello_production.sql:20` |
| `entity_versions` | `supabase/migrations/20241231000001_entity_versions.sql:2` |
| `migration_rollbacks` | `supabase/migrations/20250101000000_versioning.sql:18` |
| `queue_items` | `supabase/migrations/20250102000000_hello_production.sql:37` |
| `saved_filters` | `supabase/migrations/20241231000000_saved_filters.sql:8` |
| `schema_migrations` | `supabase/migrations/20250101000000_versioning.sql:7` |

As 6 vêm exclusivamente das 7 migrations mais antigas (prefixos `202412…`/`20250102`…), as mesmas
que fogem do padrão de nomenclatura da ferramenta. A leitura mais provável — e que **precisa de
confirmação contra o banco real, o que esta auditoria não pode fazer** — é que esse bloco inicial
nunca foi aplicado ao ambiente. As 4 views daquele mesmo bloco também não aparecem em `types.ts`,
o que reforça a hipótese.

### (C) Funções

54 funções expostas no bloco `Functions:` de `types.ts` (linhas 7458–7647). **Todas as 54 têm
`CREATE FUNCTION` correspondente** nas migrations — sem drift aqui.

## Tabelas sem RLS

Critério: criadas por `CREATE TABLE` e sem `ENABLE ROW LEVEL SECURITY` **e** sem nenhuma
`CREATE POLICY`. Resultado: **2 de 162**.

| Tabela | Evidência da criação | RLS | Policies |
|---|---|---|---|
| `schema_migrations` | `supabase/migrations/20250101000000_versioning.sql:7` | ausente | 0 |
| `migration_rollbacks` | `supabase/migrations/20250101000000_versioning.sql:18` | ausente | 0 |

São tabelas de controle interno de migração, sem PII, e provavelmente nunca aplicadas (ver
DRIFT-B) — risco baixo em si. **O risco real de RLS neste repositório não está na ausência de
RLS, e sim em políticas habilitadas porém abertas.** Ver a seção seguinte.

### RLS ligado mas efetivamente aberto (mais grave que "sem RLS")

Políticas `FOR ALL USING (true)` **sem cláusula `TO`** — valem para qualquer role, inclusive
`anon` — que **nunca são removidas** por nenhuma migration posterior
(`grep -c 'DROP POLICY IF EXISTS "Allow all"' → 0`):

| Tabela | Política | Evidência |
|---|---|---|
| `contacts` | `"Allow all" FOR ALL USING (true)` | `supabase/migrations/20250102000000_hello_production.sql:76` |
| `call_records` | `"Allow all" FOR ALL USING (true)` | `supabase/migrations/20250102000000_hello_production.sql:77` |
| `queue_items` | `"Allow all" FOR ALL USING (true)` | `supabase/migrations/20250102000000_hello_production.sql:78` |
| `agents` | `"Allow all" FOR ALL USING (true)` | `supabase/migrations/20250102000000_hello_production.sql:79` |
| `entity_versions` | `"Users can view versions" FOR SELECT USING (true)` | `supabase/migrations/20241231000001_entity_versions.sql:19` |

Comparativo: as políticas irmãs `"Allow all access to call_sessions"` (e transcriptions/analyses/
summaries) **foram** revogadas em
`supabase/migrations/20251225181949_a8f1c32a-4aeb-4156-9cb1-6e71955acb4e.sql:5-14`, e as
`"Allow public …"` em `supabase/migrations/20251224124524_38968a99-a0bc-4cff-a5c2-2fd2590d2e8e.sql:29-32,43-46,…`.
As cinco acima ficaram para trás nessa faxina. Atenuante importante: `contacts`, `agents` e
`entity_versions` recebem depois políticas restritivas adicionais — mas RLS no Postgres é
**OR entre políticas permissivas**, então uma política `USING (true)` sobrevivente anula as
restritivas da mesma tabela.

Também merecem revisão duas políticas `FOR ALL USING (true)` explícitas em tabelas de credenciais:
`"System can manage password_reset_tokens"` (`supabase/migrations/20251231115936_0cbef64e-8440-4db5-8f3d-164a7da98921.sql:378-380`)
e `"System can manage email_verification_tokens"` (idem `:385-387`) — sem `TO service_role`,
qualquer sessão autenticada lê tokens de reset de senha de qualquer usuário.

## Tabelas sem consumidor no código

Método: para cada uma das 162 tabelas,
`grep -rlF "from('<t>')" src supabase/functions` e `grep -rlF "'<t>'" / "\"<t>\"" src supabase/functions`.

**Zero referência de qualquer tipo — 13 tabelas (8,0% de 162):**

| Tabela | Migration de origem | Leitura |
|---|---|---|
| `account_journey_history` | `supabase/migrations/20260416235642_e9fe6fa3-4307-49a3-9253-09718c07703d.sql:184` | feature dormente (Customer Success) |
| `customer_journey_stages` | `supabase/migrations/20260416235642_e9fe6fa3-4307-49a3-9253-09718c07703d.sql:146` | dormente — inclui seed de 6 estágios (`:175-181`) que ninguém lê |
| `deal_revenue_snapshots` | `supabase/migrations/20260711153050_e3d3822b-d711-42cf-8514-1f348c336641.sql:5` | dormente |
| `kb_article_history` | `supabase/migrations/20260507221454_8ee1f1c8-e52c-42d1-93f5-136662aa8772.sql:2` | dormente |
| `queue_skill_requirements` | `supabase/migrations/20260417000338_f03874c1-f8d9-4f2d-bf5c-20ad794cce6f.sql:101` | dormente |
| `call_records` | `supabase/migrations/20250102000000_hello_production.sql:20` | bloco inicial órfão (também fora de `types.ts`) |
| `queue_items` | `supabase/migrations/20250102000000_hello_production.sql:37` | idem |
| `saved_filters` | `supabase/migrations/20241231000000_saved_filters.sql:8` | idem |
| `entity_versions` | `supabase/migrations/20241231000001_entity_versions.sql:2` | idem |
| `schema_migrations` | `supabase/migrations/20250101000000_versioning.sql:7` | infra de migração caseira |
| `migration_rollbacks` | `supabase/migrations/20250101000000_versioning.sql:18` | idem |
| `password_reset_tokens` | `supabase/migrations/20251231115936_0cbef64e-8440-4db5-8f3d-164a7da98921.sql:100` | **atenção**: tabela de credenciais criada, RLS aberta, e ninguém no código a usa |
| `email_verification_tokens` | `supabase/migrations/20251231115936_0cbef64e-8440-4db5-8f3d-164a7da98921.sql:111` | idem |

**Sem `from('<tabela>')` mas citadas como string — 10 tabelas** (podem ser acessadas por RPC,
por nome dinâmico, ou apenas mencionadas em texto; exigem verificação manual antes de
qualquer remoção): `account_lockouts`, `cadence_enrollments`, `cadence_steps`, `cadences`,
`call_playlists`, `deals` (12 arquivos), `index_drop_audit`, `playlist_items`, `tracker_matches`,
`trackers`.

Total sem acesso via `from()`: **23 de 162 (14,2%)**.

Limitação declarada: o teste não cobre acesso por RPC (`rpc('fn')` cuja função interna
consulta a tabela) nem construção dinâmica de nome de tabela. As 13 da primeira lista são
seguras como "sem consumidor direto"; as 10 da segunda são apenas indícios.

## Migrations suspeitas

### 1. Timestamp duplicado — colisão de ordem

`20250102000000_hello_production.sql` e `20250102000000_performance_indexes.sql` têm **o mesmo
timestamp**. A ordem de aplicação entre elas depende do desempate alfabético do nome, não da
intenção. `hello_production` cria as tabelas; `performance_indexes` cria índices sobre elas — se
a ordem inverter, quebra.

### 2. Oito migrations fora do padrão de nomenclatura

Padrão da ferramenta: `<timestamp>_<uuid>.sql`. Fogem dele:
`20241231000000_saved_filters.sql`, `20241231000001_entity_versions.sql`,
`20250101000000_versioning.sql`, `20250102000000_hello_production.sql`,
`20250102000000_performance_indexes.sql`, `20250103000000_triggers.sql`,
`20250104000000_query_monitoring.sql` e `20260805130000_fix_user_profiles_recursion.sql`.

As 7 primeiras formam o bloco inicial escrito à mão — e são exatamente as que produzem o
DRIFT-B (6 tabelas + 4 views ausentes de `types.ts`). `20250101000000_versioning.sql:2` traz o
comentário `-- Run: psql -d hello < supabase/migrations/...`, ou seja, foi desenhada para
execução manual via `psql`, fora do pipeline de migrations.

### 3. `20260805130000_fix_user_profiles_recursion.sql` — investigação específica

Migration de 52 linhas, escrita à mão, **datada 10 dias depois da última migration da
ferramenta** (`20260726202240`), e a única do repositório com esse padrão de nome recente.
Conteúdo (lido integralmente):

- `:9-14` — derruba **6 políticas de UPDATE** em `public.user_profiles`
  (`"Users can update own non-sensitive fields"`, `"Prevent role escalation via immutable check"`,
  `"Block sensitive field changes by non-admins"`, `"Admins can update any profile"`,
  `"Prevent self role change"`, `"Prevent role change by non-admins"`).
- `:21-33` — recria apenas **2**: `"Users update own profile"` (`USING/WITH CHECK auth.uid() = id`)
  e `"Admins update any profile"` (via `is_admin_user()`).
- `:39-52` — bloco `DO $$` que só cria o trigger `prevent_role_escalation_trigger` se ele
  ainda não existir em `pg_trigger`.

Três problemas:

1. **Perda líquida de defesa.** As políticas removidas bloqueavam alteração de campos sensíveis
   *na própria política*; a substituta `"Users update own profile"` permite ao usuário atualizar
   **qualquer coluna** da própria linha. A proteção de `role` passa a depender exclusivamente do
   trigger `prevent_role_escalation`. Se esse trigger não estiver ativo no ambiente, há escalada
   de privilégio direta.
2. **A migration admite que não sabe o estado do banco.** O bloco `DO $$ ... IF NOT EXISTS
   (SELECT 1 FROM pg_trigger ...)` (`:41-50`) e o comentário `"the original trigger is
   idempotent … we just confirm it here"` (`:36-38`) mostram uma migration escrita **em cima de um
   ambiente cujo estado o autor não conseguia derivar do repositório**. Isso é sintoma do mesmo
   problema do DRIFT: o repo não é a fonte da verdade.
3. **Sintoma de churn crônico em `user_profiles`.** Esta é a tabela mais retrabalhada do
   repositório: **31 `DROP POLICY`** e **67 `CREATE POLICY`** espalhados por **14 migrations**
   distintas, contra 26 políticas efetivas hoje. Recursão infinita em RLS é consequência
   previsível de camadas sucessivas de política sobre a mesma tabela.

### 4. `IF NOT EXISTS` mascarando divergência — 13 tabelas recriadas

393 ocorrências de `IF NOT EXISTS` e 444 de `IF EXISTS` em 13.329 linhas. Como `CREATE TABLE IF
NOT EXISTS` é **no-op silencioso** quando a tabela já existe (e ignora diferenças de colunas), as
13 tabelas abaixo têm definição declarada em mais de um arquivo, e **qual definição vale depende
da ordem de aplicação**, não do repositório:

| Tabela | Migrations que a declaram |
|---|---|
| `agents` (3x) | `20250102000000_hello_production.sql`, `20251223203745_ffdf3a72-…sql`, `20260515170309_98507006-…sql` |
| `contacts` | `20250102000000_hello_production.sql`, `20251223013407_14e5788a-…sql` |
| `user_profiles` | `20251224124237_40fde4e2-…sql`, `20260515170309_98507006-…sql` |
| `user_roles` | `20251231115936_0cbef64e-…sql`, `20260515170309_98507006-…sql` |
| `call_sessions` | `20251222153717_0868819c-…sql`, `20260515170309_98507006-…sql` |
| `hold_events` | `20251223211907_9badc1f9-…sql`, `20260515170309_98507006-…sql` |
| `call_quality_metrics` | `20260417164448_f2a7d0e1-…sql`, `20260515170309_98507006-…sql` |
| `voip_trunks` | `20260418141900_bac7392a-…sql`, `20260515170309_98507006-…sql` |
| `agent_trunk_assignments` | `20260418141900_bac7392a-…sql`, `20260515170309_98507006-…sql` |
| `voip_trunk_usage_metrics` | `20260418144103_3396eae6-…sql`, `20260515170309_98507006-…sql` |
| `call_control_audit_logs` | `20260509184955_dfe329e5-…sql`, `20260515170309_98507006-…sql` |
| `system_settings` | `20260507220325_dcddf456-…sql`, `20260515171135_134e605d-…sql` |
| `webhook_secrets` | `20260523172256_ea1ae0b2-…sql`, `20260523173643_89df4fa0-…sql` |

`supabase/migrations/20260515170309_98507006-514f-467b-b3e7-a1f30f5377d4.sql` (157 linhas)
sozinha redeclara **9** dessas tabelas com `CREATE TABLE IF NOT EXISTS`, incluindo
`voip_trunks` com a coluna `sip_password_encrypted` (`:14`). É uma migration de
"garantir que existe" — ou seja, uma tentativa de reconciliar repositório com ambiente, não uma
mudança de schema. Confirma que a divergência era conhecida e foi contornada em vez de resolvida.

### 5. DROPs

- **`DROP TABLE`: nenhuma tabela é destruída.** As 20 ocorrências de "DROP TABLE" são todas
  `ALTER PUBLICATION supabase_realtime DROP TABLE …` (ex.:
  `supabase/migrations/20260403173838_bac4beba-8928-466e-bf28-80f2bcc5f31a.sql:19-22`), isto é,
  remoção da publicação realtime, não do objeto. Falso positivo clássico de grep — declarado.
- **`DROP FUNCTION`: zero.** As 93 funções só são substituídas por `CREATE OR REPLACE`.
- **`DROP POLICY`: 361 ocorrências** contra 714 `CREATE POLICY` — metade das políticas escritas
  neste repositório existe para desfazer uma política anterior.
- **`DROP INDEX`: 47 statements reais**, dos quais **45 derrubam índices criados pelo próprio
  repositório**. Concentrados em `supabase/migrations/20260713124448_2dbeaa00-a7ba-4c4e-a7c2-a4166a3a3abc.sql`
  (36 drops reais; as outras 36 ocorrências de "DROP INDEX" nesse arquivo são linhas de `INSERT`
  em `index_drop_audit`, não comandos — verificado). Sobre 383 índices criados, ~12% foram
  criados e depois removidos dentro do mesmo repositório.

### 6. Funções `SECURITY DEFINER` sem `SET search_path` — 4 de 73

`SECURITY DEFINER` sem `search_path` fixo é vetor de escalada por sequestro de schema.

| Função | Última definição |
|---|---|
| `check_rls_enabled` | `supabase/migrations/20260515172240_fa26b542-4abd-4df6-8bf6-37088ffbe1cb.sql` |
| `process_audit_log` | `supabase/migrations/20260522152441_40b20906-baeb-4a9d-b7eb-d230a616e845.sql` |
| `log_critical_rls_event` | `supabase/migrations/20260522194835_bedfae5d-959f-47e1-be6a-e9bb2bbe380e.sql` |
| `log_rls_event` | `supabase/migrations/20260522202120_9602a6a5-b48f-402b-a194-f1c009763fbc.sql` |

Ironia registrada: as quatro são justamente as funções de **auditoria de RLS**.

### 7. Geração dinâmica de políticas em runtime

`supabase/migrations/20260711192700_6e6ca80d-e218-4d90-b8d7-f8dbb4e41229.sql` contém uma função
que monta `CREATE POLICY %I ON %I.%I …` via `format()` a partir de `pg_policies`. Ou seja, existe
código que **reescreve políticas de RLS em tempo de execução**, a partir do estado do banco, não
do repositório. Qualquer inventário estático de RLS (inclusive este) é, por construção,
incompleto enquanto essa função puder rodar.

## Achados graves

**G1 — O ambiente não é reconstruível a partir do repositório (severidade: crítica).**
Três tabelas em uso produtivo (`geo_restrictions`, `geo_settings`, `geo_access_logs`) existem em
`types.ts`, são lidas por `src/hooks/useGeoBlocking.ts` e `supabase/functions/validate-geo/index.ts`,
e **não têm `CREATE TABLE` em nenhuma das 207 migrations**. Pior: 8 migrations executam
`DROP POLICY IF EXISTS … ON public.geo_*`, comando que **falha** contra relação inexistente — um
`db reset` a partir deste repo aborta. Não há caminho de recuperação de desastre a partir do git.

**G2 — Segredo de produção versionado em texto claro (severidade: crítica).**
`supabase/migrations/20260723114001_09502153-d05c-40eb-be5f-f84f78526fb3.sql:14` e `:53` contêm
um JWT anon completo e o `ref` do projeto (`dyibdjwuoibwwpidgsxu`) hardcoded no job cron
`data-lake-flush-daily`. Está no histórico do git; rotacionar a chave não remove o vazamento,
e a migration não roda em nenhum outro ambiente.

**G3 — Políticas `USING (true)` sobreviventes em tabelas de dados pessoais e de credenciais
(severidade: alta).** `contacts`, `call_records`, `queue_items` e `agents` mantêm
`"Allow all" FOR ALL USING (true)` sem cláusula `TO`
(`supabase/migrations/20250102000000_hello_production.sql:76-79`), nunca revogadas — enquanto as
políticas irmãs de `call_sessions` e afins foram revogadas em `20251225181949_…:5-14`. Como RLS
combina políticas permissivas por OR, essas quatro anulam as ~50 políticas restritivas escritas
depois para as mesmas tabelas. Some-se `"System can manage password_reset_tokens" FOR ALL
USING (true)` (`20251231115936_…:378-380`): tokens de recuperação de senha legíveis por qualquer
sessão autenticada.

**Menções honrosas** (graves, mas abaixo das três acima): a perda líquida de defesa em
`user_profiles` introduzida por `20260805130000_fix_user_profiles_recursion.sql:9-33`; as 13
tabelas com definição duplicada sob `CREATE TABLE IF NOT EXISTS`; as 4 funções de auditoria de
RLS `SECURITY DEFINER` sem `search_path`.
