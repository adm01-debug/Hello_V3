# public.call_analyses

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
| 3 | `sentiment` | `text` | sim |  |  |  |
| 4 | `urgency` | `text` | sim |  |  |  |
| 5 | `emotion` | `text` | sim |  |  |  |
| 6 | `suggestion` | `text` | sim |  |  |  |
| 7 | `risk_alert` | `text` | sim |  |  |  |
| 8 | `message_analyzed` | `text` | sim |  |  |  |
| 9 | `speaker_role` | `text` | sim |  |  |  |
| 10 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| call_analyses_call_session_id_fkey | FOREIGN KEY | `FOREIGN KEY (call_session_id) REFERENCES call_sessions(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| call_analyses_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| call_analyses_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX call_analyses_pkey ON public.call_analyses USING btree (id)` |
| idx_call_analyses_call_session_id | btree | call_session_id | não | sim |  | `CREATE INDEX idx_call_analyses_call_session_id ON public.call_analyses USING btree (call_session_id)` |


## Policies (RLS)

### `Admins can manage call_analyses`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK |  |

### `Role-based view call_analyses`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(is_admin_or_supervisor() OR (EXISTS ( SELECT 1    FROM call_sessions cs   WHERE ((cs.id = call_analyses.call_session_id) AND (cs.agent_name = get_user_agent_name())))))` |
| WITH CHECK |  |

### `Validated insert call_analyses`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(is_admin_or_supervisor() OR (EXISTS ( SELECT 1    FROM call_sessions cs   WHERE ((cs.id = call_analyses.call_session_id) AND (cs.agent_name = get_user_agent_name())))))` |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
