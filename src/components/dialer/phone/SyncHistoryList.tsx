import { History, Trash2 } from 'lucide-react';
import { formatSyncEntry, type SyncHistoryEntry } from '@/lib/sync-history';
import { Button } from '@/components/ui/button';

interface SyncHistoryListProps {
  entries: readonly SyncHistoryEntry[];
  onClear: () => void;
}

/** Últimas sincronizações de preferências (somente leitura, local). */
export function SyncHistoryList({ entries, onClear }: SyncHistoryListProps) {
  if (entries.length === 0) return null;

  return (
    <div className="mt-3 border-t border-border/50 pt-2">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          <History className="h-3 w-3" aria-hidden="true" /> Últimas sincronizações
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onClear}
          aria-label="Limpar histórico de sincronizações"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
      <ul className="space-y-0.5">
        {entries.map((entry) => (
          <li
            key={`${entry.at}-${entry.subject}-${entry.detail}`}
            className="truncate text-[11px] text-muted-foreground"
            title={formatSyncEntry(entry)}
          >
            {formatSyncEntry(entry)}
          </li>
        ))}
      </ul>
    </div>
  );
}
