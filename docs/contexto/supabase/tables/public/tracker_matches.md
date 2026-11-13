# public.tracker_matches

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
| 2 | `tracker_id` | `uuid` | não |  |  |  |
| 3 | `call_session_id` | `uuid` | não |  |  |  |
| 4 | `agent_name` | `text` | sim |  |  |  |
| 5 | `matched_keyword` | `text` | sim |  |  |  |
| 6 | `quote` | `text` | sim |  |  |  |
| 7 | `timestamp_seconds` | `numeric` | sim |  |  |  |
| 8 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| tracker_matches_call_session_id_fkey | FOREIGN KEY | `FOREIGN KEY (call_session_id) REFERENCES call_sessions(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| tracker_matches_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| tracker_matches_tracker_id_fkey | FOREIGN KEY | `FOREIGN KEY (tracker_id) REFERENCES trackers(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_tracker_matches_agent | btree | agent_name | não | sim |  | `CREATE INDEX idx_tracker_matches_agent ON public.tracker_matches USING btree (agent_name)` |
| idx_tracker_matches_call_session_id | btree | call_session_id | não | sim |  | `CREATE INDEX idx_tracker_matches_call_session_id ON public.tracker_matches USING btree (call_session_id)` |
| idx_tracker_matches_tracker_id | btree | tracker_id | não | sim |  | `CREATE INDEX idx_tracker_matches_tracker_id ON public.tracker_matches USING btree (tracker_id)` |
| tracker_matches_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX tracker_matches_pkey ON public.tracker_matches USING btree (id)` |


## Policies (RLS)

### `Agents view own matches`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | public |
| USING | `((agent_name = get_user_agent_name()) OR is_admin_or_supervisor())` |
| WITH CHECK |  |

### `Supervisors insert matches`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | public |
| USING |  |
| WITH CHECK | `is_admin_or_supervisor()` |

### `Supervisors manage matches`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | public |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK | `is_admin_or_supervisor()` |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
