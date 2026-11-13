# public.call_summaries

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
| 3 | `summary` | `text` | sim |  |  |  |
| 4 | `main_topics` | `text[]` | sim |  |  |  |
| 5 | `overall_sentiment` | `text` | sim |  |  |  |
| 6 | `customer_satisfaction` | `integer` | sim |  |  |  |
| 7 | `agent_performance_score` | `integer` | sim |  |  |  |
| 8 | `next_steps` | `text[]` | sim |  |  |  |
| 9 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 10 | `translated_summary` | `jsonb` | sim | `'{}'::jsonb` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| call_summaries_call_session_id_fkey | FOREIGN KEY | `FOREIGN KEY (call_session_id) REFERENCES call_sessions(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| call_summaries_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| call_summaries_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX call_summaries_pkey ON public.call_summaries USING btree (id)` |
| idx_call_summaries_call_session_id | btree | call_session_id | não | sim |  | `CREATE INDEX idx_call_summaries_call_session_id ON public.call_summaries USING btree (call_session_id)` |


## Policies (RLS)

### `Admins can manage call_summaries`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK |  |

### `Role-based view call_summaries`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(is_admin_or_supervisor() OR (EXISTS ( SELECT 1    FROM call_sessions cs   WHERE ((cs.id = call_summaries.call_session_id) AND (cs.agent_name = get_user_agent_name())))))` |
| WITH CHECK |  |

### `Validated insert call_summaries`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(is_admin_or_supervisor() OR (EXISTS ( SELECT 1    FROM call_sessions cs   WHERE ((cs.id = call_summaries.call_session_id) AND (cs.agent_name = get_user_agent_name())))))` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_auto_scorecard | AFTER | INSERT | ROW | enabled | public.trigger_auto_scorecard |


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
