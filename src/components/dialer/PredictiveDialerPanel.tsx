import { useState, useEffect } from 'react';
import { 
  Phone, 
  Play, 
  Pause, 
  Plus,
  Users,
  Clock,
  Target,
  TrendingUp,
  PhoneCall,
  PhoneOff,
  SkipForward,
  Settings2,
  List,
  MoreHorizontal,
  Trash2,
  CheckCircle,
  XCircle,
  Voicemail,
  PhoneMissed,
  RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { usePredictiveDialer, DialerCampaign, DialerQueueItem } from '@/hooks/usePredictiveDialer';
import { CreateCampaignDialog } from './CreateCampaignDialog';
import { AddContactsDialog } from './AddContactsDialog';
import { toast } from 'sonner';

export function PredictiveDialerPanel() {
  const {
    campaigns,
    queue,
    activeCampaign,
    isDialing,
    currentCall,
    isLoading,
    fetchQueue,
    startCampaign,
    pauseCampaign,
    completeCall,
    deleteCampaign,
    removeFromQueue,
    setActiveCampaign
  } = usePredictiveDialer();

  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [callTimer, setCallTimer] = useState(0);

  // Timer for current call
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (currentCall) {
      interval = setInterval(() => {
        setCallTimer(prev => prev + 1);
      }, 1000);
    } else {
      setCallTimer(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentCall]);

  // Load queue when campaign is selected
  useEffect(() => {
    if (selectedCampaignId) {
      fetchQueue(selectedCampaignId);
      const campaign = campaigns.find(c => c.id === selectedCampaignId);
      if (campaign) {
        setActiveCampaign(campaign);
      }
    }
  }, [selectedCampaignId, campaigns, fetchQueue, setActiveCampaign]);

  const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId);

  const getProgressPercent = (campaign: DialerCampaign) => {
    if (!campaign.total_contacts) return 0;
    return Math.round((campaign.completed_contacts / campaign.total_contacts) * 100);
  };

  const getSuccessRate = (campaign: DialerCampaign) => {
    if (!campaign.completed_contacts) return 0;
    return Math.round((campaign.successful_contacts / campaign.completed_contacts) * 100);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCompleteCall = async (result: 'answered' | 'no_answer' | 'busy' | 'voicemail' | 'wrong_number' | 'callback') => {
    if (!currentCall) return;
    await completeCall(currentCall.id, result, undefined, callTimer);
    toast.success('Chamada registrada');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-success text-success-foreground';
      case 'paused':
        return 'bg-warning text-warning-foreground';
      case 'completed':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  const getQueueStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success/10 text-success';
      case 'dialing':
        return 'bg-primary/10 text-primary';
      case 'pending':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  const getResultIcon = (result: string | null) => {
    switch (result) {
      case 'answered':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'no_answer':
        return <PhoneMissed className="h-4 w-4 text-warning" />;
      case 'busy':
        return <PhoneOff className="h-4 w-4 text-warning" />;
      case 'voicemail':
        return <Voicemail className="h-4 w-4 text-muted-foreground" />;
      case 'wrong_number':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'callback':
        return <RotateCcw className="h-4 w-4 text-primary" />;
      default:
        return null;
    }
  };

  const pendingQueue = queue.filter(q => q.status === 'pending');
  const completedQueue = queue.filter(q => q.status === 'completed');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Phone className="h-6 w-6 text-primary" />
            Discador Preditivo
          </h2>
          <p className="text-muted-foreground">Gerencie campanhas e fila de discagem automática</p>
        </div>
        <div className="flex items-center gap-2">
          <CreateCampaignDialog />
        </div>
      </div>

      {/* Campaign Selector and Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Campanha Ativa</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma campanha" />
              </SelectTrigger>
              <SelectContent>
                {campaigns.map(campaign => (
                  <SelectItem key={campaign.id} value={campaign.id}>
                    <div className="flex items-center gap-2">
                      <span>{campaign.name}</span>
                      <Badge className={`text-xs ${getStatusColor(campaign.status)}`}>
                        {campaign.status === 'active' ? 'Ativa' : 
                         campaign.status === 'paused' ? 'Pausada' : 'Concluída'}
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
                  <div>
                    <p className="text-sm text-muted-foreground">Progresso</p>
                    <p className="text-2xl font-bold">{getProgressPercent(selectedCampaign)}%</p>
                  </div>
                  <Target className="h-8 w-8 text-primary opacity-50" />
                </div>
                <Progress value={getProgressPercent(selectedCampaign)} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedCampaign.completed_contacts}/{selectedCampaign.total_contacts} contatos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Taxa de Sucesso</p>
                    <p className="text-2xl font-bold">{getSuccessRate(selectedCampaign)}%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-success opacity-50" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {selectedCampaign.successful_contacts} atendidas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Na Fila</p>
                    <p className="text-2xl font-bold">{pendingQueue.length}</p>
                  </div>
                  <Users className="h-8 w-8 text-warning opacity-50" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  contatos pendentes
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {selectedCampaign && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Dialer Control */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PhoneCall className="h-5 w-5" />
                Controle de Discagem
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Dialer Status */}
              <div className="rounded-lg border p-4 text-center">
                {currentCall ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-center">
                      <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                        <Phone className="h-8 w-8 text-primary" />
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold text-lg">{currentCall.name || 'Desconhecido'}</p>
                      <p className="text-sm text-muted-foreground font-mono">{currentCall.phone}</p>
                    </div>
                    <div className="text-3xl font-mono font-bold text-primary">
                      {formatTimer(callTimer)}
                    </div>
                    <Badge className="bg-success text-success-foreground">Em Chamada</Badge>
                  </div>
                ) : (
                  <div className="space-y-3 py-4">
                    <Phone className="h-12 w-12 mx-auto text-muted-foreground/30" />
                    <p className="text-muted-foreground">
                      {isDialing ? 'Buscando próximo contato...' : 'Discador pausado'}
                    </p>
                  </div>
                )}
              </div>

              {/* Dialer Controls */}
              <div className="flex gap-2">
                {!isDialing ? (
                  <Button 
                    className="flex-1 gap-2" 
                    onClick={() => startCampaign(selectedCampaign.id)}
                    disabled={pendingQueue.length === 0}
                  >
                    <Play className="h-4 w-4" />
                    Iniciar Discagem
                  </Button>
                ) : (
                  <Button 
                    variant="destructive" 
                    className="flex-1 gap-2" 
                    onClick={() => pauseCampaign(selectedCampaign.id)}
                  >
                    <Pause className="h-4 w-4" />
                    Pausar
                  </Button>
                )}
              </div>

              {/* Call Result Buttons */}
              {currentCall && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Resultado da Chamada:</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="gap-1 text-success hover:bg-success/10"
                      onClick={() => handleCompleteCall('answered')}
                    >
                      <CheckCircle className="h-3 w-3" />
                      Atendida
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="gap-1"
                      onClick={() => handleCompleteCall('no_answer')}
                    >
                      <PhoneMissed className="h-3 w-3" />
                      Não Atendeu
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="gap-1"
                      onClick={() => handleCompleteCall('busy')}
                    >
                      <PhoneOff className="h-3 w-3" />
                      Ocupado
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="gap-1"
                      onClick={() => handleCompleteCall('voicemail')}
                    >
                      <Voicemail className="h-3 w-3" />
                      Caixa Postal
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="gap-1 text-destructive hover:bg-destructive/10"
                      onClick={() => handleCompleteCall('wrong_number')}
                    >
                      <XCircle className="h-3 w-3" />
                      Número Errado
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="gap-1 text-primary hover:bg-primary/10"
                      onClick={() => handleCompleteCall('callback')}
                    >
                      <RotateCcw className="h-3 w-3" />
                      Retornar
                    </Button>
                  </div>
                </div>
              )}

              {/* Add Contacts */}
              <AddContactsDialog campaignId={selectedCampaign.id} />
            </CardContent>
          </Card>

          {/* Queue */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <List className="h-5 w-5" />
                  Fila de Discagem
                </CardTitle>
                <Badge variant="secondary">{queue.length} total</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="pending">
                <TabsList className="w-full grid grid-cols-2">
                  <TabsTrigger value="pending">
                    Pendentes ({pendingQueue.length})
                  </TabsTrigger>
                  <TabsTrigger value="completed">
                    Concluídos ({completedQueue.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="pending" className="mt-4">
                  <ScrollArea className="h-[350px]">
                    {pendingQueue.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <Users className="h-12 w-12 mb-4 opacity-50" />
                        <p className="text-sm">Fila vazia</p>
                        <p className="text-xs">Adicione contatos para iniciar</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {pendingQueue.map((item, index) => (
                          <QueueItemCard 
                            key={item.id} 
                            item={item} 
                            index={index + 1}
                            onRemove={() => removeFromQueue(item.id)}
                            getQueueStatusColor={getQueueStatusColor}
                          />
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="completed" className="mt-4">
                  <ScrollArea className="h-[350px]">
                    {completedQueue.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <CheckCircle className="h-12 w-12 mb-4 opacity-50" />
                        <p className="text-sm">Nenhuma chamada concluída</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {completedQueue.map((item) => (
                          <div 
                            key={item.id}
                            className="flex items-center justify-between rounded-lg border p-3"
                          >
                            <div className="flex items-center gap-3">
                              {getResultIcon(item.result)}
                              <div>
                                <p className="font-medium">{item.name || 'Desconhecido'}</p>
                                <p className="text-xs text-muted-foreground font-mono">
                                  {item.phone}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge variant="outline" className="text-xs">
                                {item.result === 'answered' ? 'Atendida' :
                                 item.result === 'no_answer' ? 'Não Atendeu' :
                                 item.result === 'busy' ? 'Ocupado' :
                                 item.result === 'voicemail' ? 'Caixa Postal' :
                                 item.result === 'wrong_number' ? 'Número Errado' :
                                 item.result === 'callback' ? 'Retornar' : item.result}
                              </Badge>
                              {item.call_duration_seconds && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {formatTimer(item.call_duration_seconds)}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Campaigns List */}
      {!selectedCampaignId && (
        <Card>
          <CardHeader>
            <CardTitle>Todas as Campanhas</CardTitle>
          </CardHeader>
          <CardContent>
            {campaigns.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Phone className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-sm">Nenhuma campanha criada</p>
                <CreateCampaignDialog 
                  trigger={
                    <Button className="mt-4 gap-2">
                      <Plus className="h-4 w-4" />
                      Criar Primeira Campanha
                    </Button>
                  }
                />
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {campaigns.map(campaign => (
                  <Card 
                    key={campaign.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedCampaignId(campaign.id)}
                  >
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">{campaign.name}</h3>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {campaign.description || 'Sem descrição'}
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCampaignId(campaign.id);
                            }}>
                              <Settings2 className="h-4 w-4 mr-2" />
                              Gerenciar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteCampaign(campaign.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <Badge className={`text-xs ${getStatusColor(campaign.status)}`}>
                          {campaign.status === 'active' ? 'Ativa' : 
                           campaign.status === 'paused' ? 'Pausada' : 'Concluída'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {campaign.total_contacts} contatos
                        </span>
                      </div>
                      <Progress 
                        value={getProgressPercent(campaign)} 
                        className="mt-2 h-1" 
                      />
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

function QueueItemCard({ 
  item, 
  index, 
  onRemove,
  getQueueStatusColor
}: { 
  item: DialerQueueItem; 
  index: number;
  onRemove: () => void;
  getQueueStatusColor: (status: string) => string;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50">
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground w-6 text-center">{index}</span>
        <div>
          <p className="font-medium">{item.name || 'Desconhecido'}</p>
          <p className="text-xs text-muted-foreground font-mono">{item.phone}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {item.attempts > 0 && (
          <Badge variant="outline" className="text-xs">
            {item.attempts} tentativa{item.attempts > 1 ? 's' : ''}
          </Badge>
        )}
        <Badge className={`text-xs ${getQueueStatusColor(item.status)}`}>
          {item.status === 'pending' ? 'Pendente' : 
           item.status === 'dialing' ? 'Discando' : item.status}
        </Badge>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={onRemove}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
