# public.goal_violations

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
| 2 | `goal_id` | `uuid` | não |  |  |  |
| 3 | `goal_name` | `text` | não |  |  |  |
| 4 | `metric_type` | `text` | não |  |  |  |
| 5 | `target_value` | `numeric` | não |  |  |  |
| 6 | `actual_value` | `numeric` | não |  |  |  |
| 7 | `threshold_type` | `text` | não | `'warning'::text` |  |  |
| 8 | `deviation_percentage` | `numeric` | sim |  |  |  |
| 9 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| goal_violations_goal_id_fkey | FOREIGN KEY | `FOREIGN KEY (goal_id) REFERENCES dashboard_goals(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| goal_violations_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| goal_violations_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX goal_violations_pkey ON public.goal_violations USING btree (id)` |
| idx_goal_violations_created_at | btree | created_at | não | sim |  | `CREATE INDEX idx_goal_violations_created_at ON public.goal_violations USING btree (created_at DESC)` |
| idx_goal_violations_goal_id | btree | goal_id | não | sim |  | `CREATE INDEX idx_goal_violations_goal_id ON public.goal_violations USING btree (goal_id)` |


## Policies (RLS)

### `Authenticated users can view goal_violations`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |
| WITH CHECK |  |

### `Only admins and supervisors can insert goal_violations`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `is_admin_or_supervisor()` |

### `Supervisors can manage goal_violations`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
