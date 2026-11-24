import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ConcurrencyConflicts from '../ConcurrencyConflicts';
import type { ConflictStats } from '@/hooks/useOptimisticLockConflicts';

const state: { data?: ConflictStats; isLoading: boolean; error: unknown } = {
  data: undefined,
  isLoading: false,
  error: null,
};

vi.mock('@/hooks/useOptimisticLockConflicts', () => ({
  useOptimisticLockConflicts: () => state,
}));
vi.mock('@/hooks/usePageTitle', () => ({ usePageTitle: vi.fn() }));
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  LineChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  CartesianGrid: () => null,
}));

const vazio: ConflictStats = { total: 0, topTables: [], topUsers: [], timeline: [], recent: [] };

describe('ConcurrencyConflicts — estado vazio honesto (E174)', () => {
  beforeEach(() => {
    state.data = vazio;
    state.isLoading = false;
    state.error = null;
  });

  it('diz que nao houve conflito no periodo em vez de deixar a tela em branco', () => {
    render(<ConcurrencyConflicts />);
    expect(screen.getAllByText(/Nenhum conflito registrado nas últimas 24 horas/).length).toBeGreaterThan(0);
    expect(screen.getByText(/não que a tela esteja\s*sem dados/)).toBeInTheDocument();
  });

  it('explica a origem dos dados e a retencao de 90 dias', () => {
    render(<ConcurrencyConflicts />);
    expect(screen.getByText('enforce_optimistic_lock')).toBeInTheDocument();
    expect(screen.getByText('cleanup-lock-conflicts-weekly')).toBeInTheDocument();
  });

  it('diz quantos conflitos estao sendo mostrados quando passa de 50', () => {
    const recent = Array.from({ length: 50 }, (_, i) => ({
      id: `c${i}`,
      table_name: 'deals',
      record_id: `r${i}`,
      user_id: 'u1',
      client_version: 1,
      current_version: 2,
      attempted_at: '2026-11-24T00:00:00Z',
    }));
    state.data = {
      total: 120,
      topTables: [{ table_name: 'deals', count: 120 }],
      topUsers: [{ user_id: 'u1', count: 120 }],
      timeline: [{ date: '2026-11-24', count: 120 }],
      recent,
    };
    render(<ConcurrencyConflicts />);
    expect(screen.getByText(/Mostrando os 50 conflitos mais recentes de 120/)).toBeInTheDocument();
  });
});
