import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ActiveCallBar } from '../ActiveCallBar';

const chamada = {
  id: 'call-1',
  contactName: 'Cliente Teste',
  phoneNumber: '+5511999999999',
  direction: 'inbound',
  status: 'active',
  duration: 10,
  isOnHold: false,
  holdCount: 0,
  dbSessionId: 'sess-1',
  agentName: 'Agente Teste',
  transcripts: [],
  isMuted: false,
  isRecording: false,
  isInConference: false,
};

const callContext = {
  activeCalls: [{ ...chamada }] as unknown[],
  activeCallId: 'call-1' as string | null,
  endCall: vi.fn(),
  toggleHold: vi.fn(),
  toggleMute: vi.fn(),
  currentSession: null,
  endDbSession: vi.fn(),
  addCallAnalysis: vi.fn(),
  addDbTranscript: vi.fn(),
};

vi.mock('@/contexts/CallContext', () => ({ useCallContext: () => callContext }));
vi.mock('@/hooks/useLiveAssist', () => ({ useLiveAssist: () => ({ analyze: vi.fn() }) }));
vi.mock('@/hooks/useContacts', () => ({
  useContacts: () => ({ findOrCreateContact: vi.fn(), addContactInteraction: vi.fn() }),
}));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { functions: { invoke: vi.fn() }, from: vi.fn() },
}));
vi.mock('@/components/calls/CrmSuggestionsCard', () => ({ CrmSuggestionsCard: () => null }));
// E155: a verificacao de voz vive no proprio componente; aqui ela e mockada para o
// teste continuar medindo so o estado de espera/mute (sem mic e sem react-query).
vi.mock('@/hooks/useVoiceBiometrics', () => ({
  useLiveVoiceVerification: () => ({ run: vi.fn(), isVerifying: false, lastVerdict: null }),
}));

describe('ActiveCallBar: botao de espera', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    callContext.activeCalls = [{ ...chamada }];
    callContext.activeCallId = 'call-1';
  });

  it('pede a espera ao contexto da chamada, que e quem grava o hold_event', () => {
    render(<ActiveCallBar />);

    fireEvent.click(screen.getByRole('button', { name: 'Colocar a chamada em espera' }));

    expect(callContext.toggleHold).toHaveBeenCalledTimes(1);
    expect(callContext.toggleHold).toHaveBeenCalledWith('call-1');
  });

  it('mostra o estado de espera vindo do contexto, nao de um estado local', () => {
    callContext.activeCalls = [{ ...chamada, isOnHold: true, status: 'on-hold' }];

    render(<ActiveCallBar />);

    expect(screen.getByRole('button', { name: 'Retomar a chamada' })).toBeTruthy();
  });
});

describe('ActiveCallBar: botao de microfone', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    callContext.activeCalls = [{ ...chamada }];
    callContext.activeCallId = 'call-1';
  });

  it('pede o mute ao contexto da chamada, que e quem silencia o audio', () => {
    render(<ActiveCallBar />);

    fireEvent.click(screen.getByRole('button', { name: 'Silenciar o microfone' }));

    expect(callContext.toggleMute).toHaveBeenCalledTimes(1);
    expect(callContext.toggleMute).toHaveBeenCalledWith('call-1');
  });

  it('nao guarda estado local: o icone so muda quando o contexto muda', () => {
    render(<ActiveCallBar />);

    fireEvent.click(screen.getByRole('button', { name: 'Silenciar o microfone' }));

    expect(screen.getByRole('button', { name: 'Silenciar o microfone' })).toBeTruthy();
  });

  it('mostra o estado de mute vindo do contexto', () => {
    callContext.activeCalls = [{ ...chamada, isMuted: true }];

    render(<ActiveCallBar />);

    expect(screen.getByRole('button', { name: 'Ativar o microfone' })).toBeTruthy();
  });
});
