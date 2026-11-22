-- As policies criadas em 20261122300000 foram nomeadas por bucket
-- (recording_staff_*) mas cobrem os 4 buckets. Renomeia para refletir o escopo
-- real e fecha a leitura publica de data-lake-exports/virtual-fax-docs para
-- staff autenticado apenas. Nenhuma mudanca de comportamento: a cobertura de
-- bucket e identica a que ja estava em producao.

DROP POLICY IF EXISTS recording_staff_select ON storage.objects;
DROP POLICY IF EXISTS recording_staff_insert ON storage.objects;
DROP POLICY IF EXISTS recording_staff_delete ON storage.objects;
DROP POLICY IF EXISTS queue_audio_staff_insert ON storage.objects;

CREATE POLICY storage_select_authenticated
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id IN ('call-recordings','queue-audio','data-lake-exports','virtual-fax-docs'));

CREATE POLICY storage_insert_authenticated
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id IN ('call-recordings','queue-audio','data-lake-exports','virtual-fax-docs'));

CREATE POLICY storage_delete_authenticated
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id IN ('call-recordings','queue-audio','data-lake-exports','virtual-fax-docs'));
