import { useEffect } from 'react';
import { useRealtimeHoldAlerts } from '@/hooks/useRealtimeHoldAlerts';

interface RealtimeNotificationProviderProps {
  children: React.ReactNode;
}

// Context-less provider that just initializes the realtime subscription
export function RealtimeNotificationProvider({ children }: RealtimeNotificationProviderProps) {
  const { isEnabled } = useRealtimeHoldAlerts();

  useEffect(() => {
    if (isEnabled) {
      console.log('Realtime notifications provider active');
    }
  }, [isEnabled]);

  return <>{children}</>;
}
