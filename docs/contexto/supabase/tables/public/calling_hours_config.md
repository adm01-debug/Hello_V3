# public.calling_hours_config

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
| 2 | `region_code` | `text` | não |  |  |  |
| 3 | `region_name` | `text` | não |  |  |  |
| 4 | `timezone` | `text` | não | `'America/Sao_Paulo'::text` |  |  |
| 5 | `weekday_start` | `time without time zone` | não | `'08:00:00'::time without time zone` |  |  |
| 6 | `weekday_end` | `time without time zone` | não | `'21:00:00'::time without time zone` |  |  |
| 7 | `saturday_start` | `time without time zone` | sim |  |  |  |
| 8 | `saturday_end` | `time without time zone` | sim |  |  |  |
| 9 | `sunday_allowed` | `boolean` | não | `false` |  |  |
| 10 | `sunday_start` | `time without time zone` | sim |  |  |  |
| 11 | `sunday_end` | `time without time zone` | sim |  |  |  |
| 12 | `holidays_allowed` | `boolean` | não | `false` |  |  |
| 13 | `is_active` | `boolean` | não | `true` |  |  |
| 14 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 15 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| calling_hours_config_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| calling_hours_region_unique | UNIQUE | `UNIQUE (region_code)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| calling_hours_config_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX calling_hours_config_pkey ON public.calling_hours_config USING btree (id)` |
| calling_hours_region_unique | btree | region_code | sim | sim |  | `CREATE UNIQUE INDEX calling_hours_region_unique ON public.calling_hours_config USING btree (region_code)` |
| idx_calling_hours_region | btree | region_code | não | sim |  | `CREATE INDEX idx_calling_hours_region ON public.calling_hours_config USING btree (region_code)` |


## Policies (RLS)

### `Admins can manage calling_hours_config`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK |  |

### `Authenticated can view calling_hours_config`

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
| update_calling_hours_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
