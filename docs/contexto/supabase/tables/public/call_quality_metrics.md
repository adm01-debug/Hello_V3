# public.call_quality_metrics

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 6 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `call_session_id` | `uuid` | sim |  |  |  |
| 3 | `agent_name` | `text` | sim |  |  |  |
| 4 | `channel` | `text` | não | `'webrtc'::text` |  |  |
| 5 | `mos_avg` | `numeric(3,2)` | sim |  |  |  |
| 6 | `mos_min` | `numeric(3,2)` | sim |  |  |  |
| 7 | `jitter_avg_ms` | `numeric(6,2)` | sim |  |  |  |
| 8 | `jitter_max_ms` | `numeric(6,2)` | sim |  |  |  |
| 9 | `packet_loss_pct` | `numeric(5,2)` | sim |  |  |  |
| 10 | `rtt_avg_ms` | `numeric(6,2)` | sim |  |  |  |
| 11 | `rtt_max_ms` | `numeric(6,2)` | sim |  |  |  |
| 12 | `samples_count` | `integer` | não | `0` |  |  |
| 13 | `quality_label` | `text` | sim |  |  |  |
| 14 | `raw_samples` | `jsonb` | sim |  |  |  |
| 15 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 16 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| call_quality_metrics_call_session_id_fkey | FOREIGN KEY | `FOREIGN KEY (call_session_id) REFERENCES call_sessions(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| call_quality_metrics_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| call_quality_metrics_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX call_quality_metrics_pkey ON public.call_quality_metrics USING btree (id)` |
| idx_call_quality_created_at | btree | created_at | não | sim |  | `CREATE INDEX idx_call_quality_created_at ON public.call_quality_metrics USING btree (created_at DESC)` |
| idx_call_quality_metrics_call_session_id | btree | call_session_id | não | sim |  | `CREATE INDEX idx_call_quality_metrics_call_session_id ON public.call_quality_metrics USING btree (call_session_id)` |
| idx_call_quality_metrics_created_brin | brin | created_at | não | sim |  | `CREATE INDEX idx_call_quality_metrics_created_brin ON public.call_quality_metrics USING brin (created_at) WITH (pages_per_range='32')` |
| idx_cqm_agent | btree | agent_name | não | sim |  | `CREATE INDEX idx_cqm_agent ON public.call_quality_metrics USING btree (agent_name)` |


## Policies (RLS)

### `Admins have full access to call_quality_metrics`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `is_admin()` |
| WITH CHECK |  |

### `Role-based view quality metrics`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(is_admin() OR is_supervisor() OR (agent_name = get_user_agent_name()))` |
| WITH CHECK |  |

### `admins_delete_quality_metrics`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | public |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK |  |

### `agents_insert_own_quality_metrics`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | public |
| USING |  |
| WITH CHECK | `(is_admin_or_supervisor() OR (get_user_agent_name() = agent_name) OR (agent_name IS NULL))` |

### `agents_update_own_quality_metrics`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(is_admin_or_supervisor() OR (get_user_agent_name() = agent_name))` |
| WITH CHECK |  |

### `agents_view_own_quality_metrics`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(is_admin_or_supervisor() OR (get_user_agent_name() = agent_name))` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| update_call_quality_metrics_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
