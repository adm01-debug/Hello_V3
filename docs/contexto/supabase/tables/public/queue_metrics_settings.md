# public.queue_metrics_settings

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
| 2 | `enabled` | `boolean` | não | `true` |  |  |
| 3 | `avg_wait_time_warning` | `integer` | não | `45` |  |  |
| 4 | `avg_wait_time_critical` | `integer` | não | `90` |  |  |
| 5 | `abandonment_rate_warning` | `integer` | não | `10` |  |  |
| 6 | `abandonment_rate_critical` | `integer` | não | `20` |  |  |
| 7 | `service_level_warning` | `integer` | não | `80` |  |  |
| 8 | `service_level_critical` | `integer` | não | `60` |  |  |
| 9 | `check_interval_minutes` | `integer` | não | `5` |  |  |
| 10 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 11 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| queue_metrics_settings_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| queue_metrics_settings_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX queue_metrics_settings_pkey ON public.queue_metrics_settings USING btree (id)` |


## Policies (RLS)

### `Admins can manage queue_metrics_settings`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK |  |

### `Authenticated users can view queue_metrics_settings`

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
| update_queue_metrics_settings_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
