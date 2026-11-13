# public.call_translations

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
| 3 | `segment_id` | `uuid` | sim |  |  |  |
| 4 | `speaker` | `text` | não |  |  |  |
| 5 | `source_lang` | `text` | não |  |  |  |
| 6 | `target_lang` | `text` | não |  |  |  |
| 7 | `original_text` | `text` | não |  |  |  |
| 8 | `translated_text` | `text` | não |  |  |  |
| 9 | `confidence` | `numeric(3,2)` | sim |  |  |  |
| 10 | `detected_lang` | `text` | sim |  |  |  |
| 11 | `model_used` | `text` | sim |  |  |  |
| 12 | `latency_ms` | `integer` | sim |  |  |  |
| 13 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| call_translations_call_session_id_fkey | FOREIGN KEY | `FOREIGN KEY (call_session_id) REFERENCES call_sessions(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| call_translations_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| call_translations_speaker_check | CHECK | `CHECK (speaker = ANY (ARRAY['agent'::text, 'customer'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| call_translations_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX call_translations_pkey ON public.call_translations USING btree (id)` |
| idx_call_translations_call_session_id | btree | call_session_id | não | sim |  | `CREATE INDEX idx_call_translations_call_session_id ON public.call_translations USING btree (call_session_id)` |
| idx_call_translations_langs | btree | source_lang, target_lang | não | sim |  | `CREATE INDEX idx_call_translations_langs ON public.call_translations USING btree (source_lang, target_lang)` |
| idx_call_translations_session | btree | call_session_id, created_at | não | sim |  | `CREATE INDEX idx_call_translations_session ON public.call_translations USING btree (call_session_id, created_at)` |


## Policies (RLS)

### `Admin can delete translations`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK |  |

### `Agent/supervisor/admin can view translations`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(is_admin_or_supervisor() OR (EXISTS ( SELECT 1    FROM call_sessions cs   WHERE ((cs.id = call_translations.call_session_id) AND can_access_agent_data(cs.agent_name)))))` |
| WITH CHECK |  |

### `Owner or admin insert translations`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(is_admin_or_supervisor() OR (EXISTS ( SELECT 1    FROM call_sessions cs   WHERE ((cs.id = call_translations.call_session_id) AND (cs.agent_name = get_user_agent_name())))))` |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
