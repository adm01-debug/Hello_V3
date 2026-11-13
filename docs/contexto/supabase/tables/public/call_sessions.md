# public.call_sessions

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
| usada por views | public.financial_impact_daily |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `caller_name` | `text` | sim |  |  |  |
| 3 | `caller_phone` | `text` | sim |  |  |  |
| 4 | `agent_name` | `text` | sim |  |  |  |
| 5 | `started_at` | `timestamp with time zone` | não | `now()` |  |  |
| 6 | `ended_at` | `timestamp with time zone` | sim |  |  |  |
| 7 | `duration_seconds` | `integer` | sim |  |  |  |
| 8 | `status` | `text` | sim | `'active'::text` |  |  |
| 9 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 10 | `contact_id` | `uuid` | sim |  |  |  |
| 11 | `hold_time_seconds` | `integer` | sim | `0` |  |  |
| 12 | `hold_count` | `integer` | sim | `0` |  |  |
| 13 | `deal_id` | `uuid` | sim |  |  |  |
| 14 | `direction` | `text` | sim | `'inbound'::text` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| call_sessions_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| call_sessions_deal_id_fkey | FOREIGN KEY | `FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| call_sessions_direction_check | CHECK | `CHECK (direction = ANY (ARRAY['inbound'::text, 'outbound'::text]))` |  |  | sim |
| call_sessions_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.barge_in_sessions | barge_in_sessions_call_session_id_fkey | call_session_id | CASCADE |
| public.call_alerts | call_alerts_call_session_id_fkey | call_session_id | CASCADE |
| public.call_analyses | call_analyses_call_session_id_fkey | call_session_id | CASCADE |
| public.call_key_moments | call_key_moments_call_session_id_fkey | call_session_id | CASCADE |
| public.call_quality_metrics | call_quality_metrics_call_session_id_fkey | call_session_id | CASCADE |
| public.call_recordings | call_recordings_call_session_id_fkey | call_session_id | SET NULL |
| public.call_scorecards | call_scorecards_call_session_id_fkey | call_session_id | CASCADE |
| public.call_summaries | call_summaries_call_session_id_fkey | call_session_id | CASCADE |
| public.call_transcriptions | call_transcriptions_call_session_id_fkey | call_session_id | CASCADE |
| public.call_transcripts_searchable | call_transcripts_searchable_call_session_id_fkey | call_session_id | CASCADE |
| public.call_translations | call_translations_call_session_id_fkey | call_session_id | CASCADE |
| public.coaching_assignments | coaching_assignments_call_session_id_fkey | call_session_id | SET NULL |
| public.coaching_timestamps | coaching_timestamps_call_session_id_fkey | call_session_id | CASCADE |
| public.contact_interactions | contact_interactions_call_session_id_fkey | call_session_id | SET NULL |
| public.crm_field_suggestions | crm_field_suggestions_call_session_id_fkey | call_session_id | CASCADE |
| public.fraud_signals | fraud_signals_call_session_id_fkey | call_session_id | CASCADE |
| public.hold_events | hold_events_call_session_id_fkey | call_session_id | CASCADE |
| public.live_assist_signals | live_assist_signals_call_session_id_fkey | call_session_id | CASCADE |
| public.live_sentiment_snapshots | live_sentiment_snapshots_call_session_id_fkey | call_session_id | CASCADE |
| public.manager_alerts | manager_alerts_call_session_id_fkey | call_session_id | CASCADE |
| public.meeting_summaries | meeting_summaries_call_session_id_fkey | call_session_id | CASCADE |
| public.parked_calls | parked_calls_call_session_id_fkey | call_session_id | SET NULL |
| public.playlist_items | playlist_items_call_session_id_fkey | call_session_id | CASCADE |
| public.redaction_log | redaction_log_call_session_id_fkey | call_session_id | SET NULL |
| public.survey_responses | survey_responses_call_session_id_fkey | call_session_id | SET NULL |
| public.topic_detections | topic_detections_call_session_id_fkey | call_session_id | CASCADE |
| public.tracker_matches | tracker_matches_call_session_id_fkey | call_session_id | CASCADE |
| public.voip_quality_alerts | voip_quality_alerts_call_session_id_fkey | call_session_id | SET NULL |
| public.voip_trunk_usage_metrics | voip_trunk_usage_metrics_call_session_id_fkey | call_session_id | SET NULL |
| public.whisper_messages | whisper_messages_call_session_id_fkey | call_session_id | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| call_sessions_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX call_sessions_pkey ON public.call_sessions USING btree (id)` |
| idx_call_sessions_active_partial | btree | started_at | não | sim | `(status = 'active'::text)` | `CREATE INDEX idx_call_sessions_active_partial ON public.call_sessions USING btree (started_at DESC) WHERE (status = 'active'::text)` |
| idx_call_sessions_agent_date | btree | agent_name, started_at | não | sim |  | `CREATE INDEX idx_call_sessions_agent_date ON public.call_sessions USING btree (agent_name, started_at DESC)` |
| idx_call_sessions_agent_name_trgm | gin | agent_name | não | sim |  | `CREATE INDEX idx_call_sessions_agent_name_trgm ON public.call_sessions USING gin (agent_name gin_trgm_ops)` |
| idx_call_sessions_caller_name_trgm | gin | caller_name | não | sim |  | `CREATE INDEX idx_call_sessions_caller_name_trgm ON public.call_sessions USING gin (caller_name gin_trgm_ops)` |
| idx_call_sessions_caller_phone_trgm | gin | caller_phone | não | sim |  | `CREATE INDEX idx_call_sessions_caller_phone_trgm ON public.call_sessions USING gin (caller_phone gin_trgm_ops)` |
| idx_call_sessions_contact_id | btree | contact_id | não | sim |  | `CREATE INDEX idx_call_sessions_contact_id ON public.call_sessions USING btree (contact_id)` |
| idx_call_sessions_deal_id | btree | deal_id | não | sim |  | `CREATE INDEX idx_call_sessions_deal_id ON public.call_sessions USING btree (deal_id)` |
| idx_call_sessions_status | btree | status | não | sim | `(status = ANY (ARRAY['active'::text, 'ringing'::text, 'on_hold'::text]))` | `CREATE INDEX idx_call_sessions_status ON public.call_sessions USING btree (status) WHERE (status = ANY (ARRAY['active'::text, 'ringing'::text, 'on_hold'::text]))` |
| idx_call_sessions_status_created | btree | status, created_at | não | sim |  | `CREATE INDEX idx_call_sessions_status_created ON public.call_sessions USING btree (status, created_at DESC)` |
| idx_sessions_started_at | btree | started_at | não | sim |  | `CREATE INDEX idx_sessions_started_at ON public.call_sessions USING btree (started_at DESC)` |


## Policies (RLS)

### `Admins can delete call_sessions`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK |  |

### `Admins have full access to call_sessions`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `is_admin()` |
| WITH CHECK |  |

### `Agents can insert own call sessions`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(is_admin_or_supervisor() OR is_active_agent(agent_name))` |

### `Role-based update call_sessions`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(is_admin_or_supervisor() OR (agent_name = get_user_agent_name()))` |
| WITH CHECK |  |

### `Strict isolation: Agents view own sessions`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(is_admin_or_supervisor() OR (agent_name = get_user_agent_name()))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
