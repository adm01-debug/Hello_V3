import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { useSessionManager } from '@/hooks/useSessionManager';
import { useMFA } from '@/hooks/useMFA';
import { NotificationPermissionBanner } from '@/components/security/NotificationPermissionBanner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Shield, ShieldCheck, ShieldAlert, ShieldX, Lock, Unlock, Key, Smartphone, Monitor, Globe, MapPin, Clock, AlertTriangle, CheckCircle2, XCircle, ChevronRight, Settings, RefreshCw, FileText, Loader2 } from 'lucide-react';
import { useSecurityDashboard } from '@/hooks/useSecurityDashboard';
import { usePageTitle } from '@/hooks/usePageTitle';

export default function SecurityDashboard() {
  usePageTitle('Central de Segurança');
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { sessions, currentSessionId } = useSessionManager();
  const { settings: mfaSettings, isLoading: mfaLoading } = useMFA();
  const sd = useSecurityDashboard(user?.id, mfaSettings?.mfa_enabled, mfaLoading, sessions.length);

  const getScoreIcon = (score: number) => {
    if (score >= 80) return ShieldCheck;
    if (score >= 60) return Shield;
    if (score >= 40) return ShieldAlert;
    return ShieldX;
  };
  const ScoreIcon = getScoreIcon(sd.securityScore.total);

  if (sd.isLoading) return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="container max-w-7xl py-8 space-y-8">
      <NotificationPermissionBanner />
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold flex items-center gap-3"><Shield className="h-8 w-8 text-primary" />Central de Segurança</h1><p className="text-muted-foreground mt-1">Visão geral da segurança da sua conta</p></div>
        <Button variant="outline" onClick={sd.loadSecurityData}><RefreshCw className="h-4 w-4 mr-2" />Atualizar</Button>
      </div>

      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20"><CardContent className="pt-6"><div className="flex items-center gap-8">
        <div className="relative"><div className={`w-32 h-32 rounded-full border-8 ${sd.getScoreColor(sd.securityScore.total).replace('text-', 'border-')} flex items-center justify-center bg-background`}><div className="text-center"><span className={`text-4xl font-bold ${sd.getScoreColor(sd.securityScore.total)}`}>{sd.securityScore.total}</span><span className="text-muted-foreground text-sm block">/100</span></div></div><ScoreIcon className={`absolute -bottom-1 -right-1 h-10 w-10 ${sd.getScoreColor(sd.securityScore.total)} bg-background rounded-full p-1`} /></div>
        <div className="flex-1 space-y-4"><div><h2 className="text-2xl font-semibold">Pontuação de Segurança: <span className={sd.getScoreColor(sd.securityScore.total)}>{sd.getScoreLabel(sd.securityScore.total)}</span></h2><p className="text-muted-foreground">Baseado nas suas configurações de segurança atuais</p></div>
        <div className="grid grid-cols-4 gap-4">
          <div className="space-y-1"><div className="flex items-center justify-between text-sm"><span>MFA</span><span className="font-medium">{sd.securityScore.mfa}/40</span></div><Progress value={(sd.securityScore.mfa / 40) * 100} className="h-2" /></div>
          <div className="space-y-1"><div className="flex items-center justify-between text-sm"><span>Sessões</span><span className="font-medium">{sd.securityScore.sessions}/20</span></div><Progress value={(sd.securityScore.sessions / 20) * 100} className="h-2" /></div>
          <div className="space-y-1"><div className="flex items-center justify-between text-sm"><span>Restrição IP</span><span className="font-medium">{sd.securityScore.ipRestriction}/25</span></div><Progress value={(sd.securityScore.ipRestriction / 25) * 100} className="h-2" /></div>
          <div className="space-y-1"><div className="flex items-center justify-between text-sm"><span>Atividade</span><span className="font-medium">{sd.securityScore.recentActivity}/15</span></div><Progress value={(sd.securityScore.recentActivity / 15) * 100} className="h-2" /></div>
        </div></div>
      </div></CardContent></Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('/sessions')}><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Sessões Ativas</p><p className="text-3xl font-bold">{sessions.length}</p></div><Monitor className="h-10 w-10 text-primary opacity-50" /></div></CardContent></Card>
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('/two-factor-auth')}><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">MFA</p><p className="text-3xl font-bold flex items-center gap-2">{mfaSettings?.mfa_enabled ? <><CheckCircle2 className="h-6 w-6 text-success" /><span className="text-success">Ativo</span></> : <><XCircle className="h-6 w-6 text-destructive" /><span className="text-destructive">Inativo</span></>}</p></div><Smartphone className="h-10 w-10 text-primary opacity-50" /></div></CardContent></Card>
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('/security')}><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Restrição de IP</p><p className="text-3xl font-bold flex items-center gap-2">{sd.ipRestrictionEnabled ? <><Lock className="h-6 w-6 text-success" /><span className="text-success">Ativo</span></> : <><Unlock className="h-6 w-6 text-warning" /><span className="text-warning">Inativo</span></>}</p></div><Globe className="h-10 w-10 text-primary opacity-50" /></div></CardContent></Card>
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('/audit-logs')}><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Acessos Bloqueados</p><p className="text-3xl font-bold">{sd.blockedAccess}</p></div><ShieldAlert className="h-10 w-10 text-destructive opacity-50" /></div></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5" />Recomendações de Segurança</CardTitle><CardDescription>Ações para melhorar sua pontuação</CardDescription></CardHeader><CardContent className="space-y-3">
          {!mfaSettings?.mfa_enabled && <Alert className="border-warning/30 bg-warning/5"><AlertTriangle className="h-4 w-4 text-warning" /><AlertTitle className="text-warning">Ativar MFA</AlertTitle><AlertDescription className="text-muted-foreground">Adicione uma camada extra de segurança. <Button variant="link" className="px-0 h-auto text-warning" onClick={() => navigate('/two-factor-auth')}>Configurar →</Button></AlertDescription></Alert>}
          {!sd.ipRestrictionEnabled && <Alert className="border-primary/30 bg-primary/5"><Globe className="h-4 w-4 text-primary" /><AlertTitle className="text-primary">Restrição de IP</AlertTitle><AlertDescription className="text-muted-foreground">Limite o acesso a IPs conhecidos. <Button variant="link" className="px-0 h-auto text-primary" onClick={() => navigate('/security')}>Configurar →</Button></AlertDescription></Alert>}
          {sessions.length > 3 && <Alert className="border-warning/30 bg-warning/5"><Monitor className="h-4 w-4 text-warning" /><AlertTitle className="text-warning">Muitas Sessões</AlertTitle><AlertDescription className="text-muted-foreground">{sessions.length} sessões ativas. <Button variant="link" className="px-0 h-auto text-warning" onClick={() => navigate('/sessions')}>Gerenciar →</Button></AlertDescription></Alert>}
          {sd.securityScore.total >= 80 && <Alert className="border-success/30 bg-success/5"><CheckCircle2 className="h-4 w-4 text-success" /><AlertTitle className="text-success">Excelente!</AlertTitle><AlertDescription className="text-muted-foreground">Sua conta está bem protegida.</AlertDescription></Alert>}
        </CardContent></Card>

        <Card><CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5" />Alertas Recentes</CardTitle><CardDescription>Últimas atividades de segurança</CardDescription></CardHeader><CardContent><ScrollArea className="h-[250px]">{sd.recentAlerts.length > 0 ? (<div className="space-y-3">{sd.recentAlerts.map(alert => (<div key={alert.id} className={`p-3 rounded-lg border ${sd.getSeverityColor(alert.severity)}`}><div className="flex items-start justify-between"><div className="flex-1"><p className="font-medium text-sm">{alert.title}</p><p className="text-xs opacity-80 mt-1">{alert.description}</p></div><div className="flex items-center gap-2"><span className="text-xs opacity-70">{sd.formatTimeAgo(alert.created_at)}</span>{alert.is_resolved ? <CheckCircle2 className="h-4 w-4 text-success" /> : <Clock className="h-4 w-4" />}</div></div></div>))}</div>) : (<div className="flex flex-col items-center justify-center h-full text-muted-foreground"><ShieldCheck className="h-12 w-12 opacity-30 mb-2" /><p>Nenhum alerta recente</p></div>)}</ScrollArea></CardContent></Card>
      </div>

      <Card><CardHeader className="flex flex-row items-center justify-between"><div><CardTitle className="flex items-center gap-2"><Monitor className="h-5 w-5" />Sessões Ativas</CardTitle><CardDescription>Dispositivos conectados</CardDescription></div><Button variant="outline" size="sm" onClick={() => navigate('/sessions')}>Ver todas<ChevronRight className="h-4 w-4 ml-1" /></Button></CardHeader><CardContent><div className="grid grid-cols-1 md:grid-cols-3 gap-4">{sessions.slice(0, 3).map(session => (<div key={session.id} className={`p-4 rounded-lg border ${session.id === currentSessionId ? 'border-primary bg-primary/5' : 'border-border'}`}><div className="flex items-center gap-3"><Monitor className={`h-8 w-8 ${session.id === currentSessionId ? 'text-primary' : 'text-muted-foreground'}`} /><div className="flex-1 min-w-0"><div className="flex items-center gap-2"><p className="font-medium text-sm truncate">{session.device_info?.browser} • {session.device_info?.os}</p>{session.id === currentSessionId && <Badge variant="default" className="text-xs">Atual</Badge>}</div><div className="flex items-center gap-2 text-xs text-muted-foreground mt-1"><MapPin className="h-3 w-3" /><span className="truncate">{session.location?.city}, {session.location?.country}</span></div><div className="flex items-center gap-2 text-xs text-muted-foreground"><Globe className="h-3 w-3" /><span>{session.ip_address}</span></div></div></div></div>))}</div></CardContent></Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" onClick={() => navigate('/two-factor-auth')}><Key className="h-6 w-6" /><span>Configurar MFA</span></Button>
        <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" onClick={() => navigate('/sessions')}><Monitor className="h-6 w-6" /><span>Gerenciar Sessões</span></Button>
        <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" onClick={() => navigate('/security')}><Settings className="h-6 w-6" /><span>Configurações</span></Button>
        <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" onClick={() => navigate('/audit-logs')}><FileText className="h-6 w-6" /><span>Logs de Auditoria</span></Button>
      </div>
    </div>
  );
}
