import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
   Search, MoreVertical, Smartphone, Network, QrCode, UserCog, Headphones, FolderSync,
   AlertTriangle, Copy, Loader2, Users2, Heart, Download, PowerOff, X, LayoutDashboard,
} from 'lucide-react';
import { toast } from 'sonner';
import { useExtensionsOverview, type ExtensionOverview } from '@/hooks/useExtensionsOverview';
import { ExtensionStatusBadge, TrunkHealthBadge } from '@/components/admin/extensions/ExtensionStatusBadge';
import { ExtensionDetailsDrawer } from '@/components/admin/extensions/ExtensionDetailsDrawer';
import { HealthScoreBadge } from '@/components/admin/extensions/HealthScoreBadge';
import { BulkAssignTrunkDialog } from '@/components/admin/extensions/BulkAssignTrunkDialog';
import { usePageTitle } from '@/hooks/usePageTitle';
import { exportToCSV } from '@/lib/export';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { logger } from '@/lib/logger';
import { useExtensionAudit } from '@/hooks/useExtensionAudit';

type HealthFilter = 'all' | 'healthy' | 'warning' | 'critical';

export default function ExtensionsAdmin() {
  usePageTitle('Gestão de Ramais');
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: extensions = [], isLoading } = useExtensionsOverview();
  const { logBulk } = useExtensionAudit();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [trunkFilter, setTrunkFilter] = useState<string>('all');
  const [healthFilter, setHealthFilter] = useState<HealthFilter>('all');
  const [selected, setSelected] = useState<ExtensionOverview | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkTrunkOpen, setBulkTrunkOpen] = useState(false);
  const [bulkOffline, setBulkOffline] = useState(false);

  const filtered = useMemo(() => {
    return extensions.filter(e => {
      if (search) {
        const q = search.toLowerCase();
        if (!e.name.toLowerCase().includes(q) && !e.extension.includes(q) && !(e.email ?? '').toLowerCase().includes(q)) {
          return false;
        }
      }
      if (statusFilter !== 'all' && e.status !== statusFilter) return false;
      if (trunkFilter === 'with' && !e.primary_trunk_id) return false;
      if (trunkFilter === 'without' && e.primary_trunk_id) return false;
      if (healthFilter === 'healthy' && e.health_score < 80) return false;
      if (healthFilter === 'warning' && (e.health_score < 50 || e.health_score >= 80)) return false;
      if (healthFilter === 'critical' && e.health_score >= 50) return false;
      return true;
    });
  }, [extensions, search, statusFilter, trunkFilter, healthFilter]);

  const stats = useMemo(() => {
    const total = extensions.length;
    const sumScore = extensions.reduce((s, e) => s + e.health_score, 0);
    return {
      total,
      online: extensions.filter(e => e.status === 'available' || e.status === 'busy').length,
      noTrunk: extensions.filter(e => !e.primary_trunk_id).length,
    avgScore: total > 0 ? Math.round(sumScore / total) : 0,
    };
  }, [extensions]);

  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('tab') || 'extensions';
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab && tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [window.location.search]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    navigate(`/admin/extensions?tab=${value}`, { replace: true });
  };

  const allFilteredSelected = filtered.length > 0 && filtered.every(e => selectedIds.has(e.agent_id));
  const someFilteredSelected = filtered.some(e => selectedIds.has(e.agent_id));

  const toggleAll = () => {
    const next = new Set(selectedIds);
    if (allFilteredSelected) {
      filtered.forEach(e => next.delete(e.agent_id));
    } else {
      filtered.forEach(e => next.add(e.agent_id));
    }
    setSelectedIds(next);
  };

  const toggleOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  const clearSelection = () => setSelectedIds(new Set());

  const copySip = (ext: ExtensionOverview) => {
    const sip = `sip:${ext.extension}@${ext.primary_trunk_name ?? 'pbx.local'}`;
    navigator.clipboard.writeText(sip);
    toast.success('Credencial SIP copiada');
  };

  const handleBulkOffline = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setBulkOffline(true);
    try {
      const { error } = await supabase.from('agents').update({ status: 'offline' }).in('id', ids);
      if (error) throw error;
      toast.success(`${ids.length} ${ids.length === 1 ? 'ramal' : 'ramais'} marcados como offline`);
      logBulk({ action: 'bulk_force_offline', agentIds: ids });
      qc.invalidateQueries({ queryKey: ['extensions-overview'] });
      clearSelection();
    } catch (e) {
      const err = e as Error;
      logger.error('bulk-offline', err);
      toast.error('Falha ao atualizar status', { description: err.message });
    } finally {
      setBulkOffline(false);
    }
  };

  const handleExportCsv = () => {
    const rows = (selectedIds.size > 0 ? filtered.filter(e => selectedIds.has(e.agent_id)) : filtered);
    if (rows.length === 0) {
      toast.warning('Nada para exportar');
      return;
    }
    exportToCSV(
      rows.map(e => ({
        ramal: e.extension,
        nome: e.name,
        email: e.email ?? '',
        status: e.status,
        dispositivos: e.device_count,
        trunk: e.primary_trunk_name ?? '',
        provedor: e.primary_trunk_provider ?? '',
        saude_trunk: e.primary_trunk_health ?? '',
        score: e.health_score,
        chamadas_7d: e.call_count_7d,
        ultima_chamada: e.last_call_at ?? '',
        problemas: e.health_issues.join(' | '),
      })),
      [
        { key: 'ramal', label: 'Ramal' },
        { key: 'nome', label: 'Nome' },
        { key: 'email', label: 'E-mail' },
        { key: 'status', label: 'Status' },
        { key: 'dispositivos', label: 'Dispositivos' },
        { key: 'trunk', label: 'Trunk Primário' },
        { key: 'provedor', label: 'Provedor' },
        { key: 'saude_trunk', label: 'Saúde Trunk' },
        { key: 'score', label: 'Score' },
        { key: 'chamadas_7d', label: 'Chamadas 7d' },
        { key: 'ultima_chamada', label: 'Última Chamada' },
        { key: 'problemas', label: 'Problemas' },
      ],
      `ramais-${new Date().toISOString().slice(0, 10)}`,
    );
    logBulk({
      action: 'bulk_export_csv',
      agentIds: rows.map(r => r.agent_id),
      details: { source: selectedIds.size > 0 ? 'selection' : 'filtered' },
    });
    toast.success(`Exportados ${rows.length} ramais`);
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
          <StatCard icon={Users2} label="Total de Ramais" value={stats.total} tone="primary" />
          <StatCard icon={Headphones} label="Online Agora" value={stats.online} tone="success" />
          <StatCard icon={Network} label="Sem Trunk" value={stats.noTrunk} tone={stats.noTrunk > 0 ? 'warning' : 'muted'} />
          <StatCard icon={Heart} label="Score Médio" value={stats.avgScore}
            tone={stats.avgScore >= 80 ? 'success' : stats.avgScore >= 50 ? 'warning' : 'destructive'} suffix="/100" />
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full md:w-auto">
            <TabsTrigger value="extensions" className="gap-2">
              <Users2 className="h-4 w-4" /> Ramais
            </TabsTrigger>
            <TabsTrigger value="trunks" className="gap-2">
              <Network className="h-4 w-4" /> Trunks
            </TabsTrigger>
            <TabsTrigger value="provisioning" className="gap-2">
              <QrCode className="h-4 w-4" /> Provisionamento
            </TabsTrigger>
            <TabsTrigger value="devices" className="gap-2">
              <Smartphone className="h-4 w-4" /> Dispositivos
            </TabsTrigger>
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
                    {selectedIds.size > 0 && (
                      <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2">
                        <Button variant="outline" size="sm" onClick={handleBulkOffline} disabled={bulkOffline} className="gap-2 text-destructive border-destructive/20 hover:bg-destructive/10">
                          {bulkOffline ? <Loader2 className="h-3 w-3 animate-spin" /> : <PowerOff className="h-3 w-3" />}
                          Offline ({selectedIds.size})
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setBulkTrunkOpen(true)} className="gap-2">
                          <Network className="h-3 w-3" /> Alterar Trunk ({selectedIds.size})
                        </Button>
                      </div>
                    )}
                    <Button variant="outline" size="sm" onClick={handleExportCsv} className="gap-2">
                      <Download className="h-3 w-3" /> Exportar
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col md:flex-row gap-3 flex-wrap">
                  <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, ramal ou e-mail..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos status</SelectItem>
                <SelectItem value="available">Disponível</SelectItem>
                <SelectItem value="busy">Ocupado</SelectItem>
                <SelectItem value="away">Ausente</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
              </SelectContent>
            </Select>
            <Select value={trunkFilter} onValueChange={setTrunkFilter}>
              <SelectTrigger className="w-full md:w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos trunks</SelectItem>
                <SelectItem value="with">Com trunk</SelectItem>
                <SelectItem value="without">Sem trunk</SelectItem>
              </SelectContent>
            </Select>
            <Select value={healthFilter} onValueChange={v => setHealthFilter(v as HealthFilter)}>
              <SelectTrigger className="w-full md:w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toda saúde</SelectItem>
                <SelectItem value="healthy">Saudáveis (≥80)</SelectItem>
                <SelectItem value="warning">Atenção (50-79)</SelectItem>
                <SelectItem value="critical">Críticos (&lt;50)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">Nenhum ramal encontrado.</div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={allFilteredSelected}
                        onCheckedChange={toggleAll}
                        aria-label="Selecionar todos filtrados"
                        {...(someFilteredSelected && !allFilteredSelected ? { 'data-state': 'indeterminate' } : {})}
                      />
                    </TableHead>
                    <TableHead>Ramal</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Disp.</TableHead>
                    <TableHead>Trunk Primário</TableHead>
                    <TableHead>Saúde</TableHead>
                    <TableHead className="text-center">Chamadas 7d</TableHead>
                    <TableHead className="text-center">Score</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(ext => {
                    const isSelected = selectedIds.has(ext.agent_id);
                    return (
                      <TableRow
                        key={ext.agent_id}
                        className={`cursor-pointer hover:bg-muted/40 ${isSelected ? 'bg-primary/5' : ''}`}
                        onClick={() => setSelected(ext)}
                      >
                        <TableCell onClick={e => e.stopPropagation()}>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleOne(ext.agent_id)}
                            aria-label={`Selecionar ${ext.name}`}
                          />
                        </TableCell>
                        <TableCell className="font-mono font-bold text-primary">{ext.extension}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{ext.name}</span>
                            {ext.department && <span className="text-xs text-muted-foreground">{ext.department}</span>}
                          </div>
                        </TableCell>
                        <TableCell><ExtensionStatusBadge status={ext.status} /></TableCell>
                        <TableCell className="text-center">
                          <span className={ext.device_count === 0 ? 'text-warning' : 'font-semibold'}>
                            {ext.device_count}
                          </span>
                        </TableCell>
                        <TableCell>
                          {ext.primary_trunk_name ? (
                            <div className="flex flex-col">
                              <span className="text-sm">{ext.primary_trunk_name}</span>
                              <span className="text-xs text-muted-foreground capitalize">{ext.primary_trunk_provider}</span>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-warning">
                              <AlertTriangle className="h-3 w-3" /> Sem trunk
                            </span>
                          )}
                        </TableCell>
                        <TableCell><TrunkHealthBadge health={ext.primary_trunk_health} /></TableCell>
                        <TableCell className="text-center">
                          <span className={ext.call_count_7d === 0 ? 'text-muted-foreground' : 'font-semibold text-primary'}>
                            {ext.call_count_7d}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <HealthScoreBadge score={ext.health_score} issues={ext.health_issues} />
                        </TableCell>
                        <TableCell onClick={e => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setSelected(ext)}>
                                <Search className="h-4 w-4 mr-2" /> Ver detalhes
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => navigate('/admin/users')}>
                                <UserCog className="h-4 w-4 mr-2" /> Editar agente
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate('/multi-device-ring')}>
                                <Smartphone className="h-4 w-4 mr-2" /> Dispositivos
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate('/admin/voip-trunks')}>
                                <Network className="h-4 w-4 mr-2" /> Atribuir trunk
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate(`/qr-provisioning?ext=${ext.extension}`)}>
                                <QrCode className="h-4 w-4 mr-2" /> Gerar QR
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => copySip(ext)}>
                                <Copy className="h-4 w-4 mr-2" /> Copiar SIP
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
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
        agentIds={Array.from(selectedIds)}
        onSuccess={clearSelection}
      />

      {/* Floating bulk actions bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4">
          <Card className="border-primary/40 shadow-[0_0_30px_hsl(var(--primary)/0.3)] backdrop-blur-md bg-card/95">
            <CardContent className="flex items-center gap-3 py-3 px-4">
              <span className="text-sm font-semibold text-primary">
                {selectedIds.size} selecionado{selectedIds.size > 1 ? 's' : ''}
              </span>
              <div className="h-6 w-px bg-border" />
              <Button size="sm" variant="outline" onClick={() => setBulkTrunkOpen(true)}>
                <Network className="h-4 w-4 mr-2" /> Atribuir trunk
              </Button>
              <Button size="sm" variant="outline" onClick={handleBulkOffline} disabled={bulkOffline}>
                {bulkOffline ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <PowerOff className="h-4 w-4 mr-2" />}
                Forçar offline
              </Button>
              <Button size="sm" variant="outline" onClick={handleExportCsv}>
                <Download className="h-4 w-4 mr-2" /> Exportar CSV
              </Button>
              <Button size="sm" variant="ghost" onClick={clearSelection} aria-label="Limpar seleção">
                <X className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tone, suffix }: {
  icon: React.ElementType; label: string; value: number; suffix?: string;
  tone: 'primary' | 'success' | 'warning' | 'muted' | 'destructive';
}) {
  const toneCls = {
    primary: 'text-primary border-primary/30 shadow-[0_0_15px_hsl(var(--primary)/0.15)]',
    success: 'text-success border-success/30 shadow-[0_0_15px_hsl(var(--success)/0.15)]',
    warning: 'text-warning border-warning/30 shadow-[0_0_15px_hsl(var(--warning)/0.15)]',
    destructive: 'text-destructive border-destructive/30 shadow-[0_0_15px_hsl(var(--destructive)/0.15)]',
    muted: 'text-muted-foreground border-border',
  }[tone];
  return (
    <Card className={`${toneCls} border`}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold">{label}</p>
            <p className="text-3xl font-bold mt-1 text-display">
              {value}{suffix && <span className="text-lg opacity-60">{suffix}</span>}
            </p>
          </div>
          <Icon className="h-8 w-8 opacity-70" />
        </div>
      </CardContent>
    </Card>
  );
}
