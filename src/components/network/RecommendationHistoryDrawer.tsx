import { useMemo, useState } from 'react';
import { History, Download, Filter, X } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, ResponsiveContainer, Tooltip as RTooltip, XAxis } from 'recharts';
import { useVoipRecommendationHistory, type HistoryPeriod, type HistoryOutcome } from '@/hooks/useVoipRecommendationHistory';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const OUTCOME_LABEL: Record<HistoryOutcome, string> = {
  applied: 'Aplicada',
  auto_applied: 'Auto-aplicada',
  snoozed: 'Adiada',
  dismissed: 'Dispensada',
};

const OUTCOME_COLOR: Record<HistoryOutcome, string> = {
  applied: 'bg-primary/10 text-primary border-primary/30',
  auto_applied: 'bg-success/10 text-success border-success/30',
  snoozed: 'bg-warning/10 text-warning border-warning/30',
  dismissed: 'bg-muted/40 text-muted-foreground border-border',
};

const CATEGORY_LABEL: Record<string, string> = {
  capacity: 'Capacidade',
  quality: 'Qualidade',
  infra: 'Infraestrutura',
  process: 'Processo',
};

function toCsv(rows: Array<Record<string, unknown>>): string {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.join(','), ...rows.map(r => headers.map(h => escape(r[h])).join(','))];
  return '\uFEFF' + lines.join('\n'); // BOM UTF-8
}

export function RecommendationHistoryDrawer() {
  const [open, setOpen] = useState(false);
  const [period, setPeriod] = useState<HistoryPeriod>('week');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [outcomeFilter, setOutcomeFilter] = useState<string>('all');

  const { data, isLoading, error } = useVoipRecommendationHistory({ period, limit: 50, enabled: open });

  const filtered = useMemo(() => {
    const items = data?.items ?? [];
    return items.filter(i =>
      (categoryFilter === 'all' || i.category === categoryFilter) &&
      (outcomeFilter === 'all' || i.outcome === outcomeFilter)
    );
  }, [data, categoryFilter, outcomeFilter]);

  const handleExport = () => {
    if (!filtered.length) {
      toast.warning('Sem ações para exportar');
      return;
    }
    const csv = toCsv(filtered.map(i => ({
      data: new Date(i.applied_at).toLocaleString('pt-BR'),
      categoria: CATEGORY_LABEL[i.category] ?? i.category,
      severidade: i.severity,
      outcome: OUTCOME_LABEL[i.outcome] ?? i.outcome,
      acao: i.action_type,
      recomendacao: i.recommendation_id,
      notas: i.notes ?? '',
    })));
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recomendacoes-historico-${period}-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`${filtered.length} ações exportadas`);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5">
          <History className="h-3.5 w-3.5" /> Histórico
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" /> Histórico de Recomendações
          </SheetTitle>
          <SheetDescription>
            Auditoria de ações tomadas: aplicar, adiar, dispensar e auto-aplicar
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {/* Filtros */}
          <div className="flex flex-wrap gap-2">
            <Select value={period} onValueChange={(v) => setPeriod(v as HistoryPeriod)}>
              <SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="day">24h</SelectItem>
                <SelectItem value="week">7 dias</SelectItem>
                <SelectItem value="month">30 dias</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas categorias</SelectItem>
                <SelectItem value="capacity">Capacidade</SelectItem>
                <SelectItem value="quality">Qualidade</SelectItem>
                <SelectItem value="infra">Infraestrutura</SelectItem>
                <SelectItem value="process">Processo</SelectItem>
              </SelectContent>
            </Select>
            <Select value={outcomeFilter} onValueChange={setOutcomeFilter}>
              <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos outcomes</SelectItem>
                <SelectItem value="applied">Aplicada</SelectItem>
                <SelectItem value="auto_applied">Auto-aplicada</SelectItem>
                <SelectItem value="snoozed">Adiada</SelectItem>
                <SelectItem value="dismissed">Dispensada</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" onClick={handleExport}>
              <Download className="h-3.5 w-3.5" /> CSV
            </Button>
          </div>

          {/* Sparkline 14d */}
          {data?.aggregations.perDay && (
            <div className="rounded-lg border border-border/40 bg-muted/20 p-3">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Ações por dia (14d)</p>
              <ResponsiveContainer width="100%" height={60}>
                <LineChart data={data.aggregations.perDay}>
                  <XAxis dataKey="date" hide />
                  <RTooltip
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11 }}
                    labelFormatter={(v) => new Date(v as string).toLocaleDateString('pt-BR')}
                  />
                  <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Lista */}
          {isLoading ? (
            <div className="space-y-2">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : error ? (
            <p className="text-sm text-destructive">Erro ao carregar histórico</p>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Filter className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhuma ação encontrada para os filtros</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {filtered.map(item => (
                <div key={item.id} className="rounded-md border border-border/40 bg-card/40 p-2.5 text-xs">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge variant="outline" className={cn('text-[10px]', OUTCOME_COLOR[item.outcome])}>
                        {OUTCOME_LABEL[item.outcome]}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] bg-muted/40">
                        {CATEGORY_LABEL[item.category] ?? item.category}
                      </Badge>
                      <span className="text-[10px] uppercase text-muted-foreground">{item.severity}</span>
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {new Date(item.applied_at).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <p className="mt-1 font-mono text-[11px] text-foreground/80 truncate">{item.recommendation_id}</p>
                  {item.notes && <p className="mt-0.5 text-[11px] text-muted-foreground italic">{item.notes}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
