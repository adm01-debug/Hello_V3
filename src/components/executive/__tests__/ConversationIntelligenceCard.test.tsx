import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ConversationIntelligenceCard } from '../ConversationIntelligenceCard';

const fromMock = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: (...a: unknown[]) => fromMock(...a) },
}));

vi.mock('@/lib/logger', () => ({
  logger: { create: () => ({ error: vi.fn(), warn: vi.fn(), info: vi.fn() }) },
}));

type TableRows = Record<string, unknown[]>;

function mockTables(rows: TableRows) {
  fromMock.mockImplementation((table: string) => {
    const data = rows[table] ?? [];
    const builder: Record<string, unknown> = {};
    const chain = () => builder;
    builder.select = chain;
    builder.gte = chain;
    builder.in = chain;
    builder.eq = chain;
    builder.order = chain;
    builder.limit = chain;
    builder.then = (resolve: (v: { data: unknown[]; error: null }) => unknown) =>
      resolve({ data, error: null });
    return builder;
  });
}

describe('ConversationIntelligenceCard — talk ratio real', () => {
  beforeEach(() => {
    fromMock.mockReset();
  });

  it('calcula o talk ratio a partir das transcrições, não um valor fixo', async () => {
    mockTables({
      call_key_moments: [],
      call_sessions: [{ id: 's1', duration_seconds: 100 }],
      call_transcriptions: [
        { call_session_id: 's1', speaker: 'agent', start_time: 0, end_time: 40 },
        { call_session_id: 's1', speaker: 'customer', start_time: 40, end_time: 60 },
      ],
    });

    render(<ConversationIntelligenceCard />);

    // agente falou 40s de 100s => 40%
    await waitFor(() => expect(screen.getByText('40%')).toBeInTheDocument());
    expect(screen.queryByText('50%')).not.toBeInTheDocument();
    expect(screen.getByText(/1 chamada\(s\)/)).toBeInTheDocument();
  });

  it('mostra "sem transcrição" em vez de fingir 50% quando não há dado', async () => {
    mockTables({
      call_key_moments: [],
      call_sessions: [{ id: 's1', duration_seconds: 100 }],
      call_transcriptions: [],
    });

    render(<ConversationIntelligenceCard />);

    await waitFor(() =>
      expect(screen.getByText('Sem transcrição no período')).toBeInTheDocument(),
    );
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});