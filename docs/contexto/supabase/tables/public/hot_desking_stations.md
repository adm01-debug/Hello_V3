# public.hot_desking_stations

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
| 2 | `station_name` | `text` | não |  |  |  |
| 3 | `location` | `text` | sim |  |  |  |
| 4 | `extension` | `text` | sim |  |  |  |
| 5 | `is_available` | `boolean` | não | `true` |  |  |
| 6 | `current_user_name` | `text` | sim |  |  |  |
| 7 | `checked_in_at` | `timestamp with time zone` | sim |  |  |  |
| 8 | `auto_logout_at` | `timestamp with time zone` | sim |  |  |  |
| 9 | `equipment` | `jsonb` | não | `'{"headset": true, "monitor": true}'::jsonb` |  |  |
| 10 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 11 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| hot_desking_stations_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| hot_desking_stations_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX hot_desking_stations_pkey ON public.hot_desking_stations USING btree (id)` |


## Policies (RLS)

### `Admins can manage stations`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK |  |

### `Authenticated can view stations`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |
| WITH CHECK |  |

### `Users can update own station or admins all`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(is_admin_or_supervisor() OR (current_user_name = ( SELECT user_profiles.full_name    FROM user_profiles   WHERE (user_profiles.id = ( SELECT auth.uid() AS uid)))))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
