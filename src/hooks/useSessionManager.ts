import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

const SESSION_DURATION_HOURS = 24;
const REFRESH_THRESHOLD_MINUTES = 30;

interface ActiveSession {
  id: string;
  session_token: string;
  user_agent: string | null;
  ip_address: string | null;
  device_info: {
    browser?: string;
    os?: string;
    device?: string;
  } | null;
  location: {
    city?: string;
    country?: string;
    countryCode?: string;
  } | null;
  created_at: string;
  last_activity_at: string;
  expires_at: string;
  is_active: boolean;
  is_current?: boolean;
}

export function useSessionManager() {
  const { user, session } = useAuthContext();
  const { checkAndNotifyNewDevice, getDeviceInfo: detectDeviceInfo, getLocationInfo } = useDeviceDetection();
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [hasCheckedDevice, setHasCheckedDevice] = useState(false);

  const getDeviceInfo = useCallback(() => {
    const ua = navigator.userAgent;
    const browser = ua.match(/(chrome|safari|firefox|opera|edge|msie|trident)/i)?.[1] || 'Unknown';
    const os = ua.match(/(windows|mac|linux|android|ios)/i)?.[1] || 'Unknown';
    const isMobile = /mobile|android|iphone|ipad/i.test(ua);
    
    return {
      browser: browser.charAt(0).toUpperCase() + browser.slice(1).toLowerCase(),
      os: os.charAt(0).toUpperCase() + os.slice(1).toLowerCase(),
      device: isMobile ? 'Mobile' : 'Desktop',
    };
  }, []);

  const createSession = useCallback(async () => {
    if (!user || !session) return null;

    try {
      // Get IP and location
      let ipInfo = { ip: 'unknown', city: '', country: '', countryCode: '' };
      try {
        const response = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(5000) });
        if (response.ok) {
          const data = await response.json();
          ipInfo = { ip: data.ip || 'unknown', city: data.city || '', country: data.country_name || '', countryCode: data.country_code || '' };
        }
      } catch {
        // Silently fail IP detection
      }

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + SESSION_DURATION_HOURS);

      const { data, error } = await supabase
        .from('active_sessions')
        .insert({
          user_id: user.id,
          session_token: session.access_token.substring(0, 32),
          user_agent: navigator.userAgent,
          ip_address: ipInfo.ip,
          device_info: getDeviceInfo(),
          location: { city: ipInfo.city, country: ipInfo.country, countryCode: ipInfo.countryCode },
          expires_at: expiresAt.toISOString(),
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      setCurrentSessionId(data.id);
      return data;
    } catch (error) {
      logger.error('Error creating session:', error);
      return null;
    }
  }, [user, session, getDeviceInfo]);

  const loadSessions = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('active_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('last_activity_at', { ascending: false });

      if (error) throw error;

      const sessionsWithCurrent = (data || []).map(s => ({
        ...s,
        device_info: s.device_info as ActiveSession['device_info'],
        location: s.location as ActiveSession['location'],
        is_current: s.id === currentSessionId,
        created_at: s.created_at ?? '',
        expires_at: s.expires_at ?? '',
      }));

      setSessions(sessionsWithCurrent as ActiveSession[]);
    } catch (error) {
      logger.error('Error loading sessions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, currentSessionId]);

  const updateActivity = useCallback(async () => {
    if (!currentSessionId) return;

    try {
      await supabase
        .from('active_sessions')
        .update({ last_activity_at: new Date().toISOString() })
        .eq('id', currentSessionId);
    } catch (error) {
      logger.error('Error updating activity:', error);
    }
  }, [currentSessionId]);

  const revokeSession = useCallback(async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('active_sessions')
        .update({ is_active: false })
        .eq('id', sessionId);

      if (error) throw error;

      if (sessionId === currentSessionId) {
        await supabase.auth.signOut();
        toast.success('Sessão encerrada');
      } else {
        toast.success('Sessão revogada');
        await loadSessions();
      }
    } catch (error: any) {
      toast.error('Erro ao revogar sessão', { description: error.message });
    }
  }, [currentSessionId, loadSessions]);

  const revokeAllOtherSessions = useCallback(async () => {
    if (!user || !currentSessionId) return;

    try {
      const { error } = await supabase
        .from('active_sessions')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .neq('id', currentSessionId);

      if (error) throw error;

      toast.success('Todas as outras sessões foram encerradas');
      await loadSessions();
    } catch (error: any) {
      toast.error('Erro ao revogar sessões', { description: error.message });
    }
  }, [user, currentSessionId, loadSessions]);

  const checkAndRefreshSession = useCallback(async () => {
    if (!session) return;

    const expiresAt = new Date(session.expires_at! * 1000);
    const now = new Date();
    const minutesUntilExpiry = (expiresAt.getTime() - now.getTime()) / 60000;

    if (minutesUntilExpiry <= REFRESH_THRESHOLD_MINUTES) {
      const { error } = await supabase.auth.refreshSession();
      if (error) {
        logger.error('Error refreshing session:', error);
        toast.error('Sua sessão expirou. Faça login novamente.');
      }
    }
  }, [session]);

  // Check for new device on login
  useEffect(() => {
    if (user && session && !hasCheckedDevice) {
      setHasCheckedDevice(true);
      checkAndNotifyNewDevice(
        user.id, 
        user.email || '', 
        user.user_metadata?.full_name
      );
    }
  }, [user, session, hasCheckedDevice, checkAndNotifyNewDevice]);

  // Initialize session on mount
  useEffect(() => {
    if (user && session && !currentSessionId) {
      createSession();
    }
  }, [user, session, currentSessionId, createSession]);

  // Load sessions when user changes
  useEffect(() => {
    if (user) {
      loadSessions();
    }
  }, [user, loadSessions]);

  // Update activity every 5 minutes
  useEffect(() => {
    if (!currentSessionId) return;

    const interval = setInterval(updateActivity, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [currentSessionId, updateActivity]);

  // Check session refresh every minute
  useEffect(() => {
    if (!session) return;

    const interval = setInterval(checkAndRefreshSession, 60 * 1000);
    return () => clearInterval(interval);
  }, [session, checkAndRefreshSession]);

  return {
    sessions,
    currentSessionId,
    isLoading,
    revokeSession,
    revokeAllOtherSessions,
    refreshSessions: loadSessions,
    sessionDurationHours: SESSION_DURATION_HOURS,
  };
}
