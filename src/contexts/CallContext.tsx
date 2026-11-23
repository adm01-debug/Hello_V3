import { createContext, useContext, type ReactNode } from 'react';
import { useMultiChannelCall } from '@/hooks/useMultiChannelCall';

type CallContextType = ReturnType<typeof useMultiChannelCall>;

const CallContext = createContext<CallContextType | null>(null);

export function CallProvider({ children }: { children: ReactNode }) {
  const value = useMultiChannelCall();
  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components -- standard context hook pattern
export function useCallContext(): CallContextType {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error('useCallContext must be used within CallProvider');
  return ctx;
}