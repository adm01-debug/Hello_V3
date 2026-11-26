import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ArrowRight, ClockIcon, Loader2, TimerOff } from "lucide-react";
import { NeonPageLayout } from "@/components/layout/NeonPageLayout";
import { NeonPageHeader } from "@/components/layout/NeonPageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/ui/empty-state";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePageTitle } from "@/hooks/usePageTitle";
import {
  SLA_VIOLATIONS_PAGE_SIZE,
  describeSlaBreach,
  formatDelay,
  useSlaViolationStats,
  useSlaViolations,
  type SlaBreachKind,
} from "@/hooks/useSLA";
import { safeFormatDatePtBR } from "@/lib/safe-date";

const PERIODS = [
  { value: "7", label: "Últimos 7 dias" },
  { value: "30", label: "Últimos 30 dias" },
  { value: "90", label: "Últimos 90 dias" },
];

const BREACH_LABEL: Record<SlaBreachKind, string> = {
  first_response: "Sem primeira resposta a tempo",
  resolution: "Resolução fora do prazo",
  unknown: "Prazo estourado",
};

export default function SlaViolations() {
  usePageTitle("Violações de SLA");
  const [days, setDays] = useState("7");
  const [channel, setChannel] = useState("all");
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [page, setPage] = useState(0);

  const daysNumber = Number(days);
  const { data: stats } = useSlaViolationStats(daysNumber);
  const { data, isLoading, isError, error, refetch, isFetching } = useSlaViolations({
    days: daysNumber,
    channel,
    onlyOpen,
    page,
  });

  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / SLA_VIOLATIONS_PAGE_SIZE));

  const channelOptions = useMemo(
    () => Object.keys(stats?.byChannel ?? {}).sort(),
    [stats?.byChannel],
  );

  const resetPage = <T,>(setter: (value: T) => void) => (value: T) => {
    setPage(0);
    setter(value);
  };

  return (
    <NeonPageLayout>
      <NeonPageHeader
        title="Violações de SLA"
        description="Conversas que estouraram o prazo de primeira resposta ou de resolução, com o atraso de cada uma"
        icon={<TimerOff />}
        actions={
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching} className="gap-2">
            {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            Atualizar
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
        <Card className="p-4 bg-card/50 backdrop-blur border-destructive/30">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
            Violações no período
          </div>
          <div className="text-3xl font-bold text-destructive">{stats?.total ?? 0}</div>
        </Card>
        <Card className="p-4 bg-card/50 backdrop-blur border-primary/20">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Ainda abertas</div>
          <div className="text-3xl font-bold text-warning">{stats?.open ?? 0}</div>
        </Card>
        <Card className="p-4 bg-card/50 backdrop-blur border-primary/20">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Atraso médio</div>
          <div className="text-3xl font-bold">{formatDelay(stats?.avgDelayMinutes ?? 0)}</div>
        </Card>
        <Card className="p-4 bg-card/50 backdrop-blur border-primary/20">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Canal mais afetado</div>
          <div className="text-3xl font-bold">{stats?.topChannel ?? "—"}</div>
        </Card>
      </div>

      <Card className="p-4 mb-4 bg-card/50 backdrop-blur border-primary/20">
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-48">
            <Label className="text-xs text-muted-foreground">Período</Label>
            <Select value={days} onValueChange={resetPage(setDays)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERIODS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-48">
            <Label className="text-xs text-muted-foreground">Canal</Label>
            <Select value={channel} onValueChange={resetPage(setChannel)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os canais</SelectItem>
                {channelOptions.map((ch) => (
                  <SelectItem key={ch} value={ch}>
                    {ch}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 pb-2">
            <Switch
              id="only-open"
              checked={onlyOpen}
              onCheckedChange={resetPage(setOnlyOpen)}
            />
            <Label htmlFor="only-open" className="text-sm">
              Só conversas abertas
            </Label>
          </div>
          <div className="ml-auto pb-2 text-sm text-muted-foreground">
            {total} {total === 1 ? "violação" : "violações"} no filtro
          </div>
        </div>
      </Card>

      {isError ? (
        <EmptyState
          variant="error"
          icon={<AlertTriangle />}
          title="Não foi possível carregar as violações"
          description={(error as Error | null)?.message ?? "Tente novamente em instantes."}
        />
      ) : isLoading ? (
        <Card className="p-8 flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando violações...
        </Card>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<ClockIcon />}
          title="Nenhuma violação no período"
          description="Nenhuma conversa estourou o prazo de SLA com os filtros atuais."
        />
      ) : (
        <Card className="bg-card/50 backdrop-blur border-primary/20 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contato</TableHead>
                <TableHead>Canal</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Início</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Atraso</TableHead>
                <TableHead>Agente</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const breach = describeSlaBreach(row);
                return (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">
                      {row.contacts?.name ?? (
                        <span className="text-muted-foreground">Sem contato</span>
                      )}
                      {row.contacts?.phone && (
                        <span className="block text-xs text-muted-foreground">{row.contacts.phone}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{row.channel}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{row.priority}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{row.status}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {safeFormatDatePtBR(row.created_at, "dd/MM/yyyy HH:mm")}
                    </TableCell>
                    <TableCell className="text-sm">{BREACH_LABEL[breach.kind]}</TableCell>
                    <TableCell className="font-mono text-destructive">
                      {breach.delayMinutes === null ? "—" : formatDelay(breach.delayMinutes)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {row.assigned_agent_name ?? "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between gap-2 p-3 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              Anterior
            </Button>
            <span className="text-sm text-muted-foreground">
              Página {page + 1} de {pageCount}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page + 1 >= pageCount}
            >
              Próxima
            </Button>
          </div>
        </Card>
      )}

      <div className="mt-4">
        <Button asChild variant="ghost" className="gap-2">
          <Link to="/sla-policies">
            Ver políticas SLA <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </NeonPageLayout>
  );
}