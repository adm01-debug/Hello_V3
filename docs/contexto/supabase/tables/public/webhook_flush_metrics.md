# public.webhook_flush_metrics

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 2 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | sim |  |  |  |
| 3 | `pending_before` | `integer` | não | `0` |  |  |
| 4 | `sent` | `integer` | não | `0` |  |  |
| 5 | `failed` | `integer` | não | `0` |  |  |
| 6 | `remaining` | `integer` | não | `0` |  |  |
| 7 | `oldest_age_ms` | `bigint` | não | `0` |  |  |
| 8 | `duration_ms` | `integer` | não | `0` |  |  |
| 9 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 10 | `endpoint_hash` | `text` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| webhook_flush_metrics_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| webhook_flush_metrics_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_webhook_flush_metrics_created_at | btree | created_at | não | sim |  | `CREATE INDEX idx_webhook_flush_metrics_created_at ON public.webhook_flush_metrics USING btree (created_at DESC)` |
| idx_webhook_flush_metrics_endpoint_hash_created_at | btree | endpoint_hash, created_at | não | sim | `(endpoint_hash IS NOT NULL)` | `CREATE INDEX idx_webhook_flush_metrics_endpoint_hash_created_at ON public.webhook_flush_metrics USING btree (endpoint_hash, created_at DESC) WHERE (endpoint_hash IS NOT NULL)` |
| idx_webhook_flush_metrics_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_webhook_flush_metrics_user_id ON public.webhook_flush_metrics USING btree (user_id)` |
| webhook_flush_metrics_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX webhook_flush_metrics_pkey ON public.webhook_flush_metrics USING btree (id)` |


## Policies (RLS)

### `admins_supervisors_read_flush_metrics`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK |  |

### `authenticated_insert_own_flush_metrics`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_webhook_failure_spike | AFTER | INSERT | ROW | enabled | public.notify_webhook_failure_spike |


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
