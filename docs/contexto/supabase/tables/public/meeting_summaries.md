# public.meeting_summaries

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 7 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `call_session_id` | `uuid` | não |  |  |  |
| 3 | `summary` | `text` | sim |  |  |  |
| 4 | `key_points` | `jsonb` | sim | `'[]'::jsonb` |  |  |
| 5 | `action_items` | `jsonb` | sim | `'[]'::jsonb` |  |  |
| 6 | `decisions` | `jsonb` | sim | `'[]'::jsonb` |  |  |
| 7 | `next_steps` | `jsonb` | sim | `'[]'::jsonb` |  |  |
| 8 | `participants_sentiment` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 9 | `topics_discussed` | `text[]` | sim | `ARRAY[]::text[]` |  |  |
| 10 | `follow_up_required` | `boolean` | sim | `false` |  |  |
| 11 | `follow_up_reason` | `text` | sim |  |  |  |
| 12 | `ai_model` | `text` | sim |  |  |  |
| 13 | `ai_confidence` | `numeric` | sim |  |  |  |
| 14 | `generated_by` | `uuid` | sim |  |  |  |
| 15 | `generated_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 16 | `edited` | `boolean` | sim | `false` |  |  |
| 17 | `edited_content` | `jsonb` | sim |  |  |  |
| 18 | `edited_by` | `uuid` | sim |  |  |  |
| 19 | `edited_at` | `timestamp with time zone` | sim |  |  |  |
| 20 | `shared_with` | `uuid[]` | sim | `ARRAY[]::uuid[]` |  |  |
| 21 | `status` | `text` | não | `'completed'::text` |  |  |
| 22 | `error_message` | `text` | sim |  |  |  |
| 23 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 24 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| meeting_summaries_call_session_id_fkey | FOREIGN KEY | `FOREIGN KEY (call_session_id) REFERENCES call_sessions(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| meeting_summaries_edited_by_fkey | FOREIGN KEY | `FOREIGN KEY (edited_by) REFERENCES auth.users(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| meeting_summaries_generated_by_fkey | FOREIGN KEY | `FOREIGN KEY (generated_by) REFERENCES auth.users(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| meeting_summaries_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| meeting_summaries_status_check | CHECK | `CHECK (status = ANY (ARRAY['pending'::text, 'generating'::text, 'completed'::text, 'failed'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_meeting_summaries_call_session_id | btree | call_session_id | não | sim |  | `CREATE INDEX idx_meeting_summaries_call_session_id ON public.meeting_summaries USING btree (call_session_id)` |
| idx_meeting_summaries_edited_by | btree | edited_by | não | sim |  | `CREATE INDEX idx_meeting_summaries_edited_by ON public.meeting_summaries USING btree (edited_by)` |
| idx_meeting_summaries_followup | btree | follow_up_required | não | sim | `(follow_up_required = true)` | `CREATE INDEX idx_meeting_summaries_followup ON public.meeting_summaries USING btree (follow_up_required) WHERE (follow_up_required = true)` |
| idx_meeting_summaries_generated_at | btree | generated_at | não | sim |  | `CREATE INDEX idx_meeting_summaries_generated_at ON public.meeting_summaries USING btree (generated_at DESC)` |
| idx_meeting_summaries_generated_by | btree | generated_by | não | sim |  | `CREATE INDEX idx_meeting_summaries_generated_by ON public.meeting_summaries USING btree (generated_by)` |
| idx_meeting_summaries_session | btree | call_session_id | sim | sim |  | `CREATE UNIQUE INDEX idx_meeting_summaries_session ON public.meeting_summaries USING btree (call_session_id)` |
| idx_meeting_summaries_status | btree | status | não | sim |  | `CREATE INDEX idx_meeting_summaries_status ON public.meeting_summaries USING btree (status)` |
| meeting_summaries_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX meeting_summaries_pkey ON public.meeting_summaries USING btree (id)` |


## Policies (RLS)

### `summaries_delete_admin`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | public |
| USING | `is_admin_user(( SELECT auth.uid() AS uid))` |
| WITH CHECK |  |

### `summaries_insert_admin_supervisor`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `is_admin_or_supervisor()` |

### `summaries_insert_agent_own`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | public |
| USING |  |
| WITH CHECK | `(EXISTS ( SELECT 1    FROM call_sessions cs   WHERE ((cs.id = meeting_summaries.call_session_id) AND (cs.agent_name = get_user_agent_name()))))` |

### `summaries_select_admin_supervisor`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | public |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK |  |

### `summaries_select_agent_own`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(EXISTS ( SELECT 1    FROM call_sessions cs   WHERE ((cs.id = meeting_summaries.call_session_id) AND (cs.agent_name = get_user_agent_name()))))` |
| WITH CHECK |  |

### `summaries_update_admin_supervisor`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | public |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK |  |

### `summaries_update_agent_own`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(EXISTS ( SELECT 1    FROM call_sessions cs   WHERE ((cs.id = meeting_summaries.call_session_id) AND (cs.agent_name = get_user_agent_name()))))` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_meeting_summaries_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
