ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS voice_tts_voice text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_profiles_voice_tts_voice_len'
  ) THEN
    ALTER TABLE public.user_profiles
      ADD CONSTRAINT user_profiles_voice_tts_voice_len
      CHECK (voice_tts_voice IS NULL OR char_length(voice_tts_voice) <= 160);
  END IF;
END
$$;