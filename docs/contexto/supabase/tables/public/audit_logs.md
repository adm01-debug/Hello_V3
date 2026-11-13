# public.audit_logs

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | sim |
| policies | 4 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | sim |  |  |  |
| 3 | `user_email` | `text` | sim |  |  |  |
| 4 | `user_role` | `text` | sim |  |  |  |
| 5 | `action` | `text` | não |  |  |  |
| 6 | `resource_type` | `text` | não |  |  |  |
| 7 | `resource_id` | `text` | sim |  |  |  |
| 8 | `details` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 9 | `ip_address` | `text` | sim |  |  |  |
| 10 | `user_agent` | `text` | sim |  |  |  |
| 11 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| audit_logs_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| audit_logs_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| audit_logs_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX audit_logs_pkey ON public.audit_logs USING btree (id)` |
| idx_audit_logs_action | btree | action | não | sim |  | `CREATE INDEX idx_audit_logs_action ON public.audit_logs USING btree (action)` |
| idx_audit_logs_created_at | btree | created_at | não | sim |  | `CREATE INDEX idx_audit_logs_created_at ON public.audit_logs USING btree (created_at DESC)` |
| idx_audit_logs_created_brin | brin | created_at | não | sim |  | `CREATE INDEX idx_audit_logs_created_brin ON public.audit_logs USING brin (created_at) WITH (pages_per_range='32')` |
| idx_audit_logs_resource_type | btree | resource_type | não | sim |  | `CREATE INDEX idx_audit_logs_resource_type ON public.audit_logs USING btree (resource_type)` |
| idx_audit_logs_resource_type_created | btree | resource_type, created_at | não | sim |  | `CREATE INDEX idx_audit_logs_resource_type_created ON public.audit_logs USING btree (resource_type, created_at DESC)` |
| idx_audit_logs_user_date | btree | user_id, created_at | não | sim |  | `CREATE INDEX idx_audit_logs_user_date ON public.audit_logs USING btree (user_id, created_at DESC)` |
| idx_audit_logs_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_audit_logs_user_id ON public.audit_logs USING btree (user_id)` |


## Policies (RLS)

### `Admins can view audit_logs`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(get_user_role() = 'admin'::text)` |
| WITH CHECK |  |

### `Block direct delete audit_logs`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `false` |
| WITH CHECK |  |

### `Block direct insert audit_logs`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `false` |

### `Deny direct insert audit_logs`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | public |
| USING |  |
| WITH CHECK | `false` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| check_suspicious_activity_trigger | AFTER | INSERT | ROW | enabled | public.check_suspicious_activity |


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
