# public.call_playlists

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
| 2 | `name` | `text` | não |  |  |  |
| 3 | `description` | `text` | sim |  |  |  |
| 4 | `playlist_type` | `text` | não | `'manual'::text` |  |  |
| 5 | `auto_query` | `jsonb` | sim |  |  |  |
| 6 | `is_shared` | `boolean` | não | `false` |  |  |
| 7 | `shared_with` | `text[]` | sim | `'{}'::text[]` |  |  |
| 8 | `created_by` | `uuid` | sim |  |  |  |
| 9 | `owner_agent_name` | `text` | sim |  |  |  |
| 10 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 11 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| call_playlists_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.playlist_items | playlist_items_playlist_id_fkey | playlist_id | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| call_playlists_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX call_playlists_pkey ON public.call_playlists USING btree (id)` |
| idx_playlists_owner | btree | owner_agent_name | não | sim |  | `CREATE INDEX idx_playlists_owner ON public.call_playlists USING btree (owner_agent_name)` |


## Policies (RLS)

### `Owner or admin create playlists`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(is_admin_or_supervisor() OR (owner_agent_name = get_user_agent_name()))` |

### `Owners delete playlists`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | public |
| USING | `((owner_agent_name = get_user_agent_name()) OR is_admin_or_supervisor())` |
| WITH CHECK |  |

### `Owners update playlists`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | public |
| USING | `((owner_agent_name = get_user_agent_name()) OR is_admin_or_supervisor())` |
| WITH CHECK | `((owner_agent_name = get_user_agent_name()) OR is_admin_or_supervisor())` |

### `View own or shared playlists`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(is_admin_or_supervisor() OR (owner_agent_name = get_user_agent_name()) OR ((is_shared = true) AND (get_user_agent_name() = ANY (shared_with))))` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_playlists_updated | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
