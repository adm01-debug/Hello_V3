# public.performance_metrics

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
| 3 | `metric_name` | `text` | não |  |  |  |
| 4 | `metric_value` | `double precision` | não |  |  |  |
| 5 | `rating` | `text` | sim |  |  |  |
| 6 | `navigation_type` | `text` | sim |  |  |  |
| 7 | `url` | `text` | sim |  |  |  |
| 8 | `user_agent` | `text` | sim |  |  |  |
| 9 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| performance_metrics_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| performance_metrics_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id)` | NO ACTION | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_perf_metrics_created_at | btree | created_at | não | sim |  | `CREATE INDEX idx_perf_metrics_created_at ON public.performance_metrics USING btree (created_at DESC)` |
| idx_performance_metrics_created_brin | brin | created_at | não | sim |  | `CREATE INDEX idx_performance_metrics_created_brin ON public.performance_metrics USING brin (created_at) WITH (pages_per_range='32')` |
| idx_performance_metrics_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_performance_metrics_user_id ON public.performance_metrics USING btree (user_id)` |
| performance_metrics_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX performance_metrics_pkey ON public.performance_metrics USING btree (id)` |


## Policies (RLS)

### `Apenas admin pode ver métricas`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | public |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK |  |

### `Qualquer autenticado pode inserir métricas`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | public |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
