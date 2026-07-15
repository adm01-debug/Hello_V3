import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  totalAttempts: number;
  sent: number;
  failed: number;
  globalRatio: number;
}

export function KpiCards({ totalAttempts, sent, failed, globalRatio }: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Tentativas (72h)</CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-semibold">{totalAttempts}</CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Enviados / Falhas</CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-semibold">
          {sent} / <span className="text-destructive">{failed}</span>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Taxa de falhas</CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-semibold">{globalRatio.toFixed(1)}%</CardContent>
      </Card>
    </div>
  );
}
