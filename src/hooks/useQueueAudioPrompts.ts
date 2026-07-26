import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import {
  buildStoragePath,
  normalizeAudioPromptDraft,
  validateAudioFile,
  type AudioPromptKind,
  type QueueAudioPrompt,
  type QueueAudioPromptDraft,
} from '@/lib/queue-audio';

const log = logger.create('QueueAudio');

const PROMPTS_KEY = ['queue-audio-prompts'] as const;
const BUCKET = 'queue-audio';

export interface UploadPromptInput {
  file: File;
  name: string;
  description: string | null;
  kind: AudioPromptKind;
  durationSeconds: number;
}

/**
 * Biblioteca de áudios das filas: upload no bucket privado `queue-audio`,
 * registro em `queue_audio_prompts` e URLs assinadas para pré-escuta.
 */
export function useQueueAudioPrompts() {
  const queryClient = useQueryClient();

  const promptsQuery = useQuery({
    queryKey: PROMPTS_KEY,
    queryFn: async (): Promise<QueueAudioPrompt[]> => {
      const { data, error } = await supabase
        .from('queue_audio_prompts')
        .select(
          'id, name, description, kind, storage_path, mime_type, file_size_bytes, duration_seconds, is_active, created_at, updated_at',
        )
        .order('kind', { ascending: true })
        .order('name', { ascending: true });
      if (error) throw error;
      return (data ?? []) as QueueAudioPrompt[];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const invalidate = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: PROMPTS_KEY });
    // Filas exibem o nome da faixa selecionada.
    void queryClient.invalidateQueries({ queryKey: ['call-queues'] });
  }, [queryClient]);

  const uploadPrompt = useMutation({
    mutationFn: async (input: UploadPromptInput) => {
      const fileErrors = validateAudioFile(input.file);
      if (fileErrors.length > 0) throw new Error(fileErrors[0]);

      const uniqueId =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `${Date.now()}`;
      const path = buildStoragePath(input.kind, input.file.name, uniqueId);

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, input.file, { contentType: input.file.type, upsert: false });
      if (uploadError) throw uploadError;

      const payload: QueueAudioPromptDraft = normalizeAudioPromptDraft({
        name: input.name,
        description: input.description,
        kind: input.kind,
        storage_path: path,
        mime_type: input.file.type,
        file_size_bytes: input.file.size,
        duration_seconds: input.durationSeconds,
        is_active: true,
      });

      const { error } = await supabase.from('queue_audio_prompts').insert(payload);
      if (error) {
        // Rollback do arquivo para não deixar órfão no bucket.
        await supabase.storage.from(BUCKET).remove([path]);
        throw error;
      }
    },
    onSuccess: () => {
      toast.success('Áudio adicionado à biblioteca');
      invalidate();
    },
    onError: (error: unknown) => {
      log.error('Falha ao enviar áudio de fila', { error });
      const message = error instanceof Error ? error.message : 'Não foi possível enviar o áudio';
      toast.error(message);
    },
  });

  const updatePrompt = useMutation({
    mutationFn: async ({
      id,
      changes,
    }: {
      id: string;
      changes: Partial<Pick<QueueAudioPromptDraft, 'name' | 'description' | 'is_active'>>;
    }) => {
      const { error } = await supabase.from('queue_audio_prompts').update(changes).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => invalidate(),
    onError: (error: unknown) => {
      log.error('Falha ao atualizar áudio de fila', { error });
      toast.error('Não foi possível atualizar o áudio');
    },
  });

  const deletePrompt = useMutation({
    mutationFn: async (prompt: QueueAudioPrompt) => {
      const { error } = await supabase.from('queue_audio_prompts').delete().eq('id', prompt.id);
      if (error) throw error;
      // Arquivo removido depois: se falhar, o registro já não aparece na UI.
      await supabase.storage.from(BUCKET).remove([prompt.storage_path]);
    },
    onSuccess: () => {
      toast.success('Áudio removido');
      invalidate();
    },
    onError: (error: unknown) => {
      log.error('Falha ao remover áudio de fila', { error });
      toast.error('Não foi possível remover o áudio');
    },
  });

  /** URL assinada temporária para pré-escuta (bucket é privado). */
  const getPreviewUrl = useCallback(async (storagePath: string): Promise<string | null> => {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(storagePath, 300);
    if (error) {
      log.error('Falha ao gerar URL de pré-escuta', { error });
      return null;
    }
    return data?.signedUrl ?? null;
  }, []);

  return {
    prompts: promptsQuery.data ?? [],
    isLoading: promptsQuery.isLoading,
    isError: promptsQuery.isError,
    refetch: promptsQuery.refetch,
    uploadPrompt,
    updatePrompt,
    deletePrompt,
    getPreviewUrl,
  };
}
