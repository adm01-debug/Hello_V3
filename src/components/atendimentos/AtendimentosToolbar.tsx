
import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Download, RefreshCw } from 'lucide-react';
import { SearchInput } from '@/components/SearchInput';
import { toast } from 'sonner';

interface AtendimentosToolbarProps {
  onSearch: (term: string) => void;
  onRefresh: () => void;
  onNewClick: () => void;
}

export const AtendimentosToolbar = memo(function AtendimentosToolbar({ onSearch, onNewClick, onRefresh }: AtendimentosToolbarProps) {
  const handleExport = () => toast.info('Exportação não implementada');

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2 items-center">
          <SearchInput onChange={onSearch} placeholder="Buscar atendimento..." className="w-64" />
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
