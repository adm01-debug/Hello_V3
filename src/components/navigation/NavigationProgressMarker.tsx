import { useEffect } from 'react';
import { startNavigation, finishNavigation } from '@/lib/navigation-progress-store';

/**
 * Marca o intervalo em que um fallback de Suspense está visível.
 * Como as rotas são `lazy`, o fallback só aparece enquanto o chunk está
 * realmente sendo baixado — montar/desmontar é o sinal de progresso real.
 */
export function NavigationProgressMarker() {
  useEffect(() => {
    startNavigation();
    return finishNavigation;
  }, []);

  return null;
}