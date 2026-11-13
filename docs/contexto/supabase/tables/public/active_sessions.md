# public.active_sessions

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
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `session_token` | `text` | não |  |  |  |
| 4 | `ip_address` | `text` | sim |  |  |  |
| 5 | `user_agent` | `text` | sim |  |  |  |
| 6 | `device_info` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 7 | `location` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 8 | `is_active` | `boolean` | sim | `true` |  |  |
| 9 | `last_activity_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 10 | `expires_at` | `timestamp with time zone` | sim |  |  |  |
| 11 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| active_sessions_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| active_sessions_session_token_key | UNIQUE | `UNIQUE (session_token)` |  |  | sim |
| active_sessions_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| active_sessions_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX active_sessions_pkey ON public.active_sessions USING btree (id)` |
| active_sessions_session_token_key | btree | session_token | sim | sim |  | `CREATE UNIQUE INDEX active_sessions_session_token_key ON public.active_sessions USING btree (session_token)` |
| idx_active_sessions_token | btree | session_token | não | sim |  | `CREATE INDEX idx_active_sessions_token ON public.active_sessions USING btree (session_token)` |
| idx_active_sessions_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_active_sessions_user_id ON public.active_sessions USING btree (user_id)` |


## Policies (RLS)

### `Admins can view all sessions`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |
| WITH CHECK |  |

### `Users can manage their own sessions`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
