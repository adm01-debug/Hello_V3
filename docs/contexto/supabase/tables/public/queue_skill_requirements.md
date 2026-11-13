# public.queue_skill_requirements

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
| 2 | `queue_name` | `text` | não |  |  |  |
| 3 | `skill_id` | `uuid` | não |  |  |  |
| 4 | `min_proficiency` | `integer` | não | `3` |  |  |
| 5 | `weight` | `numeric` | não | `1.0` |  |  |
| 6 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| queue_skill_requirements_min_proficiency_check | CHECK | `CHECK (min_proficiency >= 1 AND min_proficiency <= 5)` |  |  | sim |
| queue_skill_requirements_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| queue_skill_requirements_queue_name_skill_id_key | UNIQUE | `UNIQUE (queue_name, skill_id)` |  |  | sim |
| queue_skill_requirements_skill_id_fkey | FOREIGN KEY | `FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_queue_skill_requirements_skill_id | btree | skill_id | não | sim |  | `CREATE INDEX idx_queue_skill_requirements_skill_id ON public.queue_skill_requirements USING btree (skill_id)` |
| queue_skill_requirements_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX queue_skill_requirements_pkey ON public.queue_skill_requirements USING btree (id)` |
| queue_skill_requirements_queue_name_skill_id_key | btree | queue_name, skill_id | sim | sim |  | `CREATE UNIQUE INDEX queue_skill_requirements_queue_name_skill_id_key ON public.queue_skill_requirements USING btree (queue_name, skill_id)` |


## Policies (RLS)

### `Admin/supervisor manage queue requirements`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK | `is_admin_or_supervisor()` |

### `Authenticated view queue requirements`

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
