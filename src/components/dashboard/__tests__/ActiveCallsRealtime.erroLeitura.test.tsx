import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

const estado = vi.hoisted(() => ({ error: null as string | null }));

vi.mock('@/hooks/useActiveCallsRealtime', () => ({
  useActiveCallsRealtime: () => ({
    loading: false,
    filteredCalls: [],
    agents: [],
    statusCounts: { onHold: 0, inCall: 0, total: 0, maxSeverity: 'normal' },
    error: estado.error,
    selectedAgent: 'all',
    setSelectedAgent: vi.fn(),
    selectedHoldStatus: 'all',
    setSelectedHoldStatus: vi.fn(),
    soundEnabled: true,
    toggleSound: vi.fn(),
    isCallOnHold: () => false,
    getHoldDuration: () => 0,
    getHoldSeverity: () => 'normal',
  }),
}));

import { ActiveCallsRealtime } from '@/components/dashboard/ActiveCallsRealtime';

beforeEach(() => { estado.error = null; });

describe('ActiveCallsRealtime: falha de leitura (A-218)', () => {
  it('avisa que a leitura falhou em vez de dizer que nao ha chamada ativa', () => {
    estado.error = 'permission denied for table call_sessions';
    render(<ActiveCallsRealtime />);

    expect(screen.getByRole('alert')).toHaveTextContent('permission denied for table call_sessions');
    expect(screen.queryByText('Nenhuma chamada ativa')).toBeNull();
    expect(screen.getByText('Sem dados para mostrar enquanto a leitura falha')).toBeInTheDocument();
  });

  it('sem falha, segue mostrando o estado vazio normal', () => {
    render(<ActiveCallsRealtime />);

    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByText('Nenhuma chamada ativa')).toBeInTheDocument();
  });
});