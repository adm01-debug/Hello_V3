
DO $$
DECLARE
  r record;
  new_qual text;
  new_check text;
  role_list text;
  sql text;
  changed boolean;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public'
  LOOP
    new_qual := r.qual;
    new_check := r.with_check;

    -- Two-pass replace: proteger ocorrências já-envolvidas, trocar as cruas, restaurar
    IF new_qual IS NOT NULL THEN
      new_qual := replace(new_qual, '( SELECT auth.uid() AS uid)', '__WRAPPED_UID__');
      new_qual := replace(new_qual, '(SELECT auth.uid() AS uid)', '__WRAPPED_UID__');
      new_qual := replace(new_qual, '( SELECT auth.uid())', '__WRAPPED_UID__');
      new_qual := replace(new_qual, '(SELECT auth.uid())', '__WRAPPED_UID__');
      new_qual := replace(new_qual, 'auth.uid()', '(SELECT auth.uid())');
      new_qual := replace(new_qual, '__WRAPPED_UID__', '(SELECT auth.uid())');
    END IF;

    IF new_check IS NOT NULL THEN
      new_check := replace(new_check, '( SELECT auth.uid() AS uid)', '__WRAPPED_UID__');
      new_check := replace(new_check, '(SELECT auth.uid() AS uid)', '__WRAPPED_UID__');
      new_check := replace(new_check, '( SELECT auth.uid())', '__WRAPPED_UID__');
      new_check := replace(new_check, '(SELECT auth.uid())', '__WRAPPED_UID__');
      new_check := replace(new_check, 'auth.uid()', '(SELECT auth.uid())');
      new_check := replace(new_check, '__WRAPPED_UID__', '(SELECT auth.uid())');
    END IF;

    changed := (new_qual IS DISTINCT FROM r.qual) OR (new_check IS DISTINCT FROM r.with_check);

    IF NOT changed THEN
      CONTINUE;
    END IF;

    role_list := array_to_string(
      ARRAY(SELECT quote_ident(unnest(r.roles::text[]))),
      ', '
    );

    EXECUTE format('DROP POLICY %I ON %I.%I', r.policyname, r.schemaname, r.tablename);

    sql := format(
      'CREATE POLICY %I ON %I.%I AS %s FOR %s TO %s',
      r.policyname, r.schemaname, r.tablename,
      r.permissive, r.cmd, role_list
    );
    IF new_qual IS NOT NULL THEN
      sql := sql || ' USING (' || new_qual || ')';
    END IF;
    IF new_check IS NOT NULL THEN
      sql := sql || ' WITH CHECK (' || new_check || ')';
    END IF;

    EXECUTE sql;
  END LOOP;
END $$;
