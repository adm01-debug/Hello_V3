import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { exportToCSV, type ExportColumn } from '@/lib/export';
import { useVoipExecutiveSummary, type ExecutivePeriod } from '@/hooks/useVoipExecutiveSummary';
import { logger } from '@/lib/logger';

const log = logger.create('ExecutiveReportExport');

interface Props {
  period?: ExecutivePeriod;
}

interface ReportRow {
  metric: string;
  value: string;
  detail: string;
}

export function ExecutiveReportExport({ period = 'week' }: Props) {
  const { data, isLoading, refetch } = useVoipExecutiveSummary(period);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      let summary = data;
      if (!summary) {
        const res = await refetch();
        summary = res.data;
      }
      if (!summary) {
        toast.error('Sem dados para exportar');
        return;
      }

      const rows: ReportRow[] = [
        { metric: 'Período', value: summary.period, detail: `Desde ${new Date(summary.since).toLocaleString('pt-BR')}` },
        { metric: 'Health Score', value: `${summary.health_score} / 100`, detail: '40% SLA + 30% MOS + 20% Alertas + 10% Capacidade' },
        { metric: 'SLA — Score', value: `${Math.round(summary.breakdown.sla_score)}`, detail: `Atual: ${summary.sla.current_pct ?? '—'}% / Anterior: ${summary.sla.previous_pct ?? '—'}%` },
        { metric: 'MOS — Score', value: `${Math.round(summary.breakdown.mos_score)}`, detail: `Média: ${summary.mos_avg ?? '—'}` },
        { metric: 'Alertas — Score', value: `${Math.round(summary.breakdown.alerts_score)}`, detail: `${summary.alerts.unacknowledged} pendentes / ${summary.alerts.total} total` },
        { metric: 'Capacidade — Score', value: `${Math.round(summary.breakdown.capacity_score)}`, detail: `Pico ${summary.capacity.peak_concurrent} / ${summary.capacity.cap} (${summary.capacity.utilization_pct}%)` },
        { metric: 'Total de chamadas', value: String(summary.sla.total_calls), detail: 'No período analisado' },
        ...summary.worst_agents.map((a, i) => ({
          metric: `Pior agente #${i + 1}`,
          value: a.agent_name,
          detail: `MOS ${a.mos_avg.toFixed(2)} em ${a.calls} chamadas (24h)`,
        })),
      ];

      const columns: ExportColumn[] = [
        { key: 'metric', label: 'Métrica' },
        { key: 'value', label: 'Valor' },
        { key: 'detail', label: 'Detalhe' },
      ];

      const ts = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      exportToCSV(rows as unknown as Array<Record<string, unknown>>, columns, `voip-executive-${period}-${ts}`);
      toast.success('Relatório exportado', { description: `voip-executive-${period}-${ts}.csv` });
    } catch (err) {
      log.error('Falha ao exportar relatório', err);
      toast.error('Falha ao exportar relatório');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Button onClick={handleExport} disabled={exporting || isLoading} variant="outline" size="sm">
      <Download className="mr-2 h-4 w-4" />
      {exporting ? 'Exportando...' : 'Exportar CSV'}
    </Button>
  );
}
