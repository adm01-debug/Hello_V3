ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS ringtone_updated_by_device TEXT,
  ADD COLUMN IF NOT EXISTS ringtone_updated_at TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_profiles_ringtone_device_check'
  ) THEN
    ALTER TABLE public.user_profiles
      ADD CONSTRAINT user_profiles_ringtone_device_check
      CHECK (
        ringtone_updated_by_device IS NULL
        OR (
          ringtone_updated_by_device = btrim(ringtone_updated_by_device)
          AND char_length(ringtone_updated_by_device) BETWEEN 1 AND 60
        )
      );
  END IF;
END $$;