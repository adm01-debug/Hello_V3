import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface CallHistoryCsvRow {
  id: string;
  caller_name: string | null;
  caller_phone: string | null;
  agent_name: string | null;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  status: string | null;
  direction?: string | null;
  sentiment?: string | null;
  topics?: string[] | null;
}

function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return '';
  const s = String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function formatDate(iso: string | null): string {
  if (!iso) return '';
  try {
    return format(new Date(iso), 'dd/MM/yyyy HH:mm', { locale: ptBR });
  } catch {
    return '';
  }
}

function formatDuration(seconds: number | null): string {
  if (seconds === null || seconds === undefined) return '';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

/** Gera CSV (separado por ;) do histórico de chamadas carregado em tela. */
export function buildCallHistoryCsv(sessions: CallHistoryCsvRow[]): string {
  const header = ['Data/Hora', 'Cliente', 'Telefone', 'Agente', 'Duração', 'Status', 'Sentimento', 'Tópicos'];
  const rows = sessions.map((s) => [
    formatDate(s.started_at),
    s.caller_name,
    s.caller_phone,
    s.agent_name,
    formatDuration(s.duration_seconds),
    s.status,
    s.sentiment,
    (s.topics || []).join(' | '),
  ]);
  return [header.join(';'), ...rows.map((r) => r.map(escapeCsv).join(';'))].join('\n');
}

/** Dispara o download do CSV no navegador. */
export function downloadCallHistoryCsv(sessions: CallHistoryCsvRow[], filename = 'historico-chamadas.csv'): number {
  const csv = buildCallHistoryCsv(sessions);
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  return sessions.length;
}