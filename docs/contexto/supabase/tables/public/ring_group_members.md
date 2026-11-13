# public.ring_group_members

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
| 2 | `group_id` | `uuid` | não |  |  |  |
| 3 | `agent_id` | `uuid` | não |  |  |  |
| 4 | `ring_order` | `integer` | não | `0` |  |  |
| 5 | `delay_seconds` | `integer` | não | `0` |  |  |
| 6 | `is_enabled` | `boolean` | não | `true` |  |  |
| 7 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 8 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| ring_group_members_agent_id_fkey | FOREIGN KEY | `FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| ring_group_members_delay_seconds_check | CHECK | `CHECK (delay_seconds >= 0 AND delay_seconds <= 300)` |  |  | sim |
| ring_group_members_group_id_agent_id_key | UNIQUE | `UNIQUE (group_id, agent_id)` |  |  | sim |
| ring_group_members_group_id_fkey | FOREIGN KEY | `FOREIGN KEY (group_id) REFERENCES ring_groups(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| ring_group_members_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| ring_group_members_ring_order_check | CHECK | `CHECK (ring_order >= 0 AND ring_order <= 999)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_ring_group_members_agent | btree | agent_id | não | sim |  | `CREATE INDEX idx_ring_group_members_agent ON public.ring_group_members USING btree (agent_id)` |
| idx_ring_group_members_group | btree | group_id, ring_order | não | sim |  | `CREATE INDEX idx_ring_group_members_group ON public.ring_group_members USING btree (group_id, ring_order)` |
| ring_group_members_group_id_agent_id_key | btree | group_id, agent_id | sim | sim |  | `CREATE UNIQUE INDEX ring_group_members_group_id_agent_id_key ON public.ring_group_members USING btree (group_id, agent_id)` |
| ring_group_members_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX ring_group_members_pkey ON public.ring_group_members USING btree (id)` |


## Policies (RLS)

### `ring_group_members_select_authenticated`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `true` |
| WITH CHECK |  |

### `ring_group_members_write_staff`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK | `is_admin_or_supervisor()` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_ring_group_members_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
