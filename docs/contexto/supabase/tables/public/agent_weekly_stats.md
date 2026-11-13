# public.agent_weekly_stats

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
| 3 | `week_start` | `date` | não |  |  |  |
| 4 | `total_calls` | `integer` | não | `0` |  |  |
| 5 | `total_duration_seconds` | `integer` | não | `0` |  |  |
| 6 | `avg_satisfaction` | `numeric(3,1)` | sim | `0` |  |  |
| 7 | `avg_performance` | `numeric(3,1)` | sim | `0` |  |  |
| 8 | `badges_earned` | `integer` | não | `0` |  |  |
| 9 | `points_earned` | `integer` | não | `0` |  |  |
| 10 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 11 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| agent_weekly_stats_agent_id_fkey | FOREIGN KEY | `FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| agent_weekly_stats_agent_id_week_start_key | UNIQUE | `UNIQUE (agent_id, week_start)` |  |  | sim |
| agent_weekly_stats_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| agent_weekly_stats_agent_id_week_start_key | btree | agent_id, week_start | sim | sim |  | `CREATE UNIQUE INDEX agent_weekly_stats_agent_id_week_start_key ON public.agent_weekly_stats USING btree (agent_id, week_start)` |
| agent_weekly_stats_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX agent_weekly_stats_pkey ON public.agent_weekly_stats USING btree (id)` |
| idx_agent_weekly_stats_agent_id | btree | agent_id | não | sim |  | `CREATE INDEX idx_agent_weekly_stats_agent_id ON public.agent_weekly_stats USING btree (agent_id)` |


## Policies (RLS)

### `Admins can manage agent_weekly_stats`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK |  |

### `Role-based view agent_weekly_stats`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(is_admin_or_supervisor() OR (agent_id = get_user_agent_id()))` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| update_agent_weekly_stats_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
