import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

const h = vi.hoisted(() => ({
  uploadMock: vi.fn(),
  insertMock: vi.fn(),
  createSignedUrlMock: vi.fn(),
  orderMock: vi.fn(),
  orMock: vi.fn(),
}));

vi.mock('@/lib/logger', () => {
  const lvl = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() };
  return { logger: { create: vi.fn(() => lvl), ...lvl } };
});

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => {
          const obj: Record<string, unknown> = { or: h.orMock };
          obj.then = (resolve: (v: unknown) => unknown) => h.orderMock().then(resolve);
          return obj;
        }),
      })),
      insert: h.insertMock,
    })),
    storage: {
      from: vi.fn(() => ({
        upload: h.uploadMock,
        createSignedUrl: h.createSignedUrlMock,
      })),
    },
  },
}));

import { useCallRecording } from '@/hooks/useCallRecording';

class FakeMediaRecorder {
  state = 'recording';
  ondataavailable: ((e: { data: { size: number } }) => void) | null = null;
  onstop: (() => void) | null = null;
  stream = { getTracks: () => [{ stop: vi.fn() }] };
  constructor(public s: unknown) {}
  start() {
    this.ondataavailable?.({ data: { size: 10 } });
    this.ondataavailable?.({ data: { size: 0 } });
  }
  stop() {
    this.state = 'inactive';
    this.onstop?.();
  }
}

beforeEach(() => {
  vi.clearAllMocks();
  h.uploadMock.mockResolvedValue({ error: null });
  h.insertMock.mockResolvedValue({ error: null });
  h.createSignedUrlMock.mockResolvedValue({ data: { signedUrl: 'http://x/sig' }, error: null });
  h.orderMock.mockResolvedValue({ data: [{ id: 'rec1' }], error: null });
  h.orMock.mockResolvedValue({ data: [{ id: 'rec2' }], error: null });

  (globalThis as Record<string, unknown>).MediaRecorder = FakeMediaRecorder as unknown;
  (globalThis as Record<string, unknown>).Blob = class {
    size = 123;
    constructor(public parts: unknown[], public opts: unknown) {}
  } as unknown;
  Object.defineProperty(globalThis.navigator, 'mediaDevices', {
    configurable: true,
    value: { getUserMedia: vi.fn().mockResolvedValue({ getTracks: () => [] }) },
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useCallRecording', () => {
  it('starts recording successfully', async () => {
    const { result } = renderHook(() => useCallRecording());
    let ok = false;
    await act(async () => { ok = await result.current.startRecording(); });
    expect(ok).toBe(true);
    expect(result.current.isRecording).toBe(true);
  });

  it('handles start recording failure', async () => {
    (globalThis.navigator.mediaDevices.getUserMedia as ReturnType<typeof vi.fn>)
      .mockRejectedValueOnce(new Error('denied'));
    const { result } = renderHook(() => useCallRecording());
    let ok = true;
    await act(async () => { ok = await result.current.startRecording(); });
    expect(ok).toBe(false);
    expect(result.current.isRecording).toBe(false);
  });

  it('stopAndSaveRecording returns null when no recorder', async () => {
    const { result } = renderHook(() => useCallRecording());
    let res: string | null = 'x';
    await act(async () => { res = await result.current.stopAndSaveRecording(); });
    expect(res).toBeNull();
  });

  it('stops and saves recording successfully', async () => {
    const { result } = renderHook(() => useCallRecording());
    await act(async () => { await result.current.startRecording(); });
    let path: string | null = null;
    await act(async () => {
      path = await result.current.stopAndSaveRecording({
        callSessionId: 'cs1', conferenceId: 'cf1', participantCount: 3,
      });
    });
    expect(path).toMatch(/^recordings\/recording_/);
    expect(h.insertMock).toHaveBeenCalled();
    await waitFor(() => expect(result.current.isSaving).toBe(false));
  });

  it('returns null when upload fails', async () => {
    h.uploadMock.mockResolvedValueOnce({ error: { message: 'upload err' } });
    const { result } = renderHook(() => useCallRecording());
    await act(async () => { await result.current.startRecording(); });
    let path: string | null = 'x';
    await act(async () => { path = await result.current.stopAndSaveRecording(); });
    expect(path).toBeNull();
  });

  it('gets recordings without and with filter', async () => {
    const { result } = renderHook(() => useCallRecording());
    let all: unknown[] = [];
    await act(async () => { all = await result.current.getRecordings(); });
    expect(all).toEqual([{ id: 'rec1' }]);

    let filtered: unknown[] = [];
    await act(async () => { filtered = await result.current.getRecordings('id-123'); });
    expect(filtered).toEqual([{ id: 'rec2' }]);
  });

  it('gets recording url (success and null)', async () => {
    const { result } = renderHook(() => useCallRecording());
    let url: string | null = null;
    await act(async () => { url = await result.current.getRecordingUrl('a/b.webm'); });
    expect(url).toBe('http://x/sig');

    h.createSignedUrlMock.mockResolvedValueOnce({ data: null, error: { message: 'x' } });
    await act(async () => { url = await result.current.getRecordingUrl('a/b.webm'); });
    expect(url).toBeNull();
  });
});
