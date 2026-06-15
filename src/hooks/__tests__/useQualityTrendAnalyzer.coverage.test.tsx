import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useQualityTrendAnalyzer } from '../useQualityTrendAnalyzer';

const insertMock = vi.fn().mockResolvedValue({ error: null });
const getUserMock = vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({ insert: (...args: unknown[]) => (insertMock as (...a: unknown[]) => unknown)(...args) })),
    auth: { getUser: (...args: unknown[]) => (getUserMock as (...a: unknown[]) => unknown)(...args) },
  },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));
vi.mock('@/lib/logger', () => ({ logger: { create: () => ({ warn: vi.fn(), info: vi.fn(), error: vi.fn(), debug: vi.fn() }) } }));

describe('useQualityTrendAnalyzer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    insertMock.mockResolvedValue({ error: null });
    getUserMock.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
  });

  it('não faz nada quando desabilitado', () => {
    const { rerender } = renderHook(
      ({ mos, en }: { mos: number | null; en: boolean }) => useQualityTrendAnalyzer(mos, en),
      { initialProps: { mos: 4 as number | null, en: false } },
    );
    rerender({ mos: 3, en: false });
    expect(insertMock).not.toHaveBeenCalled();
  });

  it('ignora MOS null ou não finito', () => {
    const { rerender } = renderHook(
      ({ mos }: { mos: number | null }) => useQualityTrendAnalyzer(mos, true),
      { initialProps: { mos: null as number | null } },
    );
    rerender({ mos: Infinity });
    expect(insertMock).not.toHaveBeenCalled();
  });

  it('detecta degradação progressiva e persiste alerta', async () => {
    const onSevere = vi.fn();
    const { rerender } = renderHook(
      ({ mos }: { mos: number }) => useQualityTrendAnalyzer(mos, true, { onSevereDegradation: onSevere, jitterMs: 10, rttMs: 50, callSessionId: 'c1' }),
      { initialProps: { mos: 4.5 } },
    );
    // 5 amostras com tendência fortemente decrescente, último ainda >= 3.6
    [4.4, 4.2, 4.0, 3.8, 3.7].forEach((m) => rerender({ mos: m }));
    await waitFor(() => expect(insertMock).toHaveBeenCalled());
  });

  it('detecta degradação severa e dispara callback', async () => {
    const onSevere = vi.fn();
    const { rerender } = renderHook(
      ({ mos }: { mos: number }) => useQualityTrendAnalyzer(mos, true, { onSevereDegradation: onSevere }),
      { initialProps: { mos: 4.0 } },
    );
    // último MOS < 3.5 => severe
    [3.8, 3.5, 3.2, 3.0, 2.5].forEach((m) => rerender({ mos: m }));
    await waitFor(() => expect(onSevere).toHaveBeenCalled());
  });

  it('reseta warned quando qualidade estabiliza (slope > -0.05)', () => {
    const { rerender } = renderHook(
      ({ mos }: { mos: number }) => useQualityTrendAnalyzer(mos, true),
      { initialProps: { mos: 4.0 } },
    );
    // amostras estáveis/crescentes
    [4.0, 4.0, 4.1, 4.1, 4.2].forEach((m) => rerender({ mos: m }));
    expect(insertMock).not.toHaveBeenCalled();
  });

  it('não persiste se usuário ausente', async () => {
    getUserMock.mockResolvedValue({ data: { user: null }, error: null });
    const { rerender } = renderHook(
      ({ mos }: { mos: number }) => useQualityTrendAnalyzer(mos, true),
      { initialProps: { mos: 4.5 } },
    );
    [4.4, 4.2, 4.0, 3.8, 3.7].forEach((m) => rerender({ mos: m }));
    await waitFor(() => expect(getUserMock).toHaveBeenCalled());
    expect(insertMock).not.toHaveBeenCalled();
  });

  it('lida com erro de insert sem lançar', async () => {
    insertMock.mockResolvedValue({ error: new Error('db fail') });
    const { rerender } = renderHook(
      ({ mos }: { mos: number }) => useQualityTrendAnalyzer(mos, true),
      { initialProps: { mos: 4.5 } },
    );
    [4.4, 4.2, 4.0, 3.8, 3.7].forEach((m) => rerender({ mos: m }));
    await waitFor(() => expect(insertMock).toHaveBeenCalled());
  });

  it('lida com exceção em getUser sem lançar', async () => {
    getUserMock.mockRejectedValue(new Error('network'));
    const { rerender } = renderHook(
      ({ mos }: { mos: number }) => useQualityTrendAnalyzer(mos, true),
      { initialProps: { mos: 4.5 } },
    );
    [4.4, 4.2, 4.0, 3.8, 3.7].forEach((m) => rerender({ mos: m }));
    await waitFor(() => expect(getUserMock).toHaveBeenCalled());
  });
});
