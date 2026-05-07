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
 import { Video, Plus, Users, Clock, Calendar, Play, Square, Link2, Copy, Check } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';

export default function VideoConference() {
  usePageTitle('Videoconferência');

  const queryClient = useQueryClient();
   const [title, setTitle] = useState('');
   const [dialogOpen, setDialogOpen] = useState(false);
   const [copiedId, setCopiedId] = useState<string | null>(null);
 
   const copyToClipboard = (text: string, id: string) => {
     navigator.clipboard.writeText(text);
     setCopiedId(id);
     toast.success('Link copiado!');
     setTimeout(() => setCopiedId(null), 2000);
   };

  const { data: conferences = [], isLoading } = useQuery({
    queryKey: ['video-conferences'],
    queryFn: async () => {
      const { data, error } = await supabase.from('video_conferences').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const createConference = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('video_conferences').insert({ title, status: 'scheduled' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video-conferences'] });
      setTitle('');
      setDialogOpen(false);
      toast.success('Conferência criada!');
    },
  });

  const statusColors: Record<string, string> = {
    scheduled: 'bg-info/10 text-info',
    active: 'bg-success/10 text-success',
    ended: 'bg-muted text-muted-foreground',
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Video className="h-8 w-8 text-primary" />
            Videoconferência
          </h1>
          <p className="text-muted-foreground">Reuniões em vídeo com compartilhamento de tela</p>
          <Badge variant="outline" className="mt-2">⚠️ Aguardando integração com provedor de vídeo</Badge>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Nova Reunião</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Criar Reunião</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Título</Label><Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Reunião de equipe" /></div>
              <Button onClick={() => createConference.mutate()} disabled={!title.trim()}>Criar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><Video className="h-5 w-5 text-primary" /></div>
          <div><p className="text-2xl font-bold">{conferences.length}</p><p className="text-xs text-muted-foreground">Total</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center"><Play className="h-5 w-5 text-success" /></div>
          <div><p className="text-2xl font-bold">{conferences.filter((c) => c.status === 'active').length}</p><p className="text-xs text-muted-foreground">Ativas</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center"><Calendar className="h-5 w-5 text-info" /></div>
          <div><p className="text-2xl font-bold">{conferences.filter((c) => c.status === 'scheduled').length}</p><p className="text-xs text-muted-foreground">Agendadas</p></div>
        </CardContent></Card>
      </div>

      <div className="space-y-3">
        {conferences.length === 0 ? (
          <Card className="p-12 text-center">
            <Video className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-lg font-medium text-muted-foreground">Nenhuma conferência</p>
          </Card>
        ) : conferences.map((conf) => (
          <Card key={conf.id} className="hover:shadow-md transition-all">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><Video className="h-5 w-5 text-primary" /></div>
                <div>
                  <p className="font-medium">{conf.title}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-2">
                    <Users className="h-3 w-3" /> {(conf.participants as any[])?.length || 0} participantes
                    <Clock className="h-3 w-3 ml-2" /> {new Date(conf.created_at).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
               <div className="flex items-center gap-2">
                 <Badge className={statusColors[conf.status] || ''}>
                   {conf.status === 'scheduled' ? 'Agendada' : conf.status === 'active' ? 'Ativa' : 'Encerrada'}
                 </Badge>
                 {conf.meeting_url && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8" 
                    onClick={() => copyToClipboard(conf.meeting_url || '', conf.id)}
                  >
                     {copiedId === conf.id ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                   </Button>
                 )}
                 <Button 
                   variant={conf.status === 'active' ? 'default' : 'outline'} 
                   size="sm"
                   className={conf.status === 'active' ? 'animate-pulse' : ''}
                   disabled={conf.status === 'ended'}
                 >
                   {conf.status === 'active' ? 'Entrar' : 'Iniciar'}
                 </Button>
               </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
