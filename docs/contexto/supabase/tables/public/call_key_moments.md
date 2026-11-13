# public.call_key_moments

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
| 3 | `moment_type` | `text` | não |  |  |  |
| 4 | `timestamp_seconds` | `numeric` | não | `0` |  |  |
| 5 | `quote` | `text` | não |  |  |  |
| 6 | `speaker` | `text` | sim |  |  |  |
| 7 | `confidence` | `numeric` | sim | `0.8` |  |  |
| 8 | `metadata` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 9 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| call_key_moments_call_session_id_fkey | FOREIGN KEY | `FOREIGN KEY (call_session_id) REFERENCES call_sessions(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| call_key_moments_moment_type_check | CHECK | `CHECK (moment_type = ANY (ARRAY['price'::text, 'competitor'::text, 'objection'::text, 'next_step'::text, 'commitment'::text, 'churn_risk'::text, 'question'::text, 'positive'::text]))` |  |  | sim |
| call_key_moments_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| call_key_moments_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX call_key_moments_pkey ON public.call_key_moments USING btree (id)` |
| idx_call_key_moments_call_session_id | btree | call_session_id | não | sim |  | `CREATE INDEX idx_call_key_moments_call_session_id ON public.call_key_moments USING btree (call_session_id)` |
| idx_key_moments_type | btree | moment_type | não | sim |  | `CREATE INDEX idx_key_moments_type ON public.call_key_moments USING btree (moment_type)` |


## Policies (RLS)

### `Admin/supervisor delete key moments`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK |  |

### `Owner or admin insert key moments`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(is_admin_or_supervisor() OR (EXISTS ( SELECT 1    FROM call_sessions cs   WHERE ((cs.id = call_key_moments.call_session_id) AND (cs.agent_name = get_user_agent_name())))))` |

### `View own or as supervisor key moments`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(is_admin_or_supervisor() OR (EXISTS ( SELECT 1    FROM call_sessions cs   WHERE ((cs.id = call_key_moments.call_session_id) AND can_access_agent_data(cs.agent_name)))))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
