CREATE OR REPLACE FUNCTION public.add_to_dnc(p_phone text, p_reason text DEFAULT 'manual'::text, p_source text DEFAULT 'manual'::text, p_notes text DEFAULT NULL::text, p_expires_at timestamp with time zone DEFAULT NULL::timestamp with time zone)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_normalized TEXT;
  v_id UUID;
  v_user_email TEXT;
BEGIN
  -- Normaliza o telefone
  v_normalized := regexp_replace(p_phone, '[^0-9]', '', 'g');
  
  -- Pega email do usuário atual
  SELECT email INTO v_user_email FROM public.user_profiles WHERE id = auth.uid();
  
  -- Insere ou atualiza
  INSERT INTO public.dnc_list (phone, phone_normalized, reason, source, notes, expires_at, added_by)
  VALUES (p_phone, v_normalized, p_reason, p_source, p_notes, p_expires_at, v_user_email)
  ON CONFLICT (phone_normalized) DO UPDATE
  SET reason = EXCLUDED.reason,
      source = EXCLUDED.source,
      notes = COALESCE(EXCLUDED.notes, dnc_list.notes),
      expires_at = EXCLUDED.expires_at,
      is_active = true,
      updated_at = now()
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$function$
