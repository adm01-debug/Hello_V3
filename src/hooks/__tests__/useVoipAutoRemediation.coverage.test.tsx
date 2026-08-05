import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useVoipAutoRemediation } from '../useVoipAutoRemediation';

interface ToastAction { label: string; onClick: () => void | Promise<void> }
interface ToastOpts { description?: string; duration?: number; action?: ToastAction; cancel?: ToastAction }

const toastError = vi.fn();
const toastSuccess = vi.fn();
const toastInfo = vi.fn();

vi.mock('sonner', () => ({
  toast: {
    error: (...a: unknown[]) => toastError(...a),
    success: (...a: unknown[]) => toastSuccess(...a),
    info: (...a: unknown[]) => toastInfo(...a),
    warning: vi.fn(),
  },
}));
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(), warn: vi.fn(), info: vi.fn(),
    create: () => ({ error: vi.fn(), warn: vi.fn(), info: vi.fn() }),
  },
}));

describe('useVoipAutoRemediation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(Date, 'now').mockReturnValue(1_000_000);
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sugere remediação e dispara toast de erro', () => {
    const reconnect = vi.fn().mockResolvedValue(undefined);
    const endCall = vi.fn();
    const { result } = renderHook(() => useVoipAutoRemediation({ reconnect, endCall }));
    act(() => {
      result.current.suggest({ mos: 1.23, slope: -0.5 });
    });
    expect(toastError).toHaveBeenCalledWith('Qualidade crítica detectada', expect.objectContaining({
      description: expect.stringContaining('MOS 1.23'),
      duration: 12_000,
    }));
  });

  it('throttle impede segunda sugestão dentro de 30s', () => {
    const reconnect = vi.fn();
    const endCall = vi.fn();
    const { result } = renderHook(() => useVoipAutoRemediation({ reconnect, endCall }));
    act(() => { result.current.suggest({ mos: 2, slope: -1 }); });
    act(() => { result.current.suggest({ mos: 2, slope: -1 }); });
    expect(toastError).toHaveBeenCalledTimes(1);
  });

  it('ação reconectar chama reconnect e toast de sucesso', async () => {
    const reconnect = vi.fn().mockResolvedValue(undefined);
    const endCall = vi.fn();
    const { result } = renderHook(() => useVoipAutoRemediation({ reconnect, endCall }));
    act(() => { result.current.suggest({ mos: 1.5, slope: -0.4 }); });
    const opts = toastError.mock.calls[0][1] as ToastOpts;
    await act(async () => {
      await opts.action?.onClick();
    });
    expect(reconnect).toHaveBeenCalled();
    expect(toastSuccess).toHaveBeenCalledWith('Reconexão iniciada');
  });

  it('ação reconectar trata falha', async () => {
    const reconnect = vi.fn().mockRejectedValue(new Error('boom'));
    const endCall = vi.fn();
    const { result } = renderHook(() => useVoipAutoRemediation({ reconnect, endCall }));
    act(() => { result.current.suggest({ mos: 1.1, slope: -0.9 }); });
    const opts = toastError.mock.calls[0][1] as ToastOpts;
    await act(async () => {
      await opts.action?.onClick();
    });
    await waitFor(() => expect(toastError).toHaveBeenCalledWith('Não foi possível reconectar'));
  });

  it('ação cancelar chama endCall e toast info', () => {
    const reconnect = vi.fn();
    const endCall = vi.fn();
    const { result } = renderHook(() => useVoipAutoRemediation({ reconnect, endCall }));
    act(() => { result.current.suggest({ mos: 1.0, slope: -1.0 }); });
    const opts = toastError.mock.calls[0][1] as ToastOpts;
    act(() => { opts.cancel?.onClick(); });
    expect(endCall).toHaveBeenCalled();
    expect(toastInfo).toHaveBeenCalledWith('Chamada encerrada');
  });
});
