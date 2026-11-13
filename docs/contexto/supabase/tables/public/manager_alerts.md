# public.manager_alerts

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
| 2 | `call_session_id` | `uuid` | sim |  |  |  |
| 3 | `agent_name` | `text` | sim |  |  |  |
| 4 | `alert_type` | `text` | não | `'negative_sentiment'::text` |  |  |
| 5 | `severity` | `text` | não | `'warning'::text` |  |  |
| 6 | `trigger_reason` | `text` | não |  |  |  |
| 7 | `sentiment_score` | `numeric` | sim |  |  |  |
| 8 | `is_resolved` | `boolean` | não | `false` |  |  |
| 9 | `resolved_by` | `text` | sim |  |  |  |
| 10 | `resolved_at` | `timestamp with time zone` | sim |  |  |  |
| 11 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| manager_alerts_call_session_id_fkey | FOREIGN KEY | `FOREIGN KEY (call_session_id) REFERENCES call_sessions(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| manager_alerts_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_manager_alerts_call_session_id | btree | call_session_id | não | sim |  | `CREATE INDEX idx_manager_alerts_call_session_id ON public.manager_alerts USING btree (call_session_id)` |
| manager_alerts_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX manager_alerts_pkey ON public.manager_alerts USING btree (id)` |


## Policies (RLS)

### `Admins can insert manager_alerts`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `is_admin_or_supervisor()` |

### `Admins can manage manager_alerts`

| campo | valor |
|---|---|
| comando | ALL |
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
