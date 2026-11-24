-- Avatar de perfil: bucket privado + coluna na tabela + RLS por dono.
--
-- Antes desta migration nao havia onde guardar a foto: os 4 buckets existentes
-- (call-recordings, data-lake-exports, virtual-fax-docs, queue-audio) tem
-- policies que so permitem esses nomes, e user_profiles nao tinha avatar_url.
-- O botao "Alterar foto" em ProfileSettings.tsx:41 era um <Button> sem onClick.
--
-- Bucket privado (public=false): o app gera signed URL no render. Avatar de
-- usuario nao deve ser publico - expoe quem usa o sistema.

-- 1) Coluna
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

COMMENT ON COLUMN public.user_profiles.avatar_url IS
  'Caminho do objeto no bucket avatars (<user_id>/<timestamp>.<ext>), nao URL publica. Render usa createSignedUrl.';

-- 2) Bucket privado, 2 MB, apenas imagens
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  false,
  2097152,
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 3) RLS por dono do objeto: primeiro segmento do path == auth.uid()
--    Remove antes para ser idempotente em reaplicacao.
DROP POLICY IF EXISTS "avatars_select_own" ON storage.objects;
DROP POLICY IF EXISTS "avatars_insert_own" ON storage.objects;
DROP POLICY IF EXISTS "avatars_update_own" ON storage.objects;
DROP POLICY IF EXISTS "avatars_delete_own" ON storage.objects;

CREATE POLICY "avatars_select_own" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);

CREATE POLICY "avatars_insert_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);

CREATE POLICY "avatars_update_own" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text)
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);

CREATE POLICY "avatars_delete_own" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);
