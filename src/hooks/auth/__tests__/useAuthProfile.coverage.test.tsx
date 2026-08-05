import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

const maybeSingle = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: (...args: unknown[]) => maybeSingle(...args),
    })),
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    create: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { useAuthProfile } from '../useAuthProfile';

describe('useAuthProfile', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns profile data on success', async () => {
    maybeSingle.mockResolvedValue({ data: { id: 'u1', full_name: 'Test' }, error: null });
    const { result } = renderHook(() => useAuthProfile());
    const profile = await result.current.getProfile('u1');
    expect(profile).toEqual({ id: 'u1', full_name: 'Test' });
  });

  it('returns null and logs on error', async () => {
    maybeSingle.mockResolvedValue({ data: null, error: { message: 'boom' } });
    const { result } = renderHook(() => useAuthProfile());
    const profile = await result.current.getProfile('u1');
    expect(profile).toBeNull();
  });

  it('returns null when query throws', async () => {
    maybeSingle.mockRejectedValue(new Error('network'));
    const { result } = renderHook(() => useAuthProfile());
    const profile = await result.current.getProfile('u2');
    expect(profile).toBeNull();
  });
});
