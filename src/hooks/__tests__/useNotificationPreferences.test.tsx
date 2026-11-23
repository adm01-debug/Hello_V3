import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

const fromMock = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: (...args: unknown[]) => fromMock(...args) },
}));

vi.mock('@/lib/logger', () => ({
  logger: { create: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }) },
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuthContext: () => ({ user: { id: 'user-1' } }),
}));

import { useNotificationPreferences, DEFAULT_PREFERENCES } from '../useNotificationPreferences';

const wrapper = ({ children }: { children: ReactNode }) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};

describe('useNotificationPreferences', () => {
  beforeEach(() => {
    fromMock.mockReset();
  });

  it('retorna DEFAULT_PREFERENCES quando nao ha registro', async () => {
    fromMock.mockReturnValue({ select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) }) }) });
    const { result } = renderHook(() => useNotificationPreferences(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.preferences).toEqual(DEFAULT_PREFERENCES);
  });

  it('carrega preferencias do banco', async () => {
    fromMock.mockReturnValue({ select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle: vi.fn().mockResolvedValue({ data: { user_id: 'user-1', notify_incoming_calls: false, notify_missed_calls: true, notify_voicemail: false, notify_sound: true, audio_echo_cancellation: true, audio_noise_suppression: true, audio_auto_gain_control: true, beta_program: false }, error: null }) }) }) });
    const { result } = renderHook(() => useNotificationPreferences(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.preferences?.notify_incoming_calls).toBe(false);
  });

  it('upsert no salvar usa onConflict user_id', async () => {
    const upsertMock = vi.fn().mockReturnValue({});
    fromMock.mockReturnValue({ upsert: upsertMock });
    const { result } = renderHook(() => useNotificationPreferences(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    result.current.savePreferences({ notify_sound: false });
    await waitFor(() => expect(upsertMock).toHaveBeenCalledWith({ user_id: 'user-1', notify_sound: false }, { onConflict: 'user_id' }));
  });
});