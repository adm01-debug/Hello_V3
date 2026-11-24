import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CoachingAssignmentsPanel } from '../CoachingAssignmentsPanel';
import { useCoachingTrack } from '@/hooks/useCoachingTrack';

vi.mock('@/hooks/useCoachingAssignments', () => ({
  useCoachingAssignments: () => ({ assignments: [], isLoading: false, complete: vi.fn() }),
}));

vi.mock('@/hooks/useCoachingTrack', () => ({
  useCoachingTrack: vi.fn(),
}));

vi.mock('@/components/auth/PermissionGate', () => ({
  PermissionGate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const mockTrack = (value: Record<string, unknown>) => {
  vi.mocked(useCoachingTrack).mockReturnValue({
    generateTrack: vi.fn(),
    isGenerating: false,
    rules: null,
    lastResult: null,
    ...value,
  } as unknown as ReturnType<typeof useCoachingTrack>);
};

// Números diferentes dos do motor de propósito: se a tela voltar a fixar 3/3.0/14, o teste quebra.
const rules = { min_samples: 4, score_threshold: 2.5, window_days: 30 };

describe('CoachingAssignmentsPanel - regra do coaching automático (A-131)', () => {
  it('explica a regra com os números que vieram da edge', () => {
    mockTrack({ rules });

    render(<CoachingAssignmentsPanel />);

    expect(screen.getByText(/são necessárias 4 avaliações/i)).toBeInTheDocument();
    expect(screen.getByText(/abaixo de 2\.5/i)).toBeInTheDocument();
    expect(screen.getByText(/últimos 30/i)).toBeInTheDocument();
  });

  it('mostra a contagem atual de cada agente que ficou de fora', () => {
    mockTrack({
      rules,
      lastResult: {
        tracks_created: 0,
        assignments: [],
        skipped: [
          { agent_name: 'Ana', reason: 'apenas 1 chamada(s) analisada(s) (mínimo 4)' },
        ],
      },
    });

    render(<CoachingAssignmentsPanel />);

    expect(screen.getByText('Ana')).toBeInTheDocument();
    expect(screen.getByText(/apenas 1 chamada\(s\) analisada\(s\)/i)).toBeInTheDocument();
  });

  it('sem regra conhecida, orienta a rodar a geração', () => {
    mockTrack({});

    render(<CoachingAssignmentsPanel />);

    expect(screen.getAllByText(/Gerar trilhas automáticas/i).length).toBeGreaterThan(0);
  });
});
