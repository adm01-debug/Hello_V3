import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { LAMP_LABELS, formatElapsed, type BlfLamp, type LampState } from '@/lib/blf';

const STATE_STYLES: Record<LampState, { card: string; dot: string; badge: string }> = {
  talking: {
    card: 'border-warning/40 bg-warning/5 shadow-[0_0_14px_hsl(var(--warning)/0.12)]',
    dot: 'bg-warning animate-pulse',
    badge: 'bg-warning/15 text-warning border-warning/30',
  },
  ringing: {
    card: 'border-primary/50 bg-primary/5 shadow-[0_0_16px_hsl(var(--primary)/0.18)]',
    dot: 'bg-primary animate-ping',
    badge: 'bg-primary/15 text-primary border-primary/30',
  },
  hold: {
    card: 'border-destructive/40 bg-destructive/5',
    dot: 'bg-destructive animate-pulse',
    badge: 'bg-destructive/15 text-destructive border-destructive/30',
  },
  parked: {
    card: 'border-accent/40 bg-accent/5',
    dot: 'bg-accent-foreground',
    badge: 'bg-accent/20 text-accent-foreground border-accent/40',
  },
  available: {
    card: 'border-success/35 bg-success/5',
    dot: 'bg-success',
    badge: 'bg-success/15 text-success border-success/30',
  },
  away: {
    card: 'border-border bg-card',
    dot: 'bg-muted-foreground',
    badge: 'bg-muted text-muted-foreground border-border',
  },
  offline: {
    card: 'border-border bg-card opacity-70',
    dot: 'bg-muted-foreground',
    badge: 'bg-muted text-muted-foreground border-border',
  },
};

function initials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export interface BlfLampCardProps {
  lamp: BlfLamp;
  onSelect?: (lamp: BlfLamp) => void;
}

export function BlfLampCard({ lamp, onSelect }: BlfLampCardProps) {
  const style = STATE_STYLES[lamp.state];
  const interactive = typeof onSelect === 'function';

  return (
    <button
      type="button"
      disabled={!interactive}
      onClick={() => onSelect?.(lamp)}
      aria-label={`Ramal ${lamp.extension} — ${lamp.name} — ${LAMP_LABELS[lamp.state]}`}
      className={cn(
        'flex w-full flex-col gap-2 rounded-lg border p-3 text-left backdrop-blur-sm transition-all duration-300',
        style.card,
        interactive && 'hover:-translate-y-0.5 hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <div className="relative shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              {initials(lamp.name)}
            </div>
            <span
              className={cn(
                'absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card',
                style.dot,
              )}
              aria-hidden="true"
            />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{lamp.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              Ramal {lamp.extension}
              {lamp.department ? ` • ${lamp.department}` : ''}
            </p>
          </div>
        </div>
        <Badge variant="outline" className={cn('shrink-0 text-[10px]', style.badge)}>
          {LAMP_LABELS[lamp.state]}
        </Badge>
      </div>

      {(lamp.detail || lamp.elapsedSeconds !== null || lamp.parkedSlot !== null) && (
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="truncate text-muted-foreground">
            {lamp.parkedSlot !== null ? `Vaga ${lamp.parkedSlot} • ` : ''}
            {lamp.detail ?? '—'}
          </span>
          {lamp.elapsedSeconds !== null && (
            <span className="shrink-0 font-mono tabular-nums text-muted-foreground">
              {formatElapsed(lamp.elapsedSeconds)}
            </span>
          )}
        </div>
      )}
    </button>
  );
}
