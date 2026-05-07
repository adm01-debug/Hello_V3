 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
 import { Phone, Pause, Clock, User, Filter, Volume2, VolumeX } from 'lucide-react';
 import { formatDuration } from '@/lib/utils';
import { useActiveCallsRealtime } from '@/hooks/useActiveCallsRealtime';

export const ActiveCallsRealtime = () => {
  const {
    loading, filteredCalls, agents, statusCounts,
    selectedAgent, setSelectedAgent, selectedHoldStatus, setSelectedHoldStatus,
    soundEnabled, toggleSound, isCallOnHold, getHoldDuration, getHoldSeverity,
  } = useActiveCallsRealtime();

   if (loading) {
     return (
       <Card>
         <CardHeader>
           <CardTitle className="flex items-center gap-2">
             <Phone className="h-5 w-5 text-primary" />
             Chamadas Ativas
           </CardTitle>
         </CardHeader>
         <CardContent className="space-y-3">
           {[1, 2].map(i => (
             <div key={i} className="p-4 rounded-lg border border-border">
               <div className="flex items-start justify-between">
                 <div className="flex items-center gap-3">
                   <Skeleton className="h-10 w-10 rounded-full" />
                   <div className="space-y-2">
                     <Skeleton className="h-4 w-32" />
                     <Skeleton className="h-3 w-24" />
                   </div>
                 </div>
                 <Skeleton className="h-6 w-20 rounded-full" />
               </div>
             </div>
           ))}
         </CardContent>
       </Card>
     );
   }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-2">
            <CardTitle className="flex items-center gap-2"><Phone className="h-5 w-5 text-primary" />Chamadas Ativas{filteredCalls.length > 0 && <Badge variant="secondary" className="ml-2">{filteredCalls.length}</Badge>}</CardTitle>
            {statusCounts.total > 0 && (
              <div className="flex items-center gap-3 text-sm">
                <TooltipProvider><Tooltip><TooltipTrigger asChild><div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-success/10 border border-success/20 cursor-default"><Phone className="h-3 w-3 text-success" /><span className="font-medium text-success">{statusCounts.inCall}</span></div></TooltipTrigger><TooltipContent><p>{statusCounts.inCall} chamada{statusCounts.inCall !== 1 ? 's' : ''} em andamento</p></TooltipContent></Tooltip></TooltipProvider>
                <TooltipProvider><Tooltip><TooltipTrigger asChild>
                  <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md cursor-default transition-all ${statusCounts.maxSeverity === 'critical' ? 'bg-destructive/20 border border-destructive/40 animate-pulse' : statusCounts.maxSeverity === 'warning' ? 'bg-call-hold/20 border border-call-hold/40 animate-pulse' : statusCounts.onHold > 0 ? 'bg-destructive/10 border border-destructive/20' : 'bg-muted border border-border'}`}>
                    <Pause className={`h-3 w-3 ${statusCounts.maxSeverity === 'critical' ? 'text-destructive' : statusCounts.maxSeverity === 'warning' ? 'text-call-hold' : statusCounts.onHold > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
                    <span className={`font-medium ${statusCounts.maxSeverity === 'critical' ? 'text-destructive' : statusCounts.maxSeverity === 'warning' ? 'text-call-hold' : statusCounts.onHold > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>{statusCounts.onHold}</span>
                  </div>
                </TooltipTrigger><TooltipContent><p>{statusCounts.onHold} chamada{statusCounts.onHold !== 1 ? 's' : ''} em espera{statusCounts.maxSeverity === 'critical' ? ' (crítico!)' : statusCounts.maxSeverity === 'warning' ? ' (atenção)' : ''}</p></TooltipContent></Tooltip></TooltipProvider>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <TooltipProvider><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={toggleSound} className={soundEnabled ? 'text-primary' : 'text-muted-foreground'}>{soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}</Button></TooltipTrigger><TooltipContent><p>{soundEnabled ? 'Desativar som' : 'Ativar som'}</p></TooltipContent></Tooltip></TooltipProvider>
            <Select value={selectedHoldStatus} onValueChange={setSelectedHoldStatus}><SelectTrigger className="w-[140px]"><Pause className="h-4 w-4 mr-2" /><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">Todos</SelectItem><SelectItem value="on_hold">Em Espera</SelectItem><SelectItem value="in_call">Em Chamada</SelectItem></SelectContent></Select>
            {agents.length > 0 && (<Select value={selectedAgent} onValueChange={setSelectedAgent}><SelectTrigger className="w-[180px]"><Filter className="h-4 w-4 mr-2" /><SelectValue placeholder="Filtrar por agente" /></SelectTrigger><SelectContent><SelectItem value="all">Todos os agentes</SelectItem>{agents.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent></Select>)}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredCalls.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground"><Phone className="h-12 w-12 mx-auto mb-3 opacity-20" /><p>{selectedAgent === 'all' ? 'Nenhuma chamada ativa' : `Nenhuma chamada para ${selectedAgent}`}</p></div>
        ) : (
          <div className="space-y-3">
            {filteredCalls.map(call => {
              const onHold = isCallOnHold(call.id);
              const holdDuration = getHoldDuration(call.id);
              const holdSeverity = onHold ? getHoldSeverity(holdDuration) : 'normal';
              const callDuration = Math.floor((Date.now() - new Date(call.started_at).getTime()) / 1000);
               return (
                 <div key={call.id} className={cn(
                   "p-4 rounded-lg border transition-all duration-300",
                   holdSeverity === 'critical' ? "border-destructive bg-destructive/10 animate-pulse shadow-[0_0_15px_hsl(var(--destructive)/0.2)]" : 
                   holdSeverity === 'warning' ? "border-call-hold/50 bg-call-hold/5 shadow-[0_0_10px_hsl(var(--call-hold)/0.1)]" : 
                   onHold ? "border-destructive/30 bg-destructive/5 animate-pulse" : 
                   "border-border bg-card hover:border-primary/30"
                 )}>
                   <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${holdSeverity === 'critical' ? 'bg-destructive/20' : holdSeverity === 'warning' ? 'bg-call-hold/20' : onHold ? 'bg-destructive/10' : 'bg-primary/10'}`}>
                        {onHold ? <Pause className={`h-4 w-4 ${holdSeverity === 'critical' ? 'text-destructive' : holdSeverity === 'warning' ? 'text-call-hold' : 'text-destructive'}`} /> : <Phone className="h-4 w-4 text-primary" />}
                      </div>
                      <div><p className="font-medium">{call.caller_name || call.caller_phone || 'Desconhecido'}</p>{call.caller_phone && call.caller_name && <p className="text-sm text-muted-foreground">{call.caller_phone}</p>}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {onHold ? <Badge variant="destructive" className={holdSeverity === 'critical' ? 'bg-destructive animate-pulse' : holdSeverity === 'warning' ? 'bg-call-hold hover:bg-call-hold/90' : 'animate-pulse'}><Pause className="h-3 w-3 mr-1" />Em Espera {formatDuration(holdDuration)}</Badge>
                        : <Badge variant="default" className="bg-success hover:bg-success/90"><Phone className="h-3 w-3 mr-1" />Em Chamada</Badge>}
                      <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{formatDuration(callDuration)}</span>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                    {call.agent_name && <span className="flex items-center gap-1"><User className="h-3 w-3" />{call.agent_name}</span>}
                    {(call.hold_count ?? 0) > 0 && <span className="flex items-center gap-1"><Pause className="h-3 w-3" />{call.hold_count}x em espera</span>}
                    {(call.hold_time_seconds ?? 0) > 0 && <span>Total espera: {formatDuration(call.hold_time_seconds ?? 0)}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
