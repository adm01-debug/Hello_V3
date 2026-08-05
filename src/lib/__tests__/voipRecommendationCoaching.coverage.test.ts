import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const limitMock = vi.fn();

vi.mock('@/integrations/supabase/client', () => {
  const builder: Record<string, unknown> = {};
  builder.select = vi.fn(() => builder);
  builder.gte = vi.fn(() => builder);
  builder.lte = vi.fn(() => builder);
  builder.not = vi.fn(() => builder);
  builder.limit = (...args: unknown[]) => limitMock(...args);
  return {
    supabase: {
      from: vi.fn(() => builder),
    },
  };
});

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock('../logger', () => ({
  logger: {
    create: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
  },
}));

import {
  scheduleCoachingCheck,
  processCoachingQueue,
  type CoachingItem,
} from '../voipRecommendationCoaching';
import { toast } from 'sonner';

const QUEUE_KEY = 'voip-rec-coaching-queue';
const COACHED_KEY = 'voip-rec-coaching-shown';
const WINDOW_MS = 2 * 60 * 60 * 1000;

function setMos(value: number | null): void {
  if (value === null) {
    limitMock.mockResolvedValue({ data: [], error: null });
  } else {
    limitMock.mockResolvedValue({
      data: [{ mos_avg: value, created_at: new Date().toISOString() }],
      error: null,
    });
  }
}

function readQueue(): CoachingItem[] {
  const raw = localStorage.getItem(QUEUE_KEY);
  return raw ? (JSON.parse(raw) as CoachingItem[]) : [];
}

describe('voipRecommendationCoaching', () => {
  beforeEach(() => {
    localStorage.clear();
    limitMock.mockReset();
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-14T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('schedules a coaching check with mosBefore captured', async () => {
    setMos(4.0);
    await scheduleCoachingCheck('rec-1', 'Aumentar largura de banda');
    const queue = readQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0].recommendationId).toBe('rec-1');
    expect(queue[0].mosBefore).toBe(4.0);
    expect(queue[0].scheduledAt).toBe(Date.now() + WINDOW_MS);
  });

  it('does not schedule duplicates for the same recommendation', async () => {
    setMos(4.0);
    await scheduleCoachingCheck('rec-1', 'Title');
    await scheduleCoachingCheck('rec-1', 'Title again');
    expect(readQueue()).toHaveLength(1);
  });

  it('captures null mosBefore when supabase returns empty data', async () => {
    setMos(null);
    await scheduleCoachingCheck('rec-null', 'No metrics');
    expect(readQueue()[0].mosBefore).toBeNull();
  });

  it('returns early when queue is empty', async () => {
    await processCoachingQueue();
    expect(toast.success).not.toHaveBeenCalled();
    expect(readQueue()).toHaveLength(0);
  });

  it('keeps items that are not yet due', async () => {
    setMos(4.0);
    await scheduleCoachingCheck('rec-future', 'Future');
    // not advancing time -> still pending
    await processCoachingQueue();
    expect(readQueue()).toHaveLength(1);
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('skips items with null mosBefore once due', async () => {
    setMos(null);
    await scheduleCoachingCheck('rec-skip', 'Skip me');
    vi.setSystemTime(new Date(Date.now() + WINDOW_MS + 1000));
    await processCoachingQueue();
    expect(toast.success).not.toHaveBeenCalled();
    expect(toast.warning).not.toHaveBeenCalled();
    expect(readQueue()).toHaveLength(0);
  });

  it('fires success toast when MOS improves past threshold', async () => {
    setMos(3.0);
    await scheduleCoachingCheck('rec-improve', 'Improve QoS');
    vi.setSystemTime(new Date(Date.now() + WINDOW_MS + 1000));
    setMos(4.0); // after window higher
    await processCoachingQueue();
    expect(toast.success).toHaveBeenCalledTimes(1);
    expect(readQueue()).toHaveLength(0);
    const coached = JSON.parse(localStorage.getItem(COACHED_KEY) ?? '{}');
    expect(coached['rec-improve']).toBeTruthy();
  });

  it('fires warning toast when MOS regresses past threshold', async () => {
    setMos(4.0);
    await scheduleCoachingCheck('rec-regress', 'Regress');
    vi.setSystemTime(new Date(Date.now() + WINDOW_MS + 1000));
    setMos(3.0); // after window lower
    await processCoachingQueue();
    expect(toast.warning).toHaveBeenCalledTimes(1);
  });

  it('marks as coached without toast when delta is within threshold', async () => {
    setMos(4.0);
    await scheduleCoachingCheck('rec-flat', 'Flat');
    vi.setSystemTime(new Date(Date.now() + WINDOW_MS + 1000));
    setMos(4.05); // delta < threshold
    await processCoachingQueue();
    expect(toast.success).not.toHaveBeenCalled();
    expect(toast.warning).not.toHaveBeenCalled();
    const coached = JSON.parse(localStorage.getItem(COACHED_KEY) ?? '{}');
    expect(coached['rec-flat']).toBeTruthy();
  });

  it('skips already-coached items', async () => {
    const now = Date.now();
    const item: CoachingItem = {
      recommendationId: 'rec-done',
      title: 'Done',
      scheduledAt: now - 1000,
      appliedAt: now - WINDOW_MS,
      mosBefore: 3.0,
    };
    localStorage.setItem(QUEUE_KEY, JSON.stringify([item]));
    localStorage.setItem(COACHED_KEY, JSON.stringify({ 'rec-done': now }));
    setMos(5.0);
    await processCoachingQueue();
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('skips when after-window MOS is null', async () => {
    setMos(3.0);
    await scheduleCoachingCheck('rec-noafter', 'No after');
    vi.setSystemTime(new Date(Date.now() + WINDOW_MS + 1000));
    setMos(null); // after window has no data
    await processCoachingQueue();
    expect(toast.success).not.toHaveBeenCalled();
    expect(toast.warning).not.toHaveBeenCalled();
  });

  it('returns null mos when supabase reports an error (warn branch)', async () => {
    limitMock.mockResolvedValue({ data: null, error: { message: 'boom' } });
    await scheduleCoachingCheck('rec-err', 'Error');
    expect(readQueue()[0].mosBefore).toBeNull();
  });
});
