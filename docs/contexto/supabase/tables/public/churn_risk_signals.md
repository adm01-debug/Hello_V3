# public.churn_risk_signals

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
| 3 | `signal_type` | `text` | não |  |  |  |
| 4 | `severity` | `text` | não | `'medium'::text` |  |  |
| 5 | `score_delta` | `integer` | não | `0` |  |  |
| 6 | `description` | `text` | não |  |  |  |
| 7 | `evidence` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 8 | `detected_at` | `timestamp with time zone` | não | `now()` |  |  |
| 9 | `resolved_at` | `timestamp with time zone` | sim |  |  |  |
| 10 | `resolved_by` | `text` | sim |  |  |  |
| 11 | `resolution_notes` | `text` | sim |  |  |  |
| 12 | `is_active` | `boolean` | não | `true` |  |  |
| 13 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| churn_risk_signals_account_id_fkey | FOREIGN KEY | `FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| churn_risk_signals_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| churn_risk_signals_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX churn_risk_signals_pkey ON public.churn_risk_signals USING btree (id)` |
| idx_churn_risk_signals_account_id | btree | account_id | não | sim |  | `CREATE INDEX idx_churn_risk_signals_account_id ON public.churn_risk_signals USING btree (account_id)` |
| idx_churn_signals_active | btree | is_active, severity | não | sim |  | `CREATE INDEX idx_churn_signals_active ON public.churn_risk_signals USING btree (is_active, severity)` |


## Policies (RLS)

### `Admin/supervisor full access on churn signals`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK | `is_admin_or_supervisor()` |

### `CSM can resolve signals for their accounts`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(EXISTS ( SELECT 1    FROM accounts a   WHERE ((a.id = churn_risk_signals.account_id) AND (a.csm_agent_name = get_user_agent_name()))))` |
| WITH CHECK |  |

### `CSM can view signals for their accounts`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(EXISTS ( SELECT 1    FROM accounts a   WHERE ((a.id = churn_risk_signals.account_id) AND (a.csm_agent_name = get_user_agent_name()))))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
