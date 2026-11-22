import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useAvatar } from '../useAvatar';

const { storage, uploadFn, removeFn, signedUrlFn, updateFn, updateEqFn, toast } = vi.hoisted(() => {
  const uploadFn = vi.fn();
  const removeFn = vi.fn();
  const signedUrlFn = vi.fn();
  const updateEqFn = vi.fn();
  const updateFn = vi.fn(() => ({ eq: updateEqFn }));
  return {
    uploadFn,
    removeFn,
    signedUrlFn,
    updateFn,
    updateEqFn,
    storage: { from: vi.fn() },
    toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
  };
});

let currentUser: { id: string } | null = { id: 'u1' };

vi.mock('@/contexts/AuthContext', () => ({
  useAuthContext: () => ({ user: currentUser }),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    storage: { from: storage.from },
    from: vi.fn(() => ({ update: updateFn })),
  },
}));

vi.mock('sonner', () => ({ toast }));
vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

function file(name = 'photo.png', type = 'image/png') {
  return new File([new Uint8Array(1)], name, { type });
}

describe('useAvatar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentUser = { id: 'u1' };
    storage.from.mockReturnValue({ upload: uploadFn, remove: removeFn, createSignedUrl: signedUrlFn });
    uploadFn.mockResolvedValue({ error: null });
    removeFn.mockResolvedValue({ error: null });
    signedUrlFn.mockResolvedValue({ data: { signedUrl: 'https://signed/x.png' }, error: null });
    updateEqFn.mockResolvedValue({ error: null });
  });

  it('does not request a signed url when there is no path', () => {
    const { result } = renderHook(() => useAvatar(null));
    expect(result.current.signedUrl).toBeNull();
    expect(signedUrlFn).not.toHaveBeenCalled();
  });

  it('resolves a signed url for an existing avatar', async () => {
    const { result } = renderHook(() => useAvatar('u1/1.png'));
    await waitFor(() => expect(result.current.signedUrl).toBe('https://signed/x.png'));
    expect(signedUrlFn).toHaveBeenCalledWith('u1/1.png', 3600);
  });

  it('clears the url when signing fails', async () => {
    signedUrlFn.mockResolvedValue({ data: null, error: new Error('nope') });
    const { result } = renderHook(() => useAvatar('u1/1.png'));
    await waitFor(() => expect(signedUrlFn).toHaveBeenCalled());
    expect(result.current.signedUrl).toBeNull();
  });

  it('rejects without a session', async () => {
    currentUser = null;
    const { result } = renderHook(() => useAvatar(null));
    let out: unknown;
    await act(async () => { out = await result.current.uploadAvatar(file()); });
    expect(out).toBeNull();
    expect(toast.error).toHaveBeenCalledWith('Sessão expirada', expect.anything());
    expect(uploadFn).not.toHaveBeenCalled();
  });

  it('rejects an unsupported mime type', async () => {
    const { result } = renderHook(() => useAvatar(null));
    let out: unknown;
    await act(async () => { out = await result.current.uploadAvatar(file('doc.pdf', 'application/pdf')); });
    expect(out).toBeNull();
    expect(toast.error).toHaveBeenCalledWith('Formato não suportado', expect.anything());
    expect(uploadFn).not.toHaveBeenCalled();
  });

  it('rejects a file larger than 2 MB', async () => {
    const { result } = renderHook(() => useAvatar(null));
    const big = file();
    Object.defineProperty(big, 'size', { value: 3 * 1024 * 1024 });
    let out: unknown;
    await act(async () => { out = await result.current.uploadAvatar(big); });
    expect(out).toBeNull();
    expect(toast.error).toHaveBeenCalledWith('Arquivo muito grande', expect.anything());
    expect(uploadFn).not.toHaveBeenCalled();
  });

  it('uploads, persists the column and keeps the new path', async () => {
    const { result } = renderHook(() => useAvatar(null));
    let out: unknown;
    await act(async () => { out = await result.current.uploadAvatar(file('foto.JPG', 'image/jpeg')); });
    expect(String(out)).toMatch(/^u1\/\d+\.jpg$/);
    expect(uploadFn).toHaveBeenCalledWith(String(out), expect.any(File), {
      cacheControl: '3600', upsert: false, contentType: 'image/jpeg',
    });
    expect(updateFn).toHaveBeenCalledWith({ avatar_url: out });
    expect(updateEqFn).toHaveBeenCalledWith('id', 'u1');
    expect(removeFn).not.toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith('Foto atualizada');
    expect(result.current.uploading).toBe(false);
  });

  it('removes the previous avatar after the new one is persisted', async () => {
    const { result } = renderHook(() => useAvatar('u1/old.png'));
    await act(async () => { await result.current.uploadAvatar(file()); });
    expect(removeFn).toHaveBeenCalledTimes(1);
    expect(removeFn).toHaveBeenCalledWith(['u1/old.png']);
  });

  it('rolls back the uploaded object when the column update fails', async () => {
    updateEqFn.mockResolvedValue({ error: { message: 'column does not exist' } });
    const { result } = renderHook(() => useAvatar(null));
    let out: unknown;
    await act(async () => { out = await result.current.uploadAvatar(file()); });
    expect(out).toBeNull();
    expect(removeFn).toHaveBeenCalledWith([expect.stringMatching(/^u1\/\d+\.png$/)]);
    expect(toast.error).toHaveBeenCalled();
  });

  it('surfaces upload errors', async () => {
    uploadFn.mockResolvedValue({ error: { message: 'bucket missing' } });
    const { result } = renderHook(() => useAvatar(null));
    let out: unknown;
    await act(async () => { out = await result.current.uploadAvatar(file()); });
    expect(out).toBeNull();
    expect(updateFn).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith('Erro ao enviar a foto', { description: 'bucket missing' });
  });

  it('removeAvatar is a no-op without user or path', async () => {
    const { result } = renderHook(() => useAvatar(null));
    let out: unknown;
    await act(async () => { out = await result.current.removeAvatar(); });
    expect(out).toBe(false);
    expect(removeFn).not.toHaveBeenCalled();
  });

  it('removes the avatar and clears the column', async () => {
    const { result } = renderHook(() => useAvatar('u1/1.png'));
    let out: unknown;
    await act(async () => { out = await result.current.removeAvatar(); });
    expect(out).toBe(true);
    expect(updateFn).toHaveBeenCalledWith({ avatar_url: null });
    expect(removeFn).toHaveBeenCalledWith(['u1/1.png']);
    expect(toast.success).toHaveBeenCalledWith('Foto removida');
  });

  it('keeps the object when clearing the column fails', async () => {
    updateEqFn.mockResolvedValue({ error: { message: 'denied' } });
    const { result } = renderHook(() => useAvatar('u1/1.png'));
    let out: unknown;
    await act(async () => { out = await result.current.removeAvatar(); });
    expect(out).toBe(false);
    expect(removeFn).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith('Erro ao remover a foto');
  });

  it('falls back to png extension when the filename has none', async () => {
    const { result } = renderHook(() => useAvatar(null));
    let out: unknown;
    await act(async () => { out = await result.current.uploadAvatar(file('')); });
    expect(String(out)).toMatch(/^u1\/\d+\.png$/);
  });
});