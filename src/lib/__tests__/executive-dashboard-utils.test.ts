import { describe, it, expect } from 'vitest';
import { getPeriodLabel, formatDuration } from '@/hooks/useExecutiveDashboard';

describe('getPeriodLabel', () => {
  it('returns correct label for today', () => {
    expect(getPeriodLabel('today')).toBe('hoje');
  });
  it('returns correct label for week', () => {
    expect(getPeriodLabel('week')).toBe('últimos 7 dias');
  });
  it('returns correct label for month', () => {
    expect(getPeriodLabel('month')).toBe('últimos 30 dias');
  });
  it('returns correct label for all', () => {
    expect(getPeriodLabel('all')).toBe('todo período');
  });
  it('returns fallback for unknown period', () => {
    expect(getPeriodLabel('unknown' as any)).toBe('últimos 7 dias');
  });
});

describe('formatDuration', () => {
  it('formats 0 seconds', () => {
    expect(formatDuration(0)).toBe('0m 0s');
  });
  it('formats seconds only', () => {
    expect(formatDuration(45)).toBe('0m 45s');
  });
  it('formats minutes and seconds', () => {
    expect(formatDuration(125)).toBe('2m 5s');
  });
  it('formats exact minutes', () => {
    expect(formatDuration(60)).toBe('1m 0s');
  });
  it('formats large durations', () => {
    expect(formatDuration(3661)).toBe('61m 1s');
  });
  it('rounds fractional seconds', () => {
    expect(formatDuration(90.7)).toBe('1m 31s');
  });
});
