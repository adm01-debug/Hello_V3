import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AlertsDailyChartProps {
  data: Array<{ day: string; label: string; count: number }>;
}

/**
 * Gráfico de barras "Alertas por dia (últimos 30 dias)" do painel de alertas
 * de segurança. Extraído de `SecurityAlerts.tsx`.
 */
export function AlertsDailyChart({ data }: AlertsDailyChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Alertas por dia (últimos 30 dias)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="label"
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                interval="preserveStartEnd"
                minTickGap={16}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                allowDecimals={false}
                width={32}
              />
              <Tooltip
                cursor={{ fill: "hsl(var(--muted) / 0.4)" }}
                contentStyle={{
                  background: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 6,
                  fontSize: 12,
                  color: "hsl(var(--popover-foreground))",
                }}
                labelFormatter={(_, payload) => {
                  const d = payload?.[0]?.payload?.day as string | undefined;
                  return d
                    ? format(new Date(`${d}T00:00:00`), "EEEE, dd 'de' MMMM", { locale: ptBR })
                    : "";
                }}
                formatter={(v) => [Number(v ?? 0), "Alertas"] as [number, string]}
              />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
