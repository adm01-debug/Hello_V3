import { describe, it, expect } from 'vitest';
import { buildCallHistoryCsv } from '../export/callHistoryCsv';

describe('callHistoryCsv', () => {
  const rows = [
    {
      id: 'a', caller_name: 'João, Silva', caller_phone: '1199999', agent_name: 'Agente',
      started_at: '2026-11-23T10:00:00Z', ended_at: '2026-11-23T10:05:00Z',
      duration_seconds: 300, status: 'completed', direction: 'inbound',
      sentiment: 'positive', topics: ['pagamento', 'suporte'],
    },
    {
      id: 'b', caller_name: null, caller_phone: null, agent_name: null,
      started_at: '2026-11-23T11:00:00Z', ended_at: null,
      duration_seconds: null, status: 'missed',
    },
  ];

  it('gera header + linhas separadas por ;', () => {
    const csv = buildCallHistoryCsv(rows as never);
    const lines = csv.split('\n');
    expect(lines.length).toBe(3);
    expect(lines[0]).toContain('Data/Hora');
    expect(lines[0]).toContain('Duração');
    expect(lines[1]).toContain('João, Silva');
    expect(lines[1]).toContain('5m 0s');
  });

  it('escapa valores com virgula e aspas', () => {
    const csv = buildCallHistoryCsv([{ ...rows[0], caller_name: 'A "B" C' }] as never);
    expect(csv).toContain('"A ""B"" C"');
  });

  it('deixa vazio campos nulos', () => {
    const csv = buildCallHistoryCsv([rows[1]] as never);
    const line = csv.split('\n')[1];
    // campos nulos viram cadeia vazia entre ;
    expect(line).toContain(';;');
  });
});