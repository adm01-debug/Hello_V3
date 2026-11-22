-- Cinco funcoes de notificacao escolhiam os destinatarios lendo
-- user_profiles.role, a coluna espelho. Passam a ler user_roles, a fonte de
-- verdade, e a respeitar is_active e expires_at.
--
-- Medido em producao: notify_trunk_offline, notify_bloat_hotspots,
-- notify_idle_indexes, notify_suspicious_index_drop_activity e
-- notify_webhook_failure_spike tinham todas o mesmo padrao
-- "FROM public.user_profiles WHERE role = 'admin'". Um admin concedido apenas
-- em user_roles nao recebia nenhuma dessas notificacoes, e um admin revogado
-- (is_active = false) continuava recebendo.
--
-- Cada funcao e redefinida de forma identica, trocando apenas a origem da
-- lista de destinatarios. O corpo e o texto das notificacoes nao mudam.

DO $do$
DECLARE
  v_fn text;
  v_def text;
  v_new text;
  v_alvos text[] := ARRAY[
    'notify_trunk_offline',
    'notify_bloat_hotspots',
    'notify_idle_indexes',
    'notify_suspicious_index_drop_activity',
    'notify_webhook_failure_spike'
  ];
BEGIN
  FOREACH v_fn IN ARRAY v_alvos LOOP
    SELECT pg_get_functiondef(p.oid) INTO v_def
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = v_fn;

    IF v_def IS NULL THEN
      RAISE NOTICE 'funcao % nao existe, ignorando', v_fn;
      CONTINUE;
    END IF;

    v_new := v_def;

    -- Padrao com filtro extra (notify_suspicious_index_drop_activity):
    --   SELECT id FROM public.user_profiles WHERE role = 'admin' AND id <> NEW.admin_id
    v_new := replace(
      v_new,
      $q$SELECT id FROM public.user_profiles
    WHERE role = 'admin' AND id <> NEW.admin_id$q$,
      $q$SELECT DISTINCT user_id AS id FROM public.user_roles
    WHERE role = 'admin'
      AND coalesce(is_active, true)
      AND (expires_at IS NULL OR expires_at > now())
      AND user_id <> NEW.admin_id$q$
    );

    -- Padrao simples nas demais: SELECT id FROM public.user_profiles WHERE role = 'admin'
    v_new := replace(
      v_new,
      $q$SELECT id FROM public.user_profiles WHERE role = 'admin'$q$,
      $q$SELECT DISTINCT user_id AS id FROM public.user_roles WHERE role = 'admin' AND coalesce(is_active, true) AND (expires_at IS NULL OR expires_at > now())$q$
    );

    IF v_new = v_def THEN
      RAISE NOTICE 'funcao % nao casou nenhum padrao conhecido, ignorando', v_fn;
      CONTINUE;
    END IF;

    EXECUTE v_new;
    RAISE NOTICE 'funcao % migrada para user_roles', v_fn;
  END LOOP;
END
$do$;