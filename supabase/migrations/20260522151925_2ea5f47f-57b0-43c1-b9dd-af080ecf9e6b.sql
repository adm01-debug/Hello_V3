-- Hardening RLS Policies for sensitive tables

-- Translations
DROP POLICY IF EXISTS "Admin can delete translations" ON public.call_translations;
CREATE POLICY "Admin can delete translations" 
ON public.call_translations 
FOR DELETE 
TO authenticated
USING (is_admin_or_supervisor());

-- CRM Suggestions
DROP POLICY IF EXISTS "Admin/supervisor deletam sugestões" ON public.crm_field_suggestions;
CREATE POLICY "Admin/supervisor deletam sugestões" 
ON public.crm_field_suggestions 
FOR DELETE 
TO authenticated
USING (is_admin_or_supervisor());

-- Live Assist Signals
DROP POLICY IF EXISTS "Admin/supervisor podem deletar sinais" ON public.live_assist_signals;
CREATE POLICY "Admin/supervisor podem deletar sinais" 
ON public.live_assist_signals 
FOR DELETE 
TO authenticated
USING (is_admin_or_supervisor());

-- Survey Responses (Ensuring insert is bound to auth)
DROP POLICY IF EXISTS "Admin or CSM insert survey_responses" ON public.survey_responses;
CREATE POLICY "Admin/Supervisor insert survey_responses" 
ON public.survey_responses 
FOR INSERT 
TO authenticated
WITH CHECK (is_admin_or_supervisor());

-- Call Alerts
DROP POLICY IF EXISTS "Admin supervisor insert call_alerts" ON public.call_alerts;
CREATE POLICY "Admin supervisor insert call_alerts" 
ON public.call_alerts 
FOR INSERT 
TO authenticated
WITH CHECK (is_admin_or_supervisor());

-- Key Moments
DROP POLICY IF EXISTS "Admin/supervisor delete key moments" ON public.call_key_moments;
CREATE POLICY "Admin/supervisor delete key moments" 
ON public.call_key_moments 
FOR DELETE 
TO authenticated
USING (is_admin_or_supervisor());

-- Security Definer Function Hardening
-- Ensure the helper functions only respond to authenticated users
CREATE OR REPLACE FUNCTION public.is_admin_or_supervisor()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN FALSE; END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'supervisor')
  );
END;
$$;
