# public.customer_journey_stages

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
| 2 | `stage_key` | `text` | não |  |  |  |
| 3 | `stage_name` | `text` | não |  |  |  |
| 4 | `description` | `text` | sim |  |  |  |
| 5 | `display_order` | `integer` | não | `0` |  |  |
| 6 | `color` | `text` | sim | `'#3b82f6'::text` |  |  |
| 7 | `entry_criteria` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 8 | `exit_criteria` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 9 | `is_active` | `boolean` | não | `true` |  |  |
| 10 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 11 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| customer_journey_stages_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| customer_journey_stages_stage_key_key | UNIQUE | `UNIQUE (stage_key)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| customer_journey_stages_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX customer_journey_stages_pkey ON public.customer_journey_stages USING btree (id)` |
| customer_journey_stages_stage_key_key | btree | stage_key | sim | sim |  | `CREATE UNIQUE INDEX customer_journey_stages_stage_key_key ON public.customer_journey_stages USING btree (stage_key)` |


## Policies (RLS)

### `Admin/supervisor manage journey stages`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK | `is_admin_or_supervisor()` |

### `All authenticated can view journey stages`

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
| update_journey_stages_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
