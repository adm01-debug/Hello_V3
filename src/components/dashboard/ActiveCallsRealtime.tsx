 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Phone, Pause, Clock, User, Filter, Volume2, VolumeX } from 'lucide-react';
import { useActiveCallsRealtime } from '@/hooks/useActiveCallsRealtime';

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const ActiveCallsRealtime = () => {
  const {
    loading, filteredCalls, agents, statusCounts,
    selectedAgent, setSelectedAgent, selectedHoldStatus, setSelectedHoldStatus,
    soundEnabled, toggleSound, isCallOnHold, getHoldDuration, getHoldSeverity,
  } = useActiveCallsRealtime();

  if (loading) {
    return (<Card><CardHeader><CardTitle className="flex items-center gap-2"><Phone className="h-5 w-5 text-primary" />Chamadas Ativas</CardTitle></CardHeader><CardContent><div className="flex items-center justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" /></div></CardContent></Card>);
  }

  return (
    <Card className="card-premium border-none h-full">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
               <CardTitle className="flex items-center gap-3.5 text-xl tracking-tight group">
                 <div className="p-2.5 rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20 shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)] group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                   <Phone className="h-5 w-5 animate-glow-pulse" />
                 </div>
                 <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent font-bold">Chamadas Ativas</span>
              {filteredCalls.length > 0 && (
                <Badge variant="secondary" className="ml-1 bg-primary/5 text-primary border-primary/10">
                  {filteredCalls.length}
                </Badge>
              )}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2 bg-muted/30 p-1 rounded-2xl border border-white/[0.05]">
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
             {filteredCalls.map((call, index) => {
              const onHold = isCallOnHold(call.id);
              const holdDuration = getHoldDuration(call.id);
              const holdSeverity = onHold ? getHoldSeverity(holdDuration) : 'normal';
              const callDuration = Math.floor((Date.now() - new Date(call.started_at).getTime()) / 1000);
              return (
                 <div 
                   key={call.id} 
                   className={cn(
                     "p-5 rounded-2xl border transition-all duration-500 relative overflow-hidden group/item",
                     "animate-in fade-in slide-in-from-bottom-2",
                     { "animation-delay-100": index === 1, "animation-delay-200": index === 2 },
                     holdSeverity === 'critical' 
                       ? 'border-destructive/50 bg-destructive/5 shadow-[0_0_20px_rgba(var(--destructive-rgb),0.1)]' 
                       : holdSeverity === 'warning' 
                         ? 'border-call-hold/40 bg-call-hold/5 shadow-[0_0_20px_rgba(var(--warning-rgb),0.05)]' 
                         : onHold 
                           ? 'border-destructive/30 bg-destructive/5' 
                           : 'border-white/[0.05] bg-muted/10 hover:bg-muted/20 hover:border-primary/20'
                   )}
                 >
                   {/* Premium accent bar */}
                   <div className={cn(
                     "absolute left-0 top-0 bottom-0 w-1 transition-all duration-500",
                     onHold ? "bg-destructive animate-pulse" : "bg-primary/40 group-hover/item:bg-primary group-hover/item:w-1.5"
                   )} />
                   
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
