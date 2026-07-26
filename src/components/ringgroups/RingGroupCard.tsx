import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowDown,
  ArrowUp,
  Hash,
  Pencil,
  PhoneForwarded,
  Plus,
  Timer,
  Trash2,
  Users,
} from 'lucide-react';
import {
  NO_ANSWER_LABELS,
  RING_STRATEGY_LABELS,
  estimateRingDurationSeconds,
  formatRingSeconds,
  type RingGroup,
  type RingGroupMember,
} from '@/lib/ring-group';
import type { RingGroupAgentOption } from '@/hooks/useRingGroups';

export interface RingGroupCardProps {
  group: RingGroup;
  members: readonly RingGroupMember[];
  agents: readonly RingGroupAgentOption[];
  forwardLabel: string | null;
  canManage: boolean;
  onEdit: (group: RingGroup) => void;
  onDelete: (group: RingGroup) => void;
  onToggleActive: (group: RingGroup, isActive: boolean) => void;
  onAddMember: (groupId: string, agentId: string) => void;
  onUpdateMember: (
    id: string,
    patch: Partial<Pick<RingGroupMember, 'ring_order' | 'delay_seconds' | 'is_enabled'>>,
  ) => void;
  onRemoveMember: (id: string) => void;
}

export function RingGroupCard({
  group,
  members,
  agents,
  forwardLabel,
  canManage,
  onEdit,
  onDelete,
  onToggleActive,
  onAddMember,
  onUpdateMember,
  onRemoveMember,
}: RingGroupCardProps) {
  const [pendingAgent, setPendingAgent] = useState('');

  const agentNameById = useMemo(
    () => new Map(agents.map((agent) => [agent.id, agent.name] as const)),
    [agents],
  );

  const ordered = useMemo(
    () => [...members].sort((a, b) => a.ring_order - b.ring_order),
    [members],
  );

  const available = useMemo(
    () => agents.filter((agent) => !members.some((member) => member.agent_id === agent.id)),
    [agents, members],
  );

  const enabledCount = ordered.filter((member) => member.is_enabled).length;
  const estimated = estimateRingDurationSeconds(group, ordered);

  const swap = (index: number, direction: -1 | 1) => {
    const target = ordered[index + direction];
    const current = ordered[index];
    if (!target || !current) return;
    onUpdateMember(current.id, { ring_order: target.ring_order });
    onUpdateMember(target.id, { ring_order: current.ring_order });
  };

  return (
    <Card className={group.is_active ? undefined : 'opacity-70'}>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div className="min-w-0">
          <CardTitle className="truncate text-lg">{group.name}</CardTitle>
          {group.description && (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{group.description}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Badge variant={group.is_active ? 'default' : 'secondary'}>
            {group.is_active ? 'Ativo' : 'Inativo'}
          </Badge>
          {canManage && (
            <Switch
              checked={group.is_active}
              aria-label={`Ativar ou desativar o grupo ${group.name}`}
              onCheckedChange={(checked) => onToggleActive(group, checked)}
            />
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
          <div className="flex items-center gap-2">
            <Hash className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <span>{group.extension ? `Ramal ${group.extension}` : 'Sem ramal'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <span>{enabledCount} tocando</span>
          </div>
          <div className="flex items-center gap-2">
            <Timer className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <span>{formatRingSeconds(estimated)} estimados</span>
          </div>
          <div className="flex items-center gap-2">
            <PhoneForwarded className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <span className="truncate">{forwardLabel ?? NO_ANSWER_LABELS[group.no_answer_action]}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{RING_STRATEGY_LABELS[group.strategy]}</Badge>
          <Badge variant="outline">Toque de {formatRingSeconds(group.ring_timeout_seconds)}</Badge>
          {group.strategy === 'sequential' && (
            <Badge variant="outline">
              Etapa de {formatRingSeconds(group.step_timeout_seconds)}
            </Badge>
          )}
          {group.skip_busy_agents && <Badge variant="outline">Ignora ocupados</Badge>}
        </div>

        <div className="space-y-2 rounded-lg border border-border p-3">
          <p className="text-sm font-medium">Participantes</p>

          {ordered.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum agente vinculado — o grupo não vai tocar.
            </p>
          ) : (
            <ul className="space-y-2">
              {ordered.map((member, index) => (
                <li
                  key={member.id}
                  className="flex flex-wrap items-center gap-2 rounded-md bg-muted/40 p-2"
                >
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {index + 1}. {agentNameById.get(member.agent_id) ?? 'Agente removido'}
                  </span>

                  <label className="flex items-center gap-1 text-xs text-muted-foreground">
                    Atraso
                    <Input
                      type="number"
                      min={0}
                      max={300}
                      className="h-8 w-20"
                      aria-label={`Atraso em segundos do participante ${index + 1}`}
                      value={member.delay_seconds}
                      disabled={!canManage}
                      onChange={(event) =>
                        onUpdateMember(member.id, { delay_seconds: Number(event.target.value) })
                      }
                    />
                    s
                  </label>

                  <Switch
                    checked={member.is_enabled}
                    disabled={!canManage}
                    aria-label={`Habilitar participante ${index + 1}`}
                    onCheckedChange={(checked) =>
                      onUpdateMember(member.id, { is_enabled: checked })
                    }
                  />

                  {canManage && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        aria-label="Mover participante para cima"
                        disabled={index === 0}
                        onClick={() => swap(index, -1)}
                      >
                        <ArrowUp className="h-4 w-4" aria-hidden="true" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        aria-label="Mover participante para baixo"
                        disabled={index === ordered.length - 1}
                        onClick={() => swap(index, 1)}
                      >
                        <ArrowDown className="h-4 w-4" aria-hidden="true" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        aria-label="Remover participante"
                        onClick={() => onRemoveMember(member.id)}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}

          {canManage && available.length > 0 && (
            <div className="flex gap-2 pt-1">
              <Select value={pendingAgent} onValueChange={setPendingAgent}>
                <SelectTrigger
                  className="h-9"
                  aria-label={`Escolher agente para o grupo ${group.name}`}
                >
                  <SelectValue placeholder="Adicionar agente" />
                </SelectTrigger>
                <SelectContent>
                  {available.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.name}
                      {agent.extension ? ` · ${agent.extension}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                disabled={!pendingAgent}
                onClick={() => {
                  onAddMember(group.id, pendingAgent);
                  setPendingAgent('');
                }}
              >
                <Plus className="mr-1 h-4 w-4" aria-hidden="true" />
                Incluir
              </Button>
            </div>
          )}
        </div>

        {canManage && (
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => onEdit(group)}>
              <Pencil className="mr-2 h-4 w-4" aria-hidden="true" />
              Editar
            </Button>
            <Button variant="destructive" size="sm" onClick={() => onDelete(group)}>
              <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
              Excluir
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
