import { useEffect, useState, useRef, useCallback } from 'react';
import { logger } from '@/lib/logger';

const log = logger.create('NetworkMonitor');

export type NetworkStatus = 'online' | 'unstable' | 'offline' | 'checking';

export interface NetworkInfo {
  status: NetworkStatus;
  latencyMs: number | null;
  effectiveType: string | null;
  downlinkMbps: number | null;
  rttMs: number | null;
  lastCheckedAt: number | null;
  consecutiveFailures: number;
}

interface NetInfoConnection {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  addEventListener?: (type: string, listener: () => void) => void;
  removeEventListener?: (type: string, listener: () => void) => void;
}

const PING_INTERVAL_MS = 10000;
const PING_TIMEOUT_MS = 5000;
const LATENCY_OK = 150;
const LATENCY_UNSTABLE = 400;

export function useNetworkMonitor(enabled = true) {
  const [info, setInfo] = useState<NetworkInfo>({
    status: 'checking',
    latencyMs: null,
    effectiveType: null,
    downlinkMbps: null,
    rttMs: null,
    lastCheckedAt: null,
    consecutiveFailures: 0,
  });

  const intervalRef = useRef<number | null>(null);
  const failuresRef = useRef(0);

  const readConnectionInfo = useCallback((): Partial<NetworkInfo> => {
    const conn = (navigator as Navigator & { connection?: NetInfoConnection }).connection;
    return {
      effectiveType: conn?.effectiveType ?? null,
      downlinkMbps: typeof conn?.downlink === 'number' ? conn.downlink : null,
      rttMs: typeof conn?.rtt === 'number' ? conn.rtt : null,
    };
  }, []);

  const classify = useCallback((latencyMs: number | null, online: boolean): NetworkStatus => {
    if (!online) return 'offline';
    if (latencyMs == null) return 'checking';
    if (latencyMs <= LATENCY_OK) return 'online';
    if (latencyMs <= LATENCY_UNSTABLE) return 'unstable';
    return 'unstable';
  }, []);

  const ping = useCallback(async () => {
    if (!navigator.onLine) {
      failuresRef.current += 1;
      setInfo(prev => ({
        ...prev,
        status: 'offline',
        latencyMs: null,
        lastCheckedAt: Date.now(),
        consecutiveFailures: failuresRef.current,
        ...readConnectionInfo(),
      }));
      return;
    }

    const start = performance.now();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), PING_TIMEOUT_MS);
      // Ping the static asset origin (same host as the SPA) — measures real user
      // network RTT without depending on Edge Function cold-start latency.
      // cache: 'no-store' forces a real request every time.
      await fetch(window.location.origin + '/favicon.ico', {
        method: 'HEAD',
        cache: 'no-store',
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const latency = Math.round(performance.now() - start);
      failuresRef.current = 0;
      setInfo(prev => ({
        ...prev,
        status: classify(latency, true),
        latencyMs: latency,
        lastCheckedAt: Date.now(),
        consecutiveFailures: 0,
        ...readConnectionInfo(),
      }));
    } catch (err) {
      failuresRef.current += 1;
      const latency = Math.round(performance.now() - start);
      log.warn('Ping failed', { failures: failuresRef.current, err });
      setInfo(prev => ({
        ...prev,
        status: failuresRef.current >= 2 ? 'offline' : 'unstable',
        latencyMs: latency > PING_TIMEOUT_MS ? null : latency,
        lastCheckedAt: Date.now(),
        consecutiveFailures: failuresRef.current,
        ...readConnectionInfo(),
      }));
    }
  }, [classify, readConnectionInfo]);

  useEffect(() => {
    if (!enabled) return;
    const handleOnline = () => { log.info('Browser online event'); ping(); };
    const handleOffline = () => {
      log.warn('Browser offline event');
      setInfo(prev => ({ ...prev, status: 'offline', latencyMs: null, lastCheckedAt: Date.now() }));
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const conn = (navigator as Navigator & { connection?: NetInfoConnection }).connection;
    const handleConnChange = () => setInfo(prev => ({ ...prev, ...readConnectionInfo() }));
    conn?.addEventListener?.('change', handleConnChange);

    ping();
    intervalRef.current = window.setInterval(ping, PING_INTERVAL_MS);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      conn?.removeEventListener?.('change', handleConnChange);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled, ping, readConnectionInfo]);

  return { ...info, refresh: ping };
}
