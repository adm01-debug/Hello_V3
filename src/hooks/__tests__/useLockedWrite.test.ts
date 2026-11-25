import { describe, it, expect, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useLockedWrite } from '../useLockedWrite';

const deferred = () => {
  let resolve!: () => void;
  const promise = new Promise<void>((r) => { resolve = r; });
  return { promise, resolve };
};

describe('useLockedWrite', () => {
  it('ignora o segundo clique enquanto a gravacao da mesma linha esta em voo', async () => {
    const { result } = renderHook(() => useLockedWrite());
    const gate = deferred();
    const action = vi.fn(() => gate.promise);

    let first: Promise<boolean>;
    act(() => {
      first = result.current.runLocked('call-1', action);
      result.current.runLocked('call-1', action);
    });

    expect(action).toHaveBeenCalledTimes(1);
    expect(result.current.isLocked('call-1')).toBe(true);

    gate.resolve();
    await act(async () => { await first; });

    expect(result.current.isLocked('call-1')).toBe(false);
  });

  it('libera a trava mesmo quando a gravacao falha', async () => {
    const { result } = renderHook(() => useLockedWrite());
    const action = vi.fn(() => Promise.reject(new Error('falhou')));

    await act(async () => {
      await expect(result.current.runLocked('call-1', action)).rejects.toThrow('falhou');
    });

    expect(result.current.isLocked('call-1')).toBe(false);
    const retry = vi.fn(() => Promise.resolve());
    await act(async () => {
      await result.current.runLocked('call-1', retry);
    });
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('nao bloqueia linhas diferentes', async () => {
    const { result } = renderHook(() => useLockedWrite());
    const gate = deferred();
    const action = vi.fn(() => gate.promise);

    let first: Promise<boolean>;
    act(() => {
      first = result.current.runLocked('call-1', action);
      result.current.runLocked('call-2', action);
    });

    expect(action).toHaveBeenCalledTimes(2);
    expect(result.current.isLocked('call-1')).toBe(true);
    expect(result.current.isLocked('call-2')).toBe(true);

    gate.resolve();
    await act(async () => { await first; });
  });
});