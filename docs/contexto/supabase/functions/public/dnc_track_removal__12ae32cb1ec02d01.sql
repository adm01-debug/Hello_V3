CREATE OR REPLACE FUNCTION public.dnc_track_removal()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_email text;
begin
  if old.is_active is distinct from new.is_active then
    if new.is_active is false then
      select email into v_email from public.user_profiles where id = auth.uid();
      new.removed_at := now();
      new.removed_by := coalesce(
        nullif(btrim(coalesce(new.removed_by, '')), ''),
        v_email,
        nullif(btrim(coalesce(current_setting('request.jwt.claims', true)::jsonb ->> 'email', '')), ''),
        'desconhecido'
      );
      new.removal_reason := coalesce(nullif(btrim(coalesce(new.removal_reason, '')), ''), 'removido na interface');
    else
      new.removed_at := null;
      new.removed_by := null;
      new.removal_reason := null;
    end if;
  end if;
  return new;
end;
$function$
