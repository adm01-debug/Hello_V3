import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export type HealthFilter = 'all' | 'healthy' | 'warning' | 'critical';

export interface ExtensionsFiltersProps {
  search: string;
  onSearch: (v: string) => void;
  statusFilter: string;
  onStatusFilter: (v: string) => void;
  trunkFilter: string;
  onTrunkFilter: (v: string) => void;
  healthFilter: HealthFilter;
  onHealthFilter: (v: HealthFilter) => void;
}

export function ExtensionsFilters({
  search, onSearch, statusFilter, onStatusFilter,
  trunkFilter, onTrunkFilter, healthFilter, onHealthFilter,
}: ExtensionsFiltersProps) {
  return (
    <div className="flex flex-col md:flex-row gap-3 flex-wrap">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, ramal ou e-mail..."
          value={search}
          onChange={e => onSearch(e.target.value)}
          className="pl-9"
        />
      </div>
      <Select value={statusFilter} onValueChange={onStatusFilter}>
        <SelectTrigger className="w-full md:w-40"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos status</SelectItem>
          <SelectItem value="available">Disponível</SelectItem>
          <SelectItem value="busy">Ocupado</SelectItem>
          <SelectItem value="away">Ausente</SelectItem>
          <SelectItem value="offline">Offline</SelectItem>
        </SelectContent>
      </Select>
      <Select value={trunkFilter} onValueChange={onTrunkFilter}>
        <SelectTrigger className="w-full md:w-40"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos trunks</SelectItem>
          <SelectItem value="with">Com trunk</SelectItem>
          <SelectItem value="without">Sem trunk</SelectItem>
        </SelectContent>
      </Select>
      <Select value={healthFilter} onValueChange={v => onHealthFilter(v as HealthFilter)}>
        <SelectTrigger className="w-full md:w-44"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Toda saúde</SelectItem>
          <SelectItem value="healthy">Saudáveis (≥80)</SelectItem>
          <SelectItem value="warning">Atenção (50-79)</SelectItem>
          <SelectItem value="critical">Críticos (&lt;50)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
