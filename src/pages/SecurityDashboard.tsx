
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { useSessionManager } from '@/hooks/useSessionManager';
import { useMFA } from '@/hooks/useMFA';
import { useSecurityNotifications } from '@/hooks/useSecurityNotifications';
import { supabase } from '@/integrations/supabase/client';
import { NotificationPermissionBanner } from '@/components/security/NotificationPermissionBanner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Lock,
  Unlock,
  Key,
  Smartphone,
  Monitor,
  Globe,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Activity,
  Users,
  FileText,
  Settings,
  RefreshCw,
  Eye,
  TrendingUp,
  Loader2,
  Bell,
} from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

interface SecurityScore {
  total: number;
  mfa: number;
  sessions: number;
  ipRestriction: number;
  recentActivity: number;
}

interface SecurityAlert {
  id: string;
  type: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  created_at: string;
  is_resolved: boolean;
}

export default function SecurityDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { sessions, currentSessionId, sessionDurationHours } = useSessionManager();
  const { settings: mfaSettings, isLoading: mfaLoading } = useMFA();
  
  const [securityScore, setSecurityScore] = useState<SecurityScore>({
    total: 0,
    mfa: 0,
    sessions: 0,
    ipRestriction: 0,
    recentActivity: 0,
  });
  const [recentAlerts, setRecentAlerts] = useState<SecurityAlert[]>([]);
  const [blockedAccess, setBlockedAccess] = useState<number>(0);
  const [ipRestrictionEnabled, setIpRestrictionEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadSecurityData();
    }
  }, [user]);

  const loadSecurityData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Load IP restriction status
      const { data: ipRestriction } = await supabase
        .from('user_ip_restrictions')
        .select('enabled')
        .eq('user_id', user.id)
        .maybeSingle();
      
      setIpRestrictionEnabled(ipRestriction?.enabled || false);

      // Load recent security alerts
      const { data: alerts } = await supabase
        .from('security_alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      
      setRecentAlerts((alerts || []).map((a) => ({
        id: a.id,
        type: a.alert_type,
        severity: a.severity as 'info' | 'warning' | 'critical',
        title: a.title,
        description: a.description,
        created_at: a.created_at,
        is_resolved: a.is_resolved,
      })));

      // Load blocked access count
      const { count } = await supabase
        .from('blocked_access_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      setBlockedAccess(count || 0);

      // Calculate security score
      calculateSecurityScore(ipRestriction?.enabled || false);
    } catch (error) {
      logger.error('Error loading security data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateSecurityScore = (ipEnabled: boolean) => {
    let score = {
      total: 0,
      mfa: 0,
      sessions: 0,
      ipRestriction: 0,
      recentActivity: 0,
    };

    // MFA score (40 points max)
    if (mfaSettings?.mfa_enabled) {
      score.mfa = 40;
    }

    // Sessions score (20 points max)
    const activeSessions = sessions.length;
    if (activeSessions === 1) {
      score.sessions = 20;
    } else if (activeSessions <= 3) {
      score.sessions = 15;
    } else if (activeSessions <= 5) {
      score.sessions = 10;
    } else {
      score.sessions = 5;
    }

    // IP Restriction score (25 points max)
    if (ipEnabled) {
      score.ipRestriction = 25;
    }

    // Recent activity score (15 points max - based on no suspicious activity)
    const unresolvedAlerts = recentAlerts.filter(a => !a.is_resolved).length;
    if (unresolvedAlerts === 0) {
      score.recentActivity = 15;
    } else if (unresolvedAlerts <= 2) {
      score.recentActivity = 10;
    } else {
      score.recentActivity = 5;
    }

    score.total = score.mfa + score.sessions + score.ipRestriction + score.recentActivity;
    setSecurityScore(score);
  };

  useEffect(() => {
    if (!mfaLoading && user) {
      calculateSecurityScore(ipRestrictionEnabled);
    }
  }, [mfaSettings, sessions, ipRestrictionEnabled, recentAlerts, mfaLoading]);

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

  const getScoreIcon = (score: number) => {
    if (score >= 80) return ShieldCheck;
    if (score >= 60) return Shield;
    if (score >= 40) return ShieldAlert;
    return ShieldX;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'warning': return 'bg-warning/10 text-warning border-warning/20';
      default: return 'bg-primary/10 text-primary border-primary/20';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    return `${diffDays}d`;
  };

  const ScoreIcon = getScoreIcon(securityScore.total);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-7xl py-8 space-y-8">
      {/* Notification Permission Banner */}
      <NotificationPermissionBanner />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            Central de Segurança
          </h1>
          <p className="text-muted-foreground mt-1">
            Visão geral da segurança da sua conta
          </p>
        </div>
        <Button variant="outline" onClick={loadSecurityData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Security Score Card */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center gap-8">
            <div className="relative">
              <div className={`w-32 h-32 rounded-full border-8 ${getScoreColor(securityScore.total).replace('text-', 'border-')} flex items-center justify-center bg-background`}>
                <div className="text-center">
                  <span className={`text-4xl font-bold ${getScoreColor(securityScore.total)}`}>
                    {securityScore.total}
                  </span>
                  <span className="text-muted-foreground text-sm block">/100</span>
                </div>
              </div>
              <ScoreIcon className={`absolute -bottom-1 -right-1 h-10 w-10 ${getScoreColor(securityScore.total)} bg-background rounded-full p-1`} />
            </div>
            
            <div className="flex-1 space-y-4">
              <div>
                <h2 className="text-2xl font-semibold">
                  Pontuação de Segurança: <span className={getScoreColor(securityScore.total)}>{getScoreLabel(securityScore.total)}</span>
                </h2>
                <p className="text-muted-foreground">
                  Baseado nas suas configurações de segurança atuais
                </p>
              </div>
              
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>MFA</span>
                    <span className="font-medium">{securityScore.mfa}/40</span>
                  </div>
                  <Progress value={(securityScore.mfa / 40) * 100} className="h-2" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>Sessões</span>
                    <span className="font-medium">{securityScore.sessions}/20</span>
                  </div>
                  <Progress value={(securityScore.sessions / 20) * 100} className="h-2" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>Restrição IP</span>
                    <span className="font-medium">{securityScore.ipRestriction}/25</span>
                  </div>
                  <Progress value={(securityScore.ipRestriction / 25) * 100} className="h-2" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>Atividade</span>
                    <span className="font-medium">{securityScore.recentActivity}/15</span>
                  </div>
                  <Progress value={(securityScore.recentActivity / 15) * 100} className="h-2" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('/sessions')}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sessões Ativas</p>
                <p className="text-3xl font-bold">{sessions.length}</p>
              </div>
              <Monitor className="h-10 w-10 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('/two-factor-auth')}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">MFA</p>
                <p className="text-3xl font-bold flex items-center gap-2">
                  {mfaSettings?.mfa_enabled ? (
                    <>
                      <CheckCircle2 className="h-6 w-6 text-success" />
                      <span className="text-success">Ativo</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-6 w-6 text-destructive" />
                      <span className="text-destructive">Inativo</span>
                    </>
                  )}
                </p>
              </div>
              <Smartphone className="h-10 w-10 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('/security')}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Restrição de IP</p>
                <p className="text-3xl font-bold flex items-center gap-2">
                  {ipRestrictionEnabled ? (
                    <>
                      <Lock className="h-6 w-6 text-success" />
                      <span className="text-success">Ativo</span>
                    </>
                  ) : (
                    <>
                      <Unlock className="h-6 w-6 text-warning" />
                      <span className="text-warning">Inativo</span>
                    </>
                  )}
                </p>
              </div>
              <Globe className="h-10 w-10 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('/audit-logs')}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Acessos Bloqueados</p>
                <p className="text-3xl font-bold">{blockedAccess}</p>
              </div>
              <ShieldAlert className="h-10 w-10 text-destructive opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Security Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recomendações de Segurança
            </CardTitle>
            <CardDescription>
              Ações para melhorar sua pontuação de segurança
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {!mfaSettings?.mfa_enabled && (
              <Alert className="border-warning/30 bg-warning/5">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <AlertTitle className="text-warning">Ativar Autenticação de Dois Fatores</AlertTitle>
                <AlertDescription className="text-muted-foreground">
                  Adicione uma camada extra de segurança ativando o MFA.
                  <Button 
                    variant="link" 
                    className="px-0 h-auto text-warning"
                    onClick={() => navigate('/two-factor-auth')}
                  >
                    Configurar agora →
                  </Button>
                </AlertDescription>
              </Alert>
            )}
            
            {!ipRestrictionEnabled && (
              <Alert className="border-primary/30 bg-primary/5">
                <Globe className="h-4 w-4 text-primary" />
                <AlertTitle className="text-primary">Habilitar Restrição de IP</AlertTitle>
                <AlertDescription className="text-muted-foreground">
                  Limite o acesso à sua conta apenas a IPs conhecidos.
                  <Button 
                    variant="link" 
                    className="px-0 h-auto text-primary"
                    onClick={() => navigate('/security')}
                  >
                    Configurar agora →
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {sessions.length > 3 && (
              <Alert className="border-warning/30 bg-warning/5">
                <Monitor className="h-4 w-4 text-warning" />
                <AlertTitle className="text-warning">Muitas Sessões Ativas</AlertTitle>
                <AlertDescription className="text-muted-foreground">
                  Você tem {sessions.length} sessões ativas. Considere encerrar as que não reconhece.
                  <Button 
                    variant="link" 
                    className="px-0 h-auto text-warning"
                    onClick={() => navigate('/sessions')}
                  >
                    Gerenciar sessões →
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {securityScore.total >= 80 && (
              <Alert className="border-success/30 bg-success/5">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <AlertTitle className="text-success">Excelente!</AlertTitle>
                <AlertDescription className="text-muted-foreground">
                  Sua conta está bem protegida. Continue assim!
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Recent Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Alertas Recentes
            </CardTitle>
            <CardDescription>
              Últimas atividades de segurança
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[250px]">
              {recentAlerts.length > 0 ? (
                <div className="space-y-3">
                  {recentAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-3 rounded-lg border ${getSeverityColor(alert.severity)}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{alert.title}</p>
                          <p className="text-xs opacity-80 mt-1">{alert.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs opacity-70">{formatTimeAgo(alert.created_at)}</span>
                          {alert.is_resolved ? (
                            <CheckCircle2 className="h-4 w-4 text-success" />
                          ) : (
                            <Clock className="h-4 w-4" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <ShieldCheck className="h-12 w-12 opacity-30 mb-2" />
                  <p>Nenhum alerta recente</p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Active Sessions Preview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Sessões Ativas
            </CardTitle>
            <CardDescription>
              Dispositivos conectados à sua conta
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/sessions')}>
            Ver todas
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {sessions.slice(0, 3).map((session) => (
              <div 
                key={session.id}
                className={`p-4 rounded-lg border ${session.id === currentSessionId ? 'border-primary bg-primary/5' : 'border-border'}`}
              >
                <div className="flex items-center gap-3">
                  <Monitor className={`h-8 w-8 ${session.id === currentSessionId ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">
                        {session.device_info?.browser} • {session.device_info?.os}
                      </p>
                      {session.id === currentSessionId && (
                        <Badge variant="default" className="text-xs">Atual</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">
                        {session.location?.city}, {session.location?.country}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Globe className="h-3 w-3" />
                      <span>{session.ip_address}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Button 
          variant="outline" 
          className="h-auto py-4 flex flex-col gap-2"
          onClick={() => navigate('/two-factor-auth')}
        >
          <Key className="h-6 w-6" />
          <span>Configurar MFA</span>
        </Button>
        <Button 
          variant="outline" 
          className="h-auto py-4 flex flex-col gap-2"
          onClick={() => navigate('/sessions')}
        >
          <Monitor className="h-6 w-6" />
          <span>Gerenciar Sessões</span>
        </Button>
        <Button 
          variant="outline" 
          className="h-auto py-4 flex flex-col gap-2"
          onClick={() => navigate('/security')}
        >
          <Settings className="h-6 w-6" />
          <span>Configurações</span>
        </Button>
        <Button 
          variant="outline" 
          className="h-auto py-4 flex flex-col gap-2"
          onClick={() => navigate('/audit-logs')}
        >
          <FileText className="h-6 w-6" />
          <span>Logs de Auditoria</span>
        </Button>
      </div>
    </div>
  );
}
