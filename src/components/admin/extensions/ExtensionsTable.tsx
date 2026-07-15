import { useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { AlertTriangle, Copy, MoreVertical, Network, QrCode, Search, Smartphone, UserCog } from 'lucide-react';
import { toast } from 'sonner';
import { ExtensionStatusBadge, TrunkHealthBadge } from './ExtensionStatusBadge';
import { HealthScoreBadge } from './HealthScoreBadge';
import type { ExtensionOverview } from '@/hooks/useExtensionsOverview';

export interface ExtensionsTableProps {
  rows: ExtensionOverview[];
  selectedIds: Set<string>;
  allFilteredSelected: boolean;
  someFilteredSelected: boolean;
  onToggleAll: () => void;
  onToggleOne: (id: string) => void;
  onSelect: (ext: ExtensionOverview) => void;
}

export function ExtensionsTable({
  rows, selectedIds, allFilteredSelected, someFilteredSelected,
  onToggleAll, onToggleOne, onSelect,
}: ExtensionsTableProps) {
  const navigate = useNavigate();

  const copySip = (ext: ExtensionOverview) => {
    const sip = `sip:${ext.extension}@${ext.primary_trunk_name ?? 'pbx.local'}`;
    navigator.clipboard.writeText(sip);
    toast.success('Credencial SIP copiada');
  };

  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <Checkbox
                checked={allFilteredSelected}
                onCheckedChange={onToggleAll}
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
          {rows.map(ext => {
            const isSelected = selectedIds.has(ext.agent_id);
            return (
              <TableRow
                key={ext.agent_id}
                className={`cursor-pointer hover:bg-muted/40 ${isSelected ? 'bg-primary/5' : ''}`}
                onClick={() => onSelect(ext)}
              >
                <TableCell onClick={e => e.stopPropagation()}>
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onToggleOne(ext.agent_id)}
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
                      <DropdownMenuItem onClick={() => onSelect(ext)}>
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
  );
}
