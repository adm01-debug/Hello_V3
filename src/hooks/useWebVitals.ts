import { useState, useEffect, useCallback } from 'react';
import { getLatestVitals, getWebVitals, type WebVitalMetric } from '@/lib/web-vitals';

export function useWebVitals(refreshIntervalMs = 5000) {
  const [vitals, setVitals] = useState<Record<string, WebVitalMetric | undefined>>({});
  const [history, setHistory] = useState<ReadonlyArray<WebVitalMetric>>([]);

  const refresh = useCallback(() => {
    setVitals(getLatestVitals());
    setHistory(getWebVitals());
  }, []);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, refreshIntervalMs);
    return () => clearInterval(timer);
  }, [refresh, refreshIntervalMs]);

  return { vitals, history, refresh };
}
