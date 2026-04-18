import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Search, MoreVertical, Smartphone, Network, QrCode, UserCog, Headphones, AlertTriangle, Copy, Loader2, Users2 } from 'lucide-react';
import { toast } from 'sonner';
import { useExtensionsOverview, type ExtensionOverview } from '@/hooks/useExtensionsOverview';
import { ExtensionStatusBadge, TrunkHealthBadge } from '@/components/admin/extensions/ExtensionStatusBadge';
import { ExtensionDetailsDrawer } from '@/components/admin/extensions/ExtensionDetailsDrawer';
import { usePageTitle } from '@/hooks/usePageTitle';

export default function ExtensionsAdmin() {
  usePageTitle('Gestão de Ramais');
  const navigate = useNavigate();
  const { data: extensions = [], isLoading } = useExtensionsOverview();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [trunkFilter, setTrunkFilter] = useState<string>('all');
  const [selected, setSelected] = useState<ExtensionOverview | null>(null);

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
      return true;
    });
  }, [extensions, search, statusFilter, trunkFilter]);

  const stats = useMemo(() => ({
    total: extensions.length,
    online: extensions.filter(e => e.status === 'available' || e.status === 'busy').length,
    noTrunk: extensions.filter(e => !e.primary_trunk_id).length,
    noDevices: extensions.filter(e => e.device_count === 0).length,
  }), [extensions]);

  const copySip = (ext: ExtensionOverview) => {
    const sip = `sip:${ext.extension}@${ext.primary_trunk_name ?? 'pbx.local'}`;
    navigator.clipboard.writeText(sip);
    toast.success('Credencial SIP copiada');
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-display tracking-wide">Gestão de Ramais</h1>
        <p className="text-muted-foreground">Visão 360° de todos os ramais, dispositivos, trunks e provisionamento.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users2} label="Total de Ramais" value={stats.total} tone="primary" />
        <StatCard icon={Headphones} label="Online Agora" value={stats.online} tone="success" />
        <StatCard icon={Network} label="Sem Trunk" value={stats.noTrunk} tone={stats.noTrunk > 0 ? 'warning' : 'muted'} />
        <StatCard icon={Smartphone} label="Sem Dispositivos" value={stats.noDevices} tone={stats.noDevices > 0 ? 'warning' : 'muted'} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ramais cadastrados</CardTitle>
          <CardDescription>Pesquise, filtre e gerencie todos os ramais em uma única tela.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, ramal ou e-mail..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos status</SelectItem>
                <SelectItem value="available">Disponível</SelectItem>
                <SelectItem value="busy">Ocupado</SelectItem>
                <SelectItem value="away">Ausente</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
              </SelectContent>
            </Select>
            <Select value={trunkFilter} onValueChange={setTrunkFilter}>
              <SelectTrigger className="w-full md:w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos trunks</SelectItem>
                <SelectItem value="with">Com trunk</SelectItem>
                <SelectItem value="without">Sem trunk</SelectItem>
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
                    <TableHead>Ramal</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Dispositivos</TableHead>
                    <TableHead>Trunk Primário</TableHead>
                    <TableHead>Saúde</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(ext => (
                    <TableRow
                      key={ext.agent_id}
                      className="cursor-pointer hover:bg-muted/40"
                      onClick={() => setSelected(ext)}
                    >
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
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <ExtensionDetailsDrawer
        extension={selected}
        open={!!selected}
        onOpenChange={o => !o && setSelected(null)}
      />
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tone }: {
  icon: React.ElementType; label: string; value: number;
  tone: 'primary' | 'success' | 'warning' | 'muted';
}) {
  const toneCls = {
    primary: 'text-primary border-primary/30 shadow-[0_0_15px_hsl(var(--primary)/0.15)]',
    success: 'text-success border-success/30 shadow-[0_0_15px_hsl(var(--success)/0.15)]',
    warning: 'text-warning border-warning/30 shadow-[0_0_15px_hsl(var(--warning)/0.15)]',
    muted: 'text-muted-foreground border-border',
  }[tone];
  return (
    <Card className={`${toneCls} border`}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold">{label}</p>
            <p className="text-3xl font-bold mt-1 text-display">{value}</p>
          </div>
          <Icon className="h-8 w-8 opacity-70" />
        </div>
      </CardContent>
    </Card>
  );
}
