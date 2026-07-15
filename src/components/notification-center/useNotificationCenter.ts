import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { User } from '@supabase/supabase-js';
import type { NotificationRow } from './constants';

export function useNotificationCenter(user: User | null, tab: string) {
  const queryClient = useQueryClient();

  const notificationsQuery = useQuery({
    queryKey: ['notifications-center', tab],
    queryFn: async () => {
      if (!user) return [];
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (tab === 'unread') query = query.eq('is_read', false);
      if (tab === 'archived') query = query.eq('is_archived', true);
      else query = query.eq('is_archived', false);

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as NotificationRow[];
    },
    enabled: !!user,
  });

  const preferencesQuery = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['notifications-center'] });

  const markAsRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('is_read', false);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success('Todas marcadas como lidas');
    },
  });

  const archiveNotification = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_archived: true })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const deleteNotification = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('notifications').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success('Notificação removida');
    },
  });

  const updatePreferences = useMutation({
    mutationFn: async (prefs: Record<string, unknown>) => {
      if (!user) return;
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({ user_id: user.id, ...prefs }, { onConflict: 'user_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
      toast.success('Preferências atualizadas');
    },
  });

  return {
    notifications: notificationsQuery.data ?? [],
    isLoading: notificationsQuery.isLoading,
    preferences: preferencesQuery.data ?? null,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    deleteNotification,
    updatePreferences,
  };
}
