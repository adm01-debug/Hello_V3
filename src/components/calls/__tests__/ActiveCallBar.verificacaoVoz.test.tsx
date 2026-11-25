import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ActiveCallBar } from '../ActiveCallBar';

const invokeMock = vi.hoisted(() => vi.fn());
const orderMock = vi.hoisted(() => vi.fn());
const captureVoiceSampleMock = vi.hoisted(() => vi.fn());

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      order: orderMock,
    })),
    functions: { invoke: invokeMock },
  },
}));

vi.mock('@/lib/voice-biometrics', () => ({
  captureVoiceSample: captureVoiceSampleMock,
}));

vi.mock('@/hooks/useLiveAssist', () => ({ useLiveAssist: () => ({ analyze: vi.fn() }) }));
vi.mock('@/hooks/useContacts', () => ({
  useContacts: () => ({ findOrCreateContact: vi.fn(), addContactInteraction: vi.fn() }),
}));
vi.mock('@/components/calls/CrmSuggestionsCard', () => ({ CrmSuggestionsCard: () => null }));
vi.mock('@/components/calls/NextBestActionPanel', () => ({ NextBestActionPanel: () => null }));

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
  currentSession: {
    id: 'sess-1',
    callerName: 'Cliente Teste',
    callerPhone: '+5511999999999',
    agentName: 'Agente Teste',
    startedAt: new Date(),
  } as Record<string, unknown> | null,
  endDbSession: vi.fn(),
  addCallAnalysis: vi.fn(),
  addDbTranscript: vi.fn(),
};

vi.mock('@/contexts/CallContext', () => ({ useCallContext: () => callContext }));

function renderBar() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <ActiveCallBar />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  callContext.activeCalls = [{ ...chamada }];
  callContext.activeCallId = 'call-1';
  callContext.currentSession = {
    id: 'sess-1',
    callerName: 'Cliente Teste',
    callerPhone: '+5511999999999',
    agentName: 'Agente Teste',
    startedAt: new Date(),
  };
  orderMock.mockResolvedValue({ data: [], error: null });
  captureVoiceSampleMock.mockResolvedValue({ embedding: [1, 2, 3], summary: { mean_pitch: 1 } });
});

describe('ActiveCallBar: verificacao de voz ao vivo (etapa 155)', () => {
  it('verifica a voz da sessao ativa e mostra o veredito na barra', async () => {
    invokeMock.mockResolvedValue({ data: { enrolled: true, match: true, confidence: 93 }, error: null });

    renderBar();
    fireEvent.click(screen.getByRole('button', { name: 'Verificar a voz do cliente nesta chamada' }));

    await waitFor(() => expect(screen.getByText('Voz confere (93%)')).toBeTruthy());
    expect(invokeMock).toHaveBeenCalledWith(
      'verify-voice',
      expect.objectContaining({ body: expect.objectContaining({ callSessionId: 'sess-1' }) }),
    );
  });

  it('avisa na barra quando a voz nao confere com o padrao cadastrado', async () => {
    invokeMock.mockResolvedValue({ data: { enrolled: true, match: false }, error: null });

    renderBar();
    fireEvent.click(screen.getByRole('button', { name: 'Verificar a voz do cliente nesta chamada' }));

    await waitFor(() => expect(screen.getByText('Voz não confere')).toBeTruthy());
  });

  it('nao deixa verificar sem sessao de banco gravada', async () => {
    callContext.currentSession = null;

    renderBar();
    const botao = screen.getByRole('button', { name: 'Verificar a voz do cliente nesta chamada' });
    expect((botao as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(botao);
    expect(invokeMock).not.toHaveBeenCalled();
  });
});
