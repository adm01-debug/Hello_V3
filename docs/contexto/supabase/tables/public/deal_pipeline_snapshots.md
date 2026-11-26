# public.deal_pipeline_snapshots

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
| 1 | `snapshot_date` | `date` | não |  |  |  |
| 2 | `open_count` | `integer` | não |  |  |  |
| 3 | `total_value_cents` | `bigint` | não |  |  |  |
| 4 | `weighted_value_cents` | `bigint` | não |  |  |  |
| 5 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 6 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| deal_pipeline_snapshots_pkey | PRIMARY KEY | `PRIMARY KEY (snapshot_date)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| deal_pipeline_snapshots_pkey | btree | snapshot_date | sim | sim |  | `CREATE UNIQUE INDEX deal_pipeline_snapshots_pkey ON public.deal_pipeline_snapshots USING btree (snapshot_date)` |


## Policies (RLS)

### `Admin/Supervisor veem retratos do pipeline`

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
