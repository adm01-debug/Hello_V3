# public.call_recordings

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
| 2 | `call_session_id` | `uuid` | sim |  |  |  |
| 3 | `conference_id` | `text` | sim |  |  |  |
| 4 | `file_path` | `text` | não |  |  |  |
| 5 | `file_size_bytes` | `bigint` | sim |  |  |  |
| 6 | `duration_seconds` | `integer` | sim |  |  |  |
| 7 | `recorded_at` | `timestamp with time zone` | não | `now()` |  |  |
| 8 | `participant_count` | `integer` | sim | `1` |  |  |
| 9 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 10 | `source` | `text` | não | `'internal'::text` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| call_recordings_call_session_id_fkey | FOREIGN KEY | `FOREIGN KEY (call_session_id) REFERENCES call_sessions(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| call_recordings_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| call_recordings_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX call_recordings_pkey ON public.call_recordings USING btree (id)` |
| idx_call_recordings_call_session_id | btree | call_session_id | não | sim |  | `CREATE INDEX idx_call_recordings_call_session_id ON public.call_recordings USING btree (call_session_id)` |
| idx_call_recordings_source | btree | source | não | sim |  | `CREATE INDEX idx_call_recordings_source ON public.call_recordings USING btree (source)` |


## Policies (RLS)

### `Admins can manage call_recordings`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK |  |

### `Strict isolation: Agents view own recordings`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(is_admin_or_supervisor() OR (EXISTS ( SELECT 1    FROM call_sessions cs   WHERE ((cs.id = call_recordings.call_session_id) AND (cs.agent_name = get_user_agent_name())))))` |
| WITH CHECK |  |

### `Validated insert call_recordings`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(is_admin_or_supervisor() OR (EXISTS ( SELECT 1    FROM call_sessions cs   WHERE ((cs.id = call_recordings.call_session_id) AND (cs.agent_name = get_user_agent_name())))))` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| audit_call_recordings_delete | BEFORE | DELETE | ROW | enabled | public.log_critical_rls_event |


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
