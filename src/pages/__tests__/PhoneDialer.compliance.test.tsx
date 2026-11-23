import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

const initiateCall = vi.fn(() => ({ id: 's1', status: 'ringing' }));
const updateCallStatus = vi.fn();
const endCall = vi.fn();
const preDialCheck = vi.fn();

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));

vi.mock('@/hooks/usePageTitle', () => ({ usePageTitle: vi.fn() }));
vi.mock('@/hooks/useMultiChannelCall', () => ({
  useMultiChannelCall: () => ({
    activeChannel: 'sip',
    currentCall: null,
    activeCalls: [],
    initiateCall,
    updateCallStatus,
    endCall,
    toggleMute: vi.fn(),
    setActiveChannel: vi.fn(),
  }),
}));
vi.mock('@/contexts/CallContext', () => ({
  useCallContext: () => ({
    activeChannel: 'sip',
    currentCall: null,
    activeCalls: [],
    activeCallId: null,
    initiateCall,
    updateCallStatus,
    endCall,
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
  useSipCall: () => ({ startCall: vi.fn(() => Promise.resolve(true)), endCall: vi.fn(), toggleMute: vi.fn(), answerCall: vi.fn(), rejectCall: vi.fn(), incomingCall: null }),
}));
vi.mock('@/hooks/useDialerFavorites', () => ({
  useDialerFavorites: () => ({ favorites: [], isFavorite: () => false, toggleFavorite: vi.fn(), moveFavorite: vi.fn(), setFavoriteTag: vi.fn() }),
}));
vi.mock('@/hooks/useDNCCompliance', () => ({ useDNCCompliance: () => ({ preDialCheck }) }));
vi.mock('@/lib/incoming-call-alert', () => ({
  ensureNotificationPermission: vi.fn(() => Promise.resolve()),
  startIncomingCallAlert: vi.fn(),
}));
vi.mock('@/components/dialer/phone/PhoneFrame', () => ({
  PhoneFrame: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/components/dialer/phone/PhoneDialpad', () => ({
  PhoneDialpad: ({ value, onDigit, onCall }: { value: string; onDigit: (d: string) => void; onCall: () => void }) => (
    <div>
      <span data-testid="dialed">{value}</span>
      <button type="button" onClick={() => onDigit('5')}>tecla-5</button>
      <button type="button" onClick={onCall}>ligar</button>
    </div>
  ),
}));
vi.mock('@/components/dialer/phone/PhoneCallScreen', () => ({ PhoneCallScreen: () => null }));
vi.mock('@/components/dialer/phone/PhoneQuickAccess', () => ({ PhoneQuickAccess: () => null }));
vi.mock('@/components/voice/VoiceAssistantDialog', () => ({ VoiceAssistantDialog: () => null }));
vi.mock('@/components/voice/VoiceAssistantOrb', () => ({ VoiceAssistantOrb: () => null }));

import PhoneDialer from '../PhoneDialer';

const renderPage = () =>
  render(<MemoryRouter><PhoneDialer /></MemoryRouter>);

describe('PhoneDialer compliance guard', () => {
  beforeEach(() => vi.clearAllMocks());

  it('bloqueia a chamada quando o pre-dial check reprova', async () => {
    preDialCheck.mockResolvedValue({ canDial: false, reasons: ['Número está na lista DNC (Do Not Call)'] });
    renderPage();
    const tecla = screen.getByText('tecla-5');
    fireEvent.click(tecla);
    fireEvent.click(tecla);
    fireEvent.click(tecla);
    fireEvent.click(screen.getByText('ligar'));
    await waitFor(() => expect(preDialCheck).toHaveBeenCalled());
    expect(initiateCall).not.toHaveBeenCalled();
  });

  it('inicia a chamada quando o pre-dial check aprova', async () => {
    preDialCheck.mockResolvedValue({ canDial: true, reasons: [] });
    renderPage();
    const tecla = screen.getByText('tecla-5');
    fireEvent.click(tecla);
    fireEvent.click(tecla);
    fireEvent.click(tecla);
    fireEvent.click(screen.getByText('ligar'));
    await waitFor(() => expect(initiateCall).toHaveBeenCalled());
  });
});
