-- Data Lake Exports: só admin
DROP POLICY IF EXISTS "Admins manage data lake files" ON storage.objects;
CREATE POLICY "Admins manage data lake files"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'data-lake-exports' AND public.is_admin())
  WITH CHECK (bucket_id = 'data-lake-exports' AND public.is_admin());

-- Virtual Fax Docs: admin/supervisor
DROP POLICY IF EXISTS "Admin/Supervisor manage fax docs" ON storage.objects;
CREATE POLICY "Admin/Supervisor manage fax docs"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'virtual-fax-docs' AND public.is_admin_or_supervisor())
  WITH CHECK (bucket_id = 'virtual-fax-docs' AND public.is_admin_or_supervisor());