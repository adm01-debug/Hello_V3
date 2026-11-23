import { describe, it, expect } from 'vitest';
import { buildReportCsv } from '../export/reportCsv';

describe('reportCsv', () => {
  it('gera secoes e header do relatorio', () => {
    const csv = buildReportCsv({
      kpis: { totalCallsToday: 10, answeredRate: 80, avgCallDuration: 120, activeAgents: 3, totalAgents: 5 },
      volume: [{ hour: '09:00', incoming: 2, outgoing: 1 }],
      agents: [{ name: 'Ana', chamadas: 4, media: 90 }],
      distribution: [{ name: 'Atendidas', value: 8 }],
    });
    expect(csv).toContain('# Indicadores');
    expect(csv).toContain('Total de Chamadas;10');
    expect(csv).toContain('# Volume por Hora');
    expect(csv).toContain('09:00;2;1');
    expect(csv).toContain('# Performance por Agente');
    expect(csv).toContain('Ana;4;90');
    expect(csv).toContain('# Distribuição de Chamadas');
    expect(csv).toContain('Atendidas;8');
  });

  it('escapa nome com virgula', () => {
    const csv = buildReportCsv({ agents: [{ name: 'Silva, João', chamadas: 1, media: 2 }] });
    expect(csv).toContain('"Silva, João";1;2');
  });

  it('gera arquivo vazio quando nada informado', () => {
    const csv = buildReportCsv({});
    expect(csv).toBe('');
  });
});