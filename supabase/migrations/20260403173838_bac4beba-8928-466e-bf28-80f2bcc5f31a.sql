-- 1. Fix storage policies for call-recordings (require auth + role)
DROP POLICY IF EXISTS "Allow public read from call-recordings" ON storage.objects;
DROP POLICY IF EXISTS "Allow public upload to call-recordings" ON storage.objects;
DROP POLICY IF EXISTS "Allow public delete from call-recordings" ON storage.objects;

CREATE POLICY "Authenticated admins can read call-recordings"
ON storage.objects FOR SELECT
USING (bucket_id = 'call-recordings' AND auth.uid() IS NOT NULL AND is_admin_or_supervisor());

CREATE POLICY "Authenticated admins can upload call-recordings"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'call-recordings' AND auth.uid() IS NOT NULL AND is_admin_or_supervisor());

CREATE POLICY "Authenticated admins can delete call-recordings"
ON storage.objects FOR DELETE
USING (bucket_id = 'call-recordings' AND auth.uid() IS NOT NULL AND is_admin_or_supervisor());

-- 2. Remove sensitive tables from Realtime publication
ALTER PUBLICATION supabase_realtime DROP TABLE public.security_alerts;
ALTER PUBLICATION supabase_realtime DROP TABLE public.blocked_access_logs;
ALTER PUBLICATION supabase_realtime DROP TABLE public.user_profiles;
ALTER PUBLICATION supabase_realtime DROP TABLE public.rate_limit_alerts;

-- 3. Fix privilege escalation: prevent role changes via trigger
CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If role is being changed, only admins can do that
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    IF NOT is_admin_user(auth.uid()) THEN
      NEW.role := OLD.role; -- Revert role change
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_role_escalation_trigger ON public.user_profiles;
CREATE TRIGGER prevent_role_escalation_trigger
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_role_escalation();

-- 4. Fix whisper_messages UPDATE policy
DROP POLICY IF EXISTS "Users can update whisper_messages" ON public.whisper_messages;
CREATE POLICY "Agents can update own whisper_messages"
ON public.whisper_messages FOR UPDATE
USING (is_admin_or_supervisor() OR agent_name = get_user_agent_name());

-- 5. Fix number_porting_requests SELECT
DROP POLICY IF EXISTS "Authenticated can view porting" ON public.number_porting_requests;
CREATE POLICY "Admins can view porting requests"
ON public.number_porting_requests FOR SELECT
USING (is_admin_or_supervisor());

-- 6. Fix ip_whitelist SELECT  
DROP POLICY IF EXISTS "Authenticated can view ip_whitelist" ON public.ip_whitelist;
CREATE POLICY "Admins can view ip_whitelist"
ON public.ip_whitelist FOR SELECT
USING (get_user_role() = 'admin');

-- 7. Fix rate_limit_settings SELECT
DROP POLICY IF EXISTS "Authenticated can view rate_limit_settings" ON public.rate_limit_settings;
CREATE POLICY "Admins can view rate_limit_settings"
ON public.rate_limit_settings FOR SELECT
USING (has_role(auth.uid(), 'admin'));