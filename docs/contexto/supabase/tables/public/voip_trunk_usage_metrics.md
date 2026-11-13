# public.voip_trunk_usage_metrics

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
| 2 | `trunk_id` | `uuid` | não |  |  |  |
| 3 | `agent_id` | `uuid` | sim |  |  |  |
| 4 | `call_session_id` | `uuid` | sim |  |  |  |
| 5 | `started_at` | `timestamp with time zone` | não | `now()` |  |  |
| 6 | `ended_at` | `timestamp with time zone` | sim |  |  |  |
| 7 | `duration_seconds` | `integer` | sim |  |  |  |
| 8 | `was_failover` | `boolean` | não | `false` |  |  |
| 9 | `failover_reason` | `text` | sim |  |  |  |
| 10 | `original_trunk_id` | `uuid` | sim |  |  |  |
| 11 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| voip_trunk_usage_metrics_agent_id_fkey | FOREIGN KEY | `FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| voip_trunk_usage_metrics_call_session_id_fkey | FOREIGN KEY | `FOREIGN KEY (call_session_id) REFERENCES call_sessions(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| voip_trunk_usage_metrics_original_trunk_id_fkey | FOREIGN KEY | `FOREIGN KEY (original_trunk_id) REFERENCES voip_trunks(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| voip_trunk_usage_metrics_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| voip_trunk_usage_metrics_trunk_id_fkey | FOREIGN KEY | `FOREIGN KEY (trunk_id) REFERENCES voip_trunks(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_trunk_usage_agent_started | btree | agent_id, started_at | não | sim |  | `CREATE INDEX idx_trunk_usage_agent_started ON public.voip_trunk_usage_metrics USING btree (agent_id, started_at DESC)` |
| idx_trunk_usage_failover | btree | was_failover, started_at | não | sim | `(was_failover = true)` | `CREATE INDEX idx_trunk_usage_failover ON public.voip_trunk_usage_metrics USING btree (was_failover, started_at DESC) WHERE (was_failover = true)` |
| idx_trunk_usage_trunk_started | btree | trunk_id, started_at | não | sim |  | `CREATE INDEX idx_trunk_usage_trunk_started ON public.voip_trunk_usage_metrics USING btree (trunk_id, started_at DESC)` |
| idx_voip_trunk_usage_metrics_agent_id | btree | agent_id | não | sim |  | `CREATE INDEX idx_voip_trunk_usage_metrics_agent_id ON public.voip_trunk_usage_metrics USING btree (agent_id)` |
| idx_voip_trunk_usage_metrics_call_session_id | btree | call_session_id | não | sim |  | `CREATE INDEX idx_voip_trunk_usage_metrics_call_session_id ON public.voip_trunk_usage_metrics USING btree (call_session_id)` |
| idx_voip_trunk_usage_metrics_original_trunk_id | btree | original_trunk_id | não | sim |  | `CREATE INDEX idx_voip_trunk_usage_metrics_original_trunk_id ON public.voip_trunk_usage_metrics USING btree (original_trunk_id)` |
| idx_voip_trunk_usage_metrics_trunk_id | btree | trunk_id | não | sim |  | `CREATE INDEX idx_voip_trunk_usage_metrics_trunk_id ON public.voip_trunk_usage_metrics USING btree (trunk_id)` |
| idx_voip_usage_started_at | btree | started_at | não | sim |  | `CREATE INDEX idx_voip_usage_started_at ON public.voip_trunk_usage_metrics USING btree (started_at DESC)` |
| voip_trunk_usage_metrics_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX voip_trunk_usage_metrics_pkey ON public.voip_trunk_usage_metrics USING btree (id)` |


## Policies (RLS)

### `Admins have full access to voip_trunk_usage_metrics`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `is_admin()` |
| WITH CHECK |  |

### `Admins/supervisors can view all usage metrics`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK |  |

### `Agents can view their own usage metrics`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(agent_id = get_user_agent_id())` |
| WITH CHECK |  |

### `No direct insert on usage metrics`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `false` |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
