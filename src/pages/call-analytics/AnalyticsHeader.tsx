import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { DateRange } from '@/hooks/useCallAnalytics';
import { Calendar } from 'lucide-react';

interface Props {
  dateRange: DateRange;
  onChange: (v: DateRange) => void;
}

export function AnalyticsHeader({ dateRange, onChange }: Props) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gradient">Analytics de Chamadas</h1>
        <p className="text-muted-foreground">Estatísticas e insights das chamadas atendidas</p>
      </div>
      <Select value={dateRange} onValueChange={(v) => onChange(v as DateRange)}>
        <SelectTrigger className="w-[180px]">
          <Calendar className="h-4 w-4 mr-2" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="week">Última semana</SelectItem>
          <SelectItem value="month">Último mês</SelectItem>
          <SelectItem value="3months">Últimos 3 meses</SelectItem>
          <SelectItem value="all">Todo período</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
