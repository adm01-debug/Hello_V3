# public.data_lake_exports

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
| 2 | `requested_by` | `uuid` | não |  |  |  |
| 3 | `dataset` | `text` | não |  |  |  |
| 4 | `format` | `text` | não |  |  |  |
| 5 | `since_date` | `timestamp with time zone` | sim |  |  |  |
| 6 | `status` | `text` | não | `'pending'::text` |  |  |
| 7 | `file_path` | `text` | sim |  |  |  |
| 8 | `row_count` | `integer` | sim |  |  |  |
| 9 | `size_bytes` | `bigint` | sim |  |  |  |
| 10 | `error_message` | `text` | sim |  |  |  |
| 11 | `completed_at` | `timestamp with time zone` | sim |  |  |  |
| 12 | `expires_at` | `timestamp with time zone` | não | `(now() + '7 days'::interval)` |  |  |
| 13 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| data_lake_exports_dataset_check | CHECK | `CHECK (dataset = ANY (ARRAY['call_sessions'::text, 'deals'::text, 'contacts'::text, 'audit_logs'::text]))` |  |  | sim |
| data_lake_exports_format_check | CHECK | `CHECK (format = ANY (ARRAY['csv'::text, 'ndjson'::text, 'parquet'::text]))` |  |  | sim |
| data_lake_exports_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| data_lake_exports_status_check | CHECK | `CHECK (status = ANY (ARRAY['pending'::text, 'processing'::text, 'completed'::text, 'failed'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| data_lake_exports_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX data_lake_exports_pkey ON public.data_lake_exports USING btree (id)` |
| idx_data_exports_status | btree | status, created_at | não | sim |  | `CREATE INDEX idx_data_exports_status ON public.data_lake_exports USING btree (status, created_at DESC)` |


## Policies (RLS)

### `Admins manage data exports`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `is_admin()` |
| WITH CHECK | `is_admin()` |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
