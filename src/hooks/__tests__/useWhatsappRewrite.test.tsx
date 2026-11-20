import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWhatsappRewrite } from '../useWhatsappRewrite';

const invoke = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { functions: { invoke: (...a: unknown[]) => invoke(...a) } },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() } }));

const ok = { rewritten: 'texto melhorado', tone: 'profissional', originalLength: 10, rewrittenLength: 20 };

describe('useWhatsappRewrite', () => {
  beforeEach(() => invoke.mockReset());

  it('invokes whatsapp-rewrite e retorna o texto reescrito', async () => {
    invoke.mockResolvedValue({ data: ok, error: null });
    const { result } = renderHook(() => useWhatsappRewrite());
    let out: string | null = null;
    await act(async () => { out = await result.current.rewrite('ola'); });
    expect(invoke).toHaveBeenCalledWith('whatsapp-rewrite', { body: { message: 'ola', tone: 'profissional', context: undefined } });
    expect(out).toBe('texto melhorado');
    expect(result.current.loading).toBe(false);
    expect(result.current.lastResult?.rewritten).toBe('texto melhorado');
  });

  it('usa tone e context informados', async () => {
    invoke.mockResolvedValue({ data: ok, error: null });
    const { result } = renderHook(() => useWhatsappRewrite());
    await act(async () => { await result.current.rewrite('msg', 'empatico', 'ctx'); });
    expect(invoke).toHaveBeenCalledWith('whatsapp-rewrite', { body: { message: 'msg', tone: 'empatico', context: 'ctx' } });
  });

  it('retorna null sem invocar quando a mensagem é vazia', async () => {
    const { result } = renderHook(() => useWhatsappRewrite());
    let out: string | null = 'x';
    await act(async () => { out = await result.current.rewrite('   '); });
    expect(invoke).not.toHaveBeenCalled();
    expect(out).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('retorna null quando o invoke devolve error', async () => {
    invoke.mockResolvedValue({ data: null, error: { message: 'boom' } });
    const { result } = renderHook(() => useWhatsappRewrite());
    let out: string | null = 'x';
    await act(async () => { out = await result.current.rewrite('ola'); });
    expect(out).toBeNull();
  });

  it('retorna null quando a resposta tem campo error', async () => {
    invoke.mockResolvedValue({ data: { error: 'sem permissao' }, error: null });
    const { result } = renderHook(() => useWhatsappRewrite());
    let out: string | null = 'x';
    await act(async () => { out = await result.current.rewrite('ola'); });
    expect(out).toBeNull();
  });

  it('retorna null quando a resposta é inválida (sem rewritten)', async () => {
    invoke.mockResolvedValue({ data: { foo: 1 }, error: null });
    const { result } = renderHook(() => useWhatsappRewrite());
    let out: string | null = 'x';
    await act(async () => { out = await result.current.rewrite('ola'); });
    expect(out).toBeNull();
  });

  it('retorna null e não lança quando o invoke lança exceção', async () => {
    invoke.mockRejectedValueOnce(new Error('network'));
    const { result } = renderHook(() => useWhatsappRewrite());
    let out: string | null = 'x';
    await act(async () => { out = await result.current.rewrite('ola'); });
    expect(out).toBeNull();
    expect(result.current.loading).toBe(false);
  });
});
