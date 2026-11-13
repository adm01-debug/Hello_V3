# public.rate_limit_logs

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
| 2 | `user_id` | `uuid` | sim |  |  |  |
| 3 | `ip_address` | `text` | não |  |  |  |
| 4 | `endpoint` | `text` | não |  |  |  |
| 5 | `request_count` | `integer` | sim | `1` |  |  |
| 6 | `window_start` | `timestamp with time zone` | sim | `now()` |  |  |
| 7 | `window_end` | `timestamp with time zone` | sim |  |  |  |
| 8 | `is_blocked` | `boolean` | sim | `false` |  |  |
| 9 | `block_reason` | `text` | sim |  |  |  |
| 10 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| rate_limit_logs_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| rate_limit_logs_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id)` | NO ACTION | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_rate_limit_logs_created | btree | created_at | não | sim |  | `CREATE INDEX idx_rate_limit_logs_created ON public.rate_limit_logs USING btree (created_at)` |
| idx_rate_limit_logs_created_brin | brin | created_at | não | sim |  | `CREATE INDEX idx_rate_limit_logs_created_brin ON public.rate_limit_logs USING brin (created_at) WITH (pages_per_range='32')` |
| idx_rate_limit_logs_ip | btree | ip_address | não | sim |  | `CREATE INDEX idx_rate_limit_logs_ip ON public.rate_limit_logs USING btree (ip_address)` |
| idx_rate_limit_logs_lookup | btree | ip_address, endpoint, created_at | não | sim |  | `CREATE INDEX idx_rate_limit_logs_lookup ON public.rate_limit_logs USING btree (ip_address, endpoint, created_at DESC)` |
| idx_rate_limit_logs_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_rate_limit_logs_user_id ON public.rate_limit_logs USING btree (user_id)` |
| rate_limit_logs_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX rate_limit_logs_pkey ON public.rate_limit_logs USING btree (id)` |


## Policies (RLS)

### `Admins can view rate_limit_logs`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK |  |

### `Only admins can insert rate limit logs`

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
