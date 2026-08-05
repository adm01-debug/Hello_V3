ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS voice_tts_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS voice_tts_rate numeric(3,2) NOT NULL DEFAULT 1.00,
  ADD COLUMN IF NOT EXISTS voice_command_history jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS voice_prefs_updated_at timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_profiles_voice_tts_rate_range'
  ) THEN
    ALTER TABLE public.user_profiles
      ADD CONSTRAINT user_profiles_voice_tts_rate_range
      CHECK (voice_tts_rate >= 0.50 AND voice_tts_rate <= 2.00);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_profiles_voice_command_history_shape'
  ) THEN
    ALTER TABLE public.user_profiles
      ADD CONSTRAINT user_profiles_voice_command_history_shape
      CHECK (
        jsonb_typeof(voice_command_history) = 'array'
        AND jsonb_array_length(voice_command_history) <= 6
      );
  END IF;
END
$$;