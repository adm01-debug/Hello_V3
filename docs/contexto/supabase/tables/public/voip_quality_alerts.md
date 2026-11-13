# public.voip_quality_alerts

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 4 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `call_session_id` | `uuid` | sim |  |  |  |
| 4 | `alert_type` | `text` | não |  |  |  |
| 5 | `mos_at_alert` | `numeric(3,2)` | sim |  |  |  |
| 6 | `slope` | `numeric(6,3)` | sim |  |  |  |
| 7 | `jitter_ms` | `numeric(8,2)` | sim |  |  |  |
| 8 | `rtt_ms` | `numeric(8,2)` | sim |  |  |  |
| 9 | `remediation_action` | `text` | sim |  |  |  |
| 10 | `acknowledged_at` | `timestamp with time zone` | sim |  |  |  |
| 11 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| voip_quality_alerts_alert_type_check | CHECK | `CHECK (alert_type = ANY (ARRAY['degrading'::text, 'poor'::text, 'offline'::text]))` |  |  | sim |
| voip_quality_alerts_call_session_id_fkey | FOREIGN KEY | `FOREIGN KEY (call_session_id) REFERENCES call_sessions(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| voip_quality_alerts_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_voip_quality_alerts_call_session_id | btree | call_session_id | não | sim |  | `CREATE INDEX idx_voip_quality_alerts_call_session_id ON public.voip_quality_alerts USING btree (call_session_id)` |
| idx_voip_quality_alerts_created_user | btree | created_at, user_id | não | sim |  | `CREATE INDEX idx_voip_quality_alerts_created_user ON public.voip_quality_alerts USING btree (created_at DESC, user_id)` |
| idx_voip_quality_alerts_unack | btree | user_id, acknowledged_at | não | sim | `(acknowledged_at IS NULL)` | `CREATE INDEX idx_voip_quality_alerts_unack ON public.voip_quality_alerts USING btree (user_id, acknowledged_at) WHERE (acknowledged_at IS NULL)` |
| voip_quality_alerts_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX voip_quality_alerts_pkey ON public.voip_quality_alerts USING btree (id)` |


## Policies (RLS)

### `Admins delete voip alerts`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | public |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK |  |

### `Users insert own voip alerts`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | public |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `Users update own voip alerts`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | public |
| USING | `((( SELECT auth.uid() AS uid) = user_id) OR is_admin_or_supervisor())` |
| WITH CHECK |  |

### `Users view own voip alerts`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | public |
| USING | `((( SELECT auth.uid() AS uid) = user_id) OR is_admin_or_supervisor())` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_bridge_voip_alert_to_notification | AFTER | INSERT | ROW | enabled | public.bridge_voip_alert_to_notification |


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
