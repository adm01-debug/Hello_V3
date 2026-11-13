# public.accounts

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 3 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `name` | `text` | não |  |  |  |
| 3 | `domain` | `text` | sim |  |  |  |
| 4 | `segment` | `text` | não | `'smb'::text` |  |  |
| 5 | `mrr` | `numeric(12,2)` | sim | `0` |  |  |
| 6 | `arr` | `numeric(12,2)` | sim | `0` |  |  |
| 7 | `contract_start_date` | `date` | sim |  |  |  |
| 8 | `contract_end_date` | `date` | sim |  |  |  |
| 9 | `csm_agent_name` | `text` | sim |  |  |  |
| 10 | `health_score` | `integer` | sim | `50` |  |  |
| 11 | `health_factors` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 12 | `churn_risk_score` | `integer` | sim | `0` |  |  |
| 13 | `current_stage` | `text` | sim | `'onboarding'::text` |  |  |
| 14 | `status` | `text` | não | `'active'::text` |  |  |
| 15 | `last_contact_at` | `timestamp with time zone` | sim |  |  |  |
| 16 | `next_review_at` | `timestamp with time zone` | sim |  |  |  |
| 17 | `notes` | `text` | sim |  |  |  |
| 18 | `tags` | `text[]` | sim |  |  |  |
| 19 | `metadata` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 20 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 21 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 22 | `version` | `integer` | não | `1` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| accounts_churn_risk_score_check | CHECK | `CHECK (churn_risk_score >= 0 AND churn_risk_score <= 100)` |  |  | sim |
| accounts_health_score_check | CHECK | `CHECK (health_score >= 0 AND health_score <= 100)` |  |  | sim |
| accounts_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.account_journey_history | account_journey_history_account_id_fkey | account_id | CASCADE |
| public.churn_risk_signals | churn_risk_signals_account_id_fkey | account_id | CASCADE |
| public.contacts | contacts_account_id_fkey | account_id | SET NULL |
| public.conversations | conversations_account_id_fkey | account_id | SET NULL |
| public.renewals | renewals_account_id_fkey | account_id | CASCADE |
| public.success_plans | success_plans_account_id_fkey | account_id | CASCADE |
| public.survey_responses | survey_responses_account_id_fkey | account_id | SET NULL |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| accounts_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX accounts_pkey ON public.accounts USING btree (id)` |
| idx_accounts_churn | btree | churn_risk_score | não | sim |  | `CREATE INDEX idx_accounts_churn ON public.accounts USING btree (churn_risk_score)` |
| idx_accounts_csm | btree | csm_agent_name | não | sim |  | `CREATE INDEX idx_accounts_csm ON public.accounts USING btree (csm_agent_name)` |
| idx_accounts_health | btree | health_score | não | sim |  | `CREATE INDEX idx_accounts_health ON public.accounts USING btree (health_score)` |
| idx_accounts_status | btree | status | não | sim |  | `CREATE INDEX idx_accounts_status ON public.accounts USING btree (status)` |


## Policies (RLS)

### `Admin/supervisor full access on accounts`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK | `is_admin_or_supervisor()` |

### `CSM can update their accounts`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(csm_agent_name = get_user_agent_name())` |
| WITH CHECK | `(csm_agent_name = get_user_agent_name())` |

### `CSM can view their accounts`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(csm_agent_name = get_user_agent_name())` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| enforce_optimistic_lock_accounts | BEFORE | UPDATE | ROW | enabled | public.enforce_optimistic_lock |
| update_accounts_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
