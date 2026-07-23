import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

const log = logger.create('VoipQuality');

export type QualityLabel = 'excellent' | 'good' | 'fair' | 'poor' | 'unknown';

export interface VoipQualitySample {
  ts: number;
  jitterMs: number;
  packetsLost: number;
  packetsReceived: number;
  packetsDiscarded: number;
  fractionLost: number | null;
  concealedSamples: number;
  totalSamplesReceived: number;
  rttMs: number;
  audioLevel: number;
  mos: number;
}

export interface VoipQualityState {
  current: VoipQualitySample | null;
  mosAvg: number | null;
  mosMin: number | null;
  jitterAvgMs: number | null;
  packetLossPct: number | null;
  rttAvgMs: number | null;
  concealmentPct: number | null;
  label: QualityLabel;
  samplesCount: number;
}

const COLLECT_INTERVAL_MS = 2000;

/**
 * Cálculo simplificado de MOS via E-Model (R-factor → MOS).
 * R = 93.2 - Id - Ie ; MOS = 1 + 0.035*R + R*(R-60)*(100-R)*7e-6
 */
function calculateMos(rttMs: number, jitterMs: number, lossPct: number): number {
  const effectiveLatency = rttMs / 2 + jitterMs * 2 + 10;
  let R = effectiveLatency < 160 ? 93.2 - effectiveLatency / 40 : 93.2 - (effectiveLatency - 120) / 10;
  R = R - lossPct * 2.5;
  if (R < 0) R = 0;
  if (R > 100) R = 100;
  const mos = 1 + 0.035 * R + R * (R - 60) * (100 - R) * 7e-6;
  return Math.max(1, Math.min(5, Number(mos.toFixed(2))));
}

function labelFromMos(mos: number | null): QualityLabel {
  if (mos == null) return 'unknown';
  if (mos >= 4.3) return 'excellent';
  if (mos >= 4.0) return 'good';
  if (mos >= 3.6) return 'fair';
  return 'poor';
}

export function useVoipQualityMonitor(
  pc: RTCPeerConnection | null,
  options: { callSessionId?: string | null; agentName?: string | null; channel?: string; persistOnEnd?: boolean } = {},
) {
  const [state, setState] = useState<VoipQualityState>({
    current: null, mosAvg: null, mosMin: null, jitterAvgMs: null,
    packetLossPct: null, rttAvgMs: null, label: 'unknown', samplesCount: 0,
  });

  const samplesRef = useRef<VoipQualitySample[]>([]);
  const intervalRef = useRef<number | null>(null);
  const prevPacketsLostRef = useRef(0);
  const prevPacketsReceivedRef = useRef(0);

  const collect = useCallback(async () => {
    if (!pc || pc.connectionState === 'closed') return;
    try {
      const stats = await pc.getStats();
      let jitterMs = 0, packetsLost = 0, packetsReceived = 0, rttMs = 0, audioLevel = 0;
      stats.forEach((report) => {
        if (report.type === 'inbound-rtp' && report.kind === 'audio') {
          jitterMs = (report.jitter ?? 0) * 1000;
          packetsLost = report.packetsLost ?? 0;
          packetsReceived = report.packetsReceived ?? 0;
          audioLevel = report.audioLevel ?? 0;
        }
        if (report.type === 'remote-inbound-rtp' && report.kind === 'audio') {
          rttMs = (report.roundTripTime ?? 0) * 1000;
        }
        if (report.type === 'candidate-pair' && report.state === 'succeeded' && rttMs === 0) {
          rttMs = (report.currentRoundTripTime ?? 0) * 1000;
        }
      });

      const lostDelta = Math.max(0, packetsLost - prevPacketsLostRef.current);
      const recvDelta = Math.max(1, packetsReceived - prevPacketsReceivedRef.current);
      const lossPct = (lostDelta / (lostDelta + recvDelta)) * 100;
      prevPacketsLostRef.current = packetsLost;
      prevPacketsReceivedRef.current = packetsReceived;

      const mos = calculateMos(rttMs, jitterMs, lossPct);
      const sample: VoipQualitySample = {
        ts: Date.now(), jitterMs, packetsLost, packetsReceived, rttMs, audioLevel, mos,
      };
      samplesRef.current.push(sample);

      const samples = samplesRef.current;
      const mosAvg = samples.reduce((s, x) => s + x.mos, 0) / samples.length;
      const mosMin = Math.min(...samples.map(s => s.mos));
      const jitterAvg = samples.reduce((s, x) => s + x.jitterMs, 0) / samples.length;
      const rttAvg = samples.reduce((s, x) => s + x.rttMs, 0) / samples.length;
      const totalLost = samples.reduce((s, x) => s + x.packetsLost, 0);
      const totalRecv = samples.reduce((s, x) => s + x.packetsReceived, 0);
      const lossPctAvg = totalRecv > 0 ? (totalLost / (totalLost + totalRecv)) * 100 : 0;

      setState({
        current: sample,
        mosAvg: Number(mosAvg.toFixed(2)),
        mosMin: Number(mosMin.toFixed(2)),
        jitterAvgMs: Number(jitterAvg.toFixed(2)),
        packetLossPct: Number(lossPctAvg.toFixed(2)),
        rttAvgMs: Number(rttAvg.toFixed(2)),
        label: labelFromMos(mosAvg),
        samplesCount: samples.length,
      });
    } catch (err) {
      log.warn('getStats failed', err);
    }
  }, [pc]);

  const persist = useCallback(async () => {
    if (!options.persistOnEnd || samplesRef.current.length === 0) return;
    const s = samplesRef.current;
    const mosAvg = s.reduce((a, x) => a + x.mos, 0) / s.length;
    const mosMin = Math.min(...s.map(x => x.mos));
    const jitterAvg = s.reduce((a, x) => a + x.jitterMs, 0) / s.length;
    const jitterMax = Math.max(...s.map(x => x.jitterMs));
    const rttAvg = s.reduce((a, x) => a + x.rttMs, 0) / s.length;
    const rttMax = Math.max(...s.map(x => x.rttMs));
    const totalLost = s.reduce((a, x) => a + x.packetsLost, 0);
    const totalRecv = s.reduce((a, x) => a + x.packetsReceived, 0);
    const lossPct = totalRecv > 0 ? (totalLost / (totalLost + totalRecv)) * 100 : 0;

    try {
      const payload = {
        call_session_id: options.callSessionId ?? null,
        agent_name: options.agentName ?? null,
        channel: options.channel ?? 'webrtc',
        mos_avg: Number(mosAvg.toFixed(2)),
        mos_min: Number(mosMin.toFixed(2)),
        jitter_avg_ms: Number(jitterAvg.toFixed(2)),
        jitter_max_ms: Number(jitterMax.toFixed(2)),
        packet_loss_pct: Number(lossPct.toFixed(2)),
        rtt_avg_ms: Number(rttAvg.toFixed(2)),
        rtt_max_ms: Number(rttMax.toFixed(2)),
        samples_count: s.length,
        quality_label: labelFromMos(mosAvg),
        raw_samples: s.slice(-30) as unknown as Record<string, unknown>[],
      };
      await supabase.from('call_quality_metrics').insert(payload as never);
      log.info('Quality metrics persisted', { samples: s.length, mosAvg });
    } catch (err) {
      log.error('Failed to persist quality metrics', err);
    }
  }, [options.persistOnEnd, options.callSessionId, options.agentName, options.channel]);

  useEffect(() => {
    if (!pc) return;
    samplesRef.current = [];
    prevPacketsLostRef.current = 0;
    prevPacketsReceivedRef.current = 0;
    collect();
    intervalRef.current = window.setInterval(collect, COLLECT_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      persist();
    };
  }, [pc, collect, persist]);

  return state;
}
