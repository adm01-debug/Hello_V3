# public.topic_detections

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
| 2 | `call_session_id` | `uuid` | sim |  |  |  |
| 3 | `topic` | `text` | não |  |  |  |
| 4 | `confidence` | `numeric` | não | `0` |  |  |
| 5 | `occurrence_count` | `integer` | não | `1` |  |  |
| 6 | `first_detected_at` | `timestamp with time zone` | não | `now()` |  |  |
| 7 | `last_detected_at` | `timestamp with time zone` | não | `now()` |  |  |
| 8 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| topic_detections_call_session_id_fkey | FOREIGN KEY | `FOREIGN KEY (call_session_id) REFERENCES call_sessions(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| topic_detections_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_topic_detections_call_session_id | btree | call_session_id | não | sim |  | `CREATE INDEX idx_topic_detections_call_session_id ON public.topic_detections USING btree (call_session_id)` |
| topic_detections_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX topic_detections_pkey ON public.topic_detections USING btree (id)` |


## Policies (RLS)

### `Admins can manage topics`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK |  |

### `Only admins can insert topic detections`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `is_admin_or_supervisor()` |

### `Scoped view topic detections`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(is_admin_or_supervisor() OR (EXISTS ( SELECT 1    FROM call_sessions cs   WHERE ((cs.id = topic_detections.call_session_id) AND (cs.agent_name = get_user_agent_name())))))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
