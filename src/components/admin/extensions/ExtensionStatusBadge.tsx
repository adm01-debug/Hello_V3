import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { AgentStatus } from '@/hooks/useExtensionsOverview';

const MAP: Record<AgentStatus, { label: string; cls: string }> = {
  available: { label: 'Disponível', cls: 'bg-success/15 text-success border-success/30 shadow-[0_0_8px_hsl(var(--success)/0.3)]' },
  busy: { label: 'Ocupado', cls: 'bg-destructive/15 text-destructive border-destructive/30 shadow-[0_0_8px_hsl(var(--destructive)/0.3)]' },
  away: { label: 'Ausente', cls: 'bg-warning/15 text-warning border-warning/30' },
  offline: { label: 'Offline', cls: 'bg-muted text-muted-foreground border-border' },
  inactive: { label: 'Inativo', cls: 'bg-muted text-muted-foreground border-border opacity-60' },
};

export function ExtensionStatusBadge({ status }: { status: AgentStatus }) {
  const cfg = MAP[status] ?? MAP.offline;
  return (
    <Badge variant="outline" className={cn('gap-1.5 font-medium', cfg.cls)}>
      <span className={cn(
        'h-1.5 w-1.5 rounded-full',
        status === 'available' && 'bg-success animate-pulse',
        status === 'busy' && 'bg-destructive',
        status === 'away' && 'bg-warning',
        (status === 'offline' || status === 'inactive') && 'bg-muted-foreground',
      )} />
      {cfg.label}
    </Badge>
  );
}

export function TrunkHealthBadge({ health }: { health: 'healthy' | 'degraded' | 'offline' | null }) {
  if (!health) return <Badge variant="secondary" className="text-xs">—</Badge>;
  const map = {
    healthy: { label: 'OK', cls: 'bg-success/10 text-success border-success/20' },
    degraded: { label: 'Lento', cls: 'bg-warning/10 text-warning border-warning/20' },
    offline: { label: 'Offline', cls: 'bg-destructive/10 text-destructive border-destructive/20' },
  } as const;
  const cfg = map[health];
  return <Badge variant="outline" className={cn('text-xs', cfg.cls)}>{cfg.label}</Badge>;
}
