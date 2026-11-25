import { useCallback, useRef, useState } from 'react';

/**
 * Trava por chave (normalmente o id da linha) para que dois cliques seguidos nao
 * disparem a mesma gravacao. O controle e sincrono (ref) porque o estado do React
 * so re-renderiza no ciclo seguinte: dois cliques no mesmo tick veriam a mesma
 * lista vazia e gravariam duas vezes.
 */
export const useLockedWrite = () => {
  const lockedRef = useRef<Set<string>>(new Set());
  const [lockedKeys, setLockedKeys] = useState<ReadonlySet<string>>(() => new Set());

  const runLocked = useCallback(async (key: string, action: () => Promise<unknown>) => {
    if (lockedRef.current.has(key)) return false;
    const acquired = new Set(lockedRef.current).add(key);
    lockedRef.current = acquired;
    setLockedKeys(acquired);
    try {
      await action();
      return true;
    } finally {
      const released = new Set(lockedRef.current);
      released.delete(key);
      lockedRef.current = released;
      setLockedKeys(released);
    }
  }, []);

  const isLocked = useCallback((key: string) => lockedKeys.has(key), [lockedKeys]);

  return { runLocked, isLocked };
};