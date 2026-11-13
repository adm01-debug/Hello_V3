# public.account_lockouts

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
| 2 | `email` | `text` | não |  |  |  |
| 3 | `failed_attempts` | `integer` | não | `0` |  |  |
| 4 | `locked_until` | `timestamp with time zone` | sim |  |  |  |
| 5 | `last_failed_at` | `timestamp with time zone` | sim |  |  |  |
| 6 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 7 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| account_lockouts_email_key | UNIQUE | `UNIQUE (email)` |  |  | sim |
| account_lockouts_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| account_lockouts_email_key | btree | email | sim | sim |  | `CREATE UNIQUE INDEX account_lockouts_email_key ON public.account_lockouts USING btree (email)` |
| account_lockouts_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX account_lockouts_pkey ON public.account_lockouts USING btree (id)` |
| idx_account_lockouts_email | btree | email | não | sim |  | `CREATE INDEX idx_account_lockouts_email ON public.account_lockouts USING btree (email)` |
| idx_account_lockouts_locked_until | btree | locked_until | não | sim |  | `CREATE INDEX idx_account_lockouts_locked_until ON public.account_lockouts USING btree (locked_until)` |


## Policies (RLS)

### `Admins can view account_lockouts`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK |  |

### `Deny direct delete account_lockouts`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | public |
| USING | `false` |
| WITH CHECK |  |

### `Deny direct insert account_lockouts`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | public |
| USING |  |
| WITH CHECK | `false` |

### `Deny direct update account_lockouts`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | public |
| USING | `false` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| update_account_lockouts_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
