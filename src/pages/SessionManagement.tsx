import { useState } from 'react';
import { useSessionManager } from '@/hooks/useSessionManager';
import { useReauth } from '@/hooks/useReauth';
import { ReauthDialog } from '@/components/auth/ReauthDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Loader2,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  Clock,
  MapPin,
  Shield,
  LogOut,
  AlertTriangle,
} from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';

function getDeviceIcon(device?: string) {
  if (!device) return Monitor;
  const d = device.toLowerCase();
  if (d.includes('mobile') || d.includes('phone')) return Smartphone;
  if (d.includes('tablet') || d.includes('ipad')) return Tablet;
  return Monitor;
}

function formatRelativeTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Agora';
  if (diffMins < 60) return `${diffMins}m atrás`;
  if (diffHours < 24) return `${diffHours}h atrás`;
  return `${diffDays}d atrás`;
}

export default function SessionManagement() {
  const {
    sessions,
    currentSessionId,
    isLoading,
    revokeSession,
    revokeAllOtherSessions,
    sessionDurationHours,
  } = useSessionManager();
  const { requestReauth, isRequired, cancelReauth } = useReauth();
  
  const [pendingAction, setPendingAction] = useState<{
    type: 'revoke' | 'revoke_all';
    sessionId?: string;
  } | null>(null);

  const handleRevokeSession = (sessionId: string) => {
  usePageTitle('Sessões Ativas');

    if (sessionId === currentSessionId) {
      revokeSession(sessionId);
    } else {
      setPendingAction({ type: 'revoke', sessionId });
      requestReauth('revoke_sessions');
    }
  };

  const handleRevokeAll = () => {
    setPendingAction({ type: 'revoke_all' });
    requestReauth('revoke_sessions');
  };

  const handleReauthSuccess = () => {
    if (pendingAction?.type === 'revoke' && pendingAction.sessionId) {
      revokeSession(pendingAction.sessionId);
    } else if (pendingAction?.type === 'revoke_all') {
      revokeAllOtherSessions();
    }
    setPendingAction(null);
  };

  const handleReauthCancel = () => {
    setPendingAction(null);
    cancelReauth();
  };

  const otherSessions = sessions.filter(s => s.id !== currentSessionId);
  const currentSession = sessions.find(s => s.id === currentSessionId);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          Gerenciamento de Sessões
        </h1>
        <p className="text-muted-foreground mt-1">
          Gerencie as sessões ativas da sua conta
        </p>
      </div>

      <Alert>
        <Clock className="h-4 w-4" />
        <AlertDescription>
          As sessões expiram automaticamente após <strong>{sessionDurationHours} horas</strong> de inatividade.
          Sessões são renovadas automaticamente enquanto você está ativo.
        </AlertDescription>
      </Alert>

      {/* Current Session */}
      {currentSession && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Sessão Atual
              <Badge variant="default" className="ml-auto">Ativa</Badge>
            </CardTitle>
            <CardDescription>
              Esta é a sessão do seu dispositivo atual
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              {(() => {
                const Icon = getDeviceIcon(currentSession.device_info?.device);
                return <Icon className="h-10 w-10 text-primary" />;
              })()}
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {currentSession.device_info?.browser} em {currentSession.device_info?.os}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {currentSession.device_info?.device}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {currentSession.location?.city}, {currentSession.location?.country}
                  </span>
                  <span className="flex items-center gap-1">
                    <Globe className="h-3 w-3" />
                    {currentSession.ip_address}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Ativa {formatRelativeTime(currentSession.last_activity_at)}
                </div>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <LogOut className="h-4 w-4 mr-1" />
                    Encerrar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Encerrar sessão atual?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Você será desconectado deste dispositivo e precisará fazer login novamente.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => revokeSession(currentSession.id)}>
                      Encerrar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Other Sessions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Outras Sessões
            </CardTitle>
            <CardDescription>
              {otherSessions.length > 0 
                ? `${otherSessions.length} sessões ativas em outros dispositivos`
                : 'Nenhuma outra sessão ativa'
              }
            </CardDescription>
          </div>
          {otherSessions.length > 0 && (
            <Button 
              variant="destructive" 
              size="sm"
              onClick={handleRevokeAll}
            >
              <AlertTriangle className="h-4 w-4 mr-1" />
              Encerrar Todas
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {otherSessions.length > 0 ? (
            <div className="space-y-4">
              {otherSessions.map((session) => {
                const Icon = getDeviceIcon(session.device_info?.device);
                return (
                  <div key={session.id}>
                    <div className="flex items-center gap-4">
                      <Icon className="h-8 w-8 text-muted-foreground" />
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {session.device_info?.browser} em {session.device_info?.os}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {session.device_info?.device}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {session.location?.city}, {session.location?.country}
                          </span>
                          <span className="flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            {session.ip_address}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Última atividade: {formatRelativeTime(session.last_activity_at)}
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleRevokeSession(session.id)}
                      >
                        <LogOut className="h-4 w-4" />
                      </Button>
                    </div>
                    <Separator className="mt-4" />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Monitor className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Você não tem outras sessões ativas</p>
            </div>
          )}
        </CardContent>
      </Card>

      <ReauthDialog
        open={isRequired}
        onOpenChange={(open) => !open && handleReauthCancel()}
        onSuccess={handleReauthSuccess}
        title="Confirme sua identidade"
        description="Para revogar sessões, confirme sua identidade."
      />
    </div>
  );
}
