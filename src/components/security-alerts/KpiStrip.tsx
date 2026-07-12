import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface KpiStripProps {
  total: number;
  unread: number;
  critical: number;
  webhookPending: number;
  webhookOldestLabel: string;
}

/**
 * Faixa de KPIs (Total / Não lidos / Críticos / Fila webhooks) do painel de
 * alertas de segurança. Extraído de `SecurityAlerts.tsx` para reduzir a
 * complexidade do componente pai.
 */
export function KpiStrip({
  total,
  unread,
  critical,
  webhookPending,
  webhookOldestLabel,
}: KpiStripProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Total (30d)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold">{total}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Não lidos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold">{unread}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Críticos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold text-destructive">{critical}</div>
        </CardContent>
      </Card>
      <Card
        className={webhookPending > 0 ? "border-warning/60 bg-warning/5" : undefined}
        aria-live="polite"
      >
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground flex items-center justify-between">
            <span>Fila webhooks</span>
            {webhookPending > 0 && (
              <Badge variant="outline" className="text-[10px]">
                pendente
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-semibold ${webhookPending > 0 ? "text-warning" : ""}`}>
            {webhookPending}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            {webhookPending > 0 ? `mais antigo: ${webhookOldestLabel}` : "sem pendências"}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
