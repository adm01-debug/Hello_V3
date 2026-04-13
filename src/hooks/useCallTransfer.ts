import { useCallback } from 'react';
import type { CallSession, CallStatus, TransferTarget, TransferType } from './useMultiChannelCall';

/**
 * Manages call transfer operations (blind and attended).
 */
export function useCallTransfer(
  activeCalls: CallSession[],
  activeCallId: string | null,
  setActiveCalls: React.Dispatch<React.SetStateAction<CallSession[]>>,
  setActiveCallId: React.Dispatch<React.SetStateAction<string | null>>,
  setActiveChannel: React.Dispatch<React.SetStateAction<import('./useMultiChannelCall').CallChannel>>,
  stopDurationTimer: (callId: string) => void,
  setCallHistory: React.Dispatch<React.SetStateAction<CallSession[]>>
) {
  const completeTransfer = useCallback((callId: string) => {
    const call = activeCalls.find(c => c.id === callId);
    if (!call) return;

    stopDurationTimer(callId);

    const transferredCall: CallSession = { ...call, status: 'ended' };
    setCallHistory(prev => [transferredCall, ...prev].slice(0, 50));

    setActiveCalls(prev => prev.filter(c => c.id !== callId));

    const remaining = activeCalls.filter(c => c.id !== callId);
    if (remaining.length > 0 && activeCallId === callId) {
      setActiveCallId(remaining[0].id);
      setActiveChannel(remaining[0].channel);
    } else if (remaining.length === 0) {
      setActiveCallId(null);
    }
  }, [activeCalls, activeCallId, stopDurationTimer, setActiveCalls, setActiveCallId, setActiveChannel, setCallHistory]);

  const transferCall = useCallback((
    callId: string,
    target: TransferTarget,
    transferType: TransferType
  ) => {
    setActiveCalls(prev => prev.map(call => {
      if (call.id !== callId) return call;

      if (transferType === 'blind') {
        return {
          ...call,
          status: 'transferring' as CallStatus,
          isTransferring: true,
          transferTarget: target,
        };
      } else {
        return {
          ...call,
          isOnHold: true,
          status: 'on-hold' as CallStatus,
          isTransferring: true,
          transferTarget: target,
        };
      }
    }));

    if (transferType === 'blind') {
      setTimeout(() => completeTransfer(callId), 2000);
    }
  }, [setActiveCalls, completeTransfer]);

  const cancelTransfer = useCallback((callId: string) => {
    setActiveCalls(prev => prev.map(call => {
      if (call.id !== callId) return call;
      return {
        ...call,
        isOnHold: false,
        status: 'active' as CallStatus,
        isTransferring: false,
        transferTarget: undefined,
      };
    }));
  }, [setActiveCalls]);

  return { transferCall, completeTransfer, cancelTransfer };
}
