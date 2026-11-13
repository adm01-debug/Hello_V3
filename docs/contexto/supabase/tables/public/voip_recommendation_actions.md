# public.voip_recommendation_actions

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
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `recommendation_id` | `text` | não |  |  |  |
| 4 | `category` | `text` | não |  |  |  |
| 5 | `severity` | `text` | não |  |  |  |
| 6 | `action_type` | `text` | não |  |  |  |
| 7 | `action_payload` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 8 | `outcome` | `text` | não |  |  |  |
| 9 | `applied_at` | `timestamp with time zone` | não | `now()` |  |  |
| 10 | `notes` | `text` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| voip_recommendation_actions_outcome_check | CHECK | `CHECK (outcome = ANY (ARRAY['applied'::text, 'snoozed'::text, 'dismissed'::text, 'auto_applied'::text]))` |  |  | sim |
| voip_recommendation_actions_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_voip_rec_actions_cat_outcome | btree | category, outcome | não | sim |  | `CREATE INDEX idx_voip_rec_actions_cat_outcome ON public.voip_recommendation_actions USING btree (category, outcome)` |
| idx_voip_rec_actions_user_time | btree | user_id, applied_at | não | sim |  | `CREATE INDEX idx_voip_rec_actions_user_time ON public.voip_recommendation_actions USING btree (user_id, applied_at DESC)` |
| voip_recommendation_actions_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX voip_recommendation_actions_pkey ON public.voip_recommendation_actions USING btree (id)` |


## Policies (RLS)

### `admin supervisor select all rec actions`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK |  |

### `users insert own rec actions`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `users select own rec actions`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
