# public.coaching_timestamps

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
| 2 | `call_session_id` | `uuid` | não |  |  |  |
| 3 | `agent_name` | `text` | sim |  |  |  |
| 4 | `timestamp_seconds` | `numeric` | não | `0` |  |  |
| 5 | `feedback_type` | `text` | não |  |  |  |
| 6 | `message` | `text` | não |  |  |  |
| 7 | `severity` | `text` | não | `'medium'::text` |  |  |
| 8 | `category` | `text` | sim |  |  |  |
| 9 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| coaching_timestamps_call_session_id_fkey | FOREIGN KEY | `FOREIGN KEY (call_session_id) REFERENCES call_sessions(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| coaching_timestamps_feedback_type_check | CHECK | `CHECK (feedback_type = ANY (ARRAY['positive'::text, 'improvement'::text, 'warning'::text, 'tip'::text]))` |  |  | sim |
| coaching_timestamps_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| coaching_timestamps_severity_check | CHECK | `CHECK (severity = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| coaching_timestamps_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX coaching_timestamps_pkey ON public.coaching_timestamps USING btree (id)` |
| idx_coaching_timestamps_call_session_id | btree | call_session_id | não | sim |  | `CREATE INDEX idx_coaching_timestamps_call_session_id ON public.coaching_timestamps USING btree (call_session_id)` |
| idx_coaching_ts_agent | btree | agent_name | não | sim |  | `CREATE INDEX idx_coaching_ts_agent ON public.coaching_timestamps USING btree (agent_name)` |


## Policies (RLS)

### `Admin supervisor insert coaching ts`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `is_admin_or_supervisor()` |

### `Admin/supervisor delete coaching ts`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | public |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK |  |

### `View coaching ts own or supervisor`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(is_admin_or_supervisor() OR can_access_agent_data(agent_name))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
