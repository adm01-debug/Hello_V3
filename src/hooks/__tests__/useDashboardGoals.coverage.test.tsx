import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useDashboardGoals, type DashboardGoal } from '../useDashboardGoals';

type Result = { data: unknown[] | null; error: { message: string } | null };

const makeChain = (result: Result) => {
  const chain: Record<string, unknown> = {
    select: vi.fn(() => chain),
    order: vi.fn().mockResolvedValue(result),
    eq: vi.fn().mockResolvedValue(result),
    insert: vi.fn().mockResolvedValue(result),
    update: vi.fn(() => ({ eq: vi.fn().mockResolvedValue(result) })),
    delete: vi.fn(() => ({ eq: vi.fn().mockResolvedValue(result) })),
  };
  return chain;
};

const sampleGoal: DashboardGoal = {
  id: 'g1', name: 'SL', metric_type: 'service_level', target_value: 80,
  warning_threshold: 70, critical_threshold: 60, comparison_operator: 'gte',
  is_active: true, notify_on_warning: true, notify_on_critical: true,
  created_at: '2026-01-01', updated_at: '2026-01-01',
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: vi.fn(() => makeChain({ data: [], error: null })) },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));
vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

describe('useDashboardGoals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: [sampleGoal], error: null }) as never);
  });

  it('fetches goals on mount', async () => {
    const { result } = renderHook(() => useDashboardGoals());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.goals.length).toBe(1);
  });

  it('handles fetch error', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(
      makeChain({ data: null, error: { message: 'err' } }) as never
    );
    const { result } = renderHook(() => useDashboardGoals());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(toast.error).toHaveBeenCalled();
  });

  it('opens dialog for new and for editing', async () => {
    const { result } = renderHook(() => useDashboardGoals());
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => result.current.handleOpenDialog());
    expect(result.current.dialogOpen).toBe(true);
    expect(result.current.editingGoal).toBeNull();
    act(() => result.current.handleOpenDialog(sampleGoal));
    expect(result.current.editingGoal).toEqual(sampleGoal);
    expect(result.current.formData.name).toBe('SL');
  });

  it('handleSave validation error when fields missing', async () => {
    const { result } = renderHook(() => useDashboardGoals());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { await result.current.handleSave(); });
    expect(toast.error).toHaveBeenCalledWith('Preencha todos os campos obrigatórios');
  });

  it('handleSave insert (create) success', async () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useDashboardGoals(onChange));
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => result.current.setFormData({
      name: 'X', metric_type: 'service_level', target_value: '80',
      warning_threshold: '70', critical_threshold: '60', comparison_operator: 'gte',
      is_active: true, notify_on_warning: true, notify_on_critical: true,
    }));
    await act(async () => { await result.current.handleSave(); });
    expect(toast.success).toHaveBeenCalledWith('Meta criada');
    expect(onChange).toHaveBeenCalled();
  });

  it('handleSave update (edit) and error branch', async () => {
    const { result } = renderHook(() => useDashboardGoals());
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => result.current.handleOpenDialog(sampleGoal));
    vi.mocked(supabase.from).mockReturnValueOnce(
      makeChain({ data: null, error: { message: 'save fail' } }) as never
    );
    await act(async () => { await result.current.handleSave(); });
    expect(toast.error).toHaveBeenCalledWith('Erro ao salvar meta');
  });

  it('handleDelete success and error', async () => {
    const { result } = renderHook(() => useDashboardGoals());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { await result.current.handleDelete('g1'); });
    expect(toast.success).toHaveBeenCalledWith('Meta excluída');

    vi.mocked(supabase.from).mockReturnValueOnce(
      makeChain({ data: null, error: { message: 'del fail' } }) as never
    );
    await act(async () => { await result.current.handleDelete('g1'); });
    expect(toast.error).toHaveBeenCalledWith('Erro ao excluir meta');
  });

  it('handleToggleActive success and error', async () => {
    const { result } = renderHook(() => useDashboardGoals());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { await result.current.handleToggleActive(sampleGoal); });

    vi.mocked(supabase.from).mockReturnValueOnce(
      makeChain({ data: null, error: { message: 'toggle fail' } }) as never
    );
    await act(async () => { await result.current.handleToggleActive(sampleGoal); });
    expect(toast.error).toHaveBeenCalledWith('Erro ao atualizar meta');
  });

  it('label and value formatting helpers', async () => {
    const { result } = renderHook(() => useDashboardGoals());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.getMetricLabel('service_level')).toBe('Nível de Serviço (%)');
    expect(result.current.getMetricLabel('unknown')).toBe('unknown');
    expect(result.current.formatValue(80, 'service_level')).toBe('80%');
    expect(result.current.formatValue(45, 'avg_wait_time')).toBe('45s');
    expect(result.current.formatValue(125, 'avg_handle_time')).toBe('2m 5s');
  });
});
