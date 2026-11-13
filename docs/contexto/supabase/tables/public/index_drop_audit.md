# public.index_drop_audit

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 1 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `index_name` | `text` | não |  |  |  |
| 3 | `table_name` | `text` | não |  |  |  |
| 4 | `sql_generated` | `text` | não |  |  |  |
| 5 | `admin_id` | `uuid` | sim |  |  |  |
| 6 | `admin_email` | `text` | sim |  |  |  |
| 7 | `action` | `text` | não | `'copy'::text` |  |  |
| 8 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| index_drop_audit_action_check | CHECK | `CHECK (action = ANY (ARRAY['copy'::text, 'execute'::text]))` |  |  | sim |
| index_drop_audit_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_index_drop_audit_admin_time | btree | admin_id, created_at | não | sim | `(admin_id IS NOT NULL)` | `CREATE INDEX idx_index_drop_audit_admin_time ON public.index_drop_audit USING btree (admin_id, created_at DESC) WHERE (admin_id IS NOT NULL)` |
| idx_index_drop_audit_created_at | btree | created_at | não | sim |  | `CREATE INDEX idx_index_drop_audit_created_at ON public.index_drop_audit USING btree (created_at DESC)` |
| index_drop_audit_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX index_drop_audit_pkey ON public.index_drop_audit USING btree (id)` |


## Policies (RLS)

### `Admins podem ler histórico de DROP INDEX`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `is_admin()` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_notify_suspicious_index_drop_activity | AFTER | INSERT | ROW | enabled | public.notify_suspicious_index_drop_activity |


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
