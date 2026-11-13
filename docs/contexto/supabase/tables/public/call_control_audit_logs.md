# public.call_control_audit_logs

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 4 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `call_session_id` | `text` | sim |  |  |  |
| 3 | `event_type` | `text` | não |  |  |  |
| 4 | `source` | `text` | não |  |  |  |
| 5 | `details` | `jsonb` | sim |  |  |  |
| 6 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| call_control_audit_logs_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| call_control_audit_logs_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX call_control_audit_logs_pkey ON public.call_control_audit_logs USING btree (id)` |
| idx_audit_logs_created | btree | created_at | não | sim |  | `CREATE INDEX idx_audit_logs_created ON public.call_control_audit_logs USING btree (created_at DESC)` |
| idx_audit_logs_session | btree | call_session_id | não | sim |  | `CREATE INDEX idx_audit_logs_session ON public.call_control_audit_logs USING btree (call_session_id)` |
| idx_call_control_audit_logs_created_brin | brin | created_at | não | sim |  | `CREATE INDEX idx_call_control_audit_logs_created_brin ON public.call_control_audit_logs USING brin (created_at) WITH (pages_per_range='32')` |


## Policies (RLS)

### `Admins can view call control audit`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(EXISTS ( SELECT 1    FROM user_roles   WHERE ((user_roles.user_id = ( SELECT auth.uid() AS uid)) AND (user_roles.role = ANY (ARRAY['admin'::app_role, 'supervisor'::app_role])))))` |
| WITH CHECK |  |

### `Admins have full access to call_control_audit_logs`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `is_admin()` |
| WITH CHECK |  |

### `Agents can view own audit logs`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(is_admin_or_supervisor() OR (source = (auth.jwt() ->> 'email'::text)))` |
| WITH CHECK |  |

### `Agents log own call control events`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(is_admin_or_supervisor() OR (source = (( SELECT auth.jwt() AS jwt) ->> 'email'::text)) OR (source = (( SELECT auth.uid() AS uid))::text))` |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
