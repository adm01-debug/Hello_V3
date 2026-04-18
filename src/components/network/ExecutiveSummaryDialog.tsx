import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { jsPDF } from 'jspdf';
import { FileText, Copy, Download, Loader2, Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useVoipExecutiveNarrative, type NarrativePeriod } from '@/hooks/useVoipExecutiveNarrative';
import { logger } from '@/lib/logger';

const log = logger.create('ExecutiveSummaryDialog');

export const ExecutiveSummaryDialog = () => {
  const [open, setOpen] = useState(false);
  const [period, setPeriod] = useState<NarrativePeriod>('week');
  const { data, isLoading, refetch, isFetching } = useVoipExecutiveNarrative(period, open);

  const onCopy = async () => {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(data.summary);
      toast.success('Resumo copiado');
    } catch (e) {
      log.error('Falha ao copiar', e);
      toast.error('Não foi possível copiar');
    }
  };

  const onExportPdf = () => {
    if (!data) return;
    try {
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const margin = 40;
      let y = margin;
      doc.setFontSize(16);
      doc.text('Resumo Executivo VoIP', margin, y);
      y += 22;
      doc.setFontSize(10);
      doc.setTextColor(120);
      doc.text(`Período: ${period === 'week' ? 'Última semana' : 'Último mês'} • Gerado em ${new Date(data.generatedAt).toLocaleString('pt-BR')}`, margin, y);
      y += 24;
      doc.setTextColor(0);
      doc.setFontSize(11);
      const kpisLine = `MOS médio: ${data.kpis.mosAvg ?? '—'}  •  Chamadas: ${data.kpis.totalCalls}  •  Alertas: ${data.kpis.totalAlerts} (${data.kpis.criticalAlerts} críticos)  •  Ações: ${data.kpis.appliedActions}`;
      doc.text(kpisLine, margin, y, { maxWidth: 515 });
      y += 28;
      doc.setFontSize(11);
      const lines = doc.splitTextToSize(data.summary, 515);
      doc.text(lines, margin, y);
      doc.save(`resumo-executivo-voip-${period}-${Date.now()}.pdf`);
      toast.success('PDF exportado');
    } catch (e) {
      log.error('Falha PDF', e);
      toast.error('Falha ao gerar PDF');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FileText className="mr-2 h-4 w-4" /> Resumo Executivo
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Resumo Executivo VoIP
          </DialogTitle>
          <DialogDescription>
            Narrativa gerada por IA com KPIs consolidados para apresentação à liderança.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between gap-4 flex-wrap">
          <Tabs value={period} onValueChange={(v) => setPeriod(v as NarrativePeriod)}>
            <TabsList>
              <TabsTrigger value="week">Última semana</TabsTrigger>
              <TabsTrigger value="month">Último mês</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => refetch()} disabled={isFetching}>
              {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Regenerar'}
            </Button>
            <Button size="sm" variant="outline" onClick={onCopy} disabled={!data}>
              <Copy className="mr-2 h-3 w-3" /> Copiar
            </Button>
            <Button size="sm" onClick={onExportPdf} disabled={!data}>
              <Download className="mr-2 h-3 w-3" /> PDF
            </Button>
          </div>
        </div>

        {isLoading || (!data && isFetching) ? (
          <div className="space-y-2">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : data ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <KpiBox label="MOS médio" value={data.kpis.mosAvg !== null ? data.kpis.mosAvg.toFixed(2) : '—'} />
              <KpiBox label="Chamadas" value={data.kpis.totalCalls.toString()} />
              <KpiBox label="Alertas críticos" value={data.kpis.criticalAlerts.toString()} tone={data.kpis.criticalAlerts > 5 ? 'warn' : 'ok'} />
              <KpiBox label="Ações aplicadas" value={data.kpis.appliedActions.toString()} />
              <KpiBox label="Effectiveness" value={data.kpis.effectivenessPct !== null ? `${data.kpis.effectivenessPct}%` : '—'} />
              <KpiBox label="Total alertas" value={data.kpis.totalAlerts.toString()} />
            </div>

            {data.topApplied.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                <span className="text-xs uppercase text-muted-foreground self-center">Top aplicadas:</span>
                {data.topApplied.map(t => (
                  <Badge key={t.category} variant="secondary" className="text-xs">
                    {t.category} ({t.count})
                  </Badge>
                ))}
              </div>
            )}

            <div className="rounded-lg border border-border/60 bg-muted/20 p-4 prose prose-sm prose-invert max-w-none">
              <ReactMarkdown>{data.summary}</ReactMarkdown>
            </div>

            {data.pendingHints.length > 0 && (
              <div className="rounded-lg border border-warning/40 bg-warning/5 p-3 text-xs space-y-1">
                <div className="font-semibold text-warning uppercase text-[10px]">Atenção</div>
                {data.pendingHints.map((h, i) => <div key={i}>• {h}</div>)}
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-8 text-center">Falha ao carregar resumo. Tente regenerar.</p>
        )}
      </DialogContent>
    </Dialog>
  );
};

const KpiBox = ({ label, value, tone = 'ok' }: { label: string; value: string; tone?: 'ok' | 'warn' }) => (
  <div className={`rounded border p-2 ${tone === 'warn' ? 'border-warning/40 bg-warning/5' : 'border-border/60 bg-muted/20'}`}>
    <div className="text-[10px] uppercase text-muted-foreground">{label}</div>
    <div className="text-lg font-mono font-semibold">{value}</div>
  </div>
);
