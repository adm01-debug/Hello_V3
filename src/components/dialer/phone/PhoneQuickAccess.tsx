import { Clock, Star, ClipboardPaste, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { formatPhoneDisplay } from './phone-utils';

export interface QuickAccessEntry {
  id: string;
  name: string;
  phone: string;
  hint?: string;
  favorite?: boolean;
}

interface PhoneQuickAccessProps {
  recents: QuickAccessEntry[];
  favorites: QuickAccessEntry[];
  isLoading?: boolean;
  onSelect: (phone: string, name?: string) => void;
  onPaste: () => void;
  onOpenContacts: () => void;
}

function EntryRow({
  entry,
  onSelect,
}: {
  entry: QuickAccessEntry;
  onSelect: (phone: string, name?: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(entry.phone, entry.name)}
      className={cn(
        'flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left transition-colors',
        'hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
      )}
    >
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium text-foreground">{entry.name}</span>
        <span className="block truncate text-xs text-muted-foreground">
          {formatPhoneDisplay(entry.phone) || entry.phone}
        </span>
      </span>
      {entry.hint ? (
        <span className="shrink-0 text-[11px] text-muted-foreground">{entry.hint}</span>
      ) : null}
    </button>
  );
}

/** Painel lateral com favoritos, recentes e atalhos. */
export function PhoneQuickAccess({
  recents,
  favorites,
  isLoading = false,
  onSelect,
  onPaste,
  onOpenContacts,
}: PhoneQuickAccessProps) {
  return (
    <div className="flex h-full flex-col gap-4 rounded-xl border border-border/50 bg-card/60 p-4 backdrop-blur-sm">
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onPaste}>
          <ClipboardPaste className="mr-2 h-4 w-4" />
          Colar número
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onOpenContacts}>
          <Users className="mr-2 h-4 w-4" />
          Contatos
        </Button>
      </div>

      <section aria-labelledby="favoritos-heading">
        <h3
          id="favoritos-heading"
          className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground"
        >
          <Star className="h-3.5 w-3.5" /> Favoritos
        </h3>
        {favorites.length === 0 ? (
          <p className="px-3 text-xs text-muted-foreground">Nenhum favorito ainda.</p>
        ) : (
          <ul className="space-y-1">
            {favorites.map((entry) => (
              <li key={entry.id}>
                <EntryRow entry={entry} onSelect={onSelect} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="recentes-heading" className="flex min-h-0 flex-1 flex-col">
        <h3
          id="recentes-heading"
          className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground"
        >
          <Clock className="h-3.5 w-3.5" /> Recentes
        </h3>
        <ScrollArea className="min-h-0 flex-1 pr-2">
          {isLoading ? (
            <p className="px-3 text-xs text-muted-foreground">Carregando…</p>
          ) : recents.length === 0 ? (
            <p className="px-3 text-xs text-muted-foreground">Sem chamadas recentes.</p>
          ) : (
            <ul className="space-y-1">
              {recents.map((entry) => (
                <li key={entry.id}>
                  <EntryRow entry={entry} onSelect={onSelect} />
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </section>
    </div>
  );
}
