import { Edit, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { CallingHoursRegion } from './types';
import { normalizeTime } from './types';

interface Props {
  regions: CallingHoursRegion[];
  isLoading: boolean;
  onEdit: (region: CallingHoursRegion) => void;
  onDelete: (region: CallingHoursRegion) => void;
  onToggleActive: (region: CallingHoursRegion) => void;
}

const fmt = (t: string | null) => normalizeTime(t) ?? '—';

export const RegionsTable = ({
  regions,
  isLoading,
  onEdit,
  onDelete,
  onToggleActive,
}: Props) => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Região</TableHead>
            <TableHead>Timezone</TableHead>
            <TableHead>Dias úteis</TableHead>
            <TableHead>Sábado</TableHead>
            <TableHead>Domingo</TableHead>
            <TableHead>Feriados</TableHead>
            <TableHead>Ativa</TableHead>
            <TableHead className="w-[100px] text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8">
                Carregando…
              </TableCell>
            </TableRow>
          ) : regions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                Nenhuma região configurada
              </TableCell>
            </TableRow>
          ) : (
            regions.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{r.region_name}</p>
                    <p className="text-xs text-muted-foreground">{r.region_code}</p>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">{r.timezone}</TableCell>
                <TableCell>
                  <span className="font-mono text-sm">
                    {fmt(r.weekday_start)} – {fmt(r.weekday_end)}
                  </span>
                </TableCell>
                <TableCell>
                  {r.saturday_start && r.saturday_end ? (
                    <span className="font-mono text-sm">
                      {fmt(r.saturday_start)} – {fmt(r.saturday_end)}
                    </span>
                  ) : (
                    <Badge variant="secondary">Bloqueado</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {r.sunday_allowed && r.sunday_start && r.sunday_end ? (
                    <span className="font-mono text-sm">
                      {fmt(r.sunday_start)} – {fmt(r.sunday_end)}
                    </span>
                  ) : (
                    <Badge variant="secondary">Bloqueado</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={r.holidays_allowed ? 'default' : 'secondary'}>
                    {r.holidays_allowed ? 'Permitido' : 'Bloqueado'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Switch
                    checked={r.is_active}
                    onCheckedChange={() => onToggleActive(r)}
                    aria-label={`Ativar/desativar ${r.region_name}`}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(r)}
                      aria-label={`Editar ${r.region_name}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(r)}
                      aria-label={`Excluir ${r.region_name}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};
