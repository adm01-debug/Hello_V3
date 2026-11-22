-- storage.objects tinha RLS ligado e ZERO policies: nenhum upload funcionava
-- em nenhum bucket, incluindo gravacoes de chamada e audios de fila.
-- Policies minimas por bucket, restritas ao papel authenticated.

DROP POLICY IF EXISTS "recording_staff_insert" ON storage.objects;
DROP POLICY IF EXISTS "recording_staff_select" ON storage.objects;
DROP POLICY IF EXISTS "recording_staff_delete" ON storage.objects;
DROP POLICY IF EXISTS "queue_audio_staff_insert" ON storage.objects;

CREATE POLICY "recording_staff_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'call-recordings');

CREATE POLICY "queue_audio_staff_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'queue-audio');

CREATE POLICY "recording_staff_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id IN ('call-recordings', 'queue-audio', 'data-lake-exports', 'virtual-fax-docs'));

CREATE POLICY "recording_staff_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id IN ('call-recordings', 'queue-audio'));
