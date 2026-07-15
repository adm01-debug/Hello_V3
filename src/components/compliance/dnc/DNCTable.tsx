import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Phone, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getReasonLabel, getReasonVariant } from './constants';

interface DNCItem {
  id: string;
  phone: string;
  phone_normalized: string;
  reason: string;
  source: string;
  added_by: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
}

interface Props {
  items: DNCItem[];
  isLoading: boolean;
  onRemove: (id: string) => void;
}

export function DNCTable({ items, isLoading, onRemove }: Props) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Telefone</TableHead>
            <TableHead>Motivo</TableHead>
            <TableHead>Fonte</TableHead>
            <TableHead>Adicionado Por</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[80px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow><TableCell colSpan={7} className="text-center py-8">Carregando...</TableCell></TableRow>
          ) : items.length === 0 ? (
            <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum número na lista DNC</TableCell></TableRow>
          ) : (
            items.slice(0, 50).map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="font-mono">{item.phone}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getReasonVariant(item.reason)}>{getReasonLabel(item.reason)}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{item.source}</TableCell>
                <TableCell className="text-muted-foreground">{item.added_by || '-'}</TableCell>
                <TableCell className="text-muted-foreground">
                  {format(new Date(item.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                </TableCell>
                <TableCell>
                  <Badge variant={item.is_active ? 'default' : 'secondary'}>
                    {item.is_active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remover da Lista DNC?</AlertDialogTitle>
                        <AlertDialogDescription>
                          O número {item.phone} poderá ser contatado novamente. Esta ação pode ser revertida adicionando o número novamente.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onRemove(item.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Remover
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
