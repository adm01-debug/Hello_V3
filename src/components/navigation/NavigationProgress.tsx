import { useSyncExternalStore } from 'react';
import { useLocation } from 'react-router-dom';
import { isNavigating, subscribeNavigation, getServerSnapshot } from '@/lib/navigation-progress-store';

/**
 * Barra de progresso da navegação, dirigida pelo Suspense das rotas.
 *
 * Só aparece enquanto um chunk lazy de rota está carregando (`NavigationProgressBoundary`),
 * e usa `location.pathname` apenas para reiniciar a animação ao trocar de página.
 * Animação em CSS puro (`.nav-progress-*` em `src/index.css`), sem `framer-motion`.
 */
export function NavigationProgress() {
  const location = useLocation();
  const navigating = useSyncExternalStore(subscribeNavigation, isNavigating, getServerSnapshot);

  if (!navigating) return null;

  return (
    <div
      key={`${location.pathname}-${navigating}`}
      className="nav-progress-fade fixed top-0 left-0 right-0 z-50 h-[2px]"
      role="progressbar"
      aria-label="Carregando página"
    >
      <div className="nav-progress-grow h-full bg-primary" />
    </div>
  );
}