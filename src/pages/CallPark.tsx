import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
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
import { AlertTriangle, CircleParking, Plus, RefreshCw, TimerReset } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useAuth } from '@/hooks/useAuth';
import { useCallPark } from '@/hooks/useCallPark';
import { ParkOrbitCard } from '@/components/park/ParkOrbitCard';
import { ParkOrbitFormDialog } from '@/components/park/ParkOrbitFormDialog';
import { ParkCallDialog } from '@/components/park/ParkCallDialog';
import type { CallParkOrbit, CallParkOrbitDraft, ParkedCall } from '@/lib/call-park';

const CallPark = () => {
  usePageTitle('Estacionamento de Chamadas');
  const { hasRole } = useAuth();
  const canManage = hasRole(['admin', 'supervisor']);

  const {
    orbits,
    parkedCalls,
    parkedByOrbit,
    isLoading,
    isError,
    refetch,
    createOrbit,
    updateOrbit,
    deleteOrbit,
    parkCall,
    retrieveCall,
    expireOverdue,
  } = useCallPark();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CallParkOrbit | null>(null);
  const [pendingDelete, setPendingDelete] = useState<CallParkOrbit | null>(null);
  const [parkTarget, setParkTarget] = useState<{ orbit: CallParkOrbit; slot: number } | null>(null);

  const saving = createOrbit.isPending || updateOrbit.isPending;
  const busy = parkCall.isPending || retrieveCall.isPending;

  const totals = useMemo(() => {
    const capacity = orbits
      .filter((orbit) => orbit.is_active)
      .reduce((sum, orbit) => sum + (orbit.slot_end - orbit.slot_start + 1), 0);
    return { capacity, occupied: parkedCalls.length };
  }, [orbits, parkedCalls]);

  const handleSubmit = (draft: CallParkOrbitDraft) => {
    if (editing) {
      updateOrbit.mutate(
        { id: editing.id, draft },
        { onSuccess: () => setFormOpen(false) },
      );
      return;
    }
    createOrbit.mutate(draft, { onSuccess: () => setFormOpen(false) });
  };

  const handleRetrieve = (call: ParkedCall) => {
    retrieveCall.mutate(call.id);
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <CircleParking className="h-6 w-6 text-primary" aria-hidden="true" />
            Estacionamento de Chamadas
          </h1>
          <p className="text-sm text-muted-foreground">
            {totals.occupied} de {totals.capacity} vaga(s) ativa(s) ocupada(s). Clique em uma vaga
            livre para estacionar, ou em uma ocupada para retirar.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={refetch} aria-label="Atualizar estacionamento">
            <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
            Atualizar
          </Button>
          <Button
            variant="outline"
            onClick={() => expireOverdue.mutate()}
            disabled={expireOverdue.isPending}
          >
            <TimerReset className="mr-2 h-4 w-4" aria-hidden="true" />
            Liberar vencidas
          </Button>
          {canManage && (
            <Button
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
              Nova órbita
            </Button>
          )}
        </div>
      </div>

      {isError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          <AlertDescription>
            Não foi possível carregar o estacionamento. Tente atualizar a página.
          </AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {[0, 1].map((key) => (
            <Skeleton key={key} className="h-64 w-full" />
          ))}
        </div>
      ) : orbits.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center text-muted-foreground">
          Nenhuma órbita configurada. Crie a primeira para permitir transferências assistidas entre
          agentes.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {orbits.map((orbit) => (
            <ParkOrbitCard
              key={orbit.id}
              orbit={orbit}
              parked={parkedByOrbit.get(orbit.id) ?? []}
              canManage={canManage}
              busy={busy}
              onEdit={(item) => {
                setEditing(item);
                setFormOpen(true);
              }}
              onDelete={(item) => setPendingDelete(item)}
              onPark={(item, slot) => setParkTarget({ orbit: item, slot })}
              onRetrieve={handleRetrieve}
            />
          ))}
        </div>
      )}

      <ParkOrbitFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        orbit={editing}
        otherOrbits={orbits.filter((orbit) => orbit.id !== editing?.id)}
        saving={saving}
        onSubmit={handleSubmit}
      />

      <ParkCallDialog
        open={parkTarget !== null}
        onOpenChange={(open) => {
          if (!open) setParkTarget(null);
        }}
        orbit={parkTarget?.orbit ?? null}
        slot={parkTarget?.slot ?? null}
        saving={parkCall.isPending}
        onConfirm={(input) => {
          if (!parkTarget) return;
          parkCall.mutate(
            {
              orbitId: parkTarget.orbit.id,
              slotNumber: parkTarget.slot,
              contactName: input.contactName,
              contactPhone: input.contactPhone,
              notes: input.notes,
            },
            { onSuccess: () => setParkTarget(null) },
          );
        }}
      />

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover órbita?</AlertDialogTitle>
            <AlertDialogDescription>
              A órbita "{pendingDelete?.name}" e o histórico de chamadas estacionadas nela serão
              removidos. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingDelete) deleteOrbit.mutate(pendingDelete.id);
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

export default CallPark;
