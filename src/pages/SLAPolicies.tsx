import { useState } from 'react';
import { Clock, Plus, CheckCircle2, Zap, AlertTriangle } from 'lucide-react';
import { NeonPageLayout } from '@/components/layout/NeonPageLayout';
import { NeonPageHeader } from '@/components/layout/NeonPageHeader';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { EmptyState } from '@/components/ui/empty-state';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useSlaPolicies, useUpsertSlaPolicy, useSlaCompliance, useEnforceSla, type SlaPolicy } from '@/hooks/useSLA';
import { safeFormatDistanceToNow } from '@/lib/safe-date';

export default function SLAPolicies() {
  usePageTitle('Políticas SLA');

  const { data: policies = [] } = useSlaPolicies();
  const { data: compliance } = useSlaCompliance();
  const upsert = useUpsertSlaPolicy();
  const enforce = useEnforceSla();
  const [editing, setEditing] = useState<Partial<SlaPolicy> | null>(null);

  const handleSave = () => {
    if (!editing?.name) return;
    upsert.mutate(
      {
        ...editing,
        name: editing.name,
        first_response_minutes: editing.first_response_minutes ?? 60,
        resolution_minutes: editing.resolution_minutes ?? 1440,
        is_active: editing.is_active ?? true,
        channel: editing.channel || 'all',
        priority: editing.priority || 'all',
      },
      { onSuccess: () => setEditing(null) }
    );
  };

  return (
    <NeonPageLayout>
      <NeonPageHeader
        title="Políticas SLA"
        description="Defina prazos de primeira resposta e resolução por canal e prioridade"
        icon={<Clock />}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => enforce.mutate()}
              disabled={enforce.isPending}
              className="gap-2"
            >
              <Zap className="h-4 w-4" />
              {enforce.isPending ? 'Verificando...' : 'Executar verificação'}
            </Button>
            <Button onClick={() => setEditing({ is_active: true, channel: 'all', priority: 'normal' })} className="gap-2">
              <Plus className="h-4 w-4" /> Nova política
            </Button>
          </div>
        }
      />

      {compliance && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <Card className="p-4 bg-card/50 backdrop-blur border-primary/20">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Compliance 7d</div>
            <div className="text-3xl font-bold text-success">{compliance.compliancePct}%</div>
          </Card>
          <Card className="p-4 bg-card/50 backdrop-blur border-primary/20">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Conversas analisadas</div>
            <div className="text-3xl font-bold">{compliance.total}</div>
          </Card>
          <Card className="p-4 bg-card/50 backdrop-blur border-primary/20">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Violações</div>
            <div className="text-3xl font-bold text-destructive">{compliance.breached}</div>
          </Card>
        </div>
      )}

      {compliance && compliance.breached > 0 && (
        <Card className="p-4 mb-4 bg-card/50 backdrop-blur border-destructive/30">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <h2 className="font-semibold">Violações nos últimos 7 dias</h2>
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            {Object.entries(compliance.byChannel)
              .filter(([, v]) => v.breached > 0)
              .map(([ch, v]) => (
                <Badge key={ch} variant="outline" className="gap-1">
                  {ch}
                  <span className="text-destructive font-mono">{v.breached}</span>
                  <span className="text-muted-foreground">/ {v.total}</span>
                </Badge>
              ))}
          </div>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {compliance.breaches.slice(0, 20).map((b) => (
              <div key={b.id} className="flex items-center justify-between gap-2 text-sm border-t pt-1">
                <span className="truncate font-mono text-xs">{b.id.slice(0, 8)}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline" className="text-[10px]">{b.channel ?? 'sem canal'}</Badge>
                  <Badge variant="secondary" className="text-[10px]">{b.status ?? '—'}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {safeFormatDistanceToNow(b.created_at)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {policies.length === 0 ? (
        <EmptyState icon={<Clock />} title="Sem políticas" description="Crie sua primeira política SLA." />
      ) : (
        <div className="space-y-3">
          {policies.map((p) => (
            <Card key={p.id} className="p-4 bg-card/50 backdrop-blur border-primary/20">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">{p.name}</h3>
                    <Badge variant="outline">{p.channel}</Badge>
                    <Badge variant="secondary">{p.priority}</Badge>
                    {p.is_active ? (
                      <Badge className="bg-success/20 text-success gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Ativa
                      </Badge>
                    ) : (
                      <Badge variant="outline">Inativa</Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-xs uppercase text-muted-foreground">Primeira resposta</div>
                      <div className="font-mono">{p.first_response_minutes} min</div>
                    </div>
                    <div>
                      <div className="text-xs uppercase text-muted-foreground">Resolução</div>
                      <div className="font-mono">{p.resolution_minutes} min</div>
                    </div>
                  </div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setEditing(p)}>
                  Editar
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing?.id ? 'Editar política' : 'Nova política SLA'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Nome da política"
              value={editing?.name || ''}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
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
              <Select
                value={editing?.priority || 'normal'}
                onValueChange={(v) => setEditing({ ...editing, priority: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="low">Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs uppercase text-muted-foreground">Primeira resposta (min)</label>
                <Input
                  type="number"
                  value={editing?.first_response_minutes ?? 60}
                  onChange={(e) => setEditing({ ...editing, first_response_minutes: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-xs uppercase text-muted-foreground">Resolução (min)</label>
                <Input
                  type="number"
                  value={editing?.resolution_minutes ?? 1440}
                  onChange={(e) => setEditing({ ...editing, resolution_minutes: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Ativa</span>
              <Switch
                checked={editing?.is_active ?? true}
                onCheckedChange={(v) => setEditing({ ...editing, is_active: v })}
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
