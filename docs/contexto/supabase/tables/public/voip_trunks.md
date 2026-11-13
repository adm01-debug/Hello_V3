# public.voip_trunks

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 5 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `name` | `text` | não |  |  |  |
| 3 | `provider` | `voip_provider` | não | `'generic'::voip_provider` |  |  |
| 4 | `sip_server` | `text` | não |  |  |  |
| 5 | `sip_username` | `text` | não |  |  |  |
| 6 | `sip_password_encrypted` | `text` | não |  |  |  |
| 7 | `sip_realm` | `text` | sim |  |  |  |
| 8 | `transport` | `text` | não | `'wss'::text` |  |  |
| 9 | `max_channels` | `integer` | não | `10` |  |  |
| 10 | `priority` | `integer` | não | `100` |  |  |
| 11 | `is_active` | `boolean` | não | `true` |  |  |
| 12 | `notes` | `text` | sim |  |  |  |
| 13 | `version` | `integer` | não | `1` |  |  |
| 14 | `created_by` | `uuid` | sim |  |  |  |
| 15 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 16 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 17 | `last_health_status` | `text` | sim |  |  |  |
| 18 | `last_health_latency_ms` | `integer` | sim |  |  |  |
| 19 | `last_health_checked_at` | `timestamp with time zone` | sim |  |  |  |
| 20 | `failover_count` | `integer` | sim | `0` |  |  |
| 21 | `last_failover_at` | `timestamp with time zone` | sim |  |  |  |
| 22 | `failover_reason` | `text` | sim |  |  |  |
| 23 | `cost_per_minute_cents` | `integer` | não | `15` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| voip_trunks_max_channels_check | CHECK | `CHECK (max_channels > 0 AND max_channels <= 1000)` |  |  | sim |
| voip_trunks_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| voip_trunks_transport_check | CHECK | `CHECK (transport = ANY (ARRAY['wss'::text, 'tcp'::text, 'udp'::text]))` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.agent_trunk_assignments | agent_trunk_assignments_trunk_id_fkey | trunk_id | CASCADE |
| public.voip_trunk_health_checks | voip_trunk_health_checks_trunk_id_fkey | trunk_id | CASCADE |
| public.voip_trunk_usage_metrics | voip_trunk_usage_metrics_original_trunk_id_fkey | original_trunk_id | SET NULL |
| public.voip_trunk_usage_metrics | voip_trunk_usage_metrics_trunk_id_fkey | trunk_id | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_voip_trunks_active | btree | is_active, priority | não | sim |  | `CREATE INDEX idx_voip_trunks_active ON public.voip_trunks USING btree (is_active, priority)` |
| idx_voip_trunks_provider | btree | provider | não | sim |  | `CREATE INDEX idx_voip_trunks_provider ON public.voip_trunks USING btree (provider)` |
| voip_trunks_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX voip_trunks_pkey ON public.voip_trunks USING btree (id)` |


## Policies (RLS)

### `Admins have full access to voip_trunks`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `is_admin()` |
| WITH CHECK |  |

### `voip_trunks_admin_delete`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `is_admin_user(( SELECT auth.uid() AS uid))` |
| WITH CHECK |  |

### `voip_trunks_admin_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `is_admin_user(( SELECT auth.uid() AS uid))` |

### `voip_trunks_admin_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `is_admin_user(( SELECT auth.uid() AS uid))` |
| WITH CHECK |  |

### `voip_trunks_admin_update`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `is_admin_user(( SELECT auth.uid() AS uid))` |
| WITH CHECK | `is_admin_user(( SELECT auth.uid() AS uid))` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| audit_voip_trunks_change | BEFORE | INSERT OR DELETE OR UPDATE | ROW | enabled | public.log_critical_rls_event |
| trg_voip_trunks_optimistic_lock | BEFORE | UPDATE | ROW | enabled | public.enforce_optimistic_lock |
| trg_voip_trunks_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
