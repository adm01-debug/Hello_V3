import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export interface SecurityScore {
  total: number;
  mfa: number;
  sessions: number;
  ipRestriction: number;
  recentActivity: number;
}

export interface SecurityAlertItem {
  id: string;
  type: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  created_at: string;
  is_resolved: boolean;
}

export function useSecurityDashboard(
  userId: string | undefined,
  mfaEnabled: boolean | undefined,
  mfaLoading: boolean,
  sessionsCount: number
) {
  const [securityScore, setSecurityScore] = useState<SecurityScore>({ total: 0, mfa: 0, sessions: 0, ipRestriction: 0, recentActivity: 0 });
  const [recentAlerts, setRecentAlerts] = useState<SecurityAlertItem[]>([]);
  const [blockedAccess, setBlockedAccess] = useState(0);
  const [ipRestrictionEnabled, setIpRestrictionEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadSecurityData = async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const { data: ipRestriction } = await supabase.from('user_ip_restrictions').select('enabled').eq('user_id', userId).maybeSingle();
      setIpRestrictionEnabled(ipRestriction?.enabled || false);
      const { data: alerts } = await supabase.from('security_alerts').select('*').order('created_at', { ascending: false }).limit(5);
      setRecentAlerts((alerts || []).map(a => ({
        id: a.id, type: a.alert_type, severity: a.severity as 'info' | 'warning' | 'critical',
        title: a.title, description: a.description, created_at: a.created_at, is_resolved: a.is_resolved,
      })));
      const { count } = await supabase.from('blocked_access_logs').select('*', { count: 'exact', head: true }).eq('user_id', userId);
      setBlockedAccess(count || 0);
      calculateSecurityScore(ipRestriction?.enabled || false);
    } catch (error) {
      logger.error('Error loading security data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateSecurityScore = (ipEnabled: boolean) => {
    const score: SecurityScore = { total: 0, mfa: 0, sessions: 0, ipRestriction: 0, recentActivity: 0 };
    if (mfaEnabled) score.mfa = 40;
    if (sessionsCount === 1) score.sessions = 20;
    else if (sessionsCount <= 3) score.sessions = 15;
    else if (sessionsCount <= 5) score.sessions = 10;
    else score.sessions = 5;
    if (ipEnabled) score.ipRestriction = 25;
    const unresolvedAlerts = recentAlerts.filter(a => !a.is_resolved).length;
    if (unresolvedAlerts === 0) score.recentActivity = 15;
    else if (unresolvedAlerts <= 2) score.recentActivity = 10;
    else score.recentActivity = 5;
    score.total = score.mfa + score.sessions + score.ipRestriction + score.recentActivity;
    setSecurityScore(score);
  };

  useEffect(() => { if (userId) loadSecurityData(); }, [userId]);
  useEffect(() => {
    if (!mfaLoading && userId) calculateSecurityScore(ipRestrictionEnabled);
  }, [mfaEnabled, sessionsCount, ipRestrictionEnabled, recentAlerts, mfaLoading]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    if (score >= 40) return 'text-warning';
    return 'text-destructive';
  };
  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excelente';
    if (score >= 60) return 'Bom';
    if (score >= 40) return 'Regular';
    return 'Fraco';
  };
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'warning': return 'bg-warning/10 text-warning border-warning/20';
      default: return 'bg-primary/10 text-primary border-primary/20';
    }
  };
  const formatTimeAgo = (dateString: string) => {
    const diffMs = Date.now() - new Date(dateString).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins}m`;
    const diffHours = Math.floor(diffMs / 3600000);
    if (diffHours < 24) return `${diffHours}h`;
    return `${Math.floor(diffMs / 86400000)}d`;
  };

  return {
    securityScore, recentAlerts, blockedAccess, ipRestrictionEnabled, isLoading,
    loadSecurityData, getScoreColor, getScoreLabel, getSeverityColor, formatTimeAgo,
  };
}
