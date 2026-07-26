import { cn } from '@/lib/utils';
import type { TagFilter, TagFilterOption } from '@/lib/dialer-favorite-tags';

interface FavoriteTagFilterProps {
  options: readonly TagFilterOption[];
  value: TagFilter;
  onChange: (next: TagFilter) => void;
}

/**
 * Chips de filtro rápido por etiqueta.
 * Renderiza nada quando há apenas a opção "Todos" (nenhuma etiqueta em uso),
 * evitando poluir o painel com um controle sem função.
 */
export function FavoriteTagFilter({ options, value, onChange }: FavoriteTagFilterProps) {
  if (options.length <= 2) return null;

  return (
    <div
      role="group"
      aria-label="Filtrar favoritos por etiqueta"
      className="mb-2 flex flex-wrap gap-1.5 px-1"
    >
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={String(option.value)}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(option.value)}
            className={cn(
              'rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              isActive
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border/60 bg-muted/40 text-muted-foreground hover:bg-accent hover:text-foreground',
            )}
          >
            {option.label}
            <span className="ml-1 opacity-70">{option.count}</span>
          </button>
        );
      })}
    </div>
  );
}
