/**
 * usePageVisibility — retorna `true` quando a aba está visível.
 * Fonte: Page Visibility API (document.visibilityState).
 *
 * Uso típico:
 *   const isVisible = usePageVisibility();
 *   useEffect(() => { if (!isVisible) return; // subscribe... }, [isVisible]);
 *
 * SSR-safe: assume visível quando `document` não existe.
 */
import { useEffect, useState } from 'react';

const readVisible = (): boolean => {
  if (typeof document === 'undefined') return true;
  return document.visibilityState !== 'hidden';
};

export function usePageVisibility(): boolean {
  const [isVisible, setIsVisible] = useState<boolean>(readVisible);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const onChange = () => setIsVisible(readVisible());
    document.addEventListener('visibilitychange', onChange);
    return () => document.removeEventListener('visibilitychange', onChange);
  }, []);

  return isVisible;
}
