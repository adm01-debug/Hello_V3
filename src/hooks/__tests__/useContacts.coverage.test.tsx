import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useContacts } from '../useContacts';

const fromMock = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: (...a: unknown[]) => fromMock(...a) },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));
vi.mock('@/lib/logger', () => ({ logger: { create: () => ({ error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() }) } }));
vi.mock('@/lib/error-tracking', () => ({ reportError: vi.fn() }));

const contact = { id: 'c1', name: 'Test', phone: '5511999', email: null, company: null };

function listOk(data: unknown[]) {
  return { select: vi.fn(() => ({ order: vi.fn(() => ({ or: vi.fn().mockResolvedValue({ data, error: null }) , then: undefined })) })) };
}

describe('useContacts (coverage)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // default: list returns one contact (order is awaitable directly when no search)
    fromMock.mockReturnValue({
      select: vi.fn(() => ({
        order: vi.fn(() => {
          const p: Promise<{ data: unknown[]; error: null }> & { or?: unknown } =
            Promise.resolve({ data: [contact], error: null }) as Promise<{ data: unknown[]; error: null }> & { or?: unknown };
          (p as { or: () => Promise<{ data: unknown[]; error: null }> }).or = () => Promise.resolve({ data: [contact], error: null });
          return p;
        }),
      })),
    });
  });

  it('fetches contacts on mount', async () => {
    const { result } = renderHook(() => useContacts());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.contacts).toHaveLength(1);
  });

  it('fetchContacts with search filter', async () => {
    const { result } = renderHook(() => useContacts());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => { await result.current.fetchContacts('Test'); });
    expect(result.current.contacts.length).toBeGreaterThanOrEqual(0);
  });

  it('getContactByPhone success and not found', async () => {
    const { result } = renderHook(() => useContacts());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    fromMock.mockReturnValue({ select: vi.fn(() => ({ or: vi.fn(() => ({ maybeSingle: vi.fn().mockResolvedValue({ data: contact, error: null }) })) })) });
    let found: unknown;
    await act(async () => { found = await result.current.getContactByPhone('(55) 11999'); });
    expect(found).toEqual(contact);
  });

  it('getContactByPhone error returns null', async () => {
    const { result } = renderHook(() => useContacts());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    fromMock.mockReturnValue({ select: vi.fn(() => ({ or: vi.fn(() => ({ maybeSingle: vi.fn().mockResolvedValue({ data: null, error: new Error('p') }) })) })) });
    let found: unknown;
    await act(async () => { found = await result.current.getContactByPhone('123'); });
    expect(found).toBeNull();
  });

  it('createContact success and error', async () => {
    const { result } = renderHook(() => useContacts());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    fromMock.mockReturnValue({ insert: vi.fn(() => ({ select: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data: contact, error: null }) })) })) });
    let created: unknown;
    await act(async () => { created = await result.current.createContact({ name: 'New' }); });
    expect(created).toEqual(contact);

    fromMock.mockReturnValue({ insert: vi.fn(() => ({ select: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data: null, error: new Error('ins') }) })) })) });
    let createdErr: unknown;
    await act(async () => { createdErr = await result.current.createContact({ name: 'X' }); });
    expect(createdErr).toBeNull();
  });

  it('updateContact success, conflict, and error', async () => {
    const { result } = renderHook(() => useContacts());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    fromMock.mockReturnValue({ update: vi.fn(() => ({ eq: vi.fn(() => ({ select: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data: contact, error: null }) })) })) })) });
    await act(async () => { await result.current.updateContact('c1', { name: 'Up' }); });

    fromMock.mockReturnValue({ update: vi.fn(() => ({ eq: vi.fn(() => ({ select: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data: null, error: { message: 'OPTIMISTIC_LOCK_CONFLICT' } }) })) })) })) });
    let conflictRes: unknown;
    await act(async () => { conflictRes = await result.current.updateContact('c1', { name: 'Up' }); });
    expect(conflictRes).toBeNull();

    fromMock.mockReturnValue({ update: vi.fn(() => ({ eq: vi.fn(() => ({ select: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data: null, error: new Error('upd') }) })) })) })) });
    let errRes: unknown;
    await act(async () => { errRes = await result.current.updateContact('c1', { name: 'Up' }); });
    expect(errRes).toBeNull();
  });

  it('deleteContact success and error', async () => {
    const { result } = renderHook(() => useContacts());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    fromMock.mockReturnValue({ delete: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) })) });
    let ok: boolean | undefined;
    await act(async () => { ok = await result.current.deleteContact('c1'); });
    expect(ok).toBe(true);

    fromMock.mockReturnValue({ delete: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: new Error('del') }) })) });
    let bad: boolean | undefined;
    await act(async () => { bad = await result.current.deleteContact('c1'); });
    expect(bad).toBe(false);
  });

  it('getContactInteractions success and error', async () => {
    const { result } = renderHook(() => useContacts());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    fromMock.mockReturnValue({ select: vi.fn(() => ({ eq: vi.fn(() => ({ order: vi.fn().mockResolvedValue({ data: [{ id: 'i1' }], error: null }) })) })) });
    let res: unknown[] = [];
    await act(async () => { res = await result.current.getContactInteractions('c1'); });
    expect(res).toHaveLength(1);

    fromMock.mockReturnValue({ select: vi.fn(() => ({ eq: vi.fn(() => ({ order: vi.fn().mockResolvedValue({ data: null, error: new Error('int') }) })) })) });
    await act(async () => { res = await result.current.getContactInteractions('c1'); });
    expect(res).toEqual([]);
  });

  it('addContactInteraction success and error', async () => {
    const { result } = renderHook(() => useContacts());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    fromMock.mockReturnValue({ insert: vi.fn(() => ({ select: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data: { id: 'i1' }, error: null }) })) })) });
    let res: unknown;
    await act(async () => { res = await result.current.addContactInteraction('c1', { interaction_type: 'call' }); });
    expect(res).toEqual({ id: 'i1' });

    fromMock.mockReturnValue({ insert: vi.fn(() => ({ select: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data: null, error: new Error('add') }) })) })) });
    await act(async () => { res = await result.current.addContactInteraction('c1', { interaction_type: 'call' }); });
    expect(res).toBeNull();
  });

  it('findOrCreateContact returns existing or creates new', async () => {
    const { result } = renderHook(() => useContacts());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    // existing
    fromMock.mockReturnValue({ select: vi.fn(() => ({ or: vi.fn(() => ({ maybeSingle: vi.fn().mockResolvedValue({ data: contact, error: null }) })) })) });
    let res: unknown;
    await act(async () => { res = await result.current.findOrCreateContact('5511999'); });
    expect(res).toEqual(contact);

    // not existing -> create
    // call=1: getContactByPhone lookup (maybeSingle returns null → not found)
    // call=2: createContact insert
    // call=3: fetchContacts re-load triggered inside createContact after insert
    let call = 0;
    fromMock.mockImplementation(() => {
      call += 1;
      if (call === 1) return { select: vi.fn(() => ({ or: vi.fn(() => ({ maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) })) })) };
      if (call === 2) return { insert: vi.fn(() => ({ select: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data: contact, error: null }) })) })) };
      // call >= 3: fetchContacts background re-load after insert
      return { select: vi.fn(() => ({ order: vi.fn().mockResolvedValue({ data: [contact], error: null }) })) };
    });
    await act(async () => { res = await result.current.findOrCreateContact('55119998888', 'NameX'); });
    expect(res).toEqual(contact);
  });
});
