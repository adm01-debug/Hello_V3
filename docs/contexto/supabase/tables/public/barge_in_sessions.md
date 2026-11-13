# public.barge_in_sessions

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
| 2 | `call_session_id` | `uuid` | não |  |  |  |
| 3 | `supervisor_name` | `text` | não |  |  |  |
| 4 | `agent_name` | `text` | não |  |  |  |
| 5 | `status` | `text` | não | `'active'::text` |  |  |
| 6 | `started_at` | `timestamp with time zone` | não | `now()` |  |  |
| 7 | `ended_at` | `timestamp with time zone` | sim |  |  |  |
| 8 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| barge_in_sessions_call_session_id_fkey | FOREIGN KEY | `FOREIGN KEY (call_session_id) REFERENCES call_sessions(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| barge_in_sessions_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| barge_in_sessions_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX barge_in_sessions_pkey ON public.barge_in_sessions USING btree (id)` |
| idx_barge_in_sessions_call_session_id | btree | call_session_id | não | sim |  | `CREATE INDEX idx_barge_in_sessions_call_session_id ON public.barge_in_sessions USING btree (call_session_id)` |


## Policies (RLS)

### `Involved parties view barge_in_sessions`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(is_admin_or_supervisor() OR (supervisor_name = get_user_agent_name()) OR (agent_name = get_user_agent_name()))` |
| WITH CHECK |  |

### `Supervisors can manage barge_in_sessions`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
