# public.hold_events

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 5 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `call_session_id` | `uuid` | sim |  |  |  |
| 3 | `agent_name` | `text` | sim |  |  |  |
| 4 | `started_at` | `timestamp with time zone` | não | `now()` |  |  |
| 5 | `ended_at` | `timestamp with time zone` | sim |  |  |  |
| 6 | `duration_seconds` | `integer` | sim |  |  |  |
| 7 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| hold_events_call_session_id_fkey | FOREIGN KEY | `FOREIGN KEY (call_session_id) REFERENCES call_sessions(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| hold_events_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| hold_events_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX hold_events_pkey ON public.hold_events USING btree (id)` |
| idx_hold_events_call_session_id | btree | call_session_id | não | sim |  | `CREATE INDEX idx_hold_events_call_session_id ON public.hold_events USING btree (call_session_id)` |
| idx_hold_events_session | btree | call_session_id, started_at | não | sim |  | `CREATE INDEX idx_hold_events_session ON public.hold_events USING btree (call_session_id, started_at DESC)` |
| idx_hold_events_started_at | btree | started_at | não | sim |  | `CREATE INDEX idx_hold_events_started_at ON public.hold_events USING btree (started_at DESC)` |


## Policies (RLS)

### `Admins can delete hold_events`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK |  |

### `Admins have full access to hold_events`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `is_admin()` |
| WITH CHECK |  |

### `Admins or linked agents can insert hold events`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `is_admin_or_supervisor()` |

### `Admins or linked agents can update hold events`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK |  |

### `Admins supervisors and own agent can view hold_events`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(is_admin_or_supervisor() OR (agent_name = get_user_agent_name()))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
