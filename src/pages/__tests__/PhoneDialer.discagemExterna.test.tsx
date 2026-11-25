import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, useLocation } from 'react-router-dom';

const mocks = vi.hoisted(() => ({
  initiateCall: vi.fn((_channel: string, _phone?: string, _name?: string) => ({ id: 's1', status: 'ringing' })),
  updateCallStatus: vi.fn(),
  endCall: vi.fn(),
  preDialCheck: vi.fn(),
  sipStartCall: vi.fn((_phone: string) => Promise.resolve(true)),
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));

vi.mock('@/hooks/usePageTitle', () => ({ usePageTitle: vi.fn() }));
vi.mock('@/contexts/CallContext', () => ({
  useCallContext: () => ({
    activeChannel: 'sip',
    currentCall: null,
    activeCalls: [],
    activeCallId: null,
    initiateCall: mocks.initiateCall,
    updateCallStatus: mocks.updateCallStatus,
    endCall: mocks.endCall,
    toggleMute: vi.fn(),
    setActiveChannel: vi.fn(),
    currentSession: null,
    endDbSession: vi.fn(),
    addCallAnalysis: vi.fn(),
    addDbTranscript: vi.fn(),
  }),
}));
vi.mock('@/hooks/useCallHistory', () => ({ useCallHistory: () => ({ sessions: [], isLoading: false }) }));
vi.mock('@/hooks/useSipCall', () => ({
  useSipCall: () => ({
    startCall: mocks.sipStartCall,
    endCall: vi.fn(),
    toggleMute: vi.fn(),
    answerCall: vi.fn(),
    rejectCall: vi.fn(),
    incomingCall: null,
  }),
}));
vi.mock('@/hooks/useDialerFavorites', () => ({
  useDialerFavorites: () => ({ favorites: [], isFavorite: () => false, toggleFavorite: vi.fn(), moveFavorite: vi.fn(), setFavoriteTag: vi.fn() }),
}));
vi.mock('@/hooks/useDNCCompliance', () => ({ useDNCCompliance: () => ({ preDialCheck: mocks.preDialCheck }) }));
vi.mock('@/lib/incoming-call-alert', () => ({
  ensureNotificationPermission: vi.fn(() => Promise.resolve()),
  startIncomingCallAlert: vi.fn(),
}));
vi.mock('@/components/dialer/phone/PhoneFrame', () => ({
  PhoneFrame: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/components/dialer/phone/PhoneDialpad', () => ({
  PhoneDialpad: ({ value }: { value: string }) => <span data-testid="discado">{value}</span>,
}));
vi.mock('@/components/dialer/phone/PhoneCallScreen', () => ({ PhoneCallScreen: () => null }));
vi.mock('@/components/dialer/phone/PhoneQuickAccess', () => ({ PhoneQuickAccess: () => null }));
vi.mock('@/components/voice/VoiceAssistantDialog', () => ({ VoiceAssistantDialog: () => null }));
vi.mock('@/components/voice/VoiceAssistantOrb', () => ({ VoiceAssistantOrb: () => null }));

import PhoneDialer from '../PhoneDialer';
import { dialerUrl } from '@/lib/dialerLink';

const LocationProbe = () => {
  const location = useLocation();
  return <div data-testid="rota">{location.pathname + location.search}</div>;
};

const renderAt = (url: string) =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <PhoneDialer />
      <LocationProbe />
    </MemoryRouter>,
  );

describe('PhoneDialer - discagem pedida por outra tela', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.preDialCheck.mockResolvedValue({ canDial: true, reasons: [] });
  });

  it('disca sozinho quando a URL pede (auto=1)', async () => {
    renderAt(dialerUrl('+5511988887777', 'Ana', { autoDial: true }));

    await waitFor(() => expect(mocks.sipStartCall).toHaveBeenCalledTimes(1));
    expect(mocks.sipStartCall.mock.calls[0][0]).toContain('5511988887777');
    expect(mocks.initiateCall).toHaveBeenCalledTimes(1);
    expect(mocks.initiateCall.mock.calls[0][1]).toContain('5511988887777');
    expect(mocks.initiateCall.mock.calls[0][2]).toBe('Ana');
  });

  it('apenas preenche o numero quando a URL nao pede discagem', async () => {
    renderAt(dialerUrl('11988887777', 'Ana'));

    await waitFor(() => expect(screen.getByTestId('discado').textContent).toContain('11988887777'));
    expect(mocks.sipStartCall).not.toHaveBeenCalled();
    expect(mocks.initiateCall).not.toHaveBeenCalled();
  });

  it('limpa os parametros da URL depois de consumir', async () => {
    renderAt(dialerUrl('11988887777', 'Ana'));

    await waitFor(() => expect(screen.getByTestId('rota').textContent).toBe('/'));
  });
});