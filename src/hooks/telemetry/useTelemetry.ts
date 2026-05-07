 import { useEffect } from 'react';
 import { onCLS, onFID, onLCP, onFCP, onTTFB, type Metric } from 'web-vitals';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuthContext } from '@/contexts/AuthContext';
 import { logger } from '@/lib/logger';
 
 export function useTelemetry() {
   const { user } = useAuthContext();
 
   useEffect(() => {
     if (!user) return;
 
     const sendToAnalytics = async (metric: Metric) => {
       const { name, value, rating, navigationType } = metric;
       
       // Só enviar métricas que não sejam "good" para economizar DB se necessário, 
       // mas para auditoria enterprise, enviamos todas ou um sample.
       // Aqui enviamos todas para diagnóstico completo.
       try {
         const { error } = await supabase.from('performance_metrics').insert({
           user_id: user.id,
           metric_name: name,
           metric_value: value,
           rating: rating,
           navigation_type: navigationType,
           url: window.location.href,
           user_agent: navigator.userAgent
         });
 
         if (error) {
           // Não usamos o logger global aqui para evitar loop infinito se o logger falhar
           console.warn('[Telemetry] Failed to send metric:', error.message);
         }
       } catch (err) {
         console.error('[Telemetry] Error:', err);
       }
     };
 
     // Registrar observadores
     onCLS(sendToAnalytics);
     onFID(sendToAnalytics);
     onLCP(sendToAnalytics);
     onFCP(sendToAnalytics);
     onTTFB(sendToAnalytics);
 
   }, [user]);
 }