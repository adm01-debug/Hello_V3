import { createContext, useContext, type ReactNode } from 'react';
import { useMultiChannelCall } from '@/hooks/useMultiChannelCall';
import { useDNCCompliance } from '@/hooks/useDNCCompliance';

type CallContextType = ReturnType<typeof useMultiChannelCall>;

const CallContext = createContext<CallContextType | null>(null);

export function CallProvider({ children }: { children: ReactNode }) {
  // Injetado aqui para que toda discagem (qualquer tela) passe pela mesma
  // checagem de DNC/horario dentro de initiateCall.
  const { preDialCheck } = useDNCCompliance();
  const value = useMultiChannelCall(preDialCheck);
  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components -- standard context hook pattern
export function useCallContext(): CallContextType {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error('useCallContext must be used within CallProvider');
  return ctx;
}