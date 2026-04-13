import { useState, useEffect } from 'react';
import { Phone, Plus, Target, TrendingUp, Users, Settings2, MoreHorizontal, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { usePredictiveDialer, DialerCampaign } from '@/hooks/usePredictiveDialer';
import { CreateCampaignDialog } from './CreateCampaignDialog';
import { DialerControl } from './DialerControl';
import { DialerQueue } from './DialerQueue';
import { toast } from 'sonner';

export function PredictiveDialerPanel() {
  const {
    campaigns, queue, isDialing, currentCall, fetchQueue,
    startCampaign, pauseCampaign, completeCall, deleteCampaign, removeFromQueue, setActiveCampaign,
  } = usePredictiveDialer();

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
      const campaign = campaigns.find(c => c.id === selectedCampaignId);
      if (campaign) setActiveCampaign(campaign);
    }
  }, [selectedCampaignId, campaigns, fetchQueue, setActiveCampaign]);

  const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId);
  const pendingQueue = queue.filter(q => q.status === 'pending');

  const getProgressPercent = (c: DialerCampaign) => c.total_contacts ? Math.round((c.completed_contacts / c.total_contacts) * 100) : 0;
  const getSuccessRate = (c: DialerCampaign) => c.completed_contacts ? Math.round((c.successful_contacts / c.completed_contacts) * 100) : 0;
  const getStatusColor = (s: string) => s === 'active' ? 'bg-success text-success-foreground' : s === 'paused' ? 'bg-warning text-warning-foreground' : 'bg-muted text-muted-foreground';

  const handleCompleteCall = async (result: 'answered' | 'no_answer' | 'busy' | 'voicemail' | 'wrong_number' | 'callback') => {
    if (!currentCall) return;
    await completeCall(currentCall.id, result, undefined, callTimer);
    toast.success('Chamada registrada');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Phone className="h-6 w-6 text-primary" />Discador Preditivo</h2>
          <p className="text-muted-foreground">Gerencie campanhas e fila de discagem automática</p>
        </div>
        <CreateCampaignDialog />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="md:col-span-1">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Campanha Ativa</CardTitle></CardHeader>
          <CardContent>
            <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
              <SelectTrigger><SelectValue placeholder="Selecione uma campanha" /></SelectTrigger>
              <SelectContent>
                {campaigns.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    <div className="flex items-center gap-2">
                      <span>{c.name}</span>
                      <Badge className={`text-xs ${getStatusColor(c.status)}`}>
                        {c.status === 'active' ? 'Ativa' : c.status === 'paused' ? 'Pausada' : 'Concluída'}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {selectedCampaign && (
          <>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div><p className="text-sm text-muted-foreground">Progresso</p><p className="text-2xl font-bold">{getProgressPercent(selectedCampaign)}%</p></div>
                  <Target className="h-8 w-8 text-primary opacity-50" />
                </div>
                <Progress value={getProgressPercent(selectedCampaign)} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-1">{selectedCampaign.completed_contacts}/{selectedCampaign.total_contacts} contatos</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div><p className="text-sm text-muted-foreground">Taxa de Sucesso</p><p className="text-2xl font-bold">{getSuccessRate(selectedCampaign)}%</p></div>
                  <TrendingUp className="h-8 w-8 text-success opacity-50" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">{selectedCampaign.successful_contacts} atendidas</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div><p className="text-sm text-muted-foreground">Na Fila</p><p className="text-2xl font-bold">{pendingQueue.length}</p></div>
                  <Users className="h-8 w-8 text-warning opacity-50" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">contatos pendentes</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {selectedCampaign && (
        <div className="grid gap-6 lg:grid-cols-3">
          <DialerControl
            currentCall={currentCall} isDialing={isDialing} callTimer={callTimer}
            pendingQueueLength={pendingQueue.length} campaignId={selectedCampaign.id}
            onStartCampaign={() => startCampaign(selectedCampaign.id)}
            onPauseCampaign={() => pauseCampaign(selectedCampaign.id)}
            onCompleteCall={handleCompleteCall}
          />
          <DialerQueue queue={queue} onRemoveFromQueue={removeFromQueue} />
        </div>
      )}

      {!selectedCampaignId && (
        <Card>
          <CardHeader><CardTitle>Todas as Campanhas</CardTitle></CardHeader>
          <CardContent>
            {campaigns.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Phone className="h-12 w-12 mb-4 opacity-50" /><p className="text-sm">Nenhuma campanha criada</p>
                <CreateCampaignDialog trigger={<Button className="mt-4 gap-2"><Plus className="h-4 w-4" />Criar Primeira Campanha</Button>} />
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {campaigns.map(campaign => (
                  <Card key={campaign.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedCampaignId(campaign.id)}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">{campaign.name}</h3>
                          <p className="text-xs text-muted-foreground line-clamp-1">{campaign.description || 'Sem descrição'}</p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedCampaignId(campaign.id); }}>
                              <Settings2 className="h-4 w-4 mr-2" />Gerenciar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); deleteCampaign(campaign.id); }}>
                              <Trash2 className="h-4 w-4 mr-2" />Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <Badge className={`text-xs ${getStatusColor(campaign.status)}`}>
                          {campaign.status === 'active' ? 'Ativa' : campaign.status === 'paused' ? 'Pausada' : 'Concluída'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{campaign.total_contacts} contatos</span>
                      </div>
                      <Progress value={getProgressPercent(campaign)} className="mt-2 h-1" />
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
