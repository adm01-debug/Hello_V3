# public.agent_trunk_assignments

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
| 2 | `agent_id` | `uuid` | não |  |  |  |
| 3 | `trunk_id` | `uuid` | não |  |  |  |
| 4 | `is_primary` | `boolean` | não | `false` |  |  |
| 5 | `version` | `integer` | não | `1` |  |  |
| 6 | `created_by` | `uuid` | sim |  |  |  |
| 7 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 8 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| agent_trunk_assignments_agent_id_fkey | FOREIGN KEY | `FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| agent_trunk_assignments_agent_id_trunk_id_key | UNIQUE | `UNIQUE (agent_id, trunk_id)` |  |  | sim |
| agent_trunk_assignments_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| agent_trunk_assignments_trunk_id_fkey | FOREIGN KEY | `FOREIGN KEY (trunk_id) REFERENCES voip_trunks(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| agent_trunk_assignments_agent_id_trunk_id_key | btree | agent_id, trunk_id | sim | sim |  | `CREATE UNIQUE INDEX agent_trunk_assignments_agent_id_trunk_id_key ON public.agent_trunk_assignments USING btree (agent_id, trunk_id)` |
| agent_trunk_assignments_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX agent_trunk_assignments_pkey ON public.agent_trunk_assignments USING btree (id)` |
| idx_agent_trunk_assignments_agent_id | btree | agent_id | não | sim |  | `CREATE INDEX idx_agent_trunk_assignments_agent_id ON public.agent_trunk_assignments USING btree (agent_id)` |
| idx_assignments_agent | btree | agent_id, is_primary | não | sim |  | `CREATE INDEX idx_assignments_agent ON public.agent_trunk_assignments USING btree (agent_id, is_primary DESC)` |
| idx_assignments_trunk | btree | trunk_id | não | sim |  | `CREATE INDEX idx_assignments_trunk ON public.agent_trunk_assignments USING btree (trunk_id)` |


## Policies (RLS)

### `assignments_admin_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `is_admin_user(( SELECT auth.uid() AS uid))` |
| WITH CHECK | `is_admin_user(( SELECT auth.uid() AS uid))` |

### `assignments_agent_select_own`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(agent_id = get_user_agent_id())` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_assignments_optimistic_lock | BEFORE | UPDATE | ROW | enabled | public.enforce_optimistic_lock |
| trg_assignments_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
