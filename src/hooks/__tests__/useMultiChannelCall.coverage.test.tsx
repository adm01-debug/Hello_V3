import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const makeChain = (result: { data: unknown; error: unknown }) => {
  const c: Record<string, unknown> = {};
  ['select', 'order', 'eq', 'gte', 'lte', 'lt', 'gt', 'is', 'in', 'or', 'match', 'range', 'limit', 'contains', 'maybeSingle', 'single'].forEach((m) => {
    c[m] = vi.fn(() => c);
  });
  (c as { then: (r: (v: unknown) => void) => void }).then = (resolve) => resolve(result);
  return c;
};

vi.mock('@/integrations/supabase/client', () => {
  return {
    supabase: {
      from: vi.fn(() => ({
        select: vi.fn(() => makeChain({ data: { id: 'hold-1' }, error: null })),
        insert: vi.fn().mockResolvedValue({ data: [{ id: '1' }], error: null }),
        update: vi.fn(() => makeChain({ data: null, error: null })),
        delete: vi.fn(() => makeChain({ data: null, error: null })),
      })),
      rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
      channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis() })),
      removeChannel: vi.fn(),
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null }) },
    },
  };
});

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));

import { useMultiChannelCall } from '../useMultiChannelCall';
import type { CallChannel } from '../useMultiChannelCall';

describe('useMultiChannelCall', () => {
  let nowCounter = 1_700_000_000_000;
  beforeEach(() => {
    vi.clearAllMocks();
    nowCounter = 1_700_000_000_000;
    vi.spyOn(Date, 'now').mockImplementation(() => (nowCounter += 1000));
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('initiates calls, enforces MAX_SIMULTANEOUS_CALLS, switches and ends', () => {
    const { result } = renderHook(() => useMultiChannelCall());

    let id1 = '';
    let id2 = '';
    act(() => {
      const c1 = result.current.initiateCall('webrtc', '111', 'Alice');
      id1 = c1!.id;
    });
    expect(result.current.activeCalls).toHaveLength(1);
    expect(result.current.isInCall).toBe(true);

    // ensure unique ids by advancing time via fake Date
    act(() => {
      const c2 = result.current.initiateCall('sip', '222', 'Bob');
      id2 = c2!.id;
    });
    act(() => {
      result.current.initiateCall('wavoip', '333');
    });
    expect(result.current.activeCalls.length).toBeLessThanOrEqual(3);

    // Hit the max limit -> returns null
    let overflow: unknown;
    act(() => {
      overflow = result.current.initiateCall('webrtc', '444');
    });
    expect(overflow).toBeNull();
    expect(result.current.canAddCall).toBe(false);
    expect(result.current.maxCalls).toBe(3);

    // switch to call (existing and non-existing)
    act(() => {
      result.current.switchToCall(id1);
    });
    expect(result.current.activeCallId).toBe(id1);
    act(() => {
      result.current.switchToCall('does-not-exist');
    });
    expect(result.current.activeCallId).toBe(id1);

    // getCallById
    expect(result.current.getCallById(id1)?.id).toBe(id1);
    expect(result.current.getCallById('nope')).toBeNull();

    // end a specific call
    act(() => {
      result.current.endCall(id2);
    });
    expect(result.current.activeCalls.find((c) => c.id === id2)).toBeUndefined();
    expect(result.current.callHistory.length).toBeGreaterThan(0);
  });

  it('updateCallStatus active starts timer, toggles mute/hold/recording, addTranscript', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useMultiChannelCall());

    let id = '';
    act(() => {
      id = result.current.initiateCall('webrtc', '111', 'Alice')!.id;
    });

    act(() => {
      result.current.setCallDbSession(id, 'db-1', 'AgentX');
    });
    expect(result.current.getCallById(id)?.dbSessionId).toBe('db-1');

    act(() => {
      result.current.updateCallStatus('active', id);
    });
    expect(result.current.getCallById(id)?.status).toBe('active');

    // duration timer ticks
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.getCallById(id)!.duration).toBeGreaterThanOrEqual(1);

    act(() => {
      result.current.toggleMute(id);
    });
    expect(result.current.getCallById(id)?.isMuted).toBe(true);

    act(() => {
      result.current.toggleRecording(id);
    });
    expect(result.current.getCallById(id)?.isRecording).toBe(true);

    // toggle hold on then off (exercises persistHoldEvent both branches)
    act(() => {
      result.current.toggleHold(id);
    });
    expect(result.current.getCallById(id)?.isOnHold).toBe(true);
    act(() => {
      result.current.toggleHold(id);
    });
    expect(result.current.getCallById(id)?.isOnHold).toBe(false);

    act(() => {
      result.current.addTranscript('user', 'hello', id);
    });
    act(() => {
      result.current.addTranscript('agent', 'hi');
    });
    expect(result.current.getCallById(id)!.transcripts.length).toBeGreaterThan(0);

    // updateCallStatus with no target id when none active still safe
    act(() => {
      result.current.updateCallStatus('idle', undefined);
    });
  });

  it('handles no-op branches when no active call id', () => {
    const { result } = renderHook(() => useMultiChannelCall());
    act(() => {
      result.current.toggleMute();
      result.current.toggleHold();
      result.current.toggleRecording();
      result.current.addTranscript('system', 'x');
      result.current.endCall();
      result.current.updateCallStatus('active');
    });
    expect(result.current.activeCalls).toHaveLength(0);
  });

  it('configures channels and endAllCalls', () => {
    const { result } = renderHook(() => useMultiChannelCall());
    act(() => {
      result.current.configureChannel('wavoip', { enabled: true, configured: true });
    });
    expect(result.current.channels.find((c) => c.id === 'wavoip')?.enabled).toBe(true);

    act(() => {
      result.current.initiateCall('webrtc', '111');
    });
    act(() => {
      result.current.initiateCall('sip', '222');
    });
    expect(result.current.activeCalls.length).toBeGreaterThan(0);

    act(() => {
      result.current.endAllCalls();
    });
    expect(result.current.activeCalls).toHaveLength(0);
    expect(result.current.activeCallId).toBeNull();
    expect(result.current.callHistory.length).toBeGreaterThan(0);

    act(() => {
      result.current.setActiveChannel('sip' as CallChannel);
    });
    expect(result.current.activeChannel).toBe('sip');
  });

  it('runs full conference lifecycle', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useMultiChannelCall());

    const ids: string[] = [];
    act(() => {
      ids.push(result.current.initiateCall('webrtc', '111')!.id);
    });
    act(() => {
      ids.push(result.current.initiateCall('sip', '222')!.id);
    });
    act(() => {
      ids.push(result.current.initiateCall('webrtc', '333')!.id);
    });

    // make calls active so they appear available for conference
    act(() => {
      ids.forEach((id) => result.current.updateCallStatus('active', id));
    });
    expect(result.current.getCallsAvailableForConference().length).toBeGreaterThanOrEqual(2);

    // startConference needs >= 2
    let confNull: unknown;
    act(() => {
      confNull = result.current.startConference([ids[0]]);
    });
    expect(confNull).toBeNull();

    act(() => {
      result.current.startConference([ids[0], ids[1]]);
    });
    expect(result.current.conference).not.toBeNull();

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.conference!.duration).toBeGreaterThanOrEqual(1);

    act(() => {
      result.current.addToConference(ids[2]);
    });
    expect(result.current.conference!.participantIds).toContain(ids[2]);

    act(() => {
      result.current.toggleConferenceRecording();
    });
    act(() => {
      result.current.toggleConferenceRecording();
    });

    // remove one, still >=2 participants
    act(() => {
      result.current.removeFromConference(ids[2]);
    });
    expect(result.current.conference!.participantIds).not.toContain(ids[2]);

    // remove until <2 -> auto endConference
    act(() => {
      result.current.removeFromConference(ids[1]);
    });
    expect(result.current.conference).toBeNull();
  });

  it('endConference directly and conference no-op guards', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useMultiChannelCall());

    // conference no-ops when no conference exists
    act(() => {
      result.current.addToConference('x');
      result.current.removeFromConference('x');
      result.current.endConference();
      result.current.toggleConferenceRecording();
    });
    expect(result.current.conference).toBeNull();

    const ids: string[] = [];
    act(() => {
      ids.push(result.current.initiateCall('webrtc', '111')!.id);
    });
    act(() => {
      ids.push(result.current.initiateCall('sip', '222')!.id);
    });
    act(() => {
      result.current.startConference([ids[0], ids[1]]);
    });
    act(() => {
      result.current.endConference();
    });
    expect(result.current.conference).toBeNull();
  });
});
