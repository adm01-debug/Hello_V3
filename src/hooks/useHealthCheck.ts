import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ServiceStatus {
  name: string;
  status: 'healthy' | 'degraded' | 'down' | 'checking';
  latency?: number;
  lastChecked?: number;
  error?: string;
}

interface HealthCheckResult {
  services: ServiceStatus[];
  overallStatus: 'healthy' | 'degraded' | 'down' | 'checking';
  isChecking: boolean;
  runChecks: () => Promise<void>;
}

export function useHealthCheck(): HealthCheckResult {
  const [services, setServices] = useState<ServiceStatus[]>([
    { name: 'Database', status: 'checking' },
    { name: 'Auth', status: 'checking' },
    { name: 'Edge Functions', status: 'checking' },
    { name: 'Storage', status: 'checking' },
    { name: 'Realtime', status: 'checking' },
  ]);
  const [isChecking, setIsChecking] = useState(false);

  const checkService = async (
    name: string,
    fn: () => Promise<void>
  ): Promise<ServiceStatus> => {
    const start = performance.now();
    try {
      await fn();
      return {
        name,
        status: 'healthy',
        latency: Math.round(performance.now() - start),
        lastChecked: Date.now(),
      };
    } catch (err) {
      return {
        name,
        status: 'down',
        latency: Math.round(performance.now() - start),
        lastChecked: Date.now(),
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  };

  const runChecks = useCallback(async () => {
    setIsChecking(true);
    
    const results = await Promise.all([
      checkService('Database', async () => {
        const { error } = await supabase.from('agents').select('id').limit(1);
        if (error) throw error;
      }),
      checkService('Auth', async () => {
        const { error } = await supabase.auth.getSession();
        if (error) throw error;
      }),
      checkService('Edge Functions', async () => {
        const { error } = await supabase.functions.invoke('health-check', {
          method: 'GET',
        });
        if (error) throw error;
      }),
      checkService('Storage', async () => {
        const { error } = await supabase.storage.listBuckets();
        if (error) throw error;
      }),
      checkService('Realtime', async () => {
        // Simple connectivity check
        const channel = supabase.channel('health-check-probe');
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            supabase.removeChannel(channel);
            reject(new Error('Timeout'));
          }, 5000);
          channel.subscribe((status) => {
            clearTimeout(timeout);
            supabase.removeChannel(channel);
            if (status === 'SUBSCRIBED') resolve();
            else reject(new Error(`Status: ${status}`));
          });
        });
      }),
    ]);

    setServices(results);
    setIsChecking(false);
  }, []);

  const overallStatus: 'healthy' | 'degraded' | 'down' | 'checking' = 
    isChecking ? 'checking' :
    services.every(s => s.status === 'healthy') ? 'healthy' :
    services.some(s => s.status === 'down') ? 
      (services.filter(s => s.status === 'down').length > 2 ? 'down' : 'degraded') :
    services.some(s => s.status === 'checking') ? 'checking' : 'healthy';

  return { services, overallStatus, isChecking, runChecks };
}
