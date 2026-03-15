import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Printer, Send, Inbox, Plus, FileText, Clock, CheckCircle2, XCircle } from 'lucide-react';

export default function VirtualFax() {
  const queryClient = useQueryClient();
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: faxes = [] } = useQuery({
    queryKey: ['virtual-fax'],
    queryFn: async () => {
      const { data, error } = await supabase.from('virtual_fax').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const sendFax = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('virtual_fax').insert({
        to_number: to, subject, direction: 'outbound', status: 'pending',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['virtual-fax'] });
      setTo(''); setSubject(''); setDialogOpen(false);
      toast({ title: 'Fax enviado para fila!' });
    },
  });

  const statusIcon = (status: string) => {
    if (status === 'sent') return <CheckCircle2 className="h-4 w-4 text-success" />;
    if (status === 'failed') return <XCircle className="h-4 w-4 text-destructive" />;
    return <Clock className="h-4 w-4 text-amber-500" />;
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Printer className="h-8 w-8 text-primary" />
            Fax Virtual
          </h1>
          <p className="text-muted-foreground">Envio e recebimento de fax por e-mail</p>
          <Badge variant="outline" className="mt-2">⚠️ Aguardando integração com provedor de fax</Badge>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" /> Enviar Fax</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Enviar Fax</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Número Destino</Label><Input value={to} onChange={e => setTo(e.target.value)} placeholder="+55 11 9999-9999" /></div>
              <div><Label>Assunto</Label><Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Assunto do fax" /></div>
              <Button onClick={() => sendFax.mutate()} disabled={!to.trim()}>Enviar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><Send className="h-5 w-5 text-primary" /></div>
          <div><p className="text-2xl font-bold">{faxes.filter((f: any) => f.direction === 'outbound').length}</p><p className="text-xs text-muted-foreground">Enviados</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center"><Inbox className="h-5 w-5 text-blue-500" /></div>
          <div><p className="text-2xl font-bold">{faxes.filter((f: any) => f.direction === 'inbound').length}</p><p className="text-xs text-muted-foreground">Recebidos</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center"><Clock className="h-5 w-5 text-amber-500" /></div>
          <div><p className="text-2xl font-bold">{faxes.filter((f: any) => f.status === 'pending').length}</p><p className="text-xs text-muted-foreground">Pendentes</p></div>
        </CardContent></Card>
      </div>

      <div className="space-y-3">
        {faxes.length === 0 ? (
          <Card className="p-12 text-center">
            <Printer className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-lg font-medium text-muted-foreground">Nenhum fax registrado</p>
          </Card>
        ) : faxes.map((fax: any) => (
          <Card key={fax.id} className="hover:shadow-md transition-all">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                {statusIcon(fax.status)}
                <div>
                  <p className="font-medium">{fax.subject || fax.to_number}</p>
                  <p className="text-xs text-muted-foreground">
                    {fax.direction === 'outbound' ? `Para: ${fax.to_number}` : `De: ${fax.from_number}`} • 
                    {fax.page_count} páginas • {new Date(fax.created_at).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={fax.direction === 'outbound' ? 'default' : 'secondary'}>
                  {fax.direction === 'outbound' ? 'Enviado' : 'Recebido'}
                </Badge>
                <Badge variant="outline">{fax.status}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
