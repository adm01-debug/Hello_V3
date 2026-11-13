# public.live_assist_signals

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
| 2 | `call_session_id` | `uuid` | não |  |  |  |
| 3 | `agent_name` | `text` | sim |  |  |  |
| 4 | `intent` | `text` | não |  |  |  |
| 5 | `confidence` | `numeric(3,2)` | sim | `0.0` |  |  |
| 6 | `suggestion` | `text` | sim |  |  |  |
| 7 | `trigger_text` | `text` | sim |  |  |  |
| 8 | `speaker` | `text` | sim |  |  |  |
| 9 | `source` | `text` | não | `'live_analysis'::text` |  |  |
| 10 | `metadata` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 11 | `was_used` | `boolean` | sim | `false` |  |  |
| 12 | `used_at` | `timestamp with time zone` | sim |  |  |  |
| 13 | `timestamp_seconds` | `integer` | não | `0` |  |  |
| 14 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| live_assist_signals_call_session_id_fkey | FOREIGN KEY | `FOREIGN KEY (call_session_id) REFERENCES call_sessions(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| live_assist_signals_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_live_assist_signals_agent | btree | agent_name, created_at | não | sim |  | `CREATE INDEX idx_live_assist_signals_agent ON public.live_assist_signals USING btree (agent_name, created_at DESC)` |
| idx_live_assist_signals_call_session_id | btree | call_session_id | não | sim |  | `CREATE INDEX idx_live_assist_signals_call_session_id ON public.live_assist_signals USING btree (call_session_id)` |
| idx_live_assist_signals_intent | btree | intent | não | sim |  | `CREATE INDEX idx_live_assist_signals_intent ON public.live_assist_signals USING btree (intent)` |
| idx_live_assist_signals_session | btree | call_session_id, created_at | não | sim |  | `CREATE INDEX idx_live_assist_signals_session ON public.live_assist_signals USING btree (call_session_id, created_at DESC)` |
| live_assist_signals_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX live_assist_signals_pkey ON public.live_assist_signals USING btree (id)` |


## Policies (RLS)

### `Admin supervisor insert live_assist_signals`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `is_admin_or_supervisor()` |

### `Admin/supervisor podem deletar sinais`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK |  |

### `Agente pode marcar sinal como usado`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(is_admin_or_supervisor() OR (agent_name = get_user_agent_name()))` |
| WITH CHECK |  |

### `Agentes veem seus próprios sinais`

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
