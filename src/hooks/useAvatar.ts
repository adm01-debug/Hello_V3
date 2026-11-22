import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import type { TablesUpdate } from '@/integrations/supabase/types';

const BUCKET = 'avatars';
const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
const SIGNED_URL_TTL = 60 * 60;

export const AVATAR_ACCEPT = ALLOWED.join(',');

// `avatar_url` nasce na migration 20261123020000; os tipos gerados ficam atrás até
// a regeneração. O cast é o mesmo padrão já usado no repo (useProfile.ts).
type ProfileAvatarUpdate = TablesUpdate<'user_profiles'>;

/**
 * Avatar do próprio usuário: upload para o bucket privado `avatars` e leitura via
 * signed URL. O path é `<user_id>/<timestamp>.<ext>` — a policy de storage exige
 * que o primeiro segmento seja o uid, então o arquivo só é acessível pelo dono.
 */
export function useAvatar(path: string | null | undefined) {
  const { user } = useAuthContext();
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!path) {
      setSignedUrl(null);
      return;
    }

    void (async () => {
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(path, SIGNED_URL_TTL);
      if (cancelled) return;
      if (error) {
        logger.error('Error creating avatar signed url:', error);
        setSignedUrl(null);
        return;
      }
      setSignedUrl(data.signedUrl);
    })();

    return () => {
      cancelled = true;
    };
  }, [path]);

  const uploadAvatar = useCallback(
    async (file: File) => {
      if (!user) {
        toast.error('Sessão expirada', { description: 'Faça login novamente.' });
        return null;
      }
      if (!ALLOWED.includes(file.type)) {
        toast.error('Formato não suportado', { description: 'Use PNG, JPG, WEBP ou GIF.' });
        return null;
      }
      if (file.size > MAX_BYTES) {
        toast.error('Arquivo muito grande', { description: 'O limite é 2 MB.' });
        return null;
      }

      setUploading(true);
      try {
        const ext = (file.name.split('.').pop() || 'png').toLowerCase();
        const newPath = `${user.id}/${Date.now()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(newPath, file, { cacheControl: '3600', upsert: false, contentType: file.type });

        if (uploadError) throw uploadError;

        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({ avatar_url: newPath } as ProfileAvatarUpdate)
          .eq('id', user.id);

        if (updateError) {
          // Sem a coluna, o objeto ficaria órfão no bucket.
          await supabase.storage.from(BUCKET).remove([newPath]);
          throw updateError;
        }

        // Remove o avatar anterior depois de o novo estar persistido.
        if (path && path !== newPath) {
          await supabase.storage.from(BUCKET).remove([path]);
        }

        toast.success('Foto atualizada');
        return newPath;
      } catch (error) {
        logger.error('Error uploading avatar:', error);
        toast.error('Erro ao enviar a foto', {
          description: error instanceof Error ? error.message : String(error),
        });
        return null;
      } finally {
        setUploading(false);
      }
    },
    [user, path],
  );

  const removeAvatar = useCallback(async () => {
    if (!user || !path) return false;
    setUploading(true);
    try {
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ avatar_url: null } as ProfileAvatarUpdate)
        .eq('id', user.id);
      if (updateError) throw updateError;

      await supabase.storage.from(BUCKET).remove([path]);
      toast.success('Foto removida');
      return true;
    } catch (error) {
      logger.error('Error removing avatar:', error);
      toast.error('Erro ao remover a foto');
      return false;
    } finally {
      setUploading(false);
    }
  }, [user, path]);

  return { signedUrl, uploading, uploadAvatar, removeAvatar };
}