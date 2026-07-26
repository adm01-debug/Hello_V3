import { useMemo, useState } from 'react';
import { Download, History, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useSyncHistory } from '@/hooks/useSyncHistory';
import { toast } from 'sonner';
import {
  buildSyncHistoryCsv,
  filterSyncEntries,
  formatSyncEntry,
  listSyncSubjects,
} from '@/lib/sync-history';

/**
 * Painel unificado com as últimas sincronizações de preferências
 * (toque, voz, favoritos, filtro de etiquetas, apelido do dispositivo).
 * Fonte local por usuário — nunca participa de autorização.
 */
export function SyncHistoryPanel() {
  const { user } = useAuth();
  const { entries, clear } = useSyncHistory(user?.id ?? null);
  const [subject, setSubject] = useState<string | null>(null);

  const subjects = useMemo(() => listSyncSubjects(entries), [entries]);
  const visible = useMemo(() => filterSyncEntries(entries, subject), [entries, subject]);

  const exportCsv = () => {
    try {
      const csv = buildSyncHistoryCsv(visible);
      const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sincronizacoes-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success('Histórico exportado em CSV');
    } catch {
      toast.error('Não foi possível exportar o histórico');
    }
  };

  if (entries.length === 0) return null;

  return (
    <section
      className="rounded-xl border border-border/50 bg-card/60 p-3 backdrop-blur"
      aria-label="Histórico de sincronizações"
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          <History className="h-3 w-3" aria-hidden="true" /> Sincronizações recentes
        </span>
        <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={exportCsv}
          aria-label="Exportar histórico em CSV"
        >
          <Download className="h-3 w-3" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => {
            clear();
            setSubject(null);
          }}
          aria-label="Limpar histórico de sincronizações"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
        </div>
      </div>

      {subjects.length > 1 && (
        <div className="mb-2 flex flex-wrap gap-1" role="group" aria-label="Filtrar por assunto">
          {[null, ...subjects].map((option) => {
            const isActive = option === subject;
            return (
              <button
                key={option ?? '__all__'}
                type="button"
                aria-pressed={isActive}
                onClick={() => setSubject(option)}
                className={cn(
                  'rounded-full border px-2 py-0.5 text-[10px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  isActive
                    ? 'border-primary bg-primary/15 text-primary'
                    : 'border-border/60 text-muted-foreground hover:bg-muted/50',
                )}
              >
                {option ?? 'Tudo'}
              </button>
            );
          })}
        </div>
      )}

      <ul className="space-y-0.5">
        {visible.map((entry) => (
          <li
            key={`${entry.at}-${entry.subject}-${entry.detail}`}
            className="truncate text-[11px] text-muted-foreground"
            title={formatSyncEntry(entry)}
          >
            {formatSyncEntry(entry)}
          </li>
        ))}
      </ul>
    </section>
  );
}
