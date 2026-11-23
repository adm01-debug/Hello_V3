export interface ReportVolumeRow {
  hour: string;
  incoming: number;
  outgoing: number;
}

export interface ReportAgentRow {
  name: string;
  chamadas: number;
  media: number;
}

export interface ReportKpis {
  totalCallsToday: number;
  answeredRate: number;
  avgCallDuration: number;
  activeAgents: number;
  totalAgents: number;
}

function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return '';
  const s = String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function section(title: string): string {
  return `\n# ${title}`;
}

/** Gera CSV (separado por ;) do relatório exibido em tela na página Relatórios. */
export function buildReportCsv(data: {
  kpis?: ReportKpis;
  volume?: ReportVolumeRow[];
  agents?: ReportAgentRow[];
  distribution?: { name: string; value: number }[];
}): string {
  const parts: string[] = [];

  if (data.kpis) {
    parts.push(section('Indicadores'));
    parts.push(['Indicador', 'Valor'].join(';'));
    parts.push(['Total de Chamadas', data.kpis.totalCallsToday].join(';'));
    parts.push(['Taxa de Atendimento (%)', data.kpis.answeredRate].join(';'));
    parts.push(['Duração Média (s)', data.kpis.avgCallDuration].join(';'));
    parts.push(['Agentes Ativos', `${data.kpis.activeAgents}/${data.kpis.totalAgents}`].join(';'));
  }

  if (data.volume && data.volume.length) {
    parts.push(section('Volume por Hora'));
    parts.push(['Hora', 'Recebidas', 'Realizadas'].join(';'));
    data.volume.forEach((r) => parts.push([r.hour, r.incoming, r.outgoing].map(escapeCsv).join(';')));
  }

  if (data.agents && data.agents.length) {
    parts.push(section('Performance por Agente'));
    parts.push(['Agente', 'Chamadas', 'Duração Média (s)'].join(';'));
    data.agents.forEach((r) => parts.push([r.name, r.chamadas, r.media].map(escapeCsv).join(';')));
  }

  if (data.distribution && data.distribution.length) {
    parts.push(section('Distribuição de Chamadas'));
    parts.push(['Tipo', 'Valor'].join(';'));
    data.distribution.forEach((r) => parts.push([r.name, r.value].map(escapeCsv).join(';')));
  }

  return parts.join('\n');
}

/** Dispara o download do CSV do relatório no navegador. */
export function downloadReportCsv(data: Parameters<typeof buildReportCsv>[0], filename = 'relatorio.csv'): void {
  const csv = buildReportCsv(data);
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}