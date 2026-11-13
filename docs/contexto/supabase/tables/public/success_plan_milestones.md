# public.success_plan_milestones

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
| 2 | `success_plan_id` | `uuid` | não |  |  |  |
| 3 | `title` | `text` | não |  |  |  |
| 4 | `description` | `text` | sim |  |  |  |
| 5 | `due_date` | `date` | sim |  |  |  |
| 6 | `completed_at` | `timestamp with time zone` | sim |  |  |  |
| 7 | `status` | `text` | não | `'pending'::text` |  |  |
| 8 | `display_order` | `integer` | não | `0` |  |  |
| 9 | `assigned_to` | `text` | sim |  |  |  |
| 10 | `metadata` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 11 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 12 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| success_plan_milestones_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| success_plan_milestones_success_plan_id_fkey | FOREIGN KEY | `FOREIGN KEY (success_plan_id) REFERENCES success_plans(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_success_plan_milestones_success_plan_id | btree | success_plan_id | não | sim |  | `CREATE INDEX idx_success_plan_milestones_success_plan_id ON public.success_plan_milestones USING btree (success_plan_id)` |
| success_plan_milestones_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX success_plan_milestones_pkey ON public.success_plan_milestones USING btree (id)` |


## Policies (RLS)

### `Admin/supervisor manage milestones`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK | `is_admin_or_supervisor()` |

### `CSM manages milestones of own plans`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(EXISTS ( SELECT 1    FROM success_plans sp   WHERE ((sp.id = success_plan_milestones.success_plan_id) AND (sp.owner_agent_name = get_user_agent_name()))))` |
| WITH CHECK | `(EXISTS ( SELECT 1    FROM success_plans sp   WHERE ((sp.id = success_plan_milestones.success_plan_id) AND (sp.owner_agent_name = get_user_agent_name()))))` |

### `Milestones follow plan visibility (select)`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(EXISTS ( SELECT 1    FROM success_plans sp   WHERE ((sp.id = success_plan_milestones.success_plan_id) AND (is_admin_or_supervisor() OR (sp.owner_agent_name = get_user_agent_name()) OR (EXISTS ( SELECT 1            FROM accounts a           WHERE ((a.id = sp.account_id) AND (a.csm_agent_name = get_user_agent_name()))))))))` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| update_milestones_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
