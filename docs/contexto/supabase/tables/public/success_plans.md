# public.success_plans

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
| 2 | `account_id` | `uuid` | não |  |  |  |
| 3 | `title` | `text` | não |  |  |  |
| 4 | `objective` | `text` | não |  |  |  |
| 5 | `business_outcome` | `text` | sim |  |  |  |
| 6 | `start_date` | `date` | não | `CURRENT_DATE` |  |  |
| 7 | `target_date` | `date` | não |  |  |  |
| 8 | `completed_at` | `timestamp with time zone` | sim |  |  |  |
| 9 | `status` | `text` | não | `'active'::text` |  |  |
| 10 | `progress_percent` | `integer` | sim | `0` |  |  |
| 11 | `owner_agent_name` | `text` | sim |  |  |  |
| 12 | `stakeholders` | `jsonb` | sim | `'[]'::jsonb` |  |  |
| 13 | `metadata` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 14 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 15 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 16 | `version` | `integer` | não | `1` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| success_plans_account_id_fkey | FOREIGN KEY | `FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| success_plans_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| success_plans_progress_percent_check | CHECK | `CHECK (progress_percent >= 0 AND progress_percent <= 100)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.success_plan_milestones | success_plan_milestones_success_plan_id_fkey | success_plan_id | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_success_plans_account_id | btree | account_id | não | sim |  | `CREATE INDEX idx_success_plans_account_id ON public.success_plans USING btree (account_id)` |
| idx_success_plans_status | btree | status | não | sim |  | `CREATE INDEX idx_success_plans_status ON public.success_plans USING btree (status)` |
| success_plans_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX success_plans_pkey ON public.success_plans USING btree (id)` |


## Policies (RLS)

### `Admin/supervisor full access on success plans`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK | `is_admin_or_supervisor()` |

### `CSM manages own success plans`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(owner_agent_name = get_user_agent_name())` |
| WITH CHECK | `(owner_agent_name = get_user_agent_name())` |

### `CSM views success plans for their accounts`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((owner_agent_name = get_user_agent_name()) OR (EXISTS ( SELECT 1    FROM accounts a   WHERE ((a.id = success_plans.account_id) AND (a.csm_agent_name = get_user_agent_name())))))` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| enforce_optimistic_lock_success_plans | BEFORE | UPDATE | ROW | enabled | public.enforce_optimistic_lock |
| update_success_plans_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
