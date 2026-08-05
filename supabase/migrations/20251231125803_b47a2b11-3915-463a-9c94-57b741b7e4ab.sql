-- Create table for WebAuthn credentials
CREATE TABLE public.user_passkeys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credential_id TEXT NOT NULL UNIQUE,
  public_key TEXT NOT NULL,
  counter BIGINT NOT NULL DEFAULT 0,
  device_type TEXT,
  backed_up BOOLEAN DEFAULT false,
  transports TEXT[],
  friendly_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_used_at TIMESTAMP WITH TIME ZONE
);

-- Create table for WebAuthn challenges
CREATE TABLE public.webauthn_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('registration', 'authentication')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_passkeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webauthn_challenges ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_passkeys
CREATE POLICY "Users can view their own passkeys"
  ON public.user_passkeys FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own passkeys"
  ON public.user_passkeys FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own passkeys"
  ON public.user_passkeys FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own passkeys"
  ON public.user_passkeys FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for webauthn_challenges (more permissive for auth flow)
CREATE POLICY "Anyone can insert challenges"
  ON public.webauthn_challenges FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can read challenges"
  ON public.webauthn_challenges FOR SELECT
  USING (true);

CREATE POLICY "Anyone can delete expired challenges"
  ON public.webauthn_challenges FOR DELETE
  USING (expires_at < now());

-- Index for faster lookups
CREATE INDEX idx_user_passkeys_user_id ON public.user_passkeys(user_id);
CREATE INDEX idx_user_passkeys_credential_id ON public.user_passkeys(credential_id);
CREATE INDEX idx_webauthn_challenges_expires ON public.webauthn_challenges(expires_at);

-- Function to clean expired challenges
CREATE OR REPLACE FUNCTION public.cleanup_expired_challenges()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.webauthn_challenges WHERE expires_at < now();
END;
$$;