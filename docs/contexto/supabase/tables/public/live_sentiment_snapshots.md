# public.live_sentiment_snapshots

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 2 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `call_session_id` | `uuid` | não |  |  |  |
| 3 | `timestamp_seconds` | `numeric` | não | `0` |  |  |
| 4 | `sentiment` | `text` | não |  |  |  |
| 5 | `score` | `numeric` | sim | `0` |  |  |
| 6 | `urgency` | `text` | sim | `'low'::text` |  |  |
| 7 | `emotion` | `text` | sim |  |  |  |
| 8 | `metadata` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 9 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| live_sentiment_snapshots_call_session_id_fkey | FOREIGN KEY | `FOREIGN KEY (call_session_id) REFERENCES call_sessions(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| live_sentiment_snapshots_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| live_sentiment_snapshots_sentiment_check | CHECK | `CHECK (sentiment = ANY (ARRAY['positive'::text, 'neutral'::text, 'negative'::text, 'mixed'::text]))` |  |  | sim |
| live_sentiment_snapshots_urgency_check | CHECK | `CHECK (urgency = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_live_sentiment_snapshots_call_session_id | btree | call_session_id | não | sim |  | `CREATE INDEX idx_live_sentiment_snapshots_call_session_id ON public.live_sentiment_snapshots USING btree (call_session_id)` |
| idx_sentiment_snap_created | btree | created_at | não | sim |  | `CREATE INDEX idx_sentiment_snap_created ON public.live_sentiment_snapshots USING btree (created_at)` |
| live_sentiment_snapshots_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX live_sentiment_snapshots_pkey ON public.live_sentiment_snapshots USING btree (id)` |


## Policies (RLS)

### `Owner or admin insert sentiment snapshots`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(is_admin_or_supervisor() OR (EXISTS ( SELECT 1    FROM call_sessions cs   WHERE ((cs.id = live_sentiment_snapshots.call_session_id) AND (cs.agent_name = get_user_agent_name())))))` |

### `View sentiment snapshots`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(is_admin_or_supervisor() OR (EXISTS ( SELECT 1    FROM call_sessions cs   WHERE ((cs.id = live_sentiment_snapshots.call_session_id) AND can_access_agent_data(cs.agent_name)))))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
