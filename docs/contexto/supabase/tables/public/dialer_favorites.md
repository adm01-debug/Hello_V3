# public.dialer_favorites

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 1 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `phone` | `text` | não |  |  |  |
| 4 | `label` | `text` | sim |  |  |  |
| 5 | `position` | `integer` | não | `0` |  |  |
| 6 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 7 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 8 | `tag` | `text` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| dialer_favorites_label_len | CHECK | `CHECK (label IS NULL OR char_length(label) <= 120)` |  |  | sim |
| dialer_favorites_phone_len | CHECK | `CHECK (char_length(phone) >= 3 AND char_length(phone) <= 32)` |  |  | sim |
| dialer_favorites_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| dialer_favorites_tag_length | CHECK | `CHECK (tag IS NULL OR char_length(btrim(tag)) >= 1 AND char_length(btrim(tag)) <= 24 AND tag = btrim(tag))` |  |  | sim |
| dialer_favorites_unique_phone | UNIQUE | `UNIQUE (user_id, phone)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| dialer_favorites_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX dialer_favorites_pkey ON public.dialer_favorites USING btree (id)` |
| dialer_favorites_unique_phone | btree | user_id, phone | sim | sim |  | `CREATE UNIQUE INDEX dialer_favorites_unique_phone ON public.dialer_favorites USING btree (user_id, phone)` |
| idx_dialer_favorites_user | btree | user_id, position | não | sim |  | `CREATE INDEX idx_dialer_favorites_user ON public.dialer_favorites USING btree (user_id, "position")` |
| idx_dialer_favorites_user_tag_position | btree | user_id, tag, position | não | sim |  | `CREATE INDEX idx_dialer_favorites_user_tag_position ON public.dialer_favorites USING btree (user_id, tag, "position")` |


## Policies (RLS)

### `Users manage own dialer favorites`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK | `(auth.uid() = user_id)` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| update_dialer_favorites_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
