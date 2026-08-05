import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { BlfSummary } from '@/lib/blf';

const ITEMS: Array<{ key: keyof BlfSummary; label: string; cls: string }> = [
  { key: 'ringing', label: 'Chamando', cls: 'text-primary' },
  { key: 'talking', label: 'Em chamada', cls: 'text-warning' },
  { key: 'hold', label: 'Em espera', cls: 'text-destructive' },
  { key: 'parked', label: 'Estacionadas', cls: 'text-accent-foreground' },
  { key: 'available', label: 'Disponíveis', cls: 'text-success' },
  { key: 'offline', label: 'Offline', cls: 'text-muted-foreground' },
];

export function BlfSummaryBar({ summary }: { summary: BlfSummary }) {
  return (
    <Card>
      <CardContent className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-4 lg:grid-cols-7">
        {ITEMS.map((item) => (
          <div key={item.key}>
            <p className={cn('text-2xl font-bold tabular-nums', item.cls)}>{summary[item.key]}</p>
            <p className="text-xs text-muted-foreground">{item.label}</p>
          </div>
        ))}
        <div>
          <p className="text-2xl font-bold tabular-nums">{summary.occupancyPercent}%</p>
          <p className="text-xs text-muted-foreground">Ocupação</p>
        </div>
      </CardContent>
    </Card>
  );
}
