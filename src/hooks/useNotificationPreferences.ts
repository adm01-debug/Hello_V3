import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface NotificationPreferences {
  notify_incoming_calls: boolean;
  notify_missed_calls: boolean;
  notify_voicemail: boolean;
  notify_sound: boolean;
  audio_echo_cancellation: boolean;
  audio_noise_suppression: boolean;
  audio_auto_gain_control: boolean;
  beta_program: boolean;
}

export const DEFAULT_PREFERENCES: NotificationPreferences = {
  notify_incoming_calls: true,
  notify_missed_calls: true,
  notify_voicemail: true,
  notify_sound: true,
  audio_echo_cancellation: true,
  audio_noise_suppression: true,
  audio_auto_gain_control: true,
  beta_program: false,
};

export function useNotificationPreferences() {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  const { data: preferences, isLoading } = useQuery({
    queryKey: ['user-preferences', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown as NotificationPreferences | null) ?? DEFAULT_PREFERENCES;
    },
    enabled: !!user,
  });

  const savePreferencesMutation = useMutation({
    mutationFn: async (prefs: Partial<NotificationPreferences>) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('user_preferences')
        .upsert({ user_id: user.id, ...prefs }, { onConflict: 'user_id' });
      if (error) throw error;
    },
    onMutate: async (prefs) => {
      await queryClient.cancelQueries({ queryKey: ['user-preferences', user?.id] });
      const previous = queryClient.getQueryData(['user-preferences', user?.id]);
      queryClient.setQueryData(['user-preferences', user?.id], (old: NotificationPreferences | undefined) => ({
        ...(old ?? DEFAULT_PREFERENCES),
        ...prefs,
      }));
      return { previous };
    },
    onSuccess: () => {
      toast.success('✓ Preferências salvas', { description: 'Suas preferências foram atualizadas' });
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['user-preferences', user?.id], context.previous);
      }
      toast.error('Erro ao salvar preferências', { description: error.message });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['user-preferences', user?.id] });
    },
  });

  return {
    preferences,
    isLoading,
    savePreferences: savePreferencesMutation.mutate,
    isSaving: savePreferencesMutation.isPending,
  };
}
