import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
  import { Headphones, Phone, Send, User, Clock, Volume2, Check, Users, PhoneCall, PhoneOff, Radio, Timer, TrendingDown, Activity, AlertTriangle, ChevronDown, BarChart3, Bell, BellOff } from 'lucide-react';
  import { formatDuration, cn } from '@/lib/utils';
import { QueueTrendChart } from './QueueTrendChart';
import { AlertSoundSettings } from './AlertSoundSettings';
import { SoundProfileManager } from './SoundProfileManager';
import { useSupervisorPanel } from '@/hooks/useSupervisorPanel';

export const SupervisorPanel = () => {
  const s = useSupervisorPanel();

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Radio className="h-5 w-5 text-primary" />Painel do Supervisor
            {s.activeBargeIn && <Badge variant="destructive" className="ml-2 animate-pulse"><PhoneCall className="h-3 w-3 mr-1" />Em Conferência</Badge>}
          </CardTitle>
          <div className="flex items-center gap-1">
            <SoundProfileManager currentConfig={s.soundConfig} onApplyProfile={s.handleSoundConfigChange} />
            <AlertSoundSettings config={s.soundConfig} onConfigChange={s.handleSoundConfigChange} onTestSound={s.playAlertSound} />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant={s.soundEnabled ? 'default' : 'outline'} size="icon" className="h-8 w-8"
                    onClick={s.soundEnabled ? () => s.handleSoundEnabledChange(false) : s.handleEnableSound}>
                    {s.soundEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>{s.soundEnabled ? 'Desativar notificações sonoras' : 'Ativar notificações sonoras'}</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Queue Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          <TooltipProvider>
            <Tooltip><TooltipTrigger asChild>
              <div className="p-2.5 rounded-lg border bg-accent/30">
                <div className="flex items-center gap-1.5 text-muted-foreground mb-1"><Timer className="h-3.5 w-3.5" /><span className="text-xs">Espera Média</span></div>
                 <p className="text-lg font-bold">{formatDuration(s.queueMetrics.avgWaitTime)}</p>
              </div>
            </TooltipTrigger><TooltipContent><p>Tempo médio de espera das chamadas hoje</p></TooltipContent></Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip><TooltipTrigger asChild>
              <div className={`p-2.5 rounded-lg border ${s.queueMetrics.abandonmentRate > 10 ? 'bg-destructive/10 border-destructive/30' : 'bg-accent/30'}`}>
                <div className="flex items-center gap-1.5 text-muted-foreground mb-1"><TrendingDown className={`h-3.5 w-3.5 ${s.queueMetrics.abandonmentRate > 10 ? 'text-destructive' : ''}`} /><span className="text-xs">Abandono</span></div>
                <p className={`text-lg font-bold ${s.queueMetrics.abandonmentRate > 10 ? 'text-destructive' : ''}`}>{s.queueMetrics.abandonmentRate}%</p>
              </div>
            </TooltipTrigger><TooltipContent><p>{s.queueMetrics.totalAbandoned} chamadas abandonadas de {s.queueMetrics.totalCompleted + s.queueMetrics.totalAbandoned} total</p></TooltipContent></Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip><TooltipTrigger asChild>
              <div className={`p-2.5 rounded-lg border ${s.queueMetrics.serviceLevelPercent < 80 ? 'bg-warning/10 border-warning/30' : 'bg-accent/30'}`}>
                <div className="flex items-center gap-1.5 text-muted-foreground mb-1"><Activity className={`h-3.5 w-3.5 ${s.queueMetrics.serviceLevelPercent < 80 ? 'text-warning' : ''}`} /><span className="text-xs">Nível Serviço</span></div>
                <p className={`text-lg font-bold ${s.queueMetrics.serviceLevelPercent < 80 ? 'text-warning' : ''}`}>{s.queueMetrics.serviceLevelPercent}%</p>
              </div>
            </TooltipTrigger><TooltipContent><p>Chamadas atendidas em até 30 segundos</p></TooltipContent></Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip><TooltipTrigger asChild>
              <div className={`p-2.5 rounded-lg border ${s.queueMetrics.longestWait > 120 ? 'bg-destructive/10 border-destructive/30' : 'bg-accent/30'}`}>
                <div className="flex items-center gap-1.5 text-muted-foreground mb-1"><AlertTriangle className={`h-3.5 w-3.5 ${s.queueMetrics.longestWait > 120 ? 'text-destructive' : ''}`} /><span className="text-xs">Maior Espera</span></div>
                 <p className={`text-lg font-bold ${s.queueMetrics.longestWait > 120 ? 'text-destructive' : ''}`}>{formatDuration(s.queueMetrics.longestWait)}</p>
              </div>
            </TooltipTrigger><TooltipContent><p>Maior tempo de espera registrado hoje</p></TooltipContent></Tooltip>
          </TooltipProvider>
        </div>

        <Collapsible open={s.showTrendChart} onOpenChange={s.setShowTrendChart}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between text-xs h-8">
              <span className="flex items-center gap-1.5"><BarChart3 className="h-3.5 w-3.5" />Tendência do Dia</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${s.showTrendChart ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2"><QueueTrendChart /></CollapsibleContent>
        </Collapsible>

        {s.activeBargeIn && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-destructive" />
                <div>
                  <p className="font-medium text-sm">Conferência Ativa</p>
                  <p className="text-xs text-muted-foreground">Com {s.activeBargeIn.agent_name} • {s.getCallDuration(s.activeBargeIn.started_at)}</p>
                </div>
              </div>
              <Button variant="destructive" size="sm" onClick={s.endBargeIn}><PhoneOff className="h-4 w-4 mr-1" />Sair</Button>
            </div>
          </div>
        )}

        <div>
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2"><Phone className="h-4 w-4" />Chamadas Ativas ({s.activeCalls.length})</h4>
          {s.loading ? (
            <div className="flex items-center justify-center py-4"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" /></div>
          ) : s.activeCalls.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground text-sm">Nenhuma chamada ativa</div>
          ) : (
            <ScrollArea className="h-[120px]">
              <div className="space-y-2">
                {s.activeCalls.map(call => (
                  <div key={call.id} onClick={() => s.setSelectedCall(call)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${s.selectedCall?.id === call.id ? 'border-primary bg-primary/5' : s.isCallInBargeIn(call.id) ? 'border-destructive bg-destructive/5' : 'border-border hover:border-primary/50'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                       <div className={cn(
                         "p-1.5 rounded-full",
                         s.isCallInBargeIn(call.id) ? "bg-destructive/10" : "bg-success/10"
                       )}>
                         {s.isCallInBargeIn(call.id) ? <Users className="h-3 w-3 text-destructive" /> : <Phone className="h-3 w-3 text-success" />}
                       </div>
                       <div>
                         <p className="text-sm font-medium">{call.caller_name || call.caller_phone || 'Desconhecido'}</p>
                         <p className="text-xs text-muted-foreground flex items-center gap-1"><User className="h-3 w-3" />{call.agent_name || 'Sem agente'}</p>
                       </div>
                      </div>
                      <Badge variant={s.isCallInBargeIn(call.id) ? 'destructive' : 'secondary'} className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />{s.getCallDuration(call.started_at)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        {s.selectedCall && (
          <Tabs defaultValue="whisper" className="pt-2 border-t">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="whisper" className="text-xs"><Headphones className="h-3 w-3 mr-1" />Whisper</TabsTrigger>
              <TabsTrigger value="bargein" className="text-xs"><Users className="h-3 w-3 mr-1" />Barge-in</TabsTrigger>
            </TabsList>
            <TabsContent value="whisper" className="space-y-3 mt-3">
              <div className="flex items-center gap-2 text-sm"><Volume2 className="h-4 w-4 text-primary" /><span>Sussurrar para:</span><Badge variant="default">{s.selectedCall.agent_name}</Badge></div>
              <div className="flex flex-wrap gap-1.5">
                {s.quickWhispers.map((qw, idx) => (
                  <Button key={idx} variant="outline" size="sm" className="text-xs h-7" onClick={() => s.setWhisperMessage(qw)}>{qw}</Button>
                ))}
              </div>
              <div className="flex gap-2">
                <Input placeholder="Digite sua mensagem..." value={s.whisperMessage} onChange={e => s.setWhisperMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && s.sendWhisper()} className="flex-1" />
                <Button onClick={s.sendWhisper} disabled={s.sending || !s.whisperMessage.trim()}><Send className="h-4 w-4" /></Button>
              </div>
              {s.whisperHistory.length > 0 && (
                <ScrollArea className="h-[80px]">
                  <div className="space-y-1">
                    {s.whisperHistory.map(wh => (
                      <div key={wh.id} className={`p-2 rounded text-xs border ${wh.is_read ? 'bg-muted/50' : 'bg-primary/5 border-primary/20'}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-muted-foreground">{s.formatTime(wh.created_at)}</span>
                          {wh.is_read && <Check className="h-3 w-3 text-success" />}
                        </div>
                        <p>{wh.message}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>
            <TabsContent value="bargein" className="space-y-3 mt-3">
              <div className="p-4 rounded-lg border bg-muted/30 text-center">
                <Users className="h-10 w-10 mx-auto mb-3 text-primary opacity-60" />
                <h4 className="font-medium mb-1">Modo Barge-in</h4>
                <p className="text-xs text-muted-foreground mb-4">Entre na chamada como conferência tripartite.</p>
                {s.isCallInBargeIn(s.selectedCall.id) ? (
                  <Button variant="destructive" onClick={s.endBargeIn} className="w-full"><PhoneOff className="h-4 w-4 mr-2" />Sair da Conferência</Button>
                ) : s.activeBargeIn ? (
                  <Button disabled className="w-full">Você já está em outra conferência</Button>
                ) : (
                  <Button onClick={s.startBargeIn} className="w-full"><PhoneCall className="h-4 w-4 mr-2" />Entrar na Chamada</Button>
                )}
                <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                  <p className="flex items-center justify-center gap-1"><Phone className="h-3 w-3" />Chamada: {s.selectedCall.caller_name || s.selectedCall.caller_phone}</p>
                  <p className="flex items-center justify-center gap-1 mt-1"><User className="h-3 w-3" />Agente: {s.selectedCall.agent_name}</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}

        {!s.selectedCall && s.activeCalls.length > 0 && (
          <div className="text-center py-4 text-muted-foreground text-sm">Selecione uma chamada para gerenciar</div>
        )}
      </CardContent>
    </Card>
  );
};
