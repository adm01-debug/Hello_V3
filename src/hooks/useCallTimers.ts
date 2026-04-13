import { useCallback, useRef } from 'react';
import { CallSession, CallStatus } from './useMultiChannelCall';

export function useCallTimers(
  setActiveCalls: React.Dispatch<React.SetStateAction<CallSession[]>>
) {
  const durationIntervalsRef = useRef<Map<string, number>>(new Map());
  const holdTimeIntervalsRef = useRef<Map<string, number>>(new Map());

  const startDurationTimer = useCallback((callId: string) => {
    const existingTimer = durationIntervalsRef.current.get(callId);
    if (existingTimer) clearInterval(existingTimer);
    
    const timer = window.setInterval(() => {
      setActiveCalls(prev => prev.map(call => 
        call.id === callId ? { ...call, duration: call.duration + 1 } : call
      ));
    }, 1000);
    durationIntervalsRef.current.set(callId, timer);
  }, [setActiveCalls]);

  const stopDurationTimer = useCallback((callId: string) => {
    const timer = durationIntervalsRef.current.get(callId);
    if (timer) {
      clearInterval(timer);
      durationIntervalsRef.current.delete(callId);
    }
  }, []);

  const startHoldTimer = useCallback((callId: string) => {
    const existingTimer = holdTimeIntervalsRef.current.get(callId);
    if (existingTimer) clearInterval(existingTimer);
    
    const timer = window.setInterval(() => {
      setActiveCalls(prev => prev.map(call => 
        call.id === callId && call.isOnHold 
          ? { ...call, totalHoldTime: call.totalHoldTime + 1 } 
          : call
      ));
    }, 1000);
    holdTimeIntervalsRef.current.set(callId, timer);
  }, [setActiveCalls]);

  const stopHoldTimer = useCallback((callId: string) => {
    const timer = holdTimeIntervalsRef.current.get(callId);
    if (timer) {
      clearInterval(timer);
      holdTimeIntervalsRef.current.delete(callId);
    }
  }, []);

  const stopAllTimers = useCallback(() => {
    durationIntervalsRef.current.forEach((timer) => clearInterval(timer));
    durationIntervalsRef.current.clear();
    holdTimeIntervalsRef.current.forEach((timer) => clearInterval(timer));
    holdTimeIntervalsRef.current.clear();
  }, []);

  return {
    startDurationTimer, stopDurationTimer,
    startHoldTimer, stopHoldTimer, stopAllTimers,
  };
}
