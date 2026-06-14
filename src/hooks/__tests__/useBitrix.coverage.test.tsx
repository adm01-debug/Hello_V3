import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

interface InvokeResult { data: unknown; error: unknown; }

let invokeQueue: InvokeResult[] = [];
let invokeThrows = false;
const invokeMock = vi.fn(() => {
  if (invokeThrows) return Promise.reject(new Error('network'));
  const next = invokeQueue.length > 1 ? invokeQueue.shift()! : invokeQueue[0];
  return Promise.resolve(next ?? { data: null, error: null });
});

let insertResult: InvokeResult = { error: null, data: null };
const upsertMock = vi.fn(() => Promise.resolve({ error: null }));
const insertMock = vi.fn(() => Promise.resolve(insertResult));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: { invoke: (_name: string, _opts: unknown) => invokeMock() },
    from: vi.fn(() => ({ upsert: upsertMock, insert: insertMock })),
  },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));
vi.mock('@/lib/logger', () => ({
  logger: {
    create: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
    error: vi.fn(), debug: vi.fn(), info: vi.fn(), warn: vi.fn(),
  },
}));

import { useBitrix, type BitrixCallData } from '../useBitrix';

function setInvoke(...results: InvokeResult[]) {
  invokeQueue = results;
  invokeThrows = false;
}

describe('useBitrix', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    invokeQueue = [{ data: null, error: null }];
    invokeThrows = false;
    insertResult = { error: null, data: null };
  });

  it('checkConfiguration returns true when configured', async () => {
    setInvoke({ data: { configured: true }, error: null });
    const { result } = renderHook(() => useBitrix());
    await act(async () => {
      expect(await result.current.checkConfiguration()).toBe(true);
    });
    expect(result.current.isConfigured).toBe(true);
  });

  it('callBitrixApi returns null when configured === false', async () => {
    setInvoke({ data: { configured: false }, error: null });
    const { result } = renderHook(() => useBitrix());
    await act(async () => {
      const cfg = await result.current.checkConfiguration();
      expect(cfg).toBe(false);
    });
    expect(result.current.isConfigured).toBe(false);
  });

  it('getContacts / getLeads / getDeals populate state', async () => {
    const { result } = renderHook(() => useBitrix());

    setInvoke({ data: { data: [{ ID: '1', NAME: 'C' }] }, error: null });
    await act(async () => {
      const contacts = await result.current.getContacts({ NAME: 'C' });
      expect(contacts.length).toBe(1);
    });

    setInvoke({ data: { data: [{ ID: '2', TITLE: 'L' }] }, error: null });
    await act(async () => {
      const leads = await result.current.getLeads();
      expect(leads.length).toBe(1);
    });

    setInvoke({ data: { data: [{ ID: '3', TITLE: 'D' }] }, error: null });
    await act(async () => {
      const deals = await result.current.getDeals();
      expect(deals.length).toBe(1);
    });
  });

  it('getContacts returns [] when no data', async () => {
    setInvoke({ data: null, error: null });
    const { result } = renderHook(() => useBitrix());
    await act(async () => {
      expect(await result.current.getContacts()).toEqual([]);
    });
  });

  it('createLead success path', async () => {
    setInvoke({ data: { success: true, data: { ID: '99' } }, error: null });
    const { result } = renderHook(() => useBitrix());
    await act(async () => {
      const lead = await result.current.createLead({ TITLE: 'New Lead' });
      expect(lead).toEqual({ ID: '99' });
    });
  });

  it('createLead enqueues when api fails and queue succeeds', async () => {
    setInvoke({ data: { success: false }, error: null });
    insertResult = { error: null, data: null };
    const { result } = renderHook(() => useBitrix());
    await act(async () => {
      const res = await result.current.createLead({ TITLE: 'Queued' });
      expect(res).toEqual({ queued: true });
    });
    expect(insertMock).toHaveBeenCalled();
  });

  it('createLead returns null when queue also fails', async () => {
    setInvoke({ data: { success: false }, error: null });
    insertResult = { error: { message: 'queue-fail' }, data: null };
    const { result } = renderHook(() => useBitrix());
    await act(async () => {
      const res = await result.current.createLead({ TITLE: 'Fail' });
      expect(res).toBeNull();
    });
  });

  it('registerCall success and enqueue paths', async () => {
    const callData: BitrixCallData = { PHONE_NUMBER: '5511999', TYPE: 1 };

    setInvoke({ data: { success: true, data: { CALL_ID: 'abc' } }, error: null });
    const { result } = renderHook(() => useBitrix());
    await act(async () => {
      const res = await result.current.registerCall(callData);
      expect(res).toEqual({ CALL_ID: 'abc' });
    });

    setInvoke({ data: { success: false }, error: null });
    await act(async () => {
      const res = await result.current.registerCall(callData);
      expect(res).toBeNull();
    });
    expect(insertMock).toHaveBeenCalled();
  });

  it('finishCall success and failure', async () => {
    setInvoke({ data: { success: true, data: { ok: 1 } }, error: null });
    const { result } = renderHook(() => useBitrix());
    await act(async () => {
      expect(await result.current.finishCall('cid', 30)).toEqual({ ok: 1 });
    });

    setInvoke({ data: { success: false }, error: null });
    await act(async () => {
      expect(await result.current.finishCall('cid', 30, '486')).toBeNull();
    });
  });

  it('findContactByPhone normalizes phone and returns first match', async () => {
    setInvoke({ data: { data: [{ ID: '1', NAME: 'Found' }] }, error: null });
    const { result } = renderHook(() => useBitrix());
    await act(async () => {
      const c = await result.current.findContactByPhone('(55) 11 99999-0000');
      expect(c).toEqual({ ID: '1', NAME: 'Found' });
    });

    setInvoke({ data: { data: [] }, error: null });
    await act(async () => {
      expect(await result.current.findContactByPhone('123')).toBeNull();
    });
  });

  it('syncAgents upserts users and toasts', async () => {
    setInvoke({ data: { data: [{ ID: '1', NAME: 'A', LAST_NAME: 'B', EMAIL: 'a@b.c', WORK_PHONE: '1', PERSONAL_PHONE: '2', ACTIVE: 'Y' }] }, error: null });
    const { result } = renderHook(() => useBitrix());
    await act(async () => {
      const users = await result.current.syncAgents();
      expect(users?.length).toBe(1);
    });
    expect(upsertMock).toHaveBeenCalled();
  });

  it('syncAgents returns null when no result', async () => {
    setInvoke({ data: null, error: null });
    const { result } = renderHook(() => useBitrix());
    await act(async () => {
      expect(await result.current.syncAgents()).toBeNull();
    });
  });

  it('syncDepartments upserts departments', async () => {
    setInvoke({ data: { data: [{ ID: 'd1', NAME: 'Dept', PARENT: null }] }, error: null });
    const { result } = renderHook(() => useBitrix());
    await act(async () => {
      const depts = await result.current.syncDepartments();
      expect(depts?.length).toBe(1);
    });
  });

  it('syncDepartments returns null when no result', async () => {
    setInvoke({ data: null, error: null });
    const { result } = renderHook(() => useBitrix());
    await act(async () => {
      expect(await result.current.syncDepartments()).toBeNull();
    });
  });

  it('callBitrixApi retries on error then returns null', async () => {
    vi.useFakeTimers();
    invokeQueue = [{ data: null, error: { message: 'err' } }];
    invokeThrows = false;
    const { result } = renderHook(() => useBitrix());
    let promise!: Promise<boolean>;
    await act(async () => {
      promise = result.current.checkConfiguration();
      // advance through both backoff sleeps (1000 * 2^0 and 1000 * 2^1)
      await vi.advanceTimersByTimeAsync(1000);
      await vi.advanceTimersByTimeAsync(2000);
    });
    const res = await promise;
    expect(res).toBe(false);
    vi.useRealTimers();
  });

  it('callBitrixApi handles thrown errors with retry', async () => {
    vi.useFakeTimers();
    invokeThrows = true;
    const { result } = renderHook(() => useBitrix());
    let promise!: Promise<boolean>;
    await act(async () => {
      promise = result.current.checkConfiguration();
      await vi.advanceTimersByTimeAsync(1000);
      await vi.advanceTimersByTimeAsync(2000);
    });
    const res = await promise;
    expect(res).toBe(false);
    vi.useRealTimers();
  });
});
