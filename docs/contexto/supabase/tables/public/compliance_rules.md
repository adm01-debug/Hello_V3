# public.compliance_rules

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
| 2 | `rule_name` | `text` | não |  |  |  |
| 3 | `rule_type` | `text` | não |  |  |  |
| 4 | `pattern` | `text` | não |  |  |  |
| 5 | `severity` | `text` | não | `'warning'::text` |  |  |
| 6 | `message` | `text` | não |  |  |  |
| 7 | `required_disclaimer` | `text` | sim |  |  |  |
| 8 | `category` | `text` | sim |  |  |  |
| 9 | `applies_to` | `text` | não | `'agent'::text` |  |  |
| 10 | `is_active` | `boolean` | não | `true` |  |  |
| 11 | `created_by` | `uuid` | sim |  |  |  |
| 12 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 13 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| compliance_rules_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| compliance_rules_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX compliance_rules_pkey ON public.compliance_rules USING btree (id)` |
| idx_compliance_rules_active | btree | rule_type | não | sim | `(is_active = true)` | `CREATE INDEX idx_compliance_rules_active ON public.compliance_rules USING btree (rule_type) WHERE (is_active = true)` |


## Policies (RLS)

### `Admin/supervisor gerenciam regras de compliance`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | public |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK | `is_admin_or_supervisor()` |

### `Todos autenticados leem regras de compliance`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_compliance_rules_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
