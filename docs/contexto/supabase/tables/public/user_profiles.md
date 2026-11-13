# public.user_profiles

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 6 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não |  |  |  |
| 2 | `email` | `text` | não |  |  |  |
| 3 | `full_name` | `text` | sim |  |  |  |
| 4 | `role` | `text` | não | `'agent'::text` |  |  |
| 5 | `agent_id` | `uuid` | sim |  |  |  |
| 6 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 7 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 8 | `ringtone_preset` | `text` | sim |  |  |  |
| 9 | `ringtone_volume` | `numeric(4,3)` | sim |  |  |  |
| 10 | `dialer_tag_filter` | `text` | sim |  |  |  |
| 11 | `ringtone_updated_by_device` | `text` | sim |  |  |  |
| 12 | `ringtone_updated_at` | `timestamp with time zone` | sim |  |  |  |
| 13 | `dialer_filter_updated_by_device` | `text` | sim |  |  |  |
| 14 | `dialer_filter_updated_at` | `timestamp with time zone` | sim |  |  |  |
| 15 | `preferred_device_label` | `text` | sim |  |  |  |
| 16 | `preferred_device_label_updated_at` | `timestamp with time zone` | sim |  |  |  |
| 17 | `voice_tts_enabled` | `boolean` | sim | `true` |  |  |
| 18 | `voice_tts_rate` | `numeric(3,2)` | sim | `1.00` |  |  |
| 19 | `voice_command_history` | `jsonb` | sim | `'[]'::jsonb` |  |  |
| 20 | `voice_prefs_updated_at` | `timestamp with time zone` | sim |  |  |  |
| 21 | `voice_tts_voice` | `text` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| user_profiles_agent_id_fkey | FOREIGN KEY | `FOREIGN KEY (agent_id) REFERENCES agents(id)` | NO ACTION | NO ACTION | sim |
| user_profiles_dialer_filter_device_check | CHECK | `CHECK (dialer_filter_updated_by_device IS NULL OR dialer_filter_updated_by_device = btrim(dialer_filter_updated_by_device) AND char_length(dialer_filter_updated_by_device) >= 1 AND char_length(dialer_filter_updated_by_device) <= 60)` |  |  | sim |
| user_profiles_dialer_tag_filter_check | CHECK | `CHECK (dialer_tag_filter IS NULL OR (dialer_tag_filter = ANY (ARRAY['__all__'::text, '__untagged__'::text])) OR dialer_tag_filter = btrim(dialer_tag_filter) AND char_length(dialer_tag_filter) >= 1 AND char_length(dialer_tag_filter) <= 24)` |  |  | sim |
| user_profiles_id_fkey | FOREIGN KEY | `FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| user_profiles_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| user_profiles_preferred_device_label_check | CHECK | `CHECK (preferred_device_label IS NULL OR char_length(preferred_device_label) >= 1 AND char_length(preferred_device_label) <= 60 AND preferred_device_label = btrim(preferred_device_label))` |  |  | sim |
| user_profiles_ringtone_device_check | CHECK | `CHECK (ringtone_updated_by_device IS NULL OR ringtone_updated_by_device = btrim(ringtone_updated_by_device) AND char_length(ringtone_updated_by_device) >= 1 AND char_length(ringtone_updated_by_device) <= 60)` |  |  | sim |
| user_profiles_ringtone_preset_check | CHECK | `CHECK (ringtone_preset IS NULL OR char_length(btrim(ringtone_preset)) >= 1 AND char_length(btrim(ringtone_preset)) <= 32 AND ringtone_preset = btrim(ringtone_preset))` |  |  | sim |
| user_profiles_ringtone_volume_check | CHECK | `CHECK (ringtone_volume IS NULL OR ringtone_volume >= 0::numeric AND ringtone_volume <= 1::numeric)` |  |  | sim |
| user_profiles_role_check | CHECK | `CHECK (role = ANY (ARRAY['agent'::text, 'supervisor'::text, 'admin'::text]))` |  |  | sim |
| user_profiles_voice_command_history_shape | CHECK | `CHECK (jsonb_typeof(voice_command_history) = 'array'::text AND jsonb_array_length(voice_command_history) <= 6)` |  |  | sim |
| user_profiles_voice_tts_rate_range | CHECK | `CHECK (voice_tts_rate >= 0.50 AND voice_tts_rate <= 2.00)` |  |  | sim |
| user_profiles_voice_tts_voice_len | CHECK | `CHECK (voice_tts_voice IS NULL OR char_length(voice_tts_voice) <= 160)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_user_profiles_agent_id | btree | agent_id | não | sim |  | `CREATE INDEX idx_user_profiles_agent_id ON public.user_profiles USING btree (agent_id)` |
| user_profiles_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX user_profiles_pkey ON public.user_profiles USING btree (id)` |


## Policies (RLS)

### `Admins can insert profiles with any role`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `is_admin_user(( SELECT auth.uid() AS uid))` |

### `Admins manage all profiles`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `is_admin_user(( SELECT auth.uid() AS uid))` |
| WITH CHECK |  |

### `Admins supervisors view all profiles`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK |  |

### `Admins update any profile`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `is_admin_user(auth.uid())` |
| WITH CHECK | `is_admin_user(auth.uid())` |

### `Users update own profile`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(auth.uid() = id)` |
| WITH CHECK | `(auth.uid() = id)` |

### `Users view own profile`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = id)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| audit_user_profiles_change | BEFORE | UPDATE | ROW | enabled | public.log_critical_rls_event |
| audit_user_profiles_changes | AFTER | INSERT OR DELETE OR UPDATE | ROW | enabled | public.audit_table_change |
| prevent_role_escalation_trigger | BEFORE | UPDATE | ROW | enabled | public.prevent_role_escalation |
| update_user_profiles_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
