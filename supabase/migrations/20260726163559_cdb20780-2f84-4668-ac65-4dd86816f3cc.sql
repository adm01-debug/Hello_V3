-- Realtime para user_profiles: necessário para propagar a preferência de toque
-- entre abas/dispositivos. REPLICA IDENTITY FULL garante que o payload das
-- atualizações traga todas as colunas (o cliente lê ringtone_preset/volume).
ALTER TABLE public.user_profiles REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'user_profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_profiles;
  END IF;
END
$$;