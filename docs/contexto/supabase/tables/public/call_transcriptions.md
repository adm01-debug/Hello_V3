# public.call_transcriptions

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
| 3 | `speaker` | `text` | não |  |  |  |
| 4 | `text` | `text` | não |  |  |  |
| 5 | `start_time` | `numeric` | sim |  |  |  |
| 6 | `end_time` | `numeric` | sim |  |  |  |
| 7 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| call_transcriptions_call_session_id_fkey | FOREIGN KEY | `FOREIGN KEY (call_session_id) REFERENCES call_sessions(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| call_transcriptions_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| call_transcriptions_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX call_transcriptions_pkey ON public.call_transcriptions USING btree (id)` |
| idx_call_transcriptions_call_session_id | btree | call_session_id | não | sim |  | `CREATE INDEX idx_call_transcriptions_call_session_id ON public.call_transcriptions USING btree (call_session_id)` |
| idx_call_transcriptions_text_trgm | gin | text | não | sim |  | `CREATE INDEX idx_call_transcriptions_text_trgm ON public.call_transcriptions USING gin (text gin_trgm_ops)` |


## Policies (RLS)

### `Admins can manage call_transcriptions`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK |  |

### `Role-based view call_transcriptions`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(is_admin_or_supervisor() OR ((EXISTS ( SELECT 1    FROM call_sessions cs   WHERE ((cs.id = call_transcriptions.call_session_id) AND (cs.agent_name = get_user_agent_name())))) AND is_active_agent(get_user_agent_name())))` |
| WITH CHECK |  |

### `Validated insert call_transcriptions`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(is_admin_or_supervisor() OR ((EXISTS ( SELECT 1    FROM call_sessions cs   WHERE ((cs.id = call_transcriptions.call_session_id) AND (cs.agent_name = get_user_agent_name())))) AND is_active_agent(get_user_agent_name())))` |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
