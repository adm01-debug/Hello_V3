# public.toll_free_numbers

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
| 2 | `number` | `text` | não |  |  |  |
| 3 | `friendly_name` | `text` | sim |  |  |  |
| 4 | `status` | `text` | não | `'active'::text` |  |  |
| 5 | `assigned_to` | `text` | sim |  |  |  |
| 6 | `monthly_cost` | `numeric` | sim | `0` |  |  |
| 7 | `call_flow_id` | `uuid` | sim |  |  |  |
| 8 | `provisioned_at` | `timestamp with time zone` | sim |  |  |  |
| 9 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 10 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| toll_free_numbers_call_flow_id_fkey | FOREIGN KEY | `FOREIGN KEY (call_flow_id) REFERENCES call_flows(id)` | NO ACTION | NO ACTION | sim |
| toll_free_numbers_number_key | UNIQUE | `UNIQUE (number)` |  |  | sim |
| toll_free_numbers_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_toll_free_numbers_call_flow_id | btree | call_flow_id | não | sim |  | `CREATE INDEX idx_toll_free_numbers_call_flow_id ON public.toll_free_numbers USING btree (call_flow_id)` |
| toll_free_numbers_number_key | btree | number | sim | sim |  | `CREATE UNIQUE INDEX toll_free_numbers_number_key ON public.toll_free_numbers USING btree (number)` |
| toll_free_numbers_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX toll_free_numbers_pkey ON public.toll_free_numbers USING btree (id)` |


## Policies (RLS)

### `Admins can manage toll_free`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK |  |

### `Admins can view toll free numbers`

| campo | valor |
|---|---|
| comando | SELECT |
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
