# public.queue_items

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
| 2 | `contact_name` | `text` | não |  |  |  |
| 3 | `contact_phone` | `text` | não |  |  |  |
| 4 | `wait_time` | `integer` | sim | `0` |  |  |
| 5 | `priority` | `integer` | sim | `0` |  |  |
| 6 | `agent_assigned` | `text` | sim |  |  |  |
| 7 | `status` | `text` | não | `'waiting'::text` |  |  |
| 8 | `queue_type` | `text` | sim | `'general'::text` |  |  |
| 9 | `metadata` | `jsonb` | sim |  |  |  |
| 10 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| queue_items_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| queue_items_status_check | CHECK | `CHECK (status = ANY (ARRAY['waiting'::text, 'in_progress'::text, 'completed'::text, 'abandoned'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_queue_status | btree | status | não | sim |  | `CREATE INDEX idx_queue_status ON public.queue_items USING btree (status)` |
| queue_items_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX queue_items_pkey ON public.queue_items USING btree (id)` |


## Policies (RLS)

### `Allow all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | public |
| USING | `true` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
