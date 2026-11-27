import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { History, Loader2 } from 'lucide-react';
import type { useAccountJourney } from '@/hooks/useAccountJourney';
import { safeToLocaleDateString } from '@/lib/safe-date';

export interface JourneyAccount {
  id: string;
  name: string;
  current_stage: string | null;
  version?: number;
}

interface Props {
  account: JourneyAccount;
  journey: ReturnType<typeof useAccountJourney>;
  onSaved?: () => void;
}

/**
 * Etapa atual + troca de etapa com motivo e historico de transicoes.
 * Cores vem de `customer_journey_stages.color`; o nome escrito carrega o
 * significado (cor nunca e o unico sinal).
 */
export function AccountJourneyControl({ account, journey, onSaved }: Props) {
  const [pendingStage, setPendingStage] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [historyOpen, setHistoryOpen] = useState(false);

  const { stageLabel, stages, loadingStages, stagesError, historyByAccount, loadingHistoryFor, loadHistory, changeStage, savingFor } = journey;
  const saving = savingFor === account.id;
  const history = historyByAccount[account.id] ?? [];
  const loadingHistory = loadingHistoryFor === account.id;
  const currentColor = stages.find((s) => s.stage_key === account.current_stage)?.color ?? undefined;

  const confirm = async () => {
    if (!pendingStage) return;
    const ok = await changeStage({
      accountId: account.id,
      accountName: account.name,
      fromStage: account.current_stage,
      toStageKey: pendingStage,
      version: account.version,
      reason,
    });
    setPendingStage(null);
    setReason('');
    if (ok) onSaved?.();
  };

  const toggleHistory = () => {
    const next = !historyOpen;
    setHistoryOpen(next);
    if (next) void loadHistory(account.id);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge
        variant="outline"
        className="gap-1"
        style={currentColor ? { borderColor: currentColor, color: currentColor } : undefined}
      >
        {stageLabel(account.current_stage)}
      </Badge>

      <Select value={pendingStage ?? ''} onValueChange={setPendingStage} disabled={saving || loadingStages}>
        <SelectTrigger className="h-8 w-[180px]" aria-label={`Mover ${account.name} para outra etapa`}>
          <SelectValue placeholder="Mover etapa" />
        </SelectTrigger>
        <SelectContent>
          {stages.filter((s) => s.stage_key !== account.current_stage).map((s) => (
            <SelectItem key={s.stage_key} value={s.stage_key}>{s.stage_name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        size="sm"
        variant="ghost"
        onClick={toggleHistory}
        aria-expanded={historyOpen}
        title="Historico da jornada"
      >
        <History className="h-4 w-4" />
      </Button>

      {stagesError && <span className="text-xs text-destructive" role="alert">{stagesError}</span>}

      {pendingStage && (
        <div
          className="flex w-full flex-wrap items-center gap-2 rounded-md border bg-muted/40 p-2"
          role="group"
          aria-label="Confirmar mudanca de etapa"
        >
          <span className="text-xs">
            {stageLabel(account.current_stage)} → <strong>{stageLabel(pendingStage)}</strong>
          </span>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Motivo (opcional)"
            aria-label="Motivo da mudanca de etapa"
            className="h-8 max-w-xs"
          />
          <Button size="sm" onClick={confirm} disabled={saving}>
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Confirmar'}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => { setPendingStage(null); setReason(''); }} disabled={saving}>
            Cancelar
          </Button>
        </div>
      )}

      {historyOpen && (
        <div className="w-full rounded-md border p-2" role="region" aria-label={`Historico da jornada de ${account.name}`}>
          {loadingHistory ? (
            <p className="text-xs text-muted-foreground">Carregando historico...</p>
          ) : history.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhuma mudanca de etapa registrada para esta conta.</p>
          ) : (
            <ul className="space-y-1">
              {history.map((h) => (
                <li key={h.id} className="text-xs">
                  <span className="text-muted-foreground">{safeToLocaleDateString(h.created_at)}</span>{' '}
                  {stageLabel(h.from_stage)} → <strong>{stageLabel(h.to_stage)}</strong>
                  {h.reason ? ` · ${h.reason}` : ''}
                  {h.triggered_by ? <span className="text-muted-foreground"> · por {h.triggered_by}</span> : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}