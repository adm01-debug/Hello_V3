import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSessionManager } from '@/hooks/useSessionManager';
import { useMFA } from '@/hooks/useMFA';
import { logger } from '@/lib/logger';

interface SecurityScore {
  total: number;
  mfa: number;
  sessions: number;
  ipRestriction: number;
  recentActivity: number;
}

export interface SecurityAlert {
  id: string;
  type: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  created_at: string;
  is_resolved: boolean;
}

export function useSecurityDashboard(userId: string | undefined) {
  const { sessions, currentSessionId, sessionDurationHours } = useSessionManager();
  const { settings: mfaSettings, isLoading: mfaLoading } = useMFA();

  const [securityScore, setSecurityScore] = useState<SecurityScore>({ total: 0, mfa: 0, sessions: 0, ipRestriction: 0, recentActivity: 0 });
  const [recentAlerts, setRecentAlerts] = useState<SecurityAlert[]>([]);
  const [blockedAccess, setBlockedAccess] = useState<number>(0);
  const [ipRestrictionEnabled, setIpRestrictionEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const calculateSecurityScore = (ipEnabled: boolean, alerts: SecurityAlert[]) => {
    const score = { total: 0, mfa: 0, sessions: 0, ipRestriction: 0, recentActivity: 0 };
    if (mfaSettings?.mfa_enabled) score.mfa = 40;
    const activeSessions = sessions.length;
    score.sessions = activeSessions === 1 ? 20 : activeSessions <= 3 ? 15 : activeSessions <= 5 ? 10 : 5;
    if (ipEnabled) score.ipRestriction = 25;
    const unresolvedAlerts = alerts.filter(a => !a.is_resolved).length;
    score.recentActivity = unresolvedAlerts === 0 ? 15 : unresolvedAlerts <= 2 ? 10 : 5;
    score.total = score.mfa + score.sessions + score.ipRestriction + score.recentActivity;
    setSecurityScore(score);
  };

  const loadSecurityData = async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const { data: ipRestriction } = await supabase.from('user_ip_restrictions').select('enabled').eq('user_id', userId).maybeSingle();
      setIpRestrictionEnabled(ipRestriction?.enabled || false);

      const { data: alerts } = await supabase.from('security_alerts').select('*').order('created_at', { ascending: false }).limit(5);
      const mapped = (alerts || []).map((a) => ({
        id: a.id, type: a.alert_type, severity: a.severity as 'info' | 'warning' | 'critical',
        title: a.title, description: a.description, created_at: a.created_at, is_resolved: a.is_resolved,
      }));
      setRecentAlerts(mapped);

      const { count } = await supabase.from('blocked_access_logs').select('*', { count: 'exact', head: true }).eq('user_id', userId);
      setBlockedAccess(count || 0);

      calculateSecurityScore(ipRestriction?.enabled || false, mapped);
    } catch (error) {
      logger.error('Error loading security data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userId) loadSecurityData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    if (!mfaLoading && userId) calculateSecurityScore(ipRestrictionEnabled, recentAlerts);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mfaSettings, sessions, ipRestrictionEnabled, mfaLoading]);

  return {
    securityScore, recentAlerts, blockedAccess, ipRestrictionEnabled, isLoading,
    sessions, currentSessionId, sessionDurationHours, mfaSettings, mfaLoading,
    loadSecurityData,
  };
}
