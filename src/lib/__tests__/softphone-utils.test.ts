import { describe, it, expect } from 'vitest';
import { formatCallDuration, getInitials, dialPadButtons } from '@/components/calls/softphone/constants';

describe('formatCallDuration', () => {
  it('formats 0 seconds', () => {
    expect(formatCallDuration(0)).toBe('0:00');
  });
  it('formats under a minute', () => {
    expect(formatCallDuration(5)).toBe('0:05');
    expect(formatCallDuration(59)).toBe('0:59');
  });
  it('formats exact minutes', () => {
    expect(formatCallDuration(60)).toBe('1:00');
    expect(formatCallDuration(120)).toBe('2:00');
  });
  it('formats mixed minutes and seconds', () => {
    expect(formatCallDuration(90)).toBe('1:30');
    expect(formatCallDuration(125)).toBe('2:05');
    expect(formatCallDuration(3661)).toBe('61:01');
  });
  it('pads single-digit seconds', () => {
    expect(formatCallDuration(61)).toBe('1:01');
    expect(formatCallDuration(9)).toBe('0:09');
  });
});

describe('getInitials', () => {
  it('returns two letter initials for two-word name', () => {
    expect(getInitials('John Doe')).toBe('JD');
  });
  it('returns single letter for single-word name', () => {
    expect(getInitials('Admin')).toBe('A');
  });
  it('limits to 2 characters for multi-word names', () => {
    expect(getInitials('Ana Maria Silva')).toBe('AM');
  });
  it('returns uppercase', () => {
    expect(getInitials('john doe')).toBe('JD');
  });
});

describe('dialPadButtons', () => {
  it('has exactly 12 buttons', () => {
    expect(dialPadButtons).toHaveLength(12);
  });
  it('contains digits 0-9 plus * and #', () => {
    const digits = dialPadButtons.map(b => b.digit);
    for (let i = 0; i <= 9; i++) expect(digits).toContain(String(i));
    expect(digits).toContain('*');
    expect(digits).toContain('#');
  });
  it('digit 2 has letters ABC', () => {
    const btn2 = dialPadButtons.find(b => b.digit === '2');
    expect(btn2?.letters).toBe('ABC');
  });
  it('digit 0 has letters +', () => {
    const btn0 = dialPadButtons.find(b => b.digit === '0');
    expect(btn0?.letters).toBe('+');
  });
  it('digit 1 has no letters', () => {
    const btn1 = dialPadButtons.find(b => b.digit === '1');
    expect(btn1?.letters).toBe('');
  });
});
