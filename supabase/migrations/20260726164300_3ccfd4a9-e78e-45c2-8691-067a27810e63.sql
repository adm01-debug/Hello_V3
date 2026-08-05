ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS dialer_filter_updated_by_device TEXT,
  ADD COLUMN IF NOT EXISTS dialer_filter_updated_at TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_profiles_dialer_filter_device_check'
  ) THEN
    ALTER TABLE public.user_profiles
      ADD CONSTRAINT user_profiles_dialer_filter_device_check
      CHECK (
        dialer_filter_updated_by_device IS NULL
        OR (
          dialer_filter_updated_by_device = btrim(dialer_filter_updated_by_device)
          AND char_length(dialer_filter_updated_by_device) BETWEEN 1 AND 60
        )
      );
  END IF;
END $$;