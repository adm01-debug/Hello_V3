import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarClock } from "lucide-react";
import type { CronHealthRow } from "./types";

interface Props {
  isLoading: boolean;
  rows?: CronHealthRow[];
}

const STATE_LABEL: Record<string, { label: string; className: string }> = {
  ok: { label: "ok", className: "bg-success/20 text-success" },
  falhando: { label: "falhando", className: "bg-destructive/20 text-destructive" },
  parado: { label: "parado", className: "bg-warning/20 text-warning" },
  nunca_executou: { label: "nunca executou", className: "bg-warning/20 text-warning" },
  inativo: { label: "inativo", className: "bg-muted text-muted-foreground" },
};

function pct(value: number | null, total: number): string {
  if (!total) return "—";
  return `${Math.round((value ?? 0) / total * 100)}%`;
}

export function CronHealthCard({ isLoading, rows }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarClock className="w-4 h-4 text-primary" />
          Crons agendados
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : !rows || rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum cron agendado encontrado.</p>
        ) : (
          <div className="space-y-2">
            {rows.map((r) => {
              const state = STATE_LABEL[r.state] ?? { label: r.state, className: "bg-muted text-muted-foreground" };
              return (
                <div
                  key={r.jobname}
                  className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-md border bg-card/50"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm truncate">{r.jobname}</span>
                      <Badge className={state.className}>{state.label}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <span className="font-mono">{r.schedule}</span>
                      {r.expected_every_minutes !== null && (
                        <> · a cada ~{r.expected_every_minutes} min</>
                      )}
                      {r.hours_since_last !== null && (
                        <> · última execução há {r.hours_since_last} h</>
                      )}
                      {r.last_duration_seconds !== null && (
                        <> · durou {r.last_duration_seconds}s</>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-xs">
                    <div className="text-muted-foreground">24 h</div>
                    <div className="font-mono">
                      {r.runs_24h} execuções ·{" "}
                      <span className={r.failures_24h > 0 ? "text-destructive" : ""}>
                        {r.failures_24h} falhas ({pct(r.failures_24h, r.runs_24h)})
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-3">
          Um job é marcado como <strong>falhando</strong> quando a última execução não teve sucesso e como{" "}
          <strong>parado</strong> quando passa de três vezes a cadência observada (mínimo de 2 horas). O vigia
          horário avisa os administradores no sino de notificações.
        </p>
      </CardContent>
    </Card>
  );
}