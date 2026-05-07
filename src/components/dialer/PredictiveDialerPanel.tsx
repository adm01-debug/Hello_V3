import { useState, useEffect } from 'react';
import {
  Phone, Plus, Users, Target, TrendingUp, PhoneCall, List,
  MoreHorizontal, Trash2, CheckCircle, XCircle, Voicemail,
  PhoneMissed, PhoneOff, RotateCcw, SkipForward,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
   DropdownMenu, DropdownMenuContent, DropdownMenuItem,
   DropdownMenuSeparator, DropdownMenuTrigger,
 } from '@/components/ui/dropdown-menu';
 import { AddContactsDialog } from './AddContactsDialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { usePredictiveDialer, DialerCampaign, DialerQueueItem } from '@/hooks/usePredictiveDialer';
import { CreateCampaignDialog } from './CreateCampaignDialog';
import { DialerControlPanel } from './DialerControlPanel';
import { toast } from 'sonner';

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'bg-success text-success-foreground';
    case 'paused': return 'bg-warning text-warning-foreground';
    case 'completed': return 'bg-muted text-muted-foreground';
    default: return 'bg-secondary text-secondary-foreground';
  }
};

const getQueueStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'bg-success/10 text-success';
    case 'dialing': return 'bg-primary/10 text-primary';
    case 'pending': return 'bg-muted text-muted-foreground';
    default: return 'bg-secondary text-secondary-foreground';
  }
};

const getResultIcon = (result: string | null) => {
  switch (result) {
    case 'answered': return <CheckCircle className="h-4 w-4 text-success" />;
    case 'no_answer': return <PhoneMissed className="h-4 w-4 text-warning" />;
    case 'busy': return <PhoneOff className="h-4 w-4 text-warning" />;
    case 'voicemail': return <Voicemail className="h-4 w-4 text-muted-foreground" />;
    case 'wrong_number': return <XCircle className="h-4 w-4 text-destructive" />;
    case 'callback': return <RotateCcw className="h-4 w-4 text-primary" />;
    default: return null;
  }
};

const resultLabels: Record<string, string> = {
  answered: 'Atendida', no_answer: 'Não Atendeu', busy: 'Ocupado',
  voicemail: 'Caixa Postal', wrong_number: 'Número Errado', callback: 'Retornar',
};

const formatTimer = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const getProgressPercent = (c: DialerCampaign) => c.total_contacts ? Math.round((c.completed_contacts / c.total_contacts) * 100) : 0;
const getSuccessRate = (c: DialerCampaign) => c.completed_contacts ? Math.round((c.successful_contacts / c.completed_contacts) * 100) : 0;

function QueueItemCard({ item, index, onRemove, statusColor }: { item: DialerQueueItem; index: number; onRemove: () => void; statusColor: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground w-6">{index}</span>
        <div><p className="font-medium">{item.name || 'Desconhecido'}</p><p className="text-xs text-muted-foreground font-mono">{item.phone}</p></div>
      </div>
      <div className="flex items-center gap-2">
        <Badge className={`text-xs ${statusColor}`}>{item.status === 'pending' ? 'Pendente' : item.status === 'dialing' ? 'Discando' : item.status}</Badge>
        {item.attempts > 0 && <Badge variant="outline" className="text-xs">{item.attempts}x</Badge>}
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem><SkipForward className="h-4 w-4 mr-2" />Priorizar</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={onRemove}><Trash2 className="h-4 w-4 mr-2" />Remover</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export function PredictiveDialerPanel() {
  const { campaigns, queue, isDialing, currentCall, fetchQueue, startCampaign, pauseCampaign, completeCall, deleteCampaign, removeFromQueue, setActiveCampaign } = usePredictiveDialer();
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [callTimer, setCallTimer] = useState(0);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (currentCall) { interval = setInterval(() => setCallTimer(p => p + 1), 1000); } else { setCallTimer(0); }
    return () => { if (interval) clearInterval(interval); };
  }, [currentCall]);

  useEffect(() => {
    if (selectedCampaignId) {
      fetchQueue(selectedCampaignId);
      const c = campaigns.find(x => x.id === selectedCampaignId);
      if (c) setActiveCampaign(c);
    }
  }, [selectedCampaignId, campaigns, fetchQueue, setActiveCampaign]);

  const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId);
  const pendingQueue = queue.filter(q => q.status === 'pending');
  const completedQueue = queue.filter(q => q.status === 'completed');

   const handleCompleteCall = async (result: 'answered' | 'no_answer' | 'busy' | 'voicemail' | 'wrong_number' | 'callback', notes?: string) => {
    if (!currentCall) return;
     await completeCall(currentCall.id, result, notes, callTimer);
    toast.success('Chamada registrada');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Phone className="h-6 w-6 text-primary" />Discador Preditivo</h2>
          <p className="text-muted-foreground">Gerencie campanhas e fila de discagem automática</p>
        </div>
         <div className="flex items-center gap-2">
           {selectedCampaignId && <AddContactsDialog campaignId={selectedCampaignId} />}
           <CreateCampaignDialog />
         </div>
       </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="md:col-span-1"><CardHeader className="pb-2"><CardTitle className="text-sm">Campanha Ativa</CardTitle></CardHeader><CardContent>
          <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}><SelectTrigger><SelectValue placeholder="Selecione uma campanha" /></SelectTrigger><SelectContent>{campaigns.map(c => (<SelectItem key={c.id} value={c.id}><div className="flex items-center gap-2"><span>{c.name}</span><Badge className={`text-xs ${getStatusColor(c.status)}`}>{c.status === 'active' ? 'Ativa' : c.status === 'paused' ? 'Pausada' : 'Concluída'}</Badge></div></SelectItem>))}</SelectContent></Select>
        </CardContent></Card>
        {selectedCampaign && (<>
          <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Progresso</p><p className="text-2xl font-bold">{getProgressPercent(selectedCampaign)}%</p></div><Target className="h-8 w-8 text-primary opacity-50" /></div><Progress value={getProgressPercent(selectedCampaign)} className="mt-2" /><p className="text-xs text-muted-foreground mt-1">{selectedCampaign.completed_contacts}/{selectedCampaign.total_contacts} contatos</p></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Taxa de Sucesso</p><p className="text-2xl font-bold">{getSuccessRate(selectedCampaign)}%</p></div><TrendingUp className="h-8 w-8 text-success opacity-50" /></div><p className="text-xs text-muted-foreground mt-2">{selectedCampaign.successful_contacts} atendidas</p></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Na Fila</p><p className="text-2xl font-bold">{pendingQueue.length}</p></div><Users className="h-8 w-8 text-warning opacity-50" /></div><p className="text-xs text-muted-foreground mt-2">contatos pendentes</p></CardContent></Card>
        </>)}
      </div>

      {selectedCampaign && (
        <div className="grid gap-6 lg:grid-cols-3">
          <DialerControlPanel
            currentCall={currentCall} isDialing={isDialing} callTimer={callTimer}
            campaignId={selectedCampaign.id} pendingCount={pendingQueue.length}
            onStartCampaign={startCampaign} onPauseCampaign={pauseCampaign} onCompleteCall={handleCompleteCall}
          />

          <Card className="lg:col-span-2">
            <CardHeader><div className="flex items-center justify-between"><CardTitle className="flex items-center gap-2"><List className="h-5 w-5" />Fila de Discagem</CardTitle><Badge variant="secondary">{queue.length} total</Badge></div></CardHeader>
            <CardContent>
              <Tabs defaultValue="pending">
                <TabsList className="w-full grid grid-cols-2"><TabsTrigger value="pending">Pendentes ({pendingQueue.length})</TabsTrigger><TabsTrigger value="completed">Concluídos ({completedQueue.length})</TabsTrigger></TabsList>
                <TabsContent value="pending" className="mt-4">
                  <ScrollArea className="h-[350px]">
                    {pendingQueue.length === 0 ? (<div className="flex flex-col items-center justify-center py-12 text-muted-foreground"><Users className="h-12 w-12 mb-4 opacity-50" /><p className="text-sm">Fila vazia</p></div>)
                    : (<div className="space-y-2">{pendingQueue.map((item, i) => (<QueueItemCard key={item.id} item={item} index={i + 1} onRemove={() => removeFromQueue(item.id)} statusColor={getQueueStatusColor(item.status)} />))}</div>)}
                  </ScrollArea>
                </TabsContent>
                <TabsContent value="completed" className="mt-4">
                  <ScrollArea className="h-[350px]">
                    {completedQueue.length === 0 ? (<div className="flex flex-col items-center justify-center py-12 text-muted-foreground"><CheckCircle className="h-12 w-12 mb-4 opacity-50" /><p className="text-sm">Nenhuma chamada concluída</p></div>)
                    : (<div className="space-y-2">{completedQueue.map(item => (
                        <div key={item.id} className="flex items-center justify-between rounded-lg border p-3">
                          <div className="flex items-center gap-3">{getResultIcon(item.result)}<div><p className="font-medium">{item.name || 'Desconhecido'}</p><p className="text-xs text-muted-foreground font-mono">{item.phone}</p></div></div>
                          <div className="text-right"><Badge variant="outline" className="text-xs">{resultLabels[item.result || ''] || item.result}</Badge>{item.call_duration_seconds && <p className="text-xs text-muted-foreground mt-1">{formatTimer(item.call_duration_seconds)}</p>}</div>
                        </div>
                      ))}</div>)}
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}

      {!selectedCampaignId && (
        <Card>
          <CardHeader><CardTitle>Todas as Campanhas</CardTitle></CardHeader>
          <CardContent>
            {campaigns.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground"><Phone className="h-12 w-12 mb-4 opacity-50" /><p className="text-sm">Nenhuma campanha criada</p><CreateCampaignDialog trigger={<Button className="mt-4 gap-2"><Plus className="h-4 w-4" />Criar Primeira Campanha</Button>} /></div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {campaigns.map(c => (
                  <Card key={c.id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setSelectedCampaignId(c.id)}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-2"><h3 className="font-semibold truncate">{c.name}</h3><Badge className={`text-xs ${getStatusColor(c.status)}`}>{c.status === 'active' ? 'Ativa' : c.status === 'paused' ? 'Pausada' : 'Concluída'}</Badge></div>
                      {c.description && <p className="text-sm text-muted-foreground mb-3 truncate">{c.description}</p>}
                      <Progress value={getProgressPercent(c)} className="mb-2" />
                      <div className="flex items-center justify-between text-xs text-muted-foreground"><span>{c.completed_contacts}/{c.total_contacts} contatos</span><span>Criada {formatDistanceToNow(new Date(c.created_at), { addSuffix: true, locale: ptBR })}</span></div>
                      <div className="flex justify-end mt-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={e => e.stopPropagation()}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent><DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); deleteCampaign(c.id); }}><Trash2 className="h-4 w-4 mr-2" />Excluir</DropdownMenuItem></DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
