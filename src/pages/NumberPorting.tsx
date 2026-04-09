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
import { ArrowLeftRight, Plus, Phone, Building, Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';

export default function NumberPorting() {
  usePageTitle('Portabilidade Numérica');

  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ phone: '', provider: '', account: '', name: '' });

  const { data: requests = [] } = useQuery({
    queryKey: ['porting-requests'],
    queryFn: async () => {
      const { data, error } = await supabase.from('number_porting_requests').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const createRequest = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('number_porting_requests').insert({
        phone_number: form.phone,
        current_provider: form.provider,
        account_number: form.account || null,
        authorized_name: form.name,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['porting-requests'] });
      setForm({ phone: '', provider: '', account: '', name: '' });
      setDialogOpen(false);
      toast.success('Solicitação de portabilidade criada!');
    },
  });

  const statusConfig: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string }> = {
    pending: { icon: Clock, color: 'text-amber-500' },
    processing: { icon: Loader2, color: 'text-blue-500' },
    completed: { icon: CheckCircle2, color: 'text-success' },
    rejected: { icon: XCircle, color: 'text-destructive' },
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <ArrowLeftRight className="h-8 w-8 text-primary" />
            Portabilidade de Números
          </h1>
          <p className="text-muted-foreground">Migração de números telefônicos existentes</p>
          <Badge variant="outline" className="mt-2">⚠️ Aguardando integração com operadora</Badge>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" /> Nova Solicitação</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Solicitar Portabilidade</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Número Telefônico</Label><Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+55 11 9999-9999" /></div>
              <div><Label>Operadora Atual</Label><Input value={form.provider} onChange={e => setForm(p => ({ ...p, provider: e.target.value }))} placeholder="Ex: Vivo, Claro" /></div>
              <div><Label>Nº da Conta (opcional)</Label><Input value={form.account} onChange={e => setForm(p => ({ ...p, account: e.target.value }))} /></div>
              <div><Label>Nome Autorizado</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Nome do titular" /></div>
              <Button onClick={() => createRequest.mutate()} disabled={!form.phone.trim() || !form.provider.trim() || !form.name.trim()}>Solicitar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {requests.length === 0 ? (
          <Card className="p-12 text-center">
            <ArrowLeftRight className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-lg font-medium text-muted-foreground">Nenhuma solicitação de portabilidade</p>
          </Card>
        ) : requests.map((req) => {
          const cfg = statusConfig[req.status] || statusConfig.pending;
          const StatusIcon = cfg.icon;
          return (
            <Card key={req.id} className="hover:shadow-md transition-all">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <StatusIcon className={`h-5 w-5 ${cfg.color}`} />
                  <div>
                    <p className="font-medium flex items-center gap-2"><Phone className="h-4 w-4" /> {req.phone_number}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-2">
                      <Building className="h-3 w-3" /> {req.current_provider} • {req.authorized_name} • {new Date(req.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                <Badge variant={req.status === 'completed' ? 'default' : req.status === 'rejected' ? 'destructive' : 'outline'}>
                  {req.status}
                </Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
