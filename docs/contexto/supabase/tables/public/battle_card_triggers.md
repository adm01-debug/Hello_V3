# public.battle_card_triggers

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
| 2 | `battle_card_id` | `uuid` | não |  |  |  |
| 3 | `keyword` | `text` | não |  |  |  |
| 4 | `match_type` | `text` | não | `'contains'::text` |  |  |
| 5 | `is_active` | `boolean` | não | `true` |  |  |
| 6 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| battle_card_triggers_battle_card_id_fkey | FOREIGN KEY | `FOREIGN KEY (battle_card_id) REFERENCES battle_cards(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| battle_card_triggers_match_type_check | CHECK | `CHECK (match_type = ANY (ARRAY['contains'::text, 'exact'::text, 'starts_with'::text]))` |  |  | sim |
| battle_card_triggers_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| battle_card_triggers_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX battle_card_triggers_pkey ON public.battle_card_triggers USING btree (id)` |
| idx_battle_card_triggers_battle_card_id | btree | battle_card_id | não | sim |  | `CREATE INDEX idx_battle_card_triggers_battle_card_id ON public.battle_card_triggers USING btree (battle_card_id)` |
| idx_battle_card_triggers_keyword | btree | keyword | não | sim |  | `CREATE INDEX idx_battle_card_triggers_keyword ON public.battle_card_triggers USING btree (keyword)` |


## Policies (RLS)

### `Admin/supervisor manage triggers`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK | `is_admin_or_supervisor()` |

### `All authenticated view triggers`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
