import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CircleParking, Pencil, PhoneIncoming, Trash2, User } from 'lucide-react';
import {
  PARK_TIMEOUT_ACTION_LABELS,
  formatCountdown,
  formatTimeout,
  maskPhone,
  secondsRemaining,
  slotsOf,
  type CallParkOrbit,
  type ParkedCall,
} from '@/lib/call-park';

export interface ParkOrbitCardProps {
  orbit: CallParkOrbit;
  parked: readonly ParkedCall[];
  canManage: boolean;
  busy: boolean;
  onEdit: (orbit: CallParkOrbit) => void;
  onDelete: (orbit: CallParkOrbit) => void;
  onPark: (orbit: CallParkOrbit, slot: number) => void;
  onRetrieve: (call: ParkedCall) => void;
}

export function ParkOrbitCard({
  orbit,
  parked,
  canManage,
  busy,
  onEdit,
  onDelete,
  onPark,
  onRetrieve,
}: ParkOrbitCardProps) {
  // Tick local de 1s só para o contador regressivo — não refaz requisições.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const bySlot = new Map<number, ParkedCall>();
  for (const call of parked) {
    if (call.status === 'parked') bySlot.set(call.slot_number, call);
  }

  const slots = slotsOf(orbit);
  const occupied = bySlot.size;

  return (
    <Card className={cn('flex flex-col', !orbit.is_active && 'opacity-70')}>
      <CardHeader className="space-y-2 pb-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <CircleParking className="h-4 w-4 text-primary" aria-hidden="true" />
              <span className="truncate">{orbit.name}</span>
            </CardTitle>
            {orbit.description && (
              <p className="mt-1 text-xs text-muted-foreground">{orbit.description}</p>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Badge variant={orbit.is_active ? 'default' : 'secondary'}>
              {orbit.is_active ? 'Ativa' : 'Inativa'}
            </Badge>
            {canManage && (
              <>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`Editar órbita ${orbit.name}`}
                  onClick={() => onEdit(orbit)}
                >
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`Remover órbita ${orbit.name}`}
                  onClick={() => onDelete(orbit)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span>
            Vagas {orbit.slot_start}–{orbit.slot_end}
          </span>
          <span aria-hidden="true">•</span>
          <span>
            {occupied}/{slots.length} ocupadas
          </span>
          <span aria-hidden="true">•</span>
          <span>Limite {formatTimeout(orbit.park_timeout_seconds)}</span>
          <span aria-hidden="true">•</span>
          <span>{PARK_TIMEOUT_ACTION_LABELS[orbit.timeout_action]}</span>
        </div>
      </CardHeader>

      <CardContent className="flex-1">
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {slots.map((slot) => {
            const call = bySlot.get(slot);
            const remaining = call ? secondsRemaining(call.expires_at, now) : 0;
            const critical = call !== undefined && remaining <= 30;

            return (
              <li key={slot}>
                {call ? (
                  <button
                    type="button"
                    onClick={() => onRetrieve(call)}
                    disabled={busy}
                    aria-label={`Retirar chamada da vaga ${slot}`}
                    className={cn(
                      'w-full rounded-lg border p-2 text-left transition-colors',
                      'border-primary/50 bg-primary/10 hover:bg-primary/20',
                      critical && 'border-destructive/60 bg-destructive/10 hover:bg-destructive/20',
                      busy && 'cursor-not-allowed opacity-60',
                    )}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-mono text-sm font-semibold">{slot}</span>
                      <span
                        className={cn(
                          'font-mono text-xs',
                          critical ? 'text-destructive' : 'text-muted-foreground',
                        )}
                      >
                        {formatCountdown(remaining)}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-xs text-foreground">
                      {call.contact_name ?? maskPhone(call.contact_phone)}
                    </p>
                    <p className="flex items-center gap-1 truncate text-[11px] text-muted-foreground">
                      <User className="h-3 w-3 shrink-0" aria-hidden="true" />
                      {call.parked_by_name ?? 'Agente'}
                    </p>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onPark(orbit, slot)}
                    disabled={busy || !orbit.is_active}
                    aria-label={`Estacionar chamada na vaga ${slot}`}
                    className={cn(
                      'flex w-full items-center justify-between rounded-lg border border-dashed border-border p-2 text-left transition-colors hover:bg-muted',
                      (busy || !orbit.is_active) && 'cursor-not-allowed opacity-50',
                    )}
                  >
                    <span className="font-mono text-sm text-muted-foreground">{slot}</span>
                    <PhoneIncoming
                      className="h-3.5 w-3.5 text-muted-foreground"
                      aria-hidden="true"
                    />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
