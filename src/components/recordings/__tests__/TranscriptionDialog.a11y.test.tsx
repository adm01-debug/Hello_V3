import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TranscriptionDialog } from '../TranscriptionDialog';
import type { TranscriptionSegment } from '@/hooks/useRecordings';

// jumpToMatch usa scrollIntoView, que o jsdom não implementa.
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

const segments: TranscriptionSegment[] = [
  { speaker: 'Cliente', text: 'Oi, preciso de ajuda com a fatura.', start_time: 0, end_time: 3 },
  { speaker: 'Atendente', text: 'Claro, já olho a fatura.', start_time: 3, end_time: 7 },
];

const setup = () => {
  render(
    <TranscriptionDialog
      open
      onOpenChange={vi.fn()}
      transcription={{ text: 'fatura', segments, recording: null, sentiment: null }}
      onAnalyzeSentiment={vi.fn()}
      analyzingSentiment={false}
    />,
  );
};

describe('TranscriptionDialog - rótulos acessíveis na busca (A-123)', () => {
  it('nomeia o campo de busca e anuncia a posição das ocorrências', () => {
    setup();

    fireEvent.change(screen.getByLabelText('Pesquisar na transcrição'), { target: { value: 'fatura' } });

    const regiao = screen.getByText('Ocorrência 1 de 2');
    expect(regiao).toHaveAttribute('aria-live', 'polite');

    fireEvent.click(screen.getByRole('button', { name: 'Próxima ocorrência' }));
    expect(screen.getByText('Ocorrência 2 de 2')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Ocorrência anterior' }));
    expect(screen.getByText('Ocorrência 1 de 2')).toBeInTheDocument();
  });
});
