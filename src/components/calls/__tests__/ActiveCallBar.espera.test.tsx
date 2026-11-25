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
