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
import { AlertTriangle, ListOrdered, Plus, RefreshCw, Search } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useAuth } from '@/hooks/useAuth';
import { useCallQueues } from '@/hooks/useCallQueues';
import { QueueCard } from '@/components/queues/QueueCard';
import { QueueFormDialog } from '@/components/queues/QueueFormDialog';
import type { CallQueue, CallQueueDraft } from '@/lib/call-queue';

const CallQueues = () => {
  usePageTitle('Filas de Atendimento');
  const { hasRole } = useAuth();
  const canManage = hasRole(['admin', 'supervisor']);

  const {
    queues,
    memberCountByQueue,
    isLoading,
    isError,
    refetch,
    createQueue,
    updateQueue,
    deleteQueue,
    toggleActive,
  } = useCallQueues();

  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CallQueue | null>(null);
  const [pendingDelete, setPendingDelete] = useState<CallQueue | null>(null);

  const nameById = useMemo(
    () => new Map(queues.map((queue) => [queue.id, queue.name] as const)),
    [queues],
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return queues;
    return queues.filter(
      (queue) =>
        queue.name.toLowerCase().includes(term) ||
        (queue.description ?? '').toLowerCase().includes(term),
    );
  }, [queues, search]);

  const handleSubmit = (draft: CallQueueDraft) => {
    if (editing) {
      updateQueue.mutate(
        { id: editing.id, draft },
        { onSuccess: () => setFormOpen(false) },
      );
      return;
    }
    createQueue.mutate(draft, { onSuccess: () => setFormOpen(false) });
  };

  const saving = createQueue.isPending || updateQueue.isPending;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <ListOrdered className="h-6 w-6" aria-hidden="true" />
            Filas de Atendimento
          </h1>
          <p className="text-muted-foreground">
            Configure distribuição, capacidade, transbordo, música em espera e anúncios.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => void refetch()} disabled={isLoading}>
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
              Nova fila
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
          placeholder="Buscar fila por nome ou descrição"
          aria-label="Buscar fila"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {isError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          <AlertDescription>
            Não foi possível carregar as filas. Tente atualizar a página.
          </AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1, 2, 3].map((key) => (
            <Skeleton key={key} className="h-48 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center text-muted-foreground">
          {queues.length === 0
            ? 'Nenhuma fila cadastrada ainda. Crie a primeira para começar a rotear chamadas receptivas.'
            : 'Nenhuma fila corresponde à busca.'}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((queue) => (
            <QueueCard
              key={queue.id}
              queue={queue}
              activeMembers={memberCountByQueue[queue.id] ?? 0}
              overflowName={
                queue.overflow_queue_id ? (nameById.get(queue.overflow_queue_id) ?? null) : null
              }
              canManage={canManage}
              onEdit={(item) => {
                setEditing(item);
                setFormOpen(true);
              }}
              onDelete={(item) => setPendingDelete(item)}
              onToggleActive={(item, isActive) =>
                toggleActive.mutate({ id: item.id, isActive })
              }
            />
          ))}
        </div>
      )}

      <QueueFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        queue={editing}
        otherQueues={queues.filter((queue) => queue.id !== editing?.id)}
        audioPrompts={audioPrompts}
        saving={saving}
        onSubmit={handleSubmit}
      />

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover fila</AlertDialogTitle>
            <AlertDialogDescription>
              A fila &quot;{pendingDelete?.name}&quot; e seus membros serão removidos. Filas que
              apontam para ela como transbordo passarão a não ter destino.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingDelete) deleteQueue.mutate(pendingDelete.id);
                setPendingDelete(null);
              }}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CallQueues;
