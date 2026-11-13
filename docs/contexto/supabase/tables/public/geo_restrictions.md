# public.geo_restrictions

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
| 2 | `country_code` | `text` | não |  |  |  |
| 3 | `country_name` | `text` | não |  |  |  |
| 4 | `restriction_type` | `text` | não |  |  |  |
| 5 | `reason` | `text` | sim |  |  |  |
| 6 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 7 | `created_by` | `text` | sim |  |  |  |
| 8 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| geo_restrictions_country_code_key | UNIQUE | `UNIQUE (country_code)` |  |  | sim |
| geo_restrictions_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| geo_restrictions_restriction_type_check | CHECK | `CHECK (restriction_type = ANY (ARRAY['blocked'::text, 'allowed'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| geo_restrictions_country_code_key | btree | country_code | sim | sim |  | `CREATE UNIQUE INDEX geo_restrictions_country_code_key ON public.geo_restrictions USING btree (country_code)` |
| geo_restrictions_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX geo_restrictions_pkey ON public.geo_restrictions USING btree (id)` |
| idx_geo_restrictions_country_code | btree | country_code | não | sim |  | `CREATE INDEX idx_geo_restrictions_country_code ON public.geo_restrictions USING btree (country_code)` |


## Policies (RLS)

### `Admins can manage geo restrictions`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK |  |

### `Authenticated users can read geo restrictions`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| update_geo_restrictions_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
