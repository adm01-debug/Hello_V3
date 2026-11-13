# public.rate_limit_settings

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
| 2 | `endpoint_pattern` | `text` | não |  |  |  |
| 3 | `max_requests` | `integer` | sim | `100` |  |  |
| 4 | `window_seconds` | `integer` | sim | `60` |  |  |
| 5 | `block_duration_seconds` | `integer` | sim | `3600` |  |  |
| 6 | `is_enabled` | `boolean` | sim | `true` |  |  |
| 7 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 8 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| rate_limit_settings_endpoint_pattern_key | UNIQUE | `UNIQUE (endpoint_pattern)` |  |  | sim |
| rate_limit_settings_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| rate_limit_settings_endpoint_pattern_key | btree | endpoint_pattern | sim | sim |  | `CREATE UNIQUE INDEX rate_limit_settings_endpoint_pattern_key ON public.rate_limit_settings USING btree (endpoint_pattern)` |
| rate_limit_settings_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX rate_limit_settings_pkey ON public.rate_limit_settings USING btree (id)` |


## Policies (RLS)

### `Admins can manage rate_limit_settings`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |
| WITH CHECK |  |

### `Admins can view rate_limit_settings`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| update_rate_limit_settings_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_security_updated_at |


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
