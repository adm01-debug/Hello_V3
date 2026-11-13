# public.agent_badges

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
| 3 | `badge_id` | `uuid` | não |  |  |  |
| 4 | `earned_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| agent_badges_agent_id_badge_id_key | UNIQUE | `UNIQUE (agent_id, badge_id)` |  |  | sim |
| agent_badges_agent_id_fkey | FOREIGN KEY | `FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| agent_badges_badge_id_fkey | FOREIGN KEY | `FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| agent_badges_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| agent_badges_agent_id_badge_id_key | btree | agent_id, badge_id | sim | sim |  | `CREATE UNIQUE INDEX agent_badges_agent_id_badge_id_key ON public.agent_badges USING btree (agent_id, badge_id)` |
| agent_badges_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX agent_badges_pkey ON public.agent_badges USING btree (id)` |
| idx_agent_badges_agent_id | btree | agent_id | não | sim |  | `CREATE INDEX idx_agent_badges_agent_id ON public.agent_badges USING btree (agent_id)` |
| idx_agent_badges_badge_id | btree | badge_id | não | sim |  | `CREATE INDEX idx_agent_badges_badge_id ON public.agent_badges USING btree (badge_id)` |


## Policies (RLS)

### `Admins can manage agent_badges`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK |  |

### `Authenticated users can view agent_badges`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
