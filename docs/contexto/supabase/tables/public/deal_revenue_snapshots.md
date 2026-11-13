# public.deal_revenue_snapshots

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
| 2 | `deal_id` | `uuid` | sim |  |  |  |
| 3 | `revenue_cents` | `bigint` | não |  |  |  |
| 4 | `currency` | `text` | não | `'BRL'::text` |  |  |
| 5 | `occurred_at` | `timestamp with time zone` | não | `now()` |  |  |
| 6 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| deal_revenue_snapshots_deal_id_fkey | FOREIGN KEY | `FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| deal_revenue_snapshots_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| deal_revenue_snapshots_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX deal_revenue_snapshots_pkey ON public.deal_revenue_snapshots USING btree (id)` |
| idx_deal_revenue_occurred | btree | occurred_at | não | sim |  | `CREATE INDEX idx_deal_revenue_occurred ON public.deal_revenue_snapshots USING btree (occurred_at DESC)` |
| idx_deal_revenue_snapshots_deal_id | btree | deal_id | não | sim |  | `CREATE INDEX idx_deal_revenue_snapshots_deal_id ON public.deal_revenue_snapshots USING btree (deal_id)` |


## Policies (RLS)

### `Admin/Supervisor manage revenue snapshots`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK | `is_admin_or_supervisor()` |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
