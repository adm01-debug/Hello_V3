# public.cadence_step_runs

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 1 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `enrollment_id` | `uuid` | não |  |  |  |
| 3 | `cadence_id` | `uuid` | não |  |  |  |
| 4 | `step_id` | `uuid` | sim |  |  |  |
| 5 | `step_order` | `integer` | não |  |  |  |
| 6 | `step_type` | `text` | não |  |  |  |
| 7 | `status` | `text` | não |  |  |  |
| 8 | `detail` | `text` | sim |  |  |  |
| 9 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| cadence_step_runs_cadence_id_fkey | FOREIGN KEY | `FOREIGN KEY (cadence_id) REFERENCES cadences(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| cadence_step_runs_enrollment_id_fkey | FOREIGN KEY | `FOREIGN KEY (enrollment_id) REFERENCES cadence_enrollments(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| cadence_step_runs_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| cadence_step_runs_status_check | CHECK | `CHECK (status = ANY (ARRAY['done'::text, 'skipped'::text, 'failed'::text]))` |  |  | sim |
| cadence_step_runs_step_id_fkey | FOREIGN KEY | `FOREIGN KEY (step_id) REFERENCES cadence_steps(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| cadence_step_runs_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX cadence_step_runs_pkey ON public.cadence_step_runs USING btree (id)` |
| idx_cadence_step_runs_enrollment | btree | enrollment_id, created_at | não | sim |  | `CREATE INDEX idx_cadence_step_runs_enrollment ON public.cadence_step_runs USING btree (enrollment_id, created_at DESC)` |


## Policies (RLS)

### `Agents view own cadence runs`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(is_admin_or_supervisor() OR (EXISTS ( SELECT 1    FROM cadence_enrollments e   WHERE ((e.id = cadence_step_runs.enrollment_id) AND (e.agent_name = get_user_agent_name())))))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | SELECT |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
