# public.agent_shifts

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
| 3 | `shift_date` | `date` | não |  |  |  |
| 4 | `start_time` | `timestamp with time zone` | não |  |  |  |
| 5 | `end_time` | `timestamp with time zone` | não |  |  |  |
| 6 | `break_minutes` | `integer` | não | `60` |  |  |
| 7 | `template_id` | `uuid` | sim |  |  |  |
| 8 | `status` | `text` | não | `'scheduled'::text` |  |  |
| 9 | `notes` | `text` | sim |  |  |  |
| 10 | `created_by` | `uuid` | sim |  |  |  |
| 11 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 12 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| agent_shifts_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| agent_shifts_template_id_fkey | FOREIGN KEY | `FOREIGN KEY (template_id) REFERENCES shift_templates(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.shift_swap_suggestions | shift_swap_suggestions_from_shift_id_fkey | from_shift_id | SET NULL |
| public.shift_swap_suggestions | shift_swap_suggestions_to_shift_id_fkey | to_shift_id | SET NULL |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| agent_shifts_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX agent_shifts_pkey ON public.agent_shifts USING btree (id)` |
| idx_agent_shifts_agent_date | btree | agent_name, shift_date | não | sim |  | `CREATE INDEX idx_agent_shifts_agent_date ON public.agent_shifts USING btree (agent_name, shift_date)` |
| idx_agent_shifts_date | btree | shift_date | não | sim |  | `CREATE INDEX idx_agent_shifts_date ON public.agent_shifts USING btree (shift_date)` |
| idx_agent_shifts_template_id | btree | template_id | não | sim |  | `CREATE INDEX idx_agent_shifts_template_id ON public.agent_shifts USING btree (template_id)` |


## Policies (RLS)

### `Admin/supervisor manage shifts`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK | `is_admin_or_supervisor()` |

### `Agents view own shifts, supervisors all`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(is_admin_or_supervisor() OR (get_user_agent_name() = agent_name))` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_agent_shifts_updated | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
