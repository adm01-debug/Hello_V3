import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  category: string;
  severity: string;
  is_read: boolean;
  is_archived: boolean;
  action_url?: string;
  action_label?: string;
  metadata?: Record<string, unknown>;
  source_type?: string;
  source_id?: string;
  expires_at?: string;
  read_at?: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreferences {
  email_enabled: boolean;
  push_enabled: boolean;
  sound_enabled: boolean;
  digest_enabled: boolean;
  digest_frequency: string;
  quiet_hours_enabled: boolean;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  categories: Record<string, boolean>;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  email_enabled: true,
  push_enabled: true,
  sound_enabled: true,
  digest_enabled: false,
  digest_frequency: 'daily',
  quiet_hours_enabled: false,
  quiet_hours_start: '22:00',
  quiet_hours_end: '08:00',
  categories: { system: true, call: true, security: true, coaching: true, gamification: true },
};

// Use typed table references from generated types
const notificationsTable = () => supabase.from('notifications');
const preferencesTable = () => supabase.from('notification_preferences');

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await notificationsTable()
      .select('*')
      .eq('user_id', user.id)
      .eq('is_archived', false)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      setNotifications(data as Notification[]);
      setUnreadCount((data as Notification[]).filter(n => !n.is_read).length);
    }
    setLoading(false);
  }, [user]);

  const fetchPreferences = useCallback(async () => {
    if (!user) return;
    
    const { data } = await preferencesTable()
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      setPreferences({
        email_enabled: data.email_enabled,
        push_enabled: data.push_enabled,
        sound_enabled: data.sound_enabled,
        digest_enabled: data.digest_enabled,
        digest_frequency: data.digest_frequency,
        quiet_hours_enabled: data.quiet_hours_enabled,
        quiet_hours_start: data.quiet_hours_start || '22:00',
        quiet_hours_end: data.quiet_hours_end || '08:00',
        categories: data.categories as Record<string, boolean>,
      });
    }
  }, [user]);

  const markAsRead = useCallback(async (notificationId: string) => {
    await notificationsTable()
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId);
    
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!user) return;
    
    await notificationsTable()
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('is_read', false);
    
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  }, [user]);

  const archiveNotification = useCallback(async (notificationId: string) => {
    await notificationsTable()
      .update({ is_archived: true })
      .eq('id', notificationId);
    
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    setUnreadCount(prev => {
      const wasUnread = notifications.find(n => n.id === notificationId && !n.is_read);
      return wasUnread ? Math.max(0, prev - 1) : prev;
    });
  }, [notifications]);

  const deleteNotification = useCallback(async (notificationId: string) => {
    await notificationsTable()
      .delete()
      .eq('id', notificationId);
    
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  }, []);

  const updatePreferences = useCallback(async (newPrefs: Partial<NotificationPreferences>) => {
    if (!user) return;
    
    const merged = { ...preferences, ...newPrefs };
    setPreferences(merged);

    await preferencesTable()
      .upsert({
        user_id: user.id,
        ...merged,
      }, { onConflict: 'user_id' });
  }, [user, preferences]);

  const playSound = useCallback(() => {
    if (!preferences.sound_enabled) return;
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=');
      }
      audioRef.current.play().catch(() => {});
    } catch {
      // Silently fail
    }
  }, [preferences.sound_enabled]);

  useEffect(() => {
    if (!user) return;

    fetchNotifications();
    fetchPreferences();

    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotif = payload.new as unknown as Notification;
          setNotifications(prev => [newNotif, ...prev]);
          setUnreadCount(prev => prev + 1);
          playSound();

          if (preferences.push_enabled && 'Notification' in window && Notification.permission === 'granted') {
            new Notification(newNotif.title, {
              body: newNotif.message,
              icon: '/favicon.ico',
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchNotifications, fetchPreferences, playSound, preferences.push_enabled]);

  return {
    notifications,
    unreadCount,
    loading,
    preferences,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    deleteNotification,
    updatePreferences,
    refetch: fetchNotifications,
  };
}
