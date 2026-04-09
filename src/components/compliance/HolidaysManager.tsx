import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Calendar, Plus, Trash2, Globe, MapPin, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function HolidaysManager() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [isNational, setIsNational] = useState(true);
  const [recurring, setRecurring] = useState(false);
  const [regionCode, setRegionCode] = useState('');

  const { data: holidays = [], isLoading } = useQuery({
    queryKey: ['holidays'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('holidays')
        .select('*')
        .order('date', { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const addHoliday = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('holidays').insert({
        name,
        date,
        is_national: isNational,
        recurring,
        region_code: isNational ? null : regionCode || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
      toast.success('Feriado adicionado');
      setDialogOpen(false);
      setName('');
      setDate('');
      setIsNational(true);
      setRecurring(false);
      setRegionCode('');
    },
    onError: () => toast.error('Erro ao adicionar feriado'),
  });

  const deleteHoliday = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('holidays').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
      toast.success('Feriado removido');
    },
  });

  if (isLoading) return <div className="text-center py-8 text-muted-foreground">Carregando...</div>;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" /> Feriados</CardTitle>
          <CardDescription>Gerencie feriados para configurações de horário de discagem</CardDescription>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-2" />Adicionar</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Feriado</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1">
                <Label>Nome</Label>
                <Input placeholder="Ex: Natal" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Data</Label>
                <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2"><Globe className="h-4 w-4" />Nacional</Label>
                <Switch checked={isNational} onCheckedChange={setIsNational} />
              </div>
              {!isNational && (
                <div className="space-y-1">
                  <Label>Código da Região</Label>
                  <Input placeholder="Ex: SP" value={regionCode} onChange={e => setRegionCode(e.target.value)} />
                </div>
              )}
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2"><RotateCcw className="h-4 w-4" />Recorrente (todo ano)</Label>
                <Switch checked={recurring} onCheckedChange={setRecurring} />
              </div>
              <Button className="w-full" onClick={() => addHoliday.mutate()} disabled={!name || !date}>
                Adicionar Feriado
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {holidays.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">Nenhum feriado cadastrado</div>
        ) : (
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Recorrente</TableHead>
                  <TableHead>Região</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {holidays.map(h => (
                  <TableRow key={h.id}>
                    <TableCell className="font-medium">{h.name}</TableCell>
                    <TableCell className="text-sm">{format(new Date(h.date + 'T12:00:00'), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                    <TableCell>
                      {h.is_national ? (
                        <Badge variant="secondary" className="gap-1"><Globe className="h-3 w-3" />Nacional</Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1"><MapPin className="h-3 w-3" />Regional</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {h.recurring ? (
                        <Badge className="bg-primary/15 text-primary gap-1"><RotateCcw className="h-3 w-3" />Sim</Badge>
                      ) : 'Não'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{h.region_code || '—'}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteHoliday.mutate(h.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
