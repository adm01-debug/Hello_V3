import { useState } from 'react';
import { GitBranch, Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { NeonPageLayout } from '@/components/layout/NeonPageLayout';
import { NeonPageHeader } from '@/components/layout/NeonPageHeader';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRoutingRules, useUpsertRoutingRule, useDeleteRoutingRule, type RoutingRule } from '@/hooks/useRoutingRules';

export default function RoutingRules() {
  usePageTitle('Regras de Roteamento');

  const { data: rules = [] } = useRoutingRules();
  const upsert = useUpsertRoutingRule();
  const remove = useDeleteRoutingRule();
  const [editing, setEditing] = useState<Partial<RoutingRule> | null>(null);

  const handleSave = () => {
    if (!editing?.name) return;
    let parsedConditions: unknown = editing.conditions;
    let parsedActions: unknown = editing.actions;
    try {
      if (typeof editing.conditions === 'string') parsedConditions = JSON.parse(editing.conditions);
      if (typeof editing.actions === 'string') parsedActions = JSON.parse(editing.actions);
    } catch {
      return;
    }
    upsert.mutate(
      {
        ...editing,
        name: editing.name,
        conditions: parsedConditions,
        actions: parsedActions,
        priority: editing.priority ?? 100,
        is_active: editing.is_active ?? true,
      },
      { onSuccess: () => setEditing(null) }
    );
  };

  return (
    <NeonPageLayout>
      <NeonPageHeader
        title="Regras de Roteamento"
        description="Direcione conversas automaticamente por canal, tags ou condições"
        icon={<GitBranch />}
        actions={
          <Button onClick={() => setEditing({ priority: 100, is_active: true, channel: 'all' })} className="gap-2">
            <Plus className="h-4 w-4" /> Nova regra
          </Button>
        }
      />

      {rules.length === 0 ? (
        <EmptyState icon={<GitBranch />} title="Sem regras" description="Crie sua primeira regra de roteamento." />
      ) : (
        <div className="space-y-3">
          {rules.map((r) => (
            <Card key={r.id} className="p-4 bg-card/50 backdrop-blur border-primary/20">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{r.name}</h3>
                    <Badge variant="outline">{r.channel || 'all'}</Badge>
                    <Badge variant="secondary">prioridade {r.priority}</Badge>
                    {r.is_active ? (
                      <Badge className="bg-success/20 text-success">Ativa</Badge>
                    ) : (
                      <Badge variant="outline">Inativa</Badge>
                    )}
                  </div>
                  {r.description && <p className="text-sm text-muted-foreground mb-2">{r.description}</p>}
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>Matches: {r.match_count}</span>
                    {r.last_matched_at && <span>Último: {new Date(r.last_matched_at).toLocaleString('pt-BR')}</span>}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      upsert.mutate({ id: r.id, name: r.name, is_active: !r.is_active })
                    }
                  >
                    {r.is_active ? <ToggleRight className="h-4 w-4 text-success" /> : <ToggleLeft className="h-4 w-4" />}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(r)}>
                    Editar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => remove.mutate(r.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing?.id ? 'Editar regra' : 'Nova regra'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Nome da regra"
              value={editing?.name || ''}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
            />
            <Input
              placeholder="Descrição"
              value={editing?.description || ''}
              onChange={(e) => setEditing({ ...editing, description: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-2">
              <Select
                value={editing?.channel || 'all'}
                onValueChange={(v) => setEditing({ ...editing, channel: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos canais</SelectItem>
                  <SelectItem value="voice">Voz</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="email">E-mail</SelectItem>
                  <SelectItem value="chat">Chat</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="number"
                placeholder="Prioridade"
                value={editing?.priority ?? 100}
                onChange={(e) => setEditing({ ...editing, priority: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-muted-foreground">
                Condições (JSON)
              </label>
              <Textarea
                placeholder='[{"field":"tags","op":"contains","value":"vip"}]'
                value={typeof editing?.conditions === 'string' ? editing.conditions : JSON.stringify(editing?.conditions || [], null, 2)}
                onChange={(e) => setEditing({ ...editing, conditions: e.target.value as unknown as RoutingRule['conditions'] })}
                className="font-mono text-xs min-h-[100px]"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-muted-foreground">
                Ações (JSON)
              </label>
              <Textarea
                placeholder='[{"action":"assign","value":"agent_name"},{"action":"set_priority","value":"high"}]'
                value={typeof editing?.actions === 'string' ? editing.actions : JSON.stringify(editing?.actions || [], null, 2)}
                onChange={(e) => setEditing({ ...editing, actions: e.target.value as unknown as RoutingRule['actions'] })}
                className="font-mono text-xs min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={upsert.isPending}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </NeonPageLayout>
  );
}
