# public.agent_skills

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
| 2 | `agent_name` | `text` | não |  |  |  |
| 3 | `skill_id` | `uuid` | não |  |  |  |
| 4 | `proficiency` | `integer` | não | `3` |  |  |
| 5 | `certified_at` | `timestamp with time zone` | sim |  |  |  |
| 6 | `certified_by` | `uuid` | sim |  |  |  |
| 7 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 8 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| agent_skills_agent_name_skill_id_key | UNIQUE | `UNIQUE (agent_name, skill_id)` |  |  | sim |
| agent_skills_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| agent_skills_proficiency_check | CHECK | `CHECK (proficiency >= 1 AND proficiency <= 5)` |  |  | sim |
| agent_skills_skill_id_fkey | FOREIGN KEY | `FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| agent_skills_agent_name_skill_id_key | btree | agent_name, skill_id | sim | sim |  | `CREATE UNIQUE INDEX agent_skills_agent_name_skill_id_key ON public.agent_skills USING btree (agent_name, skill_id)` |
| agent_skills_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX agent_skills_pkey ON public.agent_skills USING btree (id)` |
| idx_agent_skills_agent | btree | agent_name | não | sim |  | `CREATE INDEX idx_agent_skills_agent ON public.agent_skills USING btree (agent_name)` |
| idx_agent_skills_skill_id | btree | skill_id | não | sim |  | `CREATE INDEX idx_agent_skills_skill_id ON public.agent_skills USING btree (skill_id)` |


## Policies (RLS)

### `Admin/supervisor manage agent skills`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK | `is_admin_or_supervisor()` |

### `Authenticated view agent skills`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_agent_skills_updated | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
