# public.cadence_steps

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
| 2 | `cadence_id` | `uuid` | não |  |  |  |
| 3 | `step_order` | `integer` | não |  |  |  |
| 4 | `step_type` | `text` | não |  |  |  |
| 5 | `delay_days` | `integer` | não | `0` |  |  |
| 6 | `delay_hours` | `integer` | não | `0` |  |  |
| 7 | `subject` | `text` | sim |  |  |  |
| 8 | `body` | `text` | sim |  |  |  |
| 9 | `metadata` | `jsonb` | sim |  |  |  |
| 10 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| cadence_steps_cadence_id_fkey | FOREIGN KEY | `FOREIGN KEY (cadence_id) REFERENCES cadences(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| cadence_steps_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| cadence_steps_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX cadence_steps_pkey ON public.cadence_steps USING btree (id)` |
| idx_cadence_steps_cadence | btree | cadence_id, step_order | não | sim |  | `CREATE INDEX idx_cadence_steps_cadence ON public.cadence_steps USING btree (cadence_id, step_order)` |
| idx_cadence_steps_cadence_id | btree | cadence_id | não | sim |  | `CREATE INDEX idx_cadence_steps_cadence_id ON public.cadence_steps USING btree (cadence_id)` |


## Policies (RLS)

### `All authenticated read cadence steps`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |
| WITH CHECK |  |

### `Supervisors manage cadence steps`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | public |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK | `is_admin_or_supervisor()` |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
