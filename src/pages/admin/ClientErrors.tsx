import { useMemo, useState } from "react";
import { AlertTriangle, ChevronLeft, ChevronRight, RefreshCw, Search } from "lucide-react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CLIENT_ERRORS_PAGE_SIZE,
  clientErrorTypeLabel,
  useClientErrorStats,
  useClientErrors,
  useResolveClientError,
} from "@/hooks/useClientErrors";

function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("pt-BR");
}

export default function ClientErrors() {
  usePageTitle("Erros do Cliente");

  const [onlyOpen, setOnlyOpen] = useState(true);
  const [routeFilter, setRouteFilter] = useState("");
  const [page, setPage] = useState(0);

  const { data, isLoading, isFetching, isError, error, refetch } = useClientErrors({
    page,
    onlyOpen,
    route: routeFilter,
  });
  const stats = useClientErrorStats();
  const resolve = useResolveClientError();

  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / CLIENT_ERRORS_PAGE_SIZE));

  const kpis = useMemo(
    () => [
      { label: "Ultimas 24h", value: stats.data?.last24h ?? 0 },
      { label: "Nao resolvidos", value: stats.data?.open ?? 0 },
      { label: "No filtro atual", value: total },
    ],
    [stats.data, total],
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold">Erros do Cliente</h1>
        <p className="text-muted-foreground">
          Erros de JavaScript que quebraram a tela e que ninguem tratou. Gravados pelo
          reporter do navegador; use a rota e o trace para localizar a causa.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {kpi.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3 flex-wrap">
          <CardTitle>Ocorrencias</CardTitle>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                aria-label="Filtrar por rota"
                placeholder="Filtrar por rota (ex.: /calls)"
                className="pl-8 w-56"
                value={routeFilter}
                onChange={(e) => {
                  setRouteFilter(e.target.value);
                  setPage(0);
                }}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="only-open"
                checked={onlyOpen}
                onCheckedChange={(v) => {
                  setOnlyOpen(v);
                  setPage(0);
                }}
              />
              <Label htmlFor="only-open">So nao resolvidos</Label>
            </div>
            <Button variant="outline" size="sm" onClick={() => void refetch()} disabled={isFetching}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="space-y-2">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : isError ? (
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <span>Nao foi possivel carregar os erros: {(error as Error)?.message}</span>
            </div>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {onlyOpen
                ? "Nenhum erro em aberto. Nada quebrou desde a ultima limpeza."
                : "Nenhum erro registrado para este filtro."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Quando</TableHead>
                    <TableHead>Rota</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="min-w-[280px]">Mensagem</TableHead>
                    <TableHead>Trace</TableHead>
                    <TableHead className="text-right">Acao</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="whitespace-nowrap text-sm">
                        {formatWhen(row.occurred_at)}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{row.route}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{clientErrorTypeLabel(row.error_type)}</Badge>
                      </TableCell>
                      <TableCell className="text-sm" title={row.stack ?? row.message}>
                        <span className="line-clamp-2">{row.message}</span>
                      </TableCell>
                      <TableCell className="font-mono text-[11px] text-muted-foreground">
                        {row.correlation_id ?? "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {row.resolved_at ? (
                          <Badge variant="secondary">Resolvido</Badge>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={resolve.isPending}
                            onClick={() => resolve.mutate(row.id)}
                          >
                            Resolver
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              {total} ocorrencia(s) · pagina {page + 1} de {pageCount}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={page + 1 >= pageCount}
              >
                Proxima
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}