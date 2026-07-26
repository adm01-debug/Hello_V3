ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS preferred_device_label TEXT,
  ADD COLUMN IF NOT EXISTS preferred_device_label_updated_at TIMESTAMPTZ;

ALTER TABLE public.user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_preferred_device_label_check;

ALTER TABLE public.user_profiles
  ADD CONSTRAINT user_profiles_preferred_device_label_check
  CHECK (
    preferred_device_label IS NULL
    OR (
      char_length(preferred_device_label) BETWEEN 1 AND 60
      AND preferred_device_label = btrim(preferred_device_label)
    )
  );