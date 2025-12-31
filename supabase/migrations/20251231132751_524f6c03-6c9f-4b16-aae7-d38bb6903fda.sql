-- Create table for tracking login attempts
CREATE TABLE public.login_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient queries
CREATE INDEX idx_login_attempts_email_created ON public.login_attempts (email, created_at DESC);
CREATE INDEX idx_login_attempts_ip_created ON public.login_attempts (ip_address, created_at DESC);

-- Create table for tracking lockouts
CREATE TABLE public.account_lockouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TIMESTAMP WITH TIME ZONE,
  last_failed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for lockout lookups
CREATE INDEX idx_account_lockouts_email ON public.account_lockouts (email);
CREATE INDEX idx_account_lockouts_locked_until ON public.account_lockouts (locked_until);

-- Enable RLS
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_lockouts ENABLE ROW LEVEL SECURITY;

-- Allow insert from edge functions (service role)
CREATE POLICY "Service role can manage login_attempts"
  ON public.login_attempts
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage account_lockouts"
  ON public.account_lockouts
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Function to check and update lockout status
CREATE OR REPLACE FUNCTION public.check_login_lockout(p_email TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_lockout RECORD;
  v_remaining_seconds INTEGER;
BEGIN
  SELECT * INTO v_lockout
  FROM public.account_lockouts
  WHERE email = LOWER(p_email);
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('locked', false, 'attempts', 0);
  END IF;
  
  -- Check if lockout has expired
  IF v_lockout.locked_until IS NOT NULL AND v_lockout.locked_until > now() THEN
    v_remaining_seconds := EXTRACT(EPOCH FROM (v_lockout.locked_until - now()))::INTEGER;
    RETURN jsonb_build_object(
      'locked', true,
      'attempts', v_lockout.failed_attempts,
      'locked_until', v_lockout.locked_until,
      'remaining_seconds', v_remaining_seconds
    );
  END IF;
  
  -- Lockout expired, reset if it was locked
  IF v_lockout.locked_until IS NOT NULL AND v_lockout.locked_until <= now() THEN
    UPDATE public.account_lockouts
    SET locked_until = NULL, failed_attempts = 0, updated_at = now()
    WHERE email = LOWER(p_email);
    
    RETURN jsonb_build_object('locked', false, 'attempts', 0);
  END IF;
  
  RETURN jsonb_build_object('locked', false, 'attempts', v_lockout.failed_attempts);
END;
$$;

-- Function to record failed login attempt
CREATE OR REPLACE FUNCTION public.record_failed_login(
  p_email TEXT,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_lockout RECORD;
  v_new_attempts INTEGER;
  v_lock_duration INTEGER;
  v_locked_until TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Record the attempt
  INSERT INTO public.login_attempts (email, ip_address, user_agent, success)
  VALUES (LOWER(p_email), p_ip_address, p_user_agent, false);
  
  -- Get or create lockout record
  INSERT INTO public.account_lockouts (email, failed_attempts, last_failed_at)
  VALUES (LOWER(p_email), 1, now())
  ON CONFLICT (email) DO UPDATE
  SET 
    failed_attempts = account_lockouts.failed_attempts + 1,
    last_failed_at = now(),
    updated_at = now()
  RETURNING * INTO v_lockout;
  
  v_new_attempts := v_lockout.failed_attempts;
  
  -- Calculate lockout duration with exponential backoff after 5 attempts
  -- Attempts: 5 = 1min, 6 = 2min, 7 = 4min, 8 = 8min, 9 = 16min, 10+ = 30min max
  IF v_new_attempts >= 5 THEN
    v_lock_duration := LEAST(POWER(2, v_new_attempts - 5)::INTEGER, 30) * 60; -- seconds
    v_locked_until := now() + (v_lock_duration || ' seconds')::INTERVAL;
    
    UPDATE public.account_lockouts
    SET locked_until = v_locked_until, updated_at = now()
    WHERE email = LOWER(p_email);
    
    RETURN jsonb_build_object(
      'locked', true,
      'attempts', v_new_attempts,
      'locked_until', v_locked_until,
      'remaining_seconds', v_lock_duration
    );
  END IF;
  
  RETURN jsonb_build_object(
    'locked', false,
    'attempts', v_new_attempts,
    'remaining_attempts', 5 - v_new_attempts
  );
END;
$$;

-- Function to record successful login (resets lockout)
CREATE OR REPLACE FUNCTION public.record_successful_login(
  p_email TEXT,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Record the attempt
  INSERT INTO public.login_attempts (email, ip_address, user_agent, success)
  VALUES (LOWER(p_email), p_ip_address, p_user_agent, true);
  
  -- Reset lockout
  DELETE FROM public.account_lockouts WHERE email = LOWER(p_email);
END;
$$;

-- Trigger for updated_at
CREATE TRIGGER update_account_lockouts_updated_at
  BEFORE UPDATE ON public.account_lockouts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();