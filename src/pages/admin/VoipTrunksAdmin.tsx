import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Phone, Plus, Edit, Trash2, Zap, Loader2, Users, CheckCircle2, XCircle } from 'lucide-react';
import { useVoipTrunks, useDeleteTrunk, useTestTrunk, type VoipTrunk } from '@/hooks/useVoipTrunks';
import { VoipTrunkFormDrawer } from '@/components/admin/voip/VoipTrunkFormDrawer';
import { TrunkAssignmentsTab } from '@/components/admin/voip/TrunkAssignmentsTab';
import { usePageTitle } from '@/hooks/usePageTitle';

const PROVIDER_LABELS: Record<string, string> = {
  nvoip: 'Nvoip', directcall: 'Directcall', totalvoice: 'TotalVoice',
  wavoip: 'Wavoip', generic: 'Genérico SIP',
};

export default function VoipTrunksAdmin() {
  usePageTitle('Linhas VoIP');
  const { data: trunks = [], isLoading } = useVoipTrunks();
  const del = useDeleteTrunk();
  const test = useTestTrunk();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<VoipTrunk | null>(null);

  const openNew = () => { setEditing(null); setDrawerOpen(true); };
  const openEdit = (t: VoipTrunk) => { setEditing(t); setDrawerOpen(true); };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Remover a linha "${name}"? Esta ação não pode ser desfeita.`)) {
      del.mutate(id);
    }
  };

  return (
    <div className="space-y-6 relative">
      <div className="fixed inset-0 pointer-events-none gradient-mesh-intense opacity-30" />
      <div className="relative space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gradient flex items-center gap-2">
              <Phone className="h-7 w-7 text-primary" />
              Linhas VoIP
            </h1>
            <p className="text-muted-foreground">Gerencie operadoras e atribuições de agentes</p>
          </div>
          <Button onClick={openNew} className="gap-2">
            <Plus className="h-4 w-4" /> Nova Linha
          </Button>
        </div>

        <Tabs defaultValue="trunks">
          <TabsList>
            <TabsTrigger value="trunks" className="gap-2"><Phone className="h-4 w-4" /> Trunks</TabsTrigger>
            <TabsTrigger value="assignments" className="gap-2"><Users className="h-4 w-4" /> Atribuições</TabsTrigger>
          </TabsList>

          <TabsContent value="trunks" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Operadoras Cadastradas ({trunks.length})</CardTitle>
                <CardDescription>Linhas SIP disponíveis para os agentes</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                ) : trunks.length === 0 ? (
                  <div className="text-center py-12">
                    <Phone className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground mb-4">Nenhuma linha VoIP cadastrada</p>
                    <Button onClick={openNew} variant="outline" className="gap-2">
                      <Plus className="h-4 w-4" /> Cadastrar primeira linha
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {trunks.map(t => (
                      <div key={t.id} className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/30 transition-colors">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                            <Phone className="h-5 w-5 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium truncate">{t.name}</p>
                              <Badge variant="secondary">{PROVIDER_LABELS[t.provider]}</Badge>
                              {t.is_active ? (
                                <Badge variant="default" className="bg-success/10 text-success border-success/20 gap-1">
                                  <CheckCircle2 className="h-3 w-3" /> Ativo
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="gap-1">
                                  <XCircle className="h-3 w-3" /> Inativo
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {t.sip_server} • {t.transport.toUpperCase()} • {t.max_channels} canais • prioridade {t.priority}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button variant="ghost" size="sm" onClick={() => test.mutate(t.id)} disabled={test.isPending} className="gap-1">
                            <Zap className="h-4 w-4" /> Testar
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openEdit(t)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id, t.name)} disabled={del.isPending}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assignments">
            <TrunkAssignmentsTab />
          </TabsContent>
        </Tabs>
      </div>

      <VoipTrunkFormDrawer open={drawerOpen} onOpenChange={setDrawerOpen} trunk={editing} />
    </div>
  );
}
