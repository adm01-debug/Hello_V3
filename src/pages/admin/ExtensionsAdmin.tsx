import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FolderSync, Headphones, Heart, LayoutDashboard, Loader2, Network,
  PowerOff, QrCode, Smartphone, Users2, Download,
} from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useExtensionsAdmin, type ExtensionOverview } from '@/hooks/useExtensionsAdmin';
import { ExtensionDetailsDrawer } from '@/components/admin/extensions/ExtensionDetailsDrawer';
import { BulkAssignTrunkDialog } from '@/components/admin/extensions/BulkAssignTrunkDialog';
import { StatCard } from '@/components/admin/extensions/StatCard';
import { ExtensionsFilters } from '@/components/admin/extensions/ExtensionsFilters';
import { ExtensionsTable } from '@/components/admin/extensions/ExtensionsTable';
import { BulkActionsBar } from '@/components/admin/extensions/BulkActionsBar';

export default function ExtensionsAdmin() {
  usePageTitle('Gestão de Ramais');
  const navigate = useNavigate();
  const admin = useExtensionsAdmin();

  const [selected, setSelected] = useState<ExtensionOverview | null>(null);
  const [bulkTrunkOpen, setBulkTrunkOpen] = useState(false);

  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('tab') || 'extensions';
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab && tab !== activeTab) setActiveTab(tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [window.location.search]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    navigate(`/admin/extensions?tab=${value}`, { replace: true });
  };

  return (
    <div className="space-y-6 p-6 pb-24 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none gradient-mesh-intense opacity-10" />

      <div className="relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
          <div>
            <h1 className="text-3xl font-bold text-display tracking-tight text-gradient">Painel de Ramais</h1>
            <p className="text-muted-foreground">Gestão unificada de dispositivos, trunks e provisionamento.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/executive')} className="gap-2">
              <LayoutDashboard className="h-4 w-4" /> Dashboard
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/ldap-sync')} className="gap-2">
              <FolderSync className="h-4 w-4" /> Sincronizar LDAP
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard icon={Users2} label="Total de Ramais" value={admin.stats.total} tone="primary" />
          <StatCard icon={Headphones} label="Online Agora" value={admin.stats.online} tone="success" />
          <StatCard
            icon={Network}
            label="Sem Trunk"
            value={admin.stats.noTrunk}
            tone={admin.stats.noTrunk > 0 ? 'warning' : 'muted'}
          />
          <StatCard
            icon={Heart}
            label="Score Médio"
            value={admin.stats.avgScore}
            tone={admin.stats.avgScore >= 80 ? 'success' : admin.stats.avgScore >= 50 ? 'warning' : 'destructive'}
            suffix="/100"
          />
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full md:w-auto">
            <TabsTrigger value="extensions" className="gap-2"><Users2 className="h-4 w-4" /> Ramais</TabsTrigger>
            <TabsTrigger value="trunks" className="gap-2"><Network className="h-4 w-4" /> Trunks</TabsTrigger>
            <TabsTrigger value="provisioning" className="gap-2"><QrCode className="h-4 w-4" /> Provisionamento</TabsTrigger>
            <TabsTrigger value="devices" className="gap-2"><Smartphone className="h-4 w-4" /> Dispositivos</TabsTrigger>
          </TabsList>

          <TabsContent value="extensions" className="space-y-4">
            <Card className="border-primary/10 shadow-sm bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Ramais Ativos</CardTitle>
                    <CardDescription>Pesquise, filtre e gerencie todos os ramais em uma única tela.</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {admin.selectedIds.size > 0 && (
                      <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={admin.handleBulkOffline}
                          disabled={admin.bulkOffline}
                          className="gap-2 text-destructive border-destructive/20 hover:bg-destructive/10"
                        >
                          {admin.bulkOffline ? <Loader2 className="h-3 w-3 animate-spin" /> : <PowerOff className="h-3 w-3" />}
                          Offline ({admin.selectedIds.size})
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setBulkTrunkOpen(true)} className="gap-2">
                          <Network className="h-3 w-3" /> Alterar Trunk ({admin.selectedIds.size})
                        </Button>
                      </div>
                    )}
                    <Button variant="outline" size="sm" onClick={admin.handleExportCsv} className="gap-2">
                      <Download className="h-3 w-3" /> Exportar
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ExtensionsFilters
                  search={admin.search} onSearch={admin.setSearch}
                  statusFilter={admin.statusFilter} onStatusFilter={admin.setStatusFilter}
                  trunkFilter={admin.trunkFilter} onTrunkFilter={admin.setTrunkFilter}
                  healthFilter={admin.healthFilter} onHealthFilter={admin.setHealthFilter}
                />

                {admin.isLoading ? (
                  <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                ) : admin.filtered.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">Nenhum ramal encontrado.</div>
                ) : (
                  <ExtensionsTable
                    rows={admin.filtered}
                    selectedIds={admin.selectedIds}
                    allFilteredSelected={admin.allFilteredSelected}
                    someFilteredSelected={admin.someFilteredSelected}
                    onToggleAll={admin.toggleAll}
                    onToggleOne={admin.toggleOne}
                    onSelect={setSelected}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trunks">
            <Card className="border-primary/10 bg-card/50 backdrop-blur-sm p-12 text-center">
              <Network className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-20" />
              <h3 className="text-lg font-semibold mb-2">Redirecionando para Trunks...</h3>
              <Button onClick={() => navigate('/admin/voip-trunks')}>Ir agora</Button>
            </Card>
          </TabsContent>

          <TabsContent value="provisioning">
            <Card className="border-primary/10 bg-card/50 backdrop-blur-sm p-12 text-center">
              <QrCode className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-20" />
              <h3 className="text-lg font-semibold mb-2">Redirecionando para Provisionamento...</h3>
              <Button onClick={() => navigate('/qr-provisioning')}>Ir agora</Button>
            </Card>
          </TabsContent>

          <TabsContent value="devices">
            <Card className="border-primary/10 bg-card/50 backdrop-blur-sm p-12 text-center">
              <Smartphone className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-20" />
              <h3 className="text-lg font-semibold mb-2">Redirecionando para Dispositivos...</h3>
              <Button onClick={() => navigate('/multi-device-ring')}>Ir agora</Button>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <ExtensionDetailsDrawer
        extension={selected}
        open={!!selected}
        onOpenChange={o => !o && setSelected(null)}
      />

      <BulkAssignTrunkDialog
        open={bulkTrunkOpen}
        onOpenChange={setBulkTrunkOpen}
        agentIds={Array.from(admin.selectedIds)}
        onSuccess={admin.clearSelection}
      />

      <BulkActionsBar
        count={admin.selectedIds.size}
        bulkOffline={admin.bulkOffline}
        onAssignTrunk={() => setBulkTrunkOpen(true)}
        onForceOffline={admin.handleBulkOffline}
        onExport={admin.handleExportCsv}
        onClear={admin.clearSelection}
      />
    </div>
  );
}
