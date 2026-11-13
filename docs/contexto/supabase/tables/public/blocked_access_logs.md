# public.blocked_access_logs

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
| 3 | `user_email` | `text` | sim |  |  |  |
| 4 | `ip_address` | `text` | não |  |  |  |
| 5 | `reason` | `text` | não |  |  |  |
| 6 | `user_agent` | `text` | sim |  |  |  |
| 7 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 8 | `country` | `text` | sim |  |  |  |
| 9 | `city` | `text` | sim |  |  |  |
| 10 | `country_code` | `text` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| blocked_access_logs_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| blocked_access_logs_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| blocked_access_logs_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX blocked_access_logs_pkey ON public.blocked_access_logs USING btree (id)` |
| idx_blocked_access_logs_created_at | btree | created_at | não | sim |  | `CREATE INDEX idx_blocked_access_logs_created_at ON public.blocked_access_logs USING btree (created_at DESC)` |
| idx_blocked_access_logs_ip_address | btree | ip_address | não | sim |  | `CREATE INDEX idx_blocked_access_logs_ip_address ON public.blocked_access_logs USING btree (ip_address)` |
| idx_blocked_access_logs_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_blocked_access_logs_user_id ON public.blocked_access_logs USING btree (user_id)` |


## Policies (RLS)

### `Admins can view blocked_access_logs`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(get_user_role() = 'admin'::text)` |
| WITH CHECK |  |

### `Only admins can insert blocked access logs`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `is_admin_or_supervisor()` |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
