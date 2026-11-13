# public.geo_access_logs

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
| 2 | `user_id` | `uuid` | sim |  |  |  |
| 3 | `user_email` | `text` | sim |  |  |  |
| 4 | `ip_address` | `text` | não |  |  |  |
| 5 | `country_code` | `text` | sim |  |  |  |
| 6 | `country_name` | `text` | sim |  |  |  |
| 7 | `city` | `text` | sim |  |  |  |
| 8 | `region` | `text` | sim |  |  |  |
| 9 | `action` | `text` | não |  |  |  |
| 10 | `reason` | `text` | sim |  |  |  |
| 11 | `user_agent` | `text` | sim |  |  |  |
| 12 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| geo_access_logs_action_check | CHECK | `CHECK (action = ANY (ARRAY['allowed'::text, 'blocked'::text]))` |  |  | sim |
| geo_access_logs_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| geo_access_logs_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX geo_access_logs_pkey ON public.geo_access_logs USING btree (id)` |
| idx_geo_access_logs_country_code | btree | country_code | não | sim |  | `CREATE INDEX idx_geo_access_logs_country_code ON public.geo_access_logs USING btree (country_code)` |
| idx_geo_access_logs_created_at | btree | created_at | não | sim |  | `CREATE INDEX idx_geo_access_logs_created_at ON public.geo_access_logs USING btree (created_at DESC)` |
| idx_geo_access_logs_created_brin | brin | created_at | não | sim |  | `CREATE INDEX idx_geo_access_logs_created_brin ON public.geo_access_logs USING brin (created_at) WITH (pages_per_range='32')` |


## Policies (RLS)

### `Admins can delete geo access logs`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK |  |

### `Admins can view geo access logs`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK |  |

### `Only admins can insert geo access logs`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `is_admin_or_supervisor()` |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
