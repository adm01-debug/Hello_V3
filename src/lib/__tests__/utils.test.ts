import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn (classname utility)', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'visible')).toBe('base visible');
  });

  it('handles undefined and null', () => {
    expect(cn('base', undefined, null)).toBe('base');
  });

  it('handles empty inputs', () => {
    expect(cn()).toBe('');
  });

  it('merges tailwind conflicting classes', () => {
    const result = cn('p-4', 'p-2');
    expect(result).toBe('p-2');
  });

  it('handles arrays', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar');
  });

  it('handles objects', () => {
    expect(cn({ foo: true, bar: false, baz: true })).toBe('foo baz');
  });

  it('merges tailwind bg colors correctly', () => {
    expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
  });

  it('keeps non-conflicting tailwind classes', () => {
    expect(cn('text-sm', 'bg-blue-500')).toBe('text-sm bg-blue-500');
  });
});
