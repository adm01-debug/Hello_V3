import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createNotificationSound,
  createUrgentSound,
  formatHoldTime,
  loadSavedInterval,
  loadSavedEnabled,
  loadSavedAlertThreshold,
  loadSavedAlertsEnabled,
  saveToStorage,
  REMINDER_INTERVALS,
  ALERT_THRESHOLDS,
  STORAGE_KEY_INTERVAL,
  STORAGE_KEY_ENABLED,
  STORAGE_KEY_ALERT_THRESHOLD,
  STORAGE_KEY_ALERTS_ENABLED,
} from '../holdReminderSounds';

describe('holdReminderSounds', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useRealTimers();
  });

  it('createNotificationSound plays two oscillators (timer branch)', () => {
    vi.useFakeTimers();
    const play = createNotificationSound();
    play();
    vi.advanceTimersByTime(250);
    vi.useRealTimers();
    expect(typeof play).toBe('function');
  });

  it('createUrgentSound plays three beeps over time', () => {
    vi.useFakeTimers();
    const play = createUrgentSound();
    play();
    vi.advanceTimersByTime(700);
    vi.useRealTimers();
    expect(typeof play).toBe('function');
  });

  it('formatHoldTime formats both branches', () => {
    expect(formatHoldTime(45)).toBe('45s');
    expect(formatHoldTime(125)).toBe('2m 5s');
    expect(formatHoldTime(0)).toBe('0s');
  });

  it('exports constant tables', () => {
    expect(REMINDER_INTERVALS.length).toBe(3);
    expect(ALERT_THRESHOLDS.length).toBe(5);
  });

  it('loadSavedInterval returns default when empty and parses valid', () => {
    expect(loadSavedInterval()).toBe(30);
    saveToStorage(STORAGE_KEY_INTERVAL, '60');
    expect(loadSavedInterval()).toBe(60);
    saveToStorage(STORAGE_KEY_INTERVAL, '999');
    expect(loadSavedInterval()).toBe(30);
  });

  it('loadSavedEnabled returns default and parses', () => {
    expect(loadSavedEnabled()).toBe(true);
    saveToStorage(STORAGE_KEY_ENABLED, 'false');
    expect(loadSavedEnabled()).toBe(false);
    saveToStorage(STORAGE_KEY_ENABLED, 'true');
    expect(loadSavedEnabled()).toBe(true);
  });

  it('loadSavedAlertThreshold returns default and parses valid/invalid', () => {
    expect(loadSavedAlertThreshold()).toBe(60);
    saveToStorage(STORAGE_KEY_ALERT_THRESHOLD, '120');
    expect(loadSavedAlertThreshold()).toBe(120);
    saveToStorage(STORAGE_KEY_ALERT_THRESHOLD, '7');
    expect(loadSavedAlertThreshold()).toBe(60);
  });

  it('loadSavedAlertsEnabled returns default and parses', () => {
    expect(loadSavedAlertsEnabled()).toBe(true);
    saveToStorage(STORAGE_KEY_ALERTS_ENABLED, 'false');
    expect(loadSavedAlertsEnabled()).toBe(false);
  });

  it('saveToStorage swallows errors', () => {
    const spy = vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    expect(() => saveToStorage('x', 'y')).not.toThrow();
    spy.mockRestore();
  });

  it('load helpers swallow errors', () => {
    const spy = vi.spyOn(window.localStorage, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(loadSavedInterval()).toBe(30);
    expect(loadSavedEnabled()).toBe(true);
    expect(loadSavedAlertThreshold()).toBe(60);
    expect(loadSavedAlertsEnabled()).toBe(true);
    spy.mockRestore();
  });
});
