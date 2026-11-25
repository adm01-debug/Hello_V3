# public.user_preferences

> Preferências de notificação e áudio por usuário (E076/E077)

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
| 3 | `notify_incoming_calls` | `boolean` | não | `true` |  |  |
| 4 | `notify_missed_calls` | `boolean` | não | `true` |  |  |
| 5 | `notify_voicemail` | `boolean` | não | `true` |  |  |
| 6 | `notify_sound` | `boolean` | não | `true` |  |  |
| 7 | `audio_echo_cancellation` | `boolean` | não | `true` |  |  |
| 8 | `audio_noise_suppression` | `boolean` | não | `true` |  |  |
| 9 | `audio_auto_gain_control` | `boolean` | não | `true` |  |  |
| 10 | `beta_program` | `boolean` | não | `false` |  |  |
| 11 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 12 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| user_preferences_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| user_preferences_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| user_preferences_user_id_key | UNIQUE | `UNIQUE (user_id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| user_preferences_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX user_preferences_pkey ON public.user_preferences USING btree (id)` |
| user_preferences_user_id_key | btree | user_id | sim | sim |  | `CREATE UNIQUE INDEX user_preferences_user_id_key ON public.user_preferences USING btree (user_id)` |


## Policies (RLS)

### `Users can insert own preferences`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(auth.uid() = user_id)` |

### `Users can update own preferences`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK | `(auth.uid() = user_id)` |

### `Users can view own preferences`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| set_user_preferences_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
