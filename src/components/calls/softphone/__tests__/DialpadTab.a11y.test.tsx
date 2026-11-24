import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DialpadTab } from '../DialpadTab';
import { ConferenceSection } from '../../ConferenceSection';
import { TooltipProvider } from '@/components/ui/tooltip';
import type { CallSession, ConferenceCall } from '@/hooks/useMultiChannelCall';

const chamada = (over: Partial<CallSession>) =>
  ({ id: 'c1', channel: 'sip', status: 'active', direction: 'outbound', duration: 0,
     totalHoldTime: 0, holdCount: 0, isMuted: false, isOnHold: false, isRecording: false,
     isInConference: false, ...over } as unknown as CallSession);

const dialpadProps = {
  activeChannel: 'sip' as const,
  isInCall: false,
  canAddCall: true,
  activeCalls: [] as CallSession[],
  wavoipConfigured: true,
  wavoipStatus: 'connected',
  wavoipError: null,
  onPhoneChange: vi.fn(),
  onDigitPress: vi.fn(),
  onStartCall: vi.fn(),
  onCheckWavoip: vi.fn(),
};

describe('DialpadTab - rótulo acessível no apagar (A-123)', () => {
  it('expõe "Apagar o último dígito" e aciona o apagar', () => {
    const onBackspace = vi.fn();
    render(<DialpadTab {...dialpadProps} phoneNumber="1199" onBackspace={onBackspace} />);

    fireEvent.click(screen.getByRole('button', { name: 'Apagar o último dígito' }));
    expect(onBackspace).toHaveBeenCalledTimes(1);
  });
});

describe('ConferenceSection - rótulo acessível ao remover participante (A-123)', () => {
  it('identifica o participante que será removido', () => {
    const onRemoveFromConference = vi.fn();
    const conference = { id: 'conf1', participantIds: ['c1'], startedAt: new Date('2026-01-01T00:00:00Z'),
      duration: 30, isActive: true, isRecording: false } as ConferenceCall;

    render(
      <TooltipProvider>
        <ConferenceSection
          conference={conference}
          callsInConference={[chamada({ id: 'c1', contactName: 'Ana Souza' })]}
          callsNotInConference={[]}
          onRemoveFromConference={onRemoveFromConference}
          onAddToConference={vi.fn()}
          onEndConference={vi.fn()}
        />
      </TooltipProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Remover Ana Souza da conferência' }));
    expect(onRemoveFromConference).toHaveBeenCalledWith('c1');
  });
});
