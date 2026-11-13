# public.dialer_campaigns

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
| 2 | `name` | `text` | não |  |  |  |
| 3 | `description` | `text` | sim |  |  |  |
| 4 | `status` | `text` | não | `'paused'::text` |  |  |
| 5 | `mode` | `text` | não | `'predictive'::text` |  |  |
| 6 | `max_concurrent_calls` | `integer` | não | `3` |  |  |
| 7 | `call_timeout_seconds` | `integer` | não | `30` |  |  |
| 8 | `retry_attempts` | `integer` | não | `2` |  |  |
| 9 | `retry_delay_minutes` | `integer` | não | `30` |  |  |
| 10 | `working_hours_start` | `time without time zone` | sim | `'08:00:00'::time without time zone` |  |  |
| 11 | `working_hours_end` | `time without time zone` | sim | `'18:00:00'::time without time zone` |  |  |
| 12 | `total_contacts` | `integer` | sim | `0` |  |  |
| 13 | `completed_contacts` | `integer` | sim | `0` |  |  |
| 14 | `successful_contacts` | `integer` | sim | `0` |  |  |
| 15 | `created_by` | `text` | sim |  |  |  |
| 16 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 17 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 18 | `target_abandon_rate` | `numeric(4,2)` | não | `3.00` |  |  |
| 19 | `min_pace` | `integer` | não | `1` |  |  |
| 20 | `max_pace` | `integer` | não | `10` |  |  |
| 21 | `last_pacing_adjustment_at` | `timestamp with time zone` | sim |  |  |  |
| 22 | `last_pacing_reason` | `text` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| dialer_campaigns_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.dialer_queue | dialer_queue_campaign_id_fkey | campaign_id | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| dialer_campaigns_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX dialer_campaigns_pkey ON public.dialer_campaigns USING btree (id)` |
| idx_dialer_campaigns_status | btree | status | não | sim |  | `CREATE INDEX idx_dialer_campaigns_status ON public.dialer_campaigns USING btree (status)` |


## Policies (RLS)

### `Authenticated users can view dialer_campaigns`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |
| WITH CHECK |  |

### `Supervisors can manage dialer_campaigns`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| update_dialer_campaigns_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
