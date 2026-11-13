# public.coaching_assignments

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
| 2 | `agent_name` | `text` | não |  |  |  |
| 3 | `assigned_by` | `uuid` | sim |  |  |  |
| 4 | `assigner_name` | `text` | sim |  |  |  |
| 5 | `call_session_id` | `uuid` | sim |  |  |  |
| 6 | `scorecard_id` | `uuid` | sim |  |  |  |
| 7 | `title` | `text` | não |  |  |  |
| 8 | `description` | `text` | sim |  |  |  |
| 9 | `priority` | `text` | não | `'normal'::text` |  |  |
| 10 | `due_at` | `timestamp with time zone` | sim |  |  |  |
| 11 | `status` | `text` | não | `'open'::text` |  |  |
| 12 | `completed_at` | `timestamp with time zone` | sim |  |  |  |
| 13 | `agent_response` | `text` | sim |  |  |  |
| 14 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 15 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| coaching_assignments_call_session_id_fkey | FOREIGN KEY | `FOREIGN KEY (call_session_id) REFERENCES call_sessions(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| coaching_assignments_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| coaching_assignments_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX coaching_assignments_pkey ON public.coaching_assignments USING btree (id)` |
| idx_coaching_assignments_agent | btree | agent_name | não | sim |  | `CREATE INDEX idx_coaching_assignments_agent ON public.coaching_assignments USING btree (agent_name)` |
| idx_coaching_assignments_call_session_id | btree | call_session_id | não | sim |  | `CREATE INDEX idx_coaching_assignments_call_session_id ON public.coaching_assignments USING btree (call_session_id)` |
| idx_coaching_assignments_pending | btree | agent_name, created_at | não | sim | `(completed_at IS NULL)` | `CREATE INDEX idx_coaching_assignments_pending ON public.coaching_assignments USING btree (agent_name, created_at DESC) WHERE (completed_at IS NULL)` |
| idx_coaching_assignments_status | btree | status | não | sim |  | `CREATE INDEX idx_coaching_assignments_status ON public.coaching_assignments USING btree (status)` |


## Policies (RLS)

### `Admin/supervisor create assignments`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `is_admin_or_supervisor()` |

### `Admin/supervisor delete assignments`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK |  |

### `Agents update own assignments status`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(is_admin_or_supervisor() OR (get_user_agent_name() = agent_name))` |
| WITH CHECK | `(is_admin_or_supervisor() OR (get_user_agent_name() = agent_name))` |

### `Agents view own assignments`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(is_admin_or_supervisor() OR (get_user_agent_name() = agent_name))` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_coaching_assignments_updated | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
