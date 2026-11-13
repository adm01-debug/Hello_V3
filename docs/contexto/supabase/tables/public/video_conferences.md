# public.video_conferences

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
| 2 | `title` | `text` | não |  |  |  |
| 3 | `host_name` | `text` | sim |  |  |  |
| 4 | `status` | `text` | não | `'scheduled'::text` |  |  |
| 5 | `scheduled_at` | `timestamp with time zone` | sim |  |  |  |
| 6 | `started_at` | `timestamp with time zone` | sim |  |  |  |
| 7 | `ended_at` | `timestamp with time zone` | sim |  |  |  |
| 8 | `duration_seconds` | `integer` | sim |  |  |  |
| 9 | `max_participants` | `integer` | não | `10` |  |  |
| 10 | `meeting_url` | `text` | sim |  |  |  |
| 11 | `recording_path` | `text` | sim |  |  |  |
| 12 | `participants` | `jsonb` | não | `'[]'::jsonb` |  |  |
| 13 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 14 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| video_conferences_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| video_conferences_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX video_conferences_pkey ON public.video_conferences USING btree (id)` |


## Policies (RLS)

### `Admins can insert video conferences`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `is_admin_or_supervisor()` |

### `Admins can manage video_conferences`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK |  |

### `Admins can view video conferences`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK |  |

### `Agents can view own conferences`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((host_name = get_user_agent_name()) OR is_admin_or_supervisor())` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
