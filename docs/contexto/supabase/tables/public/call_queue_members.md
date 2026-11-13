# public.call_queue_members

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
| 2 | `queue_id` | `uuid` | não |  |  |  |
| 3 | `agent_id` | `uuid` | não |  |  |  |
| 4 | `penalty` | `integer` | não | `0` |  |  |
| 5 | `is_active` | `boolean` | não | `true` |  |  |
| 6 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 7 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| call_queue_members_agent_id_fkey | FOREIGN KEY | `FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| call_queue_members_penalty_check | CHECK | `CHECK (penalty >= 0 AND penalty <= 100)` |  |  | sim |
| call_queue_members_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| call_queue_members_queue_id_fkey | FOREIGN KEY | `FOREIGN KEY (queue_id) REFERENCES call_queues(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| call_queue_members_unique | UNIQUE | `UNIQUE (queue_id, agent_id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| call_queue_members_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX call_queue_members_pkey ON public.call_queue_members USING btree (id)` |
| call_queue_members_unique | btree | queue_id, agent_id | sim | sim |  | `CREATE UNIQUE INDEX call_queue_members_unique ON public.call_queue_members USING btree (queue_id, agent_id)` |
| idx_call_queue_members_agent | btree | agent_id | não | sim |  | `CREATE INDEX idx_call_queue_members_agent ON public.call_queue_members USING btree (agent_id)` |
| idx_call_queue_members_queue | btree | queue_id, is_active, penalty | não | sim |  | `CREATE INDEX idx_call_queue_members_queue ON public.call_queue_members USING btree (queue_id, is_active, penalty)` |


## Policies (RLS)

### `call_queue_members_manage_admin_supervisor`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK | `is_admin_or_supervisor()` |

### `call_queue_members_select_authenticated`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `true` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_call_queue_members_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
