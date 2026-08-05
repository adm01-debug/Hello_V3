import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Music, Users, Timer, ArrowRightLeft, Pencil, Trash2, Megaphone } from 'lucide-react';
import {
  OVERFLOW_LABELS,
  STRATEGY_LABELS,
  formatSeconds,
  type CallQueue,
} from '@/lib/call-queue';

export interface QueueCardProps {
  queue: CallQueue;
  activeMembers: number;
  overflowName: string | null;
  canManage: boolean;
  onEdit: (queue: CallQueue) => void;
  onDelete: (queue: CallQueue) => void;
  onToggleActive: (queue: CallQueue, isActive: boolean) => void;
}

export function QueueCard({
  queue,
  activeMembers,
  overflowName,
  canManage,
  onEdit,
  onDelete,
  onToggleActive,
}: QueueCardProps) {
  return (
    <Card className={queue.is_active ? undefined : 'opacity-70'}>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div className="min-w-0">
          <CardTitle className="truncate text-lg">{queue.name}</CardTitle>
          {queue.description && (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {queue.description}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Badge variant={queue.is_active ? 'default' : 'secondary'}>
            {queue.is_active ? 'Ativa' : 'Inativa'}
          </Badge>
          {canManage && (
            <Switch
              checked={queue.is_active}
              aria-label={`Ativar ou desativar a fila ${queue.name}`}
              onCheckedChange={(checked) => onToggleActive(queue, checked)}
            />
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <span>{activeMembers} agente(s)</span>
          </div>
          <div className="flex items-center gap-2">
            <Timer className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <span>{formatSeconds(queue.max_wait_seconds)} de espera</span>
          </div>
          <div className="flex items-center gap-2">
            <Music className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <span>{queue.moh_enabled ? 'MoH ativo' : 'Sem MoH'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <span>{queue.announce_position ? 'Anuncia posição' : 'Sem anúncio'}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{STRATEGY_LABELS[queue.strategy]}</Badge>
          <Badge variant="outline">Prioridade {queue.priority}</Badge>
          <Badge variant="outline">Máx. {queue.max_queue_size} na fila</Badge>
          <Badge variant="outline" className="gap-1">
            <ArrowRightLeft className="h-3 w-3" aria-hidden="true" />
            {OVERFLOW_LABELS[queue.overflow_action]}
            {overflowName ? `: ${overflowName}` : ''}
          </Badge>
        </div>

        {canManage && (
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => onEdit(queue)}>
              <Pencil className="mr-2 h-4 w-4" aria-hidden="true" />
              Editar
            </Button>
            <Button variant="destructive" size="sm" onClick={() => onDelete(queue)}>
              <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
              Remover
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
