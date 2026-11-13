# public.playlist_items

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
| 2 | `playlist_id` | `uuid` | não |  |  |  |
| 3 | `call_session_id` | `uuid` | não |  |  |  |
| 4 | `notes` | `text` | sim |  |  |  |
| 5 | `display_order` | `integer` | não | `0` |  |  |
| 6 | `added_by` | `uuid` | sim |  |  |  |
| 7 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| playlist_items_call_session_id_fkey | FOREIGN KEY | `FOREIGN KEY (call_session_id) REFERENCES call_sessions(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| playlist_items_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| playlist_items_playlist_id_call_session_id_key | UNIQUE | `UNIQUE (playlist_id, call_session_id)` |  |  | sim |
| playlist_items_playlist_id_fkey | FOREIGN KEY | `FOREIGN KEY (playlist_id) REFERENCES call_playlists(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_playlist_items_call_session_id | btree | call_session_id | não | sim |  | `CREATE INDEX idx_playlist_items_call_session_id ON public.playlist_items USING btree (call_session_id)` |
| idx_playlist_items_playlist | btree | playlist_id, display_order | não | sim |  | `CREATE INDEX idx_playlist_items_playlist ON public.playlist_items USING btree (playlist_id, display_order)` |
| idx_playlist_items_playlist_id | btree | playlist_id | não | sim |  | `CREATE INDEX idx_playlist_items_playlist_id ON public.playlist_items USING btree (playlist_id)` |
| playlist_items_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX playlist_items_pkey ON public.playlist_items USING btree (id)` |
| playlist_items_playlist_id_call_session_id_key | btree | playlist_id, call_session_id | sim | sim |  | `CREATE UNIQUE INDEX playlist_items_playlist_id_call_session_id_key ON public.playlist_items USING btree (playlist_id, call_session_id)` |


## Policies (RLS)

### `Manage items of own playlists`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(EXISTS ( SELECT 1    FROM call_playlists p   WHERE ((p.id = playlist_items.playlist_id) AND ((p.owner_agent_name = get_user_agent_name()) OR is_admin_or_supervisor()))))` |
| WITH CHECK | `(EXISTS ( SELECT 1    FROM call_playlists p   WHERE ((p.id = playlist_items.playlist_id) AND ((p.owner_agent_name = get_user_agent_name()) OR is_admin_or_supervisor()))))` |

### `View items of accessible playlists`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(EXISTS ( SELECT 1    FROM call_playlists p   WHERE ((p.id = playlist_items.playlist_id) AND (is_admin_or_supervisor() OR (p.owner_agent_name = get_user_agent_name()) OR (p.is_shared = true)))))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
