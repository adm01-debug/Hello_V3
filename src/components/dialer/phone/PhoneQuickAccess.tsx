import { useMemo, useState } from 'react';
import { Clock, Star, ClipboardPaste, Users, ChevronUp, ChevronDown, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { formatPhoneDisplay } from './phone-utils';
import { FavoriteTagMenu } from './FavoriteTagMenu';
import { RingtoneSettings } from './RingtoneSettings';
import { FavoriteTagFilter } from './FavoriteTagFilter';
import { usePersistedTagFilter } from '@/hooks/usePersistedTagFilter';
import {
  buildTagFilterOptions,
  collectTagOptions,
  filterFavoritesByTag,
  groupFavoritesByTag,
  normalizeTag,
  resolveActiveFilter,
} from '@/lib/dialer-favorite-tags';


export interface QuickAccessEntry {
  id: string;
  name: string;
  phone: string;
  hint?: string;
  favorite?: boolean;
  /** Etiqueta (grupo) do favorito; ausente em recentes. */
  tag?: string | null;
}

interface PhoneQuickAccessProps {
  recents: QuickAccessEntry[];
  favorites: QuickAccessEntry[];
  isLoading?: boolean;
  onSelect: (phone: string, name?: string) => void;
  onPaste: () => void;
  onOpenContacts: () => void;
  /** Indica se o número já está salvo como favorito do usuário. */
  isFavorite?: (phone: string) => boolean;
  /** Alterna o favorito persistido do usuário. */
  onToggleFavorite?: (phone: string, label?: string | null) => void;
  /** Reordena os favoritos persistidos (drag-and-drop ou teclado). */
  onReorderFavorite?: (from: number, to: number) => void;
  /** Define ou remove a etiqueta (grupo) de um favorito. */
  onSetFavoriteTag?: (id: string, tag: string | null) => void;
}

interface ReorderControls {
  index: number;
  total: number;
  onMove: (from: number, to: number) => void;
  onDragStart: () => void;
  onDragOver: () => void;
  onDrop: () => void;
  isDragging: boolean;
}

function EntryRow({
  entry,
  onSelect,
  isFavorite,
  onToggleFavorite,
  reorder,
  tagMenu,
}: {
  entry: QuickAccessEntry;
  onSelect: (phone: string, name?: string) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (phone: string, label?: string | null) => void;
  reorder?: ReorderControls;
  tagMenu?: { options: readonly string[]; onSelect: (tag: string | null) => void };
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-1 rounded-lg pr-1 transition-colors hover:bg-accent',
        reorder?.isDragging && 'opacity-50 ring-1 ring-primary',
      )}
      draggable={Boolean(reorder)}
      onDragStart={() => reorder?.onDragStart()}
      onDragOver={(event) => {
        if (!reorder) return;
        event.preventDefault();
        reorder.onDragOver();
      }}
      onDrop={(event) => {
        if (!reorder) return;
        event.preventDefault();
        reorder.onDrop();
      }}
      onDragEnd={() => reorder?.onDrop()}
    >
      {reorder ? (
        <span
          aria-hidden="true"
          className="shrink-0 cursor-grab pl-1 text-muted-foreground active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4" />
        </span>
      ) : null}
      <button
        type="button"
        onClick={() => onSelect(entry.phone, entry.name)}
        className={cn(
          'flex min-w-0 flex-1 items-center justify-between gap-3 rounded-lg px-3 py-2 text-left',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
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
      {reorder ? (
        <>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            disabled={reorder.index === 0}
            aria-label={`Mover ${entry.name} para cima`}
            onClick={() => reorder.onMove(reorder.index, reorder.index - 1)}
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            disabled={reorder.index === reorder.total - 1}
            aria-label={`Mover ${entry.name} para baixo`}
            onClick={() => reorder.onMove(reorder.index, reorder.index + 1)}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </>
      ) : null}
      {tagMenu ? (
        <FavoriteTagMenu
          entryName={entry.name}
          currentTag={normalizeTag(entry.tag)}
          options={tagMenu.options}
          onSelect={tagMenu.onSelect}
        />
      ) : null}
      {onToggleFavorite ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0"
          aria-pressed={Boolean(isFavorite)}
          aria-label={isFavorite ? `Remover ${entry.name} dos favoritos` : `Adicionar ${entry.name} aos favoritos`}
          onClick={() => onToggleFavorite(entry.phone, entry.name)}
        >
          <Star className={cn('h-4 w-4', isFavorite ? 'fill-primary text-primary' : 'text-muted-foreground')} />
        </Button>
      ) : null}
    </div>
  );
}

/** Painel lateral com favoritos agrupados, recentes, atalhos e toque. */
export function PhoneQuickAccess({
  recents,
  favorites,
  isLoading = false,
  onSelect,
  onPaste,
  onOpenContacts,
  isFavorite,
  onToggleFavorite,
  onReorderFavorite,
  onSetFavoriteTag,
}: PhoneQuickAccessProps) {
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  const commitDrop = () => {
    if (dragFrom !== null && dragOver !== null && dragFrom !== dragOver) {
      onReorderFavorite?.(dragFrom, dragOver);
    }
    setDragFrom(null);
    setDragOver(null);
  };

  // Filtro lembrado entre sessões (escopado por usuário) + origem da última mudança remota.
  const {
    filter: tagFilter,
    setFilter: setTagFilter,
    remoteDevice: filterRemoteDevice,
    remoteUpdatedAt: filterRemoteUpdatedAt,
    acknowledgeRemoteUpdate: acknowledgeFilterUpdate,
  } = usePersistedTagFilter();



  const filterOptions = useMemo(() => buildTagFilterOptions(favorites), [favorites]);
  // Reconcilia o filtro sempre que a lista muda (etiqueta removida/renomeada).
  const activeFilter = useMemo(() => resolveActiveFilter(favorites, tagFilter), [favorites, tagFilter]);
  const visibleFavorites = useMemo(
    () => filterFavoritesByTag(favorites, activeFilter),
    [favorites, activeFilter],
  );

  const groups = useMemo(() => groupFavoritesByTag(visibleFavorites), [visibleFavorites]);
  const tagOptions = useMemo(() => collectTagOptions(favorites), [favorites]);
  // Índice global preserva a semântica de posição usada na persistência.
  const indexOf = useMemo(() => {
    const map = new Map<string, number>();
    favorites.forEach((entry, index) => map.set(entry.id, index));
    return map;
  }, [favorites]);

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
        <FavoriteTagFilter options={filterOptions} value={activeFilter} onChange={setTagFilter} />
        {favorites.length === 0 ? (
          <p className="px-3 text-xs text-muted-foreground">Nenhum favorito ainda.</p>
        ) : visibleFavorites.length === 0 ? (
          <p className="px-3 text-xs text-muted-foreground">Nenhum favorito nesta etiqueta.</p>
        ) : (
          <div className="space-y-3">
            {groups.map((group) => (
              <div key={group.tag ?? '__untagged__'}>
                {groups.length > 1 ? (
                  <p className="px-3 pb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    {group.label}
                  </p>
                ) : null}
                <ul className="space-y-1">
                  {group.items.map((entry) => {
                    const index = indexOf.get(entry.id) ?? 0;
                    return (
                      <li key={entry.id}>
                        <EntryRow
                          entry={entry}
                          onSelect={onSelect}
                          isFavorite={isFavorite?.(entry.phone) ?? entry.favorite}
                          onToggleFavorite={onToggleFavorite}
                          tagMenu={
                            onSetFavoriteTag
                              ? {
                                  options: tagOptions,
                                  onSelect: (tag) => onSetFavoriteTag(entry.id, tag),
                                }
                              : undefined
                          }
                          reorder={
                            onReorderFavorite && favorites.length > 1
                              ? {
                                  index,
                                  total: favorites.length,
                                  onMove: onReorderFavorite,
                                  onDragStart: () => setDragFrom(index),
                                  onDragOver: () => setDragOver(index),
                                  onDrop: commitDrop,
                                  isDragging: dragFrom === index,
                                }
                              : undefined
                          }
                        />
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      <RingtoneSettings />

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
                  <EntryRow
                    entry={entry}
                    onSelect={onSelect}
                    isFavorite={isFavorite?.(entry.phone) ?? entry.favorite}
                    onToggleFavorite={onToggleFavorite}
                  />
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </section>
    </div>
  );
}
