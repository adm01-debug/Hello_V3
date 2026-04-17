import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSkills } from '../useSkills';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [{ id: '1', name: 'Português', category: 'language', description: null, is_active: true }], error: null }),
      insert: vi.fn(() => ({ select: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data: {}, error: null }) })) })),
      upsert: vi.fn(() => ({ select: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data: {}, error: null }) })) })),
    })),
  },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const c = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={c}>{children}</QueryClientProvider>;
};

describe('useSkills', () => {
  it('carrega skills', async () => {
    const { result } = renderHook(() => useSkills(), { wrapper });
    await waitFor(() => expect(result.current.skills.length).toBeGreaterThanOrEqual(0));
    expect(typeof result.current.createSkill).toBe('function');
    expect(typeof result.current.upsertAgentSkill).toBe('function');
  });
});
