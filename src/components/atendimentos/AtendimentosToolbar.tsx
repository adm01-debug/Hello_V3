
import { memo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Download, RefreshCw, Phone, PhoneOff, UserPlus } from 'lucide-react';
import { SearchInput } from '@/components/SearchInput';
import { SavedFiltersDropdown } from '@/components/SavedFiltersDropdown';
// import { AdvancedFilters, FilterValue, FilterConfig } from '@/components/AdvancedFilters';
// import { BulkActionsBar } from '@/components/BulkActionsBar';
// import { helloFilterConfigs } from '@/lib/helloSchemas';
// import { exportToExcel } from '@/lib/excelImporter';
import { toast } from 'sonner';

interface AtendimentosToolbarProps {
  onSearch: (term: string) => void;
  onFiltersChange: (filters: FilterValue[]) => void;
  onRefresh: () => void;
  onNewClick: () => void;
  selectedCount: number;
  onClearSelection: () => void;
  onBulkFinalizar: () => void;
  onBulkTransferir: () => void;
  currentFilters: Record<string, unknown>;
  data?: unknown[];
}

export const AtendimentosToolbar = memo(function AtendimentosToolbar({ onSearch, onFiltersChange, onRefresh, onNewClick, selectedCount, onClearSelection, onBulkFinalizar, onBulkTransferir, currentFilters, data = [] }: AtendimentosToolbarProps) {
  const [filterValues, setFilterValues] = useState<FilterValue[]>([]);

  const handleExport = () => {
    if (data.length === 0) { toast.warning('Nenhum dado'); return; }
    exportToExcel(data as Record<string, unknown>[], [
      { key: 'protocolo' as const, label: 'Protocolo' },
      { key: 'cliente_nome' as const, label: 'Cliente' },
      { key: 'canal' as const, label: 'Canal' },
      { key: 'tipo' as const, label: 'Tipo' },
      { key: 'status' as const, label: 'Status' },
      { key: 'atendente_nome' as const, label: 'Atendente' },
    ], 'atendimentos', 'Atendimentos');
    toast.success('Exportado!');
  };

  const bulkActions = [
    { key: 'transferir', label: 'Transferir', icon: <UserPlus className="h-4 w-4" />, onClick: onBulkTransferir },
    { key: 'finalizar', label: 'Finalizar', icon: <PhoneOff className="h-4 w-4" />, onClick: onBulkFinalizar },
  ];

  return (
    <div className="space-y-3">
      {selectedCount > 0 && <BulkActionsBar selectedCount={selectedCount} onClearSelection={onClearSelection} actions={bulkActions} />}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2 items-center">
          <SearchInput onSearch={onSearch} placeholder="Buscar atendimento..." className="w-64" />
          <AdvancedFilters filters={helloFilterConfigs.atendimentos as FilterConfig[]} values={filterValues} onChange={(v) => { setFilterValues(v); onFiltersChange(v); }} />
          <SavedFiltersDropdown entityType="atendimentos" currentFilters={currentFilters} onApplyFilter={(f) => { const values = Object.entries(f).map(([k,v]) => ({ key: k, operator: 'eq' as const, value: v })); setFilterValues(values); onFiltersChange(values); }} />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onRefresh}><RefreshCw className="h-4 w-4" /></Button>
          <Button variant="outline" size="sm" onClick={handleExport}><Download className="h-4 w-4" /></Button>
          <Button size="sm" onClick={onNewClick}><Plus className="h-4 w-4" /></Button>
        </div>
      </div>
    </div>
  );
});
export default AtendimentosToolbar;
