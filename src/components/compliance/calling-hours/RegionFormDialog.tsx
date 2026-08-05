import { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import {
  callingHoursSchema,
  emptyDraft,
  SUPPORTED_TIMEZONES,
  type CallingHoursDraft,
} from './types';

interface Props {
  open: boolean;
  mode: 'create' | 'edit';
  initial?: CallingHoursDraft;
  saving?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (draft: CallingHoursDraft) => Promise<void> | void;
}

export const RegionFormDialog = ({
  open,
  mode,
  initial,
  saving,
  onOpenChange,
  onSubmit,
}: Props) => {
  const [draft, setDraft] = useState<CallingHoursDraft>(initial ?? emptyDraft());
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setDraft(initial ?? emptyDraft());
      setErrors({});
    }
  }, [open, initial]);

  const patch = <K extends keyof CallingHoursDraft>(k: K, v: CallingHoursDraft[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  const title = useMemo(
    () =>
      mode === 'create'
        ? 'Nova região de atendimento'
        : `Editar horários — ${draft.region_name || draft.region_code}`,
    [mode, draft.region_name, draft.region_code],
  );

  const handleSubmit = async () => {
    const parsed = callingHoursSchema.safeParse(draft);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join('.') || '_';
        if (!errs[key]) errs[key] = issue.message;
      }
      setErrors(errs);
      return;
    }
    setErrors({});
    await onSubmit({ ...draft, ...parsed.data });
  };

  const errFor = (k: string) => errors[k];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Defina horários por região respeitando a legislação local de telemarketing.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Código da região</Label>
              <Input
                value={draft.region_code}
                onChange={(e) => patch('region_code', e.target.value.toUpperCase())}
                placeholder="BR, SP, US..."
                disabled={mode === 'edit'}
                aria-invalid={!!errFor('region_code')}
              />
              {errFor('region_code') && (
                <p className="text-xs text-destructive">{errFor('region_code')}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label>Nome da região</Label>
              <Input
                value={draft.region_name}
                onChange={(e) => patch('region_name', e.target.value)}
                placeholder="Brasil"
                aria-invalid={!!errFor('region_name')}
              />
              {errFor('region_name') && (
                <p className="text-xs text-destructive">{errFor('region_name')}</p>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <Label>Timezone</Label>
            <Select value={draft.timezone} onValueChange={(v) => patch('timezone', v)}>
              <SelectTrigger aria-invalid={!!errFor('timezone')}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {SUPPORTED_TIMEZONES.map((tz) => (
                  <SelectItem key={tz} value={tz}>
                    {tz}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-base font-medium">Dias úteis (segunda a sexta)</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Início</Label>
                <Input
                  type="time"
                  value={draft.weekday_start}
                  onChange={(e) => patch('weekday_start', e.target.value)}
                  aria-invalid={!!errFor('weekday_start')}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Fim</Label>
                <Input
                  type="time"
                  value={draft.weekday_end}
                  onChange={(e) => patch('weekday_end', e.target.value)}
                  aria-invalid={!!errFor('weekday_end')}
                />
              </div>
            </div>
            {(errFor('weekday_start') || errFor('weekday_end')) && (
              <p className="text-xs text-destructive">
                {errFor('weekday_end') ?? errFor('weekday_start')}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-base font-medium">Sábado</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Início</Label>
                <Input
                  type="time"
                  value={draft.saturday_start ?? ''}
                  onChange={(e) => patch('saturday_start', e.target.value || null)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Fim</Label>
                <Input
                  type="time"
                  value={draft.saturday_end ?? ''}
                  onChange={(e) => patch('saturday_end', e.target.value || null)}
                  aria-invalid={!!errFor('saturday_end')}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Deixe ambos vazios para bloquear sábado.
            </p>
            {errFor('saturday_end') && (
              <p className="text-xs text-destructive">{errFor('saturday_end')}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Domingo</Label>
              <Switch
                checked={draft.sunday_allowed}
                onCheckedChange={(v) =>
                  setDraft((d) => ({
                    ...d,
                    sunday_allowed: v,
                    sunday_start: v ? d.sunday_start ?? '10:00' : null,
                    sunday_end: v ? d.sunday_end ?? '16:00' : null,
                  }))
                }
              />
            </div>
            {draft.sunday_allowed && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Início</Label>
                  <Input
                    type="time"
                    value={draft.sunday_start ?? ''}
                    onChange={(e) => patch('sunday_start', e.target.value || null)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Fim</Label>
                  <Input
                    type="time"
                    value={draft.sunday_end ?? ''}
                    onChange={(e) => patch('sunday_end', e.target.value || null)}
                    aria-invalid={!!errFor('sunday_end')}
                  />
                </div>
              </div>
            )}
            {errFor('sunday_end') && (
              <p className="text-xs text-destructive">{errFor('sunday_end')}</p>
            )}
          </div>

          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <Label className="text-base font-medium">Permitir feriados</Label>
              <p className="text-sm text-muted-foreground">
                Autoriza discagem em feriados nacionais e regionais
              </p>
            </div>
            <Switch
              checked={draft.holidays_allowed}
              onCheckedChange={(v) => patch('holidays_allowed', v)}
            />
          </div>

          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <Label className="text-base font-medium">Região ativa</Label>
              <p className="text-sm text-muted-foreground">
                Somente regiões ativas são consultadas na validação
              </p>
            </div>
            <Switch
              checked={draft.is_active}
              onCheckedChange={(v) => patch('is_active', v)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === 'create' ? 'Criar região' : 'Salvar alterações'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
