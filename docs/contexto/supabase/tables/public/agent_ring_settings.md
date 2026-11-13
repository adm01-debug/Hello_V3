# public.agent_ring_settings

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
| 2 | `agent_name` | `text` | não |  |  |  |
| 3 | `ring_strategy` | `text` | não | `'simultaneous'::text` |  |  |
| 4 | `ring_timeout_seconds` | `integer` | não | `30` |  |  |
| 5 | `fallback_action` | `text` | não | `'voicemail'::text` |  |  |
| 6 | `dnd_enabled` | `boolean` | não | `false` |  |  |
| 7 | `dnd_schedule` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 8 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 9 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| agent_ring_settings_agent_name_key | UNIQUE | `UNIQUE (agent_name)` |  |  | sim |
| agent_ring_settings_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| agent_ring_settings_agent_name_key | btree | agent_name | sim | sim |  | `CREATE UNIQUE INDEX agent_ring_settings_agent_name_key ON public.agent_ring_settings USING btree (agent_name)` |
| agent_ring_settings_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX agent_ring_settings_pkey ON public.agent_ring_settings USING btree (id)` |


## Policies (RLS)

### `Admins can manage ring_settings`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK |  |

### `Agents can insert own ring_settings`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(agent_name = get_user_agent_name())` |

### `Agents can update own ring_settings`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(agent_name = get_user_agent_name())` |
| WITH CHECK |  |

### `Agents can view own ring_settings`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(agent_name = get_user_agent_name())` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
