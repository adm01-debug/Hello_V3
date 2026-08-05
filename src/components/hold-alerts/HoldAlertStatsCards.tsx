import { Card, CardContent } from '@/components/ui/card';
import { Bell, Info, AlertCircle, AlertTriangle } from 'lucide-react';

export interface HoldAlertStats {
  total: number;
  unread: number;
  critical: number;
  warning: number;
}

export function HoldAlertStatsCards({ stats }: { stats: HoldAlertStats }) {
  const cards = [
    { label: 'Total de Alertas', value: stats.total, color: 'text-foreground', Icon: Bell, iconColor: 'text-muted-foreground/50' },
    { label: 'Não Lidos', value: stats.unread, color: 'text-primary', Icon: Info, iconColor: 'text-primary/50' },
    { label: 'Críticos', value: stats.critical, color: 'text-destructive', Icon: AlertCircle, iconColor: 'text-destructive/50' },
    { label: 'Avisos', value: stats.warning, color: 'text-warning', Icon: AlertTriangle, iconColor: 'text-warning/50' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {cards.map(({ label, value, color, Icon, iconColor }) => (
        <Card key={label}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
              </div>
              <Icon className={`h-8 w-8 ${iconColor}`} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
