import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { UnifiedSoftphone } from '../UnifiedSoftphone';

const sipState = {
  status: 'disconnected' as string,
  isRegistered: false,
  isConfigured: true,
  error: null as string | null,
  connect: vi.fn(),
  setDbSessionId: vi.fn(),
  toggleMute: vi.fn(),
};

const callContext = {
  activeChannel: 'sip' as 'sip' | 'webrtc' | 'wavoip',
  currentCall: null as null | { channel: string; isMuted?: boolean },
  activeCalls: [] as unknown[],
  activeCallId: null,
  callHistory: [],
  channels: [{ id: 'sip', name: 'SIP', description: 'Linha SIP' }],
  conference: { calls: [] },
  isInCall: false,
  canAddCall: true,
  setActiveChannel: vi.fn(),
  initiateCall: vi.fn(),
  switchToCall: vi.fn(),
  updateCallStatus: vi.fn(),
  endCall: vi.fn(),
  toggleMute: vi.fn(),
  toggleHold: vi.fn(),
  toggleRecording: vi.fn(),
  addTranscript: vi.fn(),
  configureChannel: vi.fn(),
  startConference: vi.fn(),
  addToConference: vi.fn(),
  removeFromConference: vi.fn(),
  endConference: vi.fn(),
  transferCall: vi.fn(),
  completeTransfer: vi.fn(),
  cancelTransfer: vi.fn(),
  toggleConferenceRecording: vi.fn(),
  currentSession: null,
};

vi.mock('@/contexts/CallContext', () => ({ useCallContext: () => callContext }));
vi.mock('@/hooks/useSipCall', () => ({ useSipCall: () => sipState }));
vi.mock('@/hooks/useWavoipCall', () => ({
  useWavoipCall: () => ({ isConfigured: false, status: 'idle', error: null, checkConfiguration: vi.fn(), startCall: vi.fn(), endCall: vi.fn() }),
}));
vi.mock('@/hooks/useCallRecording', () => ({ useCallRecording: () => ({ isRecording: false }) }));
vi.mock('@/hooks/useConferenceRecording', () => ({ useConferenceRecording: () => ({}) }));
vi.mock('@/hooks/useAgentStatus', () => ({
  useAgentStatus: () => ({
    currentAgent: null, agents: [], setAgent: vi.fn(), clearAgent: vi.fn(),
    setStatusBusy: vi.fn(), setStatusAvailable: vi.fn(), setStatusAway: vi.fn(),
  }),
}));
vi.mock('@/lib/elevenlabs-stub', () => ({
  useConversation: () => ({ startSession: vi.fn(), endSession: vi.fn(), isSpeaking: false, setVolume: vi.fn() }),
}));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn(), info: vi.fn(), warning: vi.fn() } }));
vi.mock('@/lib/logger', () => ({
  logger: { create: () => ({ debug: vi.fn(), info: vi.fn() }), error: vi.fn() },
}));
vi.mock('@/components/calls/ActiveCallsIndicator', () => ({ ActiveCallsIndicator: () => null }));
vi.mock('@/components/calls/softphone/ActiveCallDisplay', () => ({ ActiveCallDisplay: () => null }));
vi.mock('@/components/calls/softphone/TabContents', () => ({ ContactsTab: () => null, HistoryTab: () => null }));
vi.mock('@/components/calls/softphone/HeaderDropdowns', () => ({ AgentSelector: () => null, ChannelSelector: () => null }));
// O teclado real depende de vários providers; aqui só precisamos do gatilho de "ligar".
vi.mock('@/components/calls/softphone/DialpadTab', () => ({
  DialpadTab: ({ onStartCall }: { onStartCall: () => void }) => (
    <button type="button" onClick={onStartCall}>Disparar ligacao</button>
  ),
}));

describe('UnifiedSoftphone — estados de falha (etapa 233)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    sipState.status = 'disconnected';
    sipState.isRegistered = false;
    sipState.isConfigured = true;
    sipState.error = null;
    sipState.connect.mockReset();
    sipState.toggleMute.mockReset();
    callContext.activeChannel = 'sip';
    callContext.isInCall = false;
    callContext.currentCall = null;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('mostra o estado do registro SIP da propria linha no cabecalho', () => {
    sipState.status = 'registered';
    sipState.isRegistered = true;
    render(<UnifiedSoftphone />);
    expect(screen.getByText('Linha SIP ativa')).toBeInTheDocument();
  });

  it('mostra o motivo da falha e tenta de novo quando o operador clica em Tentar agora', () => {
    sipState.status = 'error';
    sipState.error = 'Registro falhou: 403 Forbidden';
    render(<UnifiedSoftphone />);

    expect(screen.getByText('Linha SIP fora do ar')).toBeInTheDocument();
    expect(screen.getByText(/Registro falhou: 403 Forbidden/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Tentar agora' }));
    expect(sipState.connect).toHaveBeenCalledTimes(1);
  });

  it('repete o registro automaticamente com espera crescente', () => {
    const { rerender } = render(<UnifiedSoftphone />);

    // Primeira tentativa e imediata.
    act(() => { vi.advanceTimersByTime(0); });
    expect(sipState.connect).toHaveBeenCalledTimes(1);

    // Registro caiu de verdade: proxima tentativa so depois de 5s.
    sipState.status = 'error';
    sipState.error = 'Registro falhou: timeout';
    rerender(<UnifiedSoftphone />);
    act(() => { vi.advanceTimersByTime(4999); });
    expect(sipState.connect).toHaveBeenCalledTimes(1);
    act(() => { vi.advanceTimersByTime(1); });
    expect(sipState.connect).toHaveBeenCalledTimes(2);
  });

  it('instrui o agente quando o microfone e negado', async () => {
    vi.useRealTimers();
    callContext.activeChannel = 'webrtc';
    const getUserMedia = vi.fn().mockRejectedValue(new DOMException('negado', 'NotAllowedError'));
    Object.defineProperty(navigator, 'mediaDevices', { value: { getUserMedia }, configurable: true });

    render(<UnifiedSoftphone />);
    fireEvent.click(screen.getByRole('button', { name: 'Disparar ligacao' }));

    expect(await screen.findByText('Microfone bloqueado')).toBeInTheDocument();
    expect(screen.getByText(/Permissão de microfone negada/)).toBeInTheDocument();
    expect(screen.getByText(/cadeado/)).toBeInTheDocument();
    expect(getUserMedia).toHaveBeenCalled();
  });

  it('aplica no audio do SIP o mute pedido pelo estado da chamada', () => {
    callContext.currentCall = { channel: 'sip', isMuted: true };

    render(<UnifiedSoftphone />);

    expect(sipState.toggleMute).toHaveBeenCalledWith(true);
  });

  it('nao mexe no audio do SIP quando a chamada e de outro canal', () => {
    callContext.activeChannel = 'webrtc';
    callContext.currentCall = { channel: 'webrtc', isMuted: true };

    render(<UnifiedSoftphone />);

    expect(sipState.toggleMute).not.toHaveBeenCalled();
  });
});