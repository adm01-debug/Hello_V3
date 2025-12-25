-- Restringir INSERT em contacts apenas para supervisores/admins
DROP POLICY IF EXISTS "Authenticated users can insert contacts" ON public.contacts;

CREATE POLICY "Supervisors can insert contacts" ON public.contacts
FOR INSERT WITH CHECK (is_admin_or_supervisor());

-- Restringir INSERT em scheduled_callbacks apenas para supervisores/admins
DROP POLICY IF EXISTS "Role-based insert scheduled_callbacks" ON public.scheduled_callbacks;

CREATE POLICY "Supervisors can insert scheduled_callbacks" ON public.scheduled_callbacks
FOR INSERT WITH CHECK (is_admin_or_supervisor());