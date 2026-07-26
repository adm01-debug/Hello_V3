ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS dialer_tag_filter TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_profiles_dialer_tag_filter_check'
  ) THEN
    ALTER TABLE public.user_profiles
      ADD CONSTRAINT user_profiles_dialer_tag_filter_check
      CHECK (
        dialer_tag_filter IS NULL
        OR dialer_tag_filter IN ('__all__', '__untagged__')
        OR (dialer_tag_filter = btrim(dialer_tag_filter) AND char_length(dialer_tag_filter) BETWEEN 1 AND 24)
      );
  END IF;
END $$;