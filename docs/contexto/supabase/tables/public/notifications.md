# public.notifications

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
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `title` | `text` | não |  |  |  |
| 4 | `message` | `text` | não |  |  |  |
| 5 | `type` | `text` | não | `'info'::text` |  |  |
| 6 | `category` | `text` | não | `'system'::text` |  |  |
| 7 | `severity` | `text` | não | `'info'::text` |  |  |
| 8 | `is_read` | `boolean` | não | `false` |  |  |
| 9 | `is_archived` | `boolean` | não | `false` |  |  |
| 10 | `action_url` | `text` | sim |  |  |  |
| 11 | `action_label` | `text` | sim |  |  |  |
| 12 | `metadata` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 13 | `source_type` | `text` | sim |  |  |  |
| 14 | `source_id` | `text` | sim |  |  |  |
| 15 | `expires_at` | `timestamp with time zone` | sim |  |  |  |
| 16 | `read_at` | `timestamp with time zone` | sim |  |  |  |
| 17 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 18 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| notifications_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_notifications_category | btree | category | não | sim |  | `CREATE INDEX idx_notifications_category ON public.notifications USING btree (category)` |
| idx_notifications_created_at | btree | created_at | não | sim |  | `CREATE INDEX idx_notifications_created_at ON public.notifications USING btree (created_at DESC)` |
| idx_notifications_source_debounce | btree | source_type, source_id, created_at | não | sim | `(source_type IS NOT NULL)` | `CREATE INDEX idx_notifications_source_debounce ON public.notifications USING btree (source_type, source_id, created_at DESC) WHERE (source_type IS NOT NULL)` |
| idx_notifications_source_type_time | btree | source_type, created_at | não | sim | `(source_type IS NOT NULL)` | `CREATE INDEX idx_notifications_source_type_time ON public.notifications USING btree (source_type, created_at DESC) WHERE (source_type IS NOT NULL)` |
| idx_notifications_unread_user | btree | user_id, created_at | não | sim | `(is_read = false)` | `CREATE INDEX idx_notifications_unread_user ON public.notifications USING btree (user_id, created_at DESC) WHERE (is_read = false)` |
| idx_notifications_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_notifications_user_id ON public.notifications USING btree (user_id)` |
| notifications_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX notifications_pkey ON public.notifications USING btree (id)` |


## Policies (RLS)

### `Users can delete own notifications`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users can insert own notifications`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `Users can update own notifications`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users can view own notifications`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| update_notifications_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
