# public.renewals

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
| 3 | `renewal_type` | `text` | não | `'renewal'::text` |  |  |
| 4 | `current_value` | `numeric(12,2)` | não | `0` |  |  |
| 5 | `proposed_value` | `numeric(12,2)` | não | `0` |  |  |
| 6 | `probability` | `integer` | não | `50` |  |  |
| 7 | `status` | `text` | não | `'open'::text` |  |  |
| 8 | `due_date` | `date` | não |  |  |  |
| 9 | `closed_at` | `timestamp with time zone` | sim |  |  |  |
| 10 | `owner_agent_name` | `text` | sim |  |  |  |
| 11 | `notes` | `text` | sim |  |  |  |
| 12 | `loss_reason` | `text` | sim |  |  |  |
| 13 | `metadata` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 14 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 15 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| renewals_account_id_fkey | FOREIGN KEY | `FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| renewals_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| renewals_probability_check | CHECK | `CHECK (probability >= 0 AND probability <= 100)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_renewals_account_id | btree | account_id | não | sim |  | `CREATE INDEX idx_renewals_account_id ON public.renewals USING btree (account_id)` |
| idx_renewals_due | btree | due_date | não | sim | `(status = 'open'::text)` | `CREATE INDEX idx_renewals_due ON public.renewals USING btree (due_date) WHERE (status = 'open'::text)` |
| idx_renewals_status | btree | status | não | sim |  | `CREATE INDEX idx_renewals_status ON public.renewals USING btree (status)` |
| renewals_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX renewals_pkey ON public.renewals USING btree (id)` |


## Policies (RLS)

### `Admin/supervisor full access on renewals`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK | `is_admin_or_supervisor()` |

### `CSM can update their renewals`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(owner_agent_name = get_user_agent_name())` |
| WITH CHECK | `(owner_agent_name = get_user_agent_name())` |

### `CSM can view their renewals`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((owner_agent_name = get_user_agent_name()) OR (EXISTS ( SELECT 1    FROM accounts a   WHERE ((a.id = renewals.account_id) AND (a.csm_agent_name = get_user_agent_name())))))` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| update_renewals_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
