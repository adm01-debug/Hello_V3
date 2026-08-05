import { describe, it, expect, vi, beforeEach } from 'vitest';

const toastWarning = vi.fn();
vi.mock('sonner', () => ({
  toast: { warning: (...a: unknown[]) => toastWarning(...a), success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));
vi.mock('@/lib/logger', () => ({
  logger: {
    create: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
  },
}));

import {
  isProactiveEnabled,
  setProactiveEnabled,
  shouldRunProactiveCheck,
  compareSnapshotAndNotify,
} from '../voipProactiveSnapshot';

const SNAPSHOT_KEY = 'voip-rec-last-snapshot';
const PREF_KEY = 'voip-rec-proactive-enabled';

describe('voipProactiveSnapshot', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('isProactiveEnabled reflects localStorage pref', () => {
    expect(isProactiveEnabled()).toBe(false);
    localStorage.setItem(PREF_KEY, '1');
    expect(isProactiveEnabled()).toBe(true);
  });

  it('setProactiveEnabled writes the pref', () => {
    setProactiveEnabled(true);
    expect(localStorage.getItem(PREF_KEY)).toBe('1');
    setProactiveEnabled(false);
    expect(localStorage.getItem(PREF_KEY)).toBe('0');
  });

  it('shouldRunProactiveCheck false when disabled', () => {
    expect(shouldRunProactiveCheck()).toBe(false);
  });

  it('shouldRunProactiveCheck true when enabled and no snapshot', () => {
    setProactiveEnabled(true);
    expect(shouldRunProactiveCheck()).toBe(true);
  });

  it('shouldRunProactiveCheck false for fresh snapshot, true for stale', () => {
    setProactiveEnabled(true);
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify({ ids: [], takenAt: Date.now() }));
    expect(shouldRunProactiveCheck()).toBe(false);

    localStorage.setItem(
      SNAPSHOT_KEY,
      JSON.stringify({ ids: [], takenAt: Date.now() - 25 * 60 * 60 * 1000 }),
    );
    expect(shouldRunProactiveCheck()).toBe(true);
  });

  it('shouldRunProactiveCheck true on corrupt snapshot JSON', () => {
    setProactiveEnabled(true);
    localStorage.setItem(SNAPSHOT_KEY, 'not-json');
    expect(shouldRunProactiveCheck()).toBe(true);
  });

  it('compareSnapshotAndNotify warns for new critical and writes snapshot', () => {
    compareSnapshotAndNotify([
      { id: '1', title: 'A', severity: 'critical' },
      { id: '2', title: 'B', severity: 'critical' },
    ]);
    expect(toastWarning).toHaveBeenCalledTimes(1);
    const stored = JSON.parse(localStorage.getItem(SNAPSHOT_KEY)!);
    expect(stored.ids).toEqual(['1', '2']);
  });

  it('compareSnapshotAndNotify does not warn when nothing new', () => {
    localStorage.setItem(
      SNAPSHOT_KEY,
      JSON.stringify({ ids: ['1'], takenAt: Date.now() }),
    );
    compareSnapshotAndNotify([{ id: '1', title: 'A', severity: 'critical' }]);
    expect(toastWarning).not.toHaveBeenCalled();
  });
});
