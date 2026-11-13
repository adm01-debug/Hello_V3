# public.call_transcripts_searchable

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 3 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `call_session_id` | `uuid` | não |  |  |  |
| 3 | `full_text` | `text` | não |  |  |  |
| 4 | `search_vector` | `tsvector` | sim |  |  |  |
| 5 | `agent_name` | `text` | sim |  |  |  |
| 6 | `duration_seconds` | `integer` | sim |  |  |  |
| 7 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 8 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| call_transcripts_searchable_call_session_id_fkey | FOREIGN KEY | `FOREIGN KEY (call_session_id) REFERENCES call_sessions(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| call_transcripts_searchable_call_session_id_key | UNIQUE | `UNIQUE (call_session_id)` |  |  | sim |
| call_transcripts_searchable_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| call_transcripts_searchable_call_session_id_key | btree | call_session_id | sim | sim |  | `CREATE UNIQUE INDEX call_transcripts_searchable_call_session_id_key ON public.call_transcripts_searchable USING btree (call_session_id)` |
| call_transcripts_searchable_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX call_transcripts_searchable_pkey ON public.call_transcripts_searchable USING btree (id)` |
| idx_call_transcripts_searchable_call_session_id | btree | call_session_id | não | sim |  | `CREATE INDEX idx_call_transcripts_searchable_call_session_id ON public.call_transcripts_searchable USING btree (call_session_id)` |
| idx_transcripts_agent | btree | agent_name | não | sim |  | `CREATE INDEX idx_transcripts_agent ON public.call_transcripts_searchable USING btree (agent_name)` |
| idx_transcripts_search_vector | gin | search_vector | não | sim |  | `CREATE INDEX idx_transcripts_search_vector ON public.call_transcripts_searchable USING gin (search_vector)` |


## Policies (RLS)

### `Owner or admin insert transcripts`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(is_admin_or_supervisor() OR (EXISTS ( SELECT 1    FROM call_sessions cs   WHERE ((cs.id = call_transcripts_searchable.call_session_id) AND (cs.agent_name = get_user_agent_name())))))` |

### `Owner or admin update transcripts`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(is_admin_or_supervisor() OR (EXISTS ( SELECT 1    FROM call_sessions cs   WHERE ((cs.id = call_transcripts_searchable.call_session_id) AND (cs.agent_name = get_user_agent_name())))))` |
| WITH CHECK |  |

### `View transcripts own or supervisor`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(is_admin_or_supervisor() OR can_access_agent_data(agent_name))` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_transcript_search_vector | BEFORE | INSERT OR UPDATE | ROW | enabled | public.update_transcript_search_vector |


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
