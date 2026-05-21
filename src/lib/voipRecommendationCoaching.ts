/**
 * Sistema de coaching pós-ação para recomendações VoIP.
 *
 * Fluxo:
 * 1. Após uma ação `applied`/`auto_applied`, agenda uma verificação 2h depois.
 * 2. A fila persiste em `localStorage` (resiste a reload).
 * 3. No próximo load do app (ou após 2h), lê MOS antes/depois e dispara toast.
 *
 * Sem cron, sem servidor — pura lógica client-side.
 */
import { supabase } from '@/integrations/supabase/client';
import { logger } from './logger';
import { toast } from 'sonner';

const QUEUE_KEY = 'voip-rec-coaching-queue';
const COACHED_KEY = 'voip-rec-coaching-shown';
const WINDOW_MS = 2 * 60 * 60 * 1000; // 2h
const MOS_DELTA_THRESHOLD = 0.2;

const log = logger.create('voipRecommendationCoaching');

export interface CoachingItem {
  recommendationId: string;
  title: string;
  scheduledAt: number; // timestamp ms quando dispara
  appliedAt: number;
  mosBefore: number | null;
}

function readQueue(): CoachingItem[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (i): i is CoachingItem =>
        !!i &&
        typeof i === 'object' &&
        typeof (i as CoachingItem).recommendationId === 'string' &&
        typeof (i as CoachingItem).title === 'string' &&
        typeof (i as CoachingItem).scheduledAt === 'number' &&
        typeof (i as CoachingItem).appliedAt === 'number',
    );
  } catch { return []; }
}

function writeQueue(items: CoachingItem[]) {
  try { localStorage.setItem(QUEUE_KEY, JSON.stringify(items)); } catch { /* noop */ }
}

function readCoached(): Record<string, number> {
  try {
    const raw = localStorage.getItem(COACHED_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const result: Record<string, number> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof v === 'number') result[k] = v;
    }
    return result;
  } catch { return {}; }
}

function writeCoached(map: Record<string, number>) {
  try { localStorage.setItem(COACHED_KEY, JSON.stringify(map)); } catch { /* noop */ }
}

async function fetchAvgMos(sinceMs: number, untilMs: number): Promise<number | null> {
  try {
    const { data, error } = await supabase
      .from('call_quality_metrics')
      .select('mos_avg, created_at')
      .gte('created_at', new Date(sinceMs).toISOString())
      .lte('created_at', new Date(untilMs).toISOString())
      .not('mos_avg', 'is', null)
      .limit(200);
    if (error || !data?.length) return null;
    const valid = data.filter(d => typeof d.mos_avg === 'number');
    if (!valid.length) return null;
    return valid.reduce((s, d) => s + (d.mos_avg ?? 0), 0) / valid.length;
  } catch (err) {
    log.warn('Falha ao buscar MOS médio', err);
    return null;
  }
}

/** Agenda verificação de coaching após aplicar/auto-aplicar uma recomendação. */
export async function scheduleCoachingCheck(recommendationId: string, title: string): Promise<void> {
  const now = Date.now();
  const mosBefore = await fetchAvgMos(now - WINDOW_MS, now);
  const queue = readQueue();
  // Evita duplicatas
  if (queue.some(q => q.recommendationId === recommendationId)) return;
  queue.push({
    recommendationId,
    title,
    scheduledAt: now + WINDOW_MS,
    appliedAt: now,
    mosBefore,
  });
  writeQueue(queue);
  log.info('Coaching agendado', { recommendationId, mosBefore, dueIn: '2h' });
}

/** Verifica fila e dispara toasts para itens vencidos com melhoria detectada. */
export async function processCoachingQueue(): Promise<void> {
  const queue = readQueue();
  if (!queue.length) return;
  const now = Date.now();
  const coached = readCoached();
  const remaining: CoachingItem[] = [];

  for (const item of queue) {
    if (now < item.scheduledAt) {
      remaining.push(item);
      continue;
    }
    if (coached[item.recommendationId]) continue;
    if (item.mosBefore === null) continue;

    const mosAfter = await fetchAvgMos(item.appliedAt, item.appliedAt + WINDOW_MS);
    if (mosAfter === null) continue;

    const delta = mosAfter - item.mosBefore;
    if (delta >= MOS_DELTA_THRESHOLD) {
      const pct = ((delta / item.mosBefore) * 100).toFixed(1);
      toast.success(`✓ "${item.title}" melhorou MOS em ${pct}%`, {
        description: `MOS ${item.mosBefore.toFixed(2)} → ${mosAfter.toFixed(2)} nas 2h seguintes`,
        duration: 8000,
      });
      coached[item.recommendationId] = now;
    } else if (delta <= -MOS_DELTA_THRESHOLD) {
      toast.warning(`⚠ "${item.title}" não trouxe ganho`, {
        description: `MOS variou ${item.mosBefore.toFixed(2)} → ${mosAfter.toFixed(2)}`,
        duration: 6000,
      });
      coached[item.recommendationId] = now;
    } else {
      coached[item.recommendationId] = now;
    }
  }

  writeQueue(remaining);
  writeCoached(coached);
  // Limpa coached antigos (>7d)
  const cutoff = now - 7 * 86_400_000;
  const cleaned = Object.fromEntries(Object.entries(coached).filter(([, t]) => t > cutoff));
  writeCoached(cleaned);
}
