# public.webauthn_challenges

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 5 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `challenge` | `text` | não |  |  |  |
| 4 | `type` | `text` | não |  |  |  |
| 5 | `expires_at` | `timestamp with time zone` | não |  |  |  |
| 6 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| webauthn_challenges_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| webauthn_challenges_type_check | CHECK | `CHECK (type = ANY (ARRAY['registration'::text, 'authentication'::text]))` |  |  | sim |
| webauthn_challenges_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_webauthn_challenges_expires | btree | expires_at | não | sim |  | `CREATE INDEX idx_webauthn_challenges_expires ON public.webauthn_challenges USING btree (expires_at)` |
| idx_webauthn_challenges_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_webauthn_challenges_user_id ON public.webauthn_challenges USING btree (user_id)` |
| webauthn_challenges_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX webauthn_challenges_pkey ON public.webauthn_challenges USING btree (id)` |


## Policies (RLS)

### `Deny update webauthn_challenges`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `false` |

### `Users can delete own challenges`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(user_id = ( SELECT auth.uid() AS uid))` |
| WITH CHECK |  |

### `Users can delete own expired challenges`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((expires_at < now()) AND ((user_id = ( SELECT auth.uid() AS uid)) OR is_admin_or_supervisor()))` |
| WITH CHECK |  |

### `Users can insert own challenges`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `((user_id IS NOT NULL) AND (( SELECT auth.uid() AS uid) = user_id))` |

### `Users can read own challenges`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(user_id = ( SELECT auth.uid() AS uid))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
