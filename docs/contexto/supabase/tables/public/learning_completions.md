# public.learning_completions

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
| 2 | `agent_name` | `text` | não |  |  |  |
| 3 | `module_id` | `uuid` | não |  |  |  |
| 4 | `completed_at` | `timestamp with time zone` | não | `now()` |  |  |
| 5 | `score` | `numeric` | sim |  |  |  |
| 6 | `notes` | `text` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| learning_completions_agent_name_module_id_key | UNIQUE | `UNIQUE (agent_name, module_id)` |  |  | sim |
| learning_completions_module_id_fkey | FOREIGN KEY | `FOREIGN KEY (module_id) REFERENCES learning_modules(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| learning_completions_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_learning_completions_agent | btree | agent_name | não | sim |  | `CREATE INDEX idx_learning_completions_agent ON public.learning_completions USING btree (agent_name)` |
| idx_learning_completions_module_id | btree | module_id | não | sim |  | `CREATE INDEX idx_learning_completions_module_id ON public.learning_completions USING btree (module_id)` |
| learning_completions_agent_name_module_id_key | btree | agent_name, module_id | sim | sim |  | `CREATE UNIQUE INDEX learning_completions_agent_name_module_id_key ON public.learning_completions USING btree (agent_name, module_id)` |
| learning_completions_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX learning_completions_pkey ON public.learning_completions USING btree (id)` |


## Policies (RLS)

### `Admin/supervisor delete completions`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK |  |

### `Agents create own completions`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `((get_user_agent_name() = agent_name) OR is_admin_or_supervisor())` |

### `Agents view own completions`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(is_admin_or_supervisor() OR (get_user_agent_name() = agent_name))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
