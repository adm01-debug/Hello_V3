import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Loader2, Network, PowerOff, X } from 'lucide-react';

export interface BulkActionsBarProps {
  count: number;
  bulkOffline: boolean;
  onAssignTrunk: () => void;
  onForceOffline: () => void;
  onExport: () => void;
  onClear: () => void;
}

export function BulkActionsBar({
  count, bulkOffline, onAssignTrunk, onForceOffline, onExport, onClear,
}: BulkActionsBarProps) {
  if (count === 0) return null;
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4">
      <Card className="border-primary/40 shadow-[0_0_30px_hsl(var(--primary)/0.3)] backdrop-blur-md bg-card/95">
        <CardContent className="flex items-center gap-3 py-3 px-4">
          <span className="text-sm font-semibold text-primary">
            {count} selecionado{count > 1 ? 's' : ''}
          </span>
          <div className="h-6 w-px bg-border" />
          <Button size="sm" variant="outline" onClick={onAssignTrunk}>
            <Network className="h-4 w-4 mr-2" /> Atribuir trunk
          </Button>
          <Button size="sm" variant="outline" onClick={onForceOffline} disabled={bulkOffline}>
            {bulkOffline ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <PowerOff className="h-4 w-4 mr-2" />}
            Forçar offline
          </Button>
          <Button size="sm" variant="outline" onClick={onExport}>
            <Download className="h-4 w-4 mr-2" /> Exportar CSV
          </Button>
          <Button size="sm" variant="ghost" onClick={onClear} aria-label="Limpar seleção">
            <X className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
