ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS ringtone_preset TEXT,
  ADD COLUMN IF NOT EXISTS ringtone_volume NUMERIC(4,3);

ALTER TABLE public.user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_ringtone_preset_check;
ALTER TABLE public.user_profiles
  ADD CONSTRAINT user_profiles_ringtone_preset_check
  CHECK (ringtone_preset IS NULL OR (char_length(btrim(ringtone_preset)) BETWEEN 1 AND 32 AND ringtone_preset = btrim(ringtone_preset)));

ALTER TABLE public.user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_ringtone_volume_check;
ALTER TABLE public.user_profiles
  ADD CONSTRAINT user_profiles_ringtone_volume_check
  CHECK (ringtone_volume IS NULL OR (ringtone_volume >= 0 AND ringtone_volume <= 1));