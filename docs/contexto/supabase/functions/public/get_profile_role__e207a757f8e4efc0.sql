CREATE OR REPLACE FUNCTION public.get_profile_role(_user_id uuid)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT role FROM public.user_profiles WHERE id = _user_id
$function$
