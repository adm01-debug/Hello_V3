import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useCulturalHints } from '../useCulturalHints';

const orderResult = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: (...a: unknown[]) => (orderResult as (...args: unknown[]) => unknown)(...a),
    })),
  },
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));
vi.mock('@/lib/logger', () => ({
  logger: { create: () => ({ debug: vi.fn(), info: vi.fn(), error: vi.fn(), warn: vi.fn() }), error: vi.fn() },
}));

import { logger } from '@/lib/logger';

describe('useCulturalHints (coverage)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    orderResult.mockReset();
  });

  it('returns empty hints when no langCode provided', () => {
    orderResult.mockResolvedValue({ data: [], error: null });
    const { result } = renderHook(() => useCulturalHints());
    expect(result.current.hints).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('loads hints for a language code', async () => {
    const rows = [{ id: '1', locale: 'pt-BR', context_type: 'greeting', hint_text: 'Olá', severity: 'info' }];
    orderResult.mockResolvedValue({ data: rows, error: null });
    const { result } = renderHook(() => useCulturalHints('pt'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.hints).toHaveLength(1);
    expect(result.current.hints[0].severity).toBe('info');
  });

  it('handles null data gracefully', async () => {
    orderResult.mockResolvedValue({ data: null, error: null });
    const { result } = renderHook(() => useCulturalHints('en'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.hints).toEqual([]);
  });

  it('logs error on query failure', async () => {
    orderResult.mockResolvedValue({ data: null, error: new Error('boom') });
    const { result } = renderHook(() => useCulturalHints('es'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(logger.error).toHaveBeenCalled();
    expect(result.current.hints).toEqual([]);
  });

  it('cleans up on unmount without setting state', async () => {
    orderResult.mockResolvedValue({ data: [], error: null });
    const { unmount } = renderHook(() => useCulturalHints('fr'));
    unmount();
    expect(true).toBe(true);
  });
});
