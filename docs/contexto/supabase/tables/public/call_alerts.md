# public.call_alerts

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
| 2 | `call_session_id` | `uuid` | não |  |  |  |
| 3 | `alert_type` | `text` | não |  |  |  |
| 4 | `severity` | `text` | não | `'warning'::text` |  |  |
| 5 | `title` | `text` | não |  |  |  |
| 6 | `message` | `text` | não |  |  |  |
| 7 | `is_read` | `boolean` | não | `false` |  |  |
| 8 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| call_alerts_call_session_id_fkey | FOREIGN KEY | `FOREIGN KEY (call_session_id) REFERENCES call_sessions(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| call_alerts_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| call_alerts_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX call_alerts_pkey ON public.call_alerts USING btree (id)` |
| idx_call_alerts_call_session_id | btree | call_session_id | não | sim |  | `CREATE INDEX idx_call_alerts_call_session_id ON public.call_alerts USING btree (call_session_id)` |
| idx_call_alerts_created_at | btree | created_at | não | sim |  | `CREATE INDEX idx_call_alerts_created_at ON public.call_alerts USING btree (created_at DESC)` |
| idx_call_alerts_is_read | btree | is_read | não | sim |  | `CREATE INDEX idx_call_alerts_is_read ON public.call_alerts USING btree (is_read)` |


## Policies (RLS)

### `Admin supervisor insert call_alerts`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `is_admin_or_supervisor()` |

### `Admins and supervisors can update call_alerts`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK | `is_admin_or_supervisor()` |

### `Admins can delete call_alerts`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK |  |

### `Agents can mark own alerts as read`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(call_session_id IN ( SELECT call_sessions.id    FROM call_sessions   WHERE (call_sessions.agent_name = get_user_agent_name())))` |
| WITH CHECK | `(call_session_id IN ( SELECT call_sessions.id    FROM call_sessions   WHERE (call_sessions.agent_name = get_user_agent_name())))` |

### `Scoped call_alerts SELECT`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(is_admin_or_supervisor() OR (call_session_id IN ( SELECT call_sessions.id    FROM call_sessions   WHERE (call_sessions.agent_name = get_user_agent_name()))))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
