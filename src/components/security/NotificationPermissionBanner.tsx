import { useState, useEffect } from 'react';
import { useSecurityNotifications } from '@/hooks/useSecurityNotifications';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Bell, BellOff, X } from 'lucide-react';

export function NotificationPermissionBanner() {
  const { isSupported, permission, requestPermission } = useSecurityNotifications();
  const [dismissed, setDismissed] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  // Check if banner was previously dismissed
  useEffect(() => {
    const wasDismissed = localStorage.getItem('security-notifications-dismissed');
    if (wasDismissed) {
      setDismissed(true);
    }
  }, []);

  // Don't show if not supported, already granted, or dismissed
  if (!isSupported || permission === 'granted' || dismissed) {
    return null;
  }

  // Don't show if explicitly denied (user needs to change in browser settings)
  if (permission === 'denied') {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('security-notifications-dismissed', 'true');
  };

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    await requestPermission();
    setIsRequesting(false);
  };

  return (
    <Alert className="mb-4 border-primary/30 bg-primary/5">
      <Bell className="h-4 w-4 text-primary" />
      <AlertTitle className="flex items-center justify-between">
        <span>Ativar Notificações de Segurança</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={handleDismiss}
        >
          <X className="h-4 w-4" />
        </Button>
      </AlertTitle>
      <AlertDescription className="mt-2">
        <p className="text-muted-foreground mb-3">
          Receba alertas em tempo real sobre atividades suspeitas, acessos bloqueados e outros eventos de segurança.
        </p>
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleRequestPermission}
            disabled={isRequesting}
          >
            <Bell className="h-4 w-4 mr-2" />
            {isRequesting ? 'Solicitando...' : 'Ativar Notificações'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
          >
            Agora não
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
