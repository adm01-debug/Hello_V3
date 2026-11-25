-- user_preferences: preferências de notificação e áudio por usuário (E076/E077)
-- Cria a tabela, RLS e policies no padrão user_mfa_settings.
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  notify_incoming_calls BOOLEAN NOT NULL DEFAULT true,
  notify_missed_calls BOOLEAN NOT NULL DEFAULT true,
  notify_voicemail BOOLEAN NOT NULL DEFAULT true,
  notify_sound BOOLEAN NOT NULL DEFAULT true,
  audio_echo_cancellation BOOLEAN NOT NULL DEFAULT true,
  audio_noise_suppression BOOLEAN NOT NULL DEFAULT true,
  audio_auto_gain_control BOOLEAN NOT NULL DEFAULT true,
  beta_program BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
)

COMMENT ON TABLE public.user_preferences IS 'Preferências de notificação e áudio por usuário (E076/E077)'

-- trigger de updated_at
DROP TRIGGER IF EXISTS set_user_preferences_updated_at ON public.user_preferences

CREATE TRIGGER set_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY

-- Sem GRANT explicito a tabela nova pode ficar inacessivel para `authenticated`
-- mesmo com a policy correta.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_preferences TO authenticated

-- policies: cada usuário só vê/insere/atualiza as próprias preferências
DROP POLICY IF EXISTS "Users can view own preferences" ON public.user_preferences

CREATE POLICY "Users can view own preferences"
  ON public.user_preferences FOR SELECT TO authenticated
  USING (auth.uid() = user_id)

DROP POLICY IF EXISTS "Users can insert own preferences" ON public.user_preferences

CREATE POLICY "Users can insert own preferences"
  ON public.user_preferences FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id)

DROP POLICY IF EXISTS "Users can update own preferences" ON public.user_preferences

CREATE POLICY "Users can update own preferences"
  ON public.user_preferences FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id)
