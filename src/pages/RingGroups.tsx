import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle, BellRing, Plus, RefreshCw, Search } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useAuth } from '@/hooks/useAuth';
import { useRingGroups } from '@/hooks/useRingGroups';
import { useCallQueues } from '@/hooks/useCallQueues';
import { RingGroupCard } from '@/components/ringgroups/RingGroupCard';
import { RingGroupFormDialog } from '@/components/ringgroups/RingGroupFormDialog';
import { NO_ANSWER_LABELS, type RingGroup, type RingGroupDraft } from '@/lib/ring-group';

const RingGroups = () => {
  usePageTitle('Grupos de Toque');
  const { hasRole } = useAuth();
  const canManage = hasRole(['admin', 'supervisor']);

  const {
    groups,
    membersByGroup,
    agents,
    isLoading,
    isError,
    refetch,
    createGroup,
    updateGroup,
    deleteGroup,
    toggleActive,
    addMember,
    updateMember,
    removeMember,
  } = useRingGroups();

  const { queues } = useCallQueues();

  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<RingGroup | null>(null);
  const [pendingDelete, setPendingDelete] = useState<RingGroup | null>(null);

  const queueNameById = useMemo(
    () => new Map(queues.map((queue) => [queue.id, queue.name] as const)),
    [queues],
  );

  const takenExtensions = useMemo(
    () =>
      groups
        .filter((group) => group.id !== editing?.id && group.extension)
        .map((group) => group.extension as string),
    [groups, editing],
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return groups;
    return groups.filter(
      (group) =>
        group.name.toLowerCase().includes(term) ||
        (group.description ?? '').toLowerCase().includes(term) ||
        (group.extension ?? '').includes(term),
    );
  }, [groups, search]);

  const forwardLabelFor = (group: RingGroup): string | null => {
    if (group.no_answer_action === 'forward_queue' && group.forward_target) {
      return `Fila: ${queueNameById.get(group.forward_target) ?? 'desconhecida'}`;
    }
    if (group.no_answer_action === 'forward_extension' && group.forward_target) {
      return `Ramal ${group.forward_target}`;
    }
    return NO_ANSWER_LABELS[group.no_answer_action];
  };

  const handleSubmit = (draft: RingGroupDraft) => {
    if (editing) {
      updateGroup.mutate({ id: editing.id, draft }, { onSuccess: () => setFormOpen(false) });
      return;
    }
    createGroup.mutate(draft, { onSuccess: () => setFormOpen(false) });
  };

  const saving = createGroup.isPending || updateGroup.isPending;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <BellRing className="h-6 w-6" aria-hidden="true" />
            Grupos de Toque
          </h1>
          <p className="text-muted-foreground">
            Toque um ramal virtual em vários agentes ao mesmo tempo ou em cascata.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refetch} disabled={isLoading}>
            <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
            Atualizar
          </Button>
          {canManage && (
            <Button
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
              Novo grupo
            </Button>
          )}
        </div>
      </div>

      <div className="relative max-w-md">
        <Search
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          className="pl-9"
          placeholder="Buscar por nome, descrição ou ramal"
          aria-label="Buscar grupo de toque"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {isError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          <AlertDescription>
            Não foi possível carregar os grupos de toque. Tente atualizar.
          </AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1, 2, 3].map((key) => (
            <Skeleton key={key} className="h-64 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center">
          <p className="text-muted-foreground">
            {groups.length === 0
              ? 'Nenhum grupo de toque criado ainda.'
              : 'Nenhum grupo corresponde à busca.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((group) => (
            <RingGroupCard
              key={group.id}
              group={group}
              members={membersByGroup.get(group.id) ?? []}
              agents={agents}
              forwardLabel={forwardLabelFor(group)}
              canManage={canManage}
              onEdit={(target) => {
                setEditing(target);
                setFormOpen(true);
              }}
              onDelete={setPendingDelete}
              onToggleActive={(target, isActive) =>
                toggleActive.mutate({ id: target.id, isActive })
              }
              onAddMember={(groupId, agentId) => addMember.mutate({ groupId, agentId })}
              onUpdateMember={(id, patch) => updateMember.mutate({ id, patch })}
              onRemoveMember={(id) => removeMember.mutate(id)}
            />
          ))}
        </div>
      )}

      <RingGroupFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        group={editing}
        queues={queues}
        takenExtensions={takenExtensions}
        saving={saving}
        onSubmit={handleSubmit}
      />

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir grupo de toque?</AlertDialogTitle>
            <AlertDialogDescription>
              O grupo &ldquo;{pendingDelete?.name}&rdquo; e todos os seus participantes serão
              removidos. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingDelete) deleteGroup.mutate(pendingDelete.id);
                setPendingDelete(null);
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default RingGroups;
