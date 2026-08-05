import { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Loader2, Network } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { logger } from '@/lib/logger';
import { TrunkHealthBadge } from './ExtensionStatusBadge';
import { useExtensionAudit } from '@/hooks/useExtensionAudit';

interface Trunk {
  id: string;
  name: string;
  provider: string;
  last_health_status: 'healthy' | 'degraded' | 'offline' | null;
}

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  agentIds: string[];
  onSuccess: () => void;
}

export function BulkAssignTrunkDialog({ open, onOpenChange, agentIds, onSuccess }: Props) {
  const qc = useQueryClient();
  const { logBulk } = useExtensionAudit();
  const [trunks, setTrunks] = useState<Trunk[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    supabase
      .from('voip_trunks')
      .select('id, name, provider, last_health_status')
      .eq('is_active', true)
      .order('name')
      .then(({ data, error }) => {
        if (error) {
          logger.error('bulk-assign: load trunks', error);
          toast.error('Erro ao carregar trunks');
        } else {
          setTrunks((data ?? []) as Trunk[]);
        }
        setLoading(false);
      });
  }, [open]);

  const handleSubmit = async () => {
    if (!selected || agentIds.length === 0) return;
    setSubmitting(true);
    try {
      // Remove existing primary assignments for these agents
      const { error: delErr } = await supabase
        .from('agent_trunk_assignments')
        .delete()
        .in('agent_id', agentIds)
        .eq('is_primary', true);
      if (delErr) throw delErr;

      // Insert new primary assignments
      const rows = agentIds.map(agent_id => ({
        agent_id,
        trunk_id: selected,
        is_primary: true,
      }));
      const { error: insErr } = await supabase.from('agent_trunk_assignments').insert(rows);
      if (insErr) throw insErr;

      toast.success(`Trunk atribuído a ${agentIds.length} ${agentIds.length === 1 ? 'ramal' : 'ramais'}`);
      logBulk({
        action: 'bulk_assign_trunk',
        agentIds,
        details: { trunk_id: selected, trunk_name: trunks.find(t => t.id === selected)?.name },
      });
      qc.invalidateQueries({ queryKey: ['extensions-overview'] });
      onSuccess();
      onOpenChange(false);
    } catch (e) {
      const err = e as Error;
      logger.error('bulk-assign: submit', err);
      toast.error('Falha ao atribuir trunk', { description: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const trunkName = trunks.find(t => t.id === selected)?.name;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Network className="h-5 w-5 text-primary" />
            Atribuir Trunk em Massa
          </DialogTitle>
          <DialogDescription>
            Selecione um trunk VoIP para atribuir como primário a {agentIds.length}{' '}
            {agentIds.length === 1 ? 'ramal selecionado' : 'ramais selecionados'}.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : trunks.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Nenhum trunk ativo encontrado.</p>
        ) : (
          <RadioGroup value={selected} onValueChange={setSelected} className="space-y-2 max-h-72 overflow-y-auto">
            {trunks.map(t => (
              <Label
                key={t.id}
                htmlFor={t.id}
                className="flex items-center justify-between gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/40 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
              >
                <div className="flex items-center gap-3">
                  <RadioGroupItem value={t.id} id={t.id} />
                  <div>
                    <p className="font-medium text-sm">{t.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{t.provider}</p>
                  </div>
                </div>
                <TrunkHealthBadge health={t.last_health_status} />
              </Label>
            ))}
          </RadioGroup>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!selected || submitting}>
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {trunkName ? `Atribuir "${trunkName}"` : 'Confirmar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
