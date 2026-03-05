
/**
 * Hook para Push Notifications
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type PermissionState = 'default' | 'granted' | 'denied';

interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface UsePushNotificationsReturn {
  isSupported: boolean;
  permission: PermissionState;
  isSubscribed: boolean;
  isLoading: boolean;
  error: Error | null;
  requestPermission: () => Promise<PermissionState>;
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
  sendTestNotification: () => Promise<void>;
}

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

export function usePushNotifications(): UsePushNotificationsReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<PermissionState>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const checkSupport = async () => {
      try {
        const supported = 'serviceWorker' in navigator && 
                         'PushManager' in window &&
                         'Notification' in window;

        setIsSupported(supported);

        if (!supported) {
          setIsLoading(false);
          return;
        }

        if ('Notification' in window) {
          setPermission(Notification.permission as PermissionState);
        }

        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        
        setIsSubscribed(!!subscription);
        setIsLoading(false);
      } catch (err) {
        console.error('Erro ao verificar suporte:', err);
        setError(err as Error);
        setIsLoading(false);
      }
    };

    checkSupport();
  }, []);

  const requestPermission = useCallback(async (): Promise<PermissionState> => {
    try {
      if (!isSupported) {
        throw new Error('Push notifications não suportadas');
      }

      const result = await Notification.requestPermission();
      setPermission(result as PermissionState);

      if (result === 'granted') {
        toast.success('Permissão concedida!');
      } else if (result === 'denied') {
        toast.error('Permissão negada');
      }

      return result as PermissionState;
    } catch (err) {
      const e = err as Error;
      setError(e);
      toast.error('Erro ao solicitar permissão');
      throw e;
    }
  }, [isSupported]);

  const subscribe = useCallback(async () => {
    if (!isSupported) {
      throw new Error('Push notifications não suportadas');
    }

    let currentPermission = permission;
    if (currentPermission !== 'granted') {
      currentPermission = await requestPermission();
    }

    if (currentPermission !== 'granted') {
      throw new Error('Permissão necessária para push notifications');
    }

    const registration = await navigator.serviceWorker.ready;

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    const subscriptionJSON = subscription.toJSON();

    if (!subscriptionJSON.endpoint || !subscriptionJSON.keys) {
      throw new Error('Subscription inválida');
    }

    const pushData: PushSubscriptionData = {
      endpoint: subscriptionJSON.endpoint,
      keys: {
        p256dh: subscriptionJSON.keys.p256dh || '',
        auth: subscriptionJSON.keys.auth || '',
      },
    };

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    // Use type assertion since push_subscriptions may not be in generated types
    const { error: dbError } = await (supabase as any)
      .from('push_subscriptions')
      .upsert({
        user_id: user.id,
        subscription: pushData,
        user_agent: navigator.userAgent,
        is_active: true,
        last_used_at: new Date().toISOString(),
      });

    if (dbError) throw dbError;

    setIsSubscribed(true);
    toast.success('Push notifications ativadas!');
  }, [isSupported, permission, requestPermission]);

  const unsubscribe = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error: dbError } = await (supabase as any)
        .from('push_subscriptions')
        .update({ is_active: false })
        .eq('user_id', user.id);

      if (dbError) throw dbError;

      setIsSubscribed(false);
      toast.success('Push notifications desativadas');
    } catch (err) {
      setError(err as Error);
      toast.error('Erro ao desativar push notifications');
    }
  }, []);

  const sendTestNotification = useCallback(async () => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('send-test-push', {
        body: {
          title: 'Teste de Push Notification',
          message: 'Se você recebeu isso, tudo está funcionando! 🎉',
        },
      });

      if (fnError) throw fnError;
      toast.success('Notificação de teste enviada!');
    } catch (err) {
      console.error('Erro ao enviar teste:', err);
      toast.error('Erro ao enviar notificação de teste');
    }
  }, []);

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    error,
    requestPermission,
    subscribe,
    unsubscribe,
    sendTestNotification,
  };
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

export function usePushStatus() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<PermissionState>('default');

  useEffect(() => {
    const checkStatus = () => {
      const supported = 'serviceWorker' in navigator && 
                       'PushManager' in window &&
                       'Notification' in window;
      
      setIsSupported(supported);

      if (supported && 'Notification' in window) {
        setPermission(Notification.permission as PermissionState);
      }
    };

    checkStatus();

    if ('Notification' in window) {
      const interval = setInterval(checkStatus, 5000);
      return () => clearInterval(interval);
    }
  }, []);

  return { isSupported, permission, isEnabled: permission === 'granted' };
}

export function usePushBadge(count: number) {
  useEffect(() => {
    if ('setAppBadge' in navigator) {
      if (count > 0) {
        (navigator as any).setAppBadge(count).catch(() => {});
      } else {
        (navigator as any).clearAppBadge().catch(() => {});
      }
    }
  }, [count]);
}
