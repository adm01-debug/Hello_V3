import { useSyncExternalStore } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { isNavigating, subscribeNavigation, getServerSnapshot } from '@/lib/navigation-progress-store';

/**
 * Barra de progresso da navegação, dirigida pelo Suspense das rotas.
 *
 * Só aparece enquanto um chunk lazy de rota está carregando (`NavigationProgressBoundary`),
 * e usa `location.pathname` apenas para reiniciar a animação ao trocar de página.
 */
export function NavigationProgress() {
  const location = useLocation();
  const navigating = useSyncExternalStore(subscribeNavigation, isNavigating, getServerSnapshot);

  return (
    <AnimatePresence>
      {navigating && (
        <motion.div
          key={`${location.pathname}-${navigating}`}
          className="fixed top-0 left-0 right-0 z-50 h-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="progressbar"
          aria-label="Carregando página"
        >
          <motion.div
            className="h-full bg-primary"
            initial={{ width: '0%' }}
            animate={{ width: '92%' }}
            transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}