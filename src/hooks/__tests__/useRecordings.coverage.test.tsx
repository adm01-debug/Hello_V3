import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

const { invokeMock, createSignedUrlMock, removeMock, orderMock, deleteEqMock } = vi.hoisted(() => ({
  invokeMock: vi.fn(),
  createSignedUrlMock: vi.fn(),
  removeMock: vi.fn(),
  orderMock: vi.fn(),
  deleteEqMock: vi.fn(),
}));

vi.mock('@/lib/logger', () => {
  const lvl = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() };
  return { logger: { create: vi.fn(() => lvl), ...lvl } };
});

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
}));

vi.mock('@/hooks/useAuditLog', () => ({
  useAuditLog: () => ({
    logCallRecordingDownload: vi.fn(),
    logCallTranscriptionAccess: vi.fn(),
  }),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({ order: orderMock })),
      delete: vi.fn(() => ({ eq: deleteEqMock })),
    })),
    storage: {
      from: vi.fn(() => ({
        createSignedUrl: createSignedUrlMock,
        remove: removeMock,
      })),
    },
    functions: { invoke: invokeMock },
  },
}));

import { useRecordings } from '@/hooks/useRecordings';
import { toast } from 'sonner';

const rows = [
  { id: 'r1', file_path: 'a/b.webm', conference_id: 'CONF1', call_session_id: 'cs1', duration_seconds: 60, file_size_bytes: 100, participant_count: 2, recorded_at: '2024-01-01T10:00:00Z', created_at: '2024-01-01T10:00:00Z' },
  { id: 'r2', file_path: 'a/c.webm', conference_id: null, call_session_id: null, duration_seconds: null, file_size_bytes: null, participant_count: null, recorded_at: '2024-02-02T11:00:00Z', created_at: '2024-02-02T11:00:00Z' },
];

beforeEach(() => {
  orderMock.mockResolvedValue({ data: rows, error: null });
  createSignedUrlMock.mockResolvedValue({ data: { signedUrl: 'http://x/file' }, error: null });
  removeMock.mockResolvedValue({ error: null });
  deleteEqMock.mockResolvedValue({ error: null });
  invokeMock.mockResolvedValue({ data: { success: true, text: 'hello', words: [] }, error: null });
  (globalThis as Record<string, unknown>).Audio = class {
    volume = 1; currentTime = 0; duration = 0;
    onloadedmetadata: (() => void) | null = null;
    ontimeupdate: (() => void) | null = null;
    onended: (() => void) | null = null;
    play = vi.fn(); pause = vi.fn();
    constructor(public src: string) {}
  };
  (globalThis as Record<string, unknown>).confirm = vi.fn(() => true);
});

describe('useRecordings', () => {
  it('fetches recordings and filters', async () => {
    const { result } = renderHook(() => useRecordings());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.allRecordingsCount).toBe(2);

    act(() => result.current.setSearchTerm('conf1'));
    await waitFor(() => expect(result.current.recordings.length).toBe(1));

    act(() => result.current.setSearchTerm('01/01/2024'));
    await waitFor(() => expect(result.current.recordings.length).toBeGreaterThanOrEqual(1));
  });

  it('handles fetch error', async () => {
    orderMock.mockResolvedValueOnce({ data: null, error: { message: 'boom' } });
    const { result } = renderHook(() => useRecordings());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(toast.error).toHaveBeenCalledWith('Erro ao carregar gravações');
  });

  it('plays, toggles pause/play, seeks, skips', async () => {
    const { result } = renderHook(() => useRecordings());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => { await result.current.handlePlay(rows[0]); });
    await waitFor(() => expect(result.current.playingId).toBe('r1'));
    expect(result.current.isPlaying).toBe(true);

    // toggle pause
    await act(async () => { await result.current.handlePlay(rows[0]); });
    expect(result.current.isPlaying).toBe(false);
    // toggle play again
    await act(async () => { await result.current.handlePlay(rows[0]); });
    expect(result.current.isPlaying).toBe(true);

    // play a different one (replaces audio)
    await act(async () => { await result.current.handlePlay(rows[1]); });
    await waitFor(() => expect(result.current.playingId).toBe('r2'));

    act(() => result.current.handleSeek([5]));
    act(() => result.current.handleSkip(10));
    act(() => result.current.handleSkip(-100));
    act(() => result.current.setVolume(0.5));
    act(() => result.current.setIsMuted(true));
  });

  it('handlePlay error when no signed url', async () => {
    createSignedUrlMock.mockResolvedValueOnce({ data: null, error: { message: 'x' } });
    const { result } = renderHook(() => useRecordings());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { await result.current.handlePlay(rows[0]); });
    expect(toast.error).toHaveBeenCalledWith('Erro ao carregar áudio');
  });

  it('downloads recording (success and error)', async () => {
    const { result } = renderHook(() => useRecordings());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { await result.current.handleDownload(rows[0]); });
    expect(toast.success).toHaveBeenCalledWith('Download iniciado');

    createSignedUrlMock.mockResolvedValueOnce({ data: null, error: { message: 'x' } });
    await act(async () => { await result.current.handleDownload(rows[0]); });
    expect(toast.error).toHaveBeenCalledWith('Erro ao baixar gravação');
  });

  it('deletes recording (success, cancel and error)', async () => {
    const { result } = renderHook(() => useRecordings());
    await waitFor(() => expect(result.current.loading).toBe(false));

    // play then delete the playing one
    await act(async () => { await result.current.handlePlay(rows[0]); });
    await act(async () => { await result.current.handleDelete(rows[0]); });
    expect(toast.success).toHaveBeenCalledWith('Gravação excluída');

    // cancel
    (globalThis as Record<string, unknown>).confirm = vi.fn(() => false);
    await act(async () => { await result.current.handleDelete(rows[1]); });

    // error path
    (globalThis as Record<string, unknown>).confirm = vi.fn(() => true);
    removeMock.mockResolvedValueOnce({ error: { message: 'storage err' } });
    await act(async () => { await result.current.handleDelete(rows[1]); });
    expect(toast.error).toHaveBeenCalledWith('Erro ao excluir gravação');
  });

  it('transcribes with words building segments + sentiment', async () => {
    invokeMock.mockResolvedValueOnce({
      data: {
        success: true,
        text: 'full text',
        words: [
          { speaker: 'A', text: 'hi', start: 0, end: 1 },
          { speaker: 'A', text: 'there', start: 1, end: 2 },
          { speaker: 'B', text: 'hello', start: 2, end: 3 },
        ],
      },
      error: null,
    });
    const { result } = renderHook(() => useRecordings());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => { await result.current.handleTranscribe(rows[0]); });
    await waitFor(() => expect(result.current.transcriptionDialog).toBe(true));
    expect(result.current.currentTranscription?.segments.length).toBeGreaterThan(0);

    // analyze sentiment success
    invokeMock.mockResolvedValueOnce({
      data: {
        success: true, overall_sentiment: 'positive', sentiment_score: 0.8,
        emotions: {}, key_moments: [], summary: 's', customer_satisfaction_estimate: 90,
      },
      error: null,
    });
    await act(async () => { await result.current.handleAnalyzeSentiment(); });
    await waitFor(() => expect(result.current.currentTranscription?.sentiment).toBeTruthy());
  });

  it('transcribe error and unsuccessful response', async () => {
    invokeMock.mockResolvedValueOnce({ data: null, error: { message: 'fail' } });
    const { result } = renderHook(() => useRecordings());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { await result.current.handleTranscribe(rows[0]); });
    expect(toast.error).toHaveBeenCalledWith('Erro ao transcrever gravação');

    invokeMock.mockResolvedValueOnce({ data: { success: false, error: 'nope' }, error: null });
    await act(async () => { await result.current.handleTranscribe(rows[0]); });

    // analyze sentiment with no transcription returns early
    await act(async () => { await result.current.handleAnalyzeSentiment(); });

    // set a transcription then trigger sentiment error
    invokeMock.mockResolvedValueOnce({
      data: { success: true, text: 't', words: [{ speaker: 'A', text: 'x', start: 0, end: 1 }] },
      error: null,
    });
    await act(async () => { await result.current.handleTranscribe(rows[0]); });
    invokeMock.mockResolvedValueOnce({ data: null, error: { message: 'err' } });
    await act(async () => { await result.current.handleAnalyzeSentiment(); });
    expect(toast.error).toHaveBeenCalledWith('Erro ao analisar sentimento');
  });
});
