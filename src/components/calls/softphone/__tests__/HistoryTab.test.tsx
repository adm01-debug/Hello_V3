import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HistoryTab } from '../TabContents';
import type { CallSession } from '@/hooks/useMultiChannelCall';

function makeCall(overrides: Partial<CallSession> = {}): CallSession {
  return {
    id: 'call-1',
    channel: 'webrtc',
    status: 'ended',
    direction: 'outbound',
    phoneNumber: '5511988887777',
    contactName: 'Ana Souza',
    duration: 65,
    totalHoldTime: 0,
    holdCount: 0,
    isMuted: false,
    isOnHold: false,
    isRecording: false,
    isInConference: false,
    transcripts: [],
    ...overrides,
  } as CallSession;
}

describe('HistoryTab — botao de ligar de volta (etapa 165)', () => {
  it('preenche o numero no discador ao clicar no botao de telefone', () => {
    const onSelectNumber = vi.fn();
    render(<HistoryTab callHistory={[makeCall()]} onSelectNumber={onSelectNumber} />);

    fireEvent.click(screen.getByRole('button', { name: 'Ligar de volta para Ana Souza' }));

    expect(onSelectNumber).toHaveBeenCalledWith('5511988887777');
  });

  it('fica inativo quando a chamada nao tem numero registrado', () => {
    const onSelectNumber = vi.fn();
    render(
      <HistoryTab
        callHistory={[makeCall({ phoneNumber: undefined, contactName: undefined })]}
        onSelectNumber={onSelectNumber}
      />,
    );

    const button = screen.getByRole('button', { name: 'Chamada sem número registrado' });

    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(onSelectNumber).not.toHaveBeenCalled();
  });
});