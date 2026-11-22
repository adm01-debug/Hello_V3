import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useEffect } from 'react';

// Conta ciclos de vida reais do gráfico (não renders): cada montagem abre canal
// realtime e inicia polling de 5s em call_sessions.
const chartMounts = vi.fn();
const chartUnmounts = vi.fn();

vi.mock('../../QueueTrendChart', () => ({
  QueueTrendChart: () => {
    useEffect(() => {
      chartMounts();
      return () => chartUnmounts();
    }, []);
    return <div data-testid="trend-chart" />;
  },
}));

import { TrendChartToggle } from '../TrendChartToggle';
import type { SupervisorPanelState } from '../types';

describe('TrendChartToggle', () => {
  beforeEach(() => {
    chartMounts.mockClear();
    chartUnmounts.mockClear();
  });

  const makeState = (showTrendChart: boolean) => {
    const setShowTrendChart = vi.fn();
    const s = { showTrendChart, setShowTrendChart } as unknown as SupervisorPanelState;
    return { s, setShowTrendChart };
  };

  it('não monta o gráfico antes do primeiro clique', () => {
    // O hook do gráfico abre canal realtime e faz polling de 5s enquanto
    // estiver montado. Montar de início cobraria esse custo de quem nunca abriu
    // a tendência (showTrendChart nasce false em useSupervisorPanel.ts:53).
    const { s } = makeState(false);
    render(<TrendChartToggle s={s} />);
    expect(chartMounts).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /Tendência do Dia/i }));
    expect(chartMounts).toHaveBeenCalledTimes(1);
  });

  it('conserva o gráfico montado ao fechar, para o histórico não zerar', () => {
    // Regressão: CollapsibleContent desmontava o filho ao fechar, destruindo a
    // série de 20 pontos do hook. Reabrir mostrava gráfico vazio e levava ~100s
    // (20 x 5s) para reencher.
    const open = makeState(true);
    const { unmount } = render(<TrendChartToggle s={open.s} />);
    expect(chartMounts).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /Tendência do Dia/i }));
    expect(open.setShowTrendChart).toHaveBeenCalledWith(false);
    expect(chartUnmounts).not.toHaveBeenCalled();
    expect(screen.getByTestId('trend-chart')).toBeInTheDocument();
    unmount();
    expect(chartUnmounts).toHaveBeenCalledTimes(1);
  });

  it('não reinicia o gráfico quando o pai reflete o fechamento', () => {
    const { s, setShowTrendChart } = makeState(true);
    const { rerender } = render(<TrendChartToggle s={s} />);
    fireEvent.click(screen.getByRole('button', { name: /Tendência do Dia/i }));
    expect(setShowTrendChart).toHaveBeenCalledWith(false);

    // O pai aplica open=false e re-renderiza; o gráfico precisa sobreviver.
    const closed = makeState(false);
    rerender(<TrendChartToggle s={closed.s} />);
    expect(chartMounts).toHaveBeenCalledTimes(1);
    expect(chartUnmounts).not.toHaveBeenCalled();
  });

  it('continua montado ao reabrir depois de fechar', () => {
    const { s } = makeState(true);
    const { rerender } = render(<TrendChartToggle s={s} />);
    rerender(<TrendChartToggle s={makeState(false).s} />);
    rerender(<TrendChartToggle s={makeState(true).s} />);
    expect(chartMounts).toHaveBeenCalledTimes(1);
    expect(chartUnmounts).not.toHaveBeenCalled();
  });
});
