import { useMemo } from 'react';
import { Sparkles, TrendingUp, ShieldAlert, MessageSquare } from 'lucide-react';
import { NeonPageLayout } from '@/components/layout/NeonPageLayout';
import { NeonPageHeader } from '@/components/layout/NeonPageHeader';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EmptyState } from '@/components/ui/empty-state';

import { ptBR } from 'date-fns/locale';
import { useAgentAssistHistory, type LiveAssistSignal } from '@/hooks/useLiveAssist';
import { useObjectionLibrary } from '@/hooks/useObjectionLibrary';
import { calculateAcceptanceRate, countByIntent, INTENT_LABELS } from '@/lib/agent-assist-utils';
import { usePageTitle } from '@/hooks/usePageTitle';
import { safeFormatDatePtBR } from "@/lib/safe-date";

export default function AgentAssist() {
  usePageTitle('Agent Assist em Tempo Real');
  const { data: history = [], isLoading } = useAgentAssistHistory({ limit: 200 });
  const { objections } = useObjectionLibrary();

  const stats = useMemo(() => {
    const total = history.length;
    const acceptance = calculateAcceptanceRate(history);
    const byIntent = countByIntent(history);
    const compliance = byIntent['compliance_violation'] ?? 0;
    const buying = byIntent['buying_signal'] ?? 0;
    const objectionCount = byIntent['objection'] ?? 0;
    return { total, acceptance, compliance, buying, objectionCount, byIntent };
  }, [history]);

  const topObjections = useMemo(
    () => [...objections].sort((a, b) => b.times_used - a.times_used).slice(0, 5),
    [objections]
  );

  return (
    <NeonPageLayout>
      <NeonPageHeader
        title="Agent Assist em Tempo Real"
        description="Sinais ao vivo, sugestões aplicadas e objeções top performance"
        icon={<Sparkles />}
      />

       <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
         <Card variant="neon" className="p-4">
           <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Sinais (30d)</div>
           <div className="text-3xl font-bold">{stats.total}</div>
         </Card>
         <Card variant="neon" className="p-4">
           <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
             <TrendingUp className="h-3 w-3" /> Aceitação
           </div>
           <div className="text-3xl font-bold text-success">{stats.acceptance}%</div>
         </Card>
         <Card variant="neon" className="p-4">
           <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
             <ShieldAlert className="h-3 w-3" /> Compliance
           </div>
           <div className="text-3xl font-bold text-destructive">{stats.compliance}</div>
         </Card>
         <Card variant="neon" className="p-4">
           <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
             <MessageSquare className="h-3 w-3" /> Objeções
           </div>
           <div className="text-3xl font-bold text-warning">{stats.objectionCount}</div>
         </Card>
       </div>
 
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
         <Card variant="neon" className="lg:col-span-2 p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> Sinais recentes
          </h3>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : history.length === 0 ? (
            <EmptyState icon={<Sparkles />} title="Sem sinais ainda" description="Faça uma chamada com o copiloto ativo para ver sinais aqui." />
          ) : (
            <ScrollArea className="h-[480px] pr-2">
              <div className="space-y-2">
                 {history.slice(0, 60).map((s: LiveAssistSignal) => (
                   <Card key={s.id} variant="neon-interactive" className="p-2 text-xs mb-2">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{INTENT_LABELS[s.intent] ?? s.intent}</Badge>
                        {s.was_used && <Badge variant="default" className="text-[10px]">usada</Badge>}
                      </div>
                      <span className="text-muted-foreground">
                        {safeFormatDatePtBR(s.created_at, 'dd/MM HH:mm')}
                      </span>
                    </div>
                    {s.suggestion && <p className="text-foreground/90">{s.suggestion}</p>}
                    {s.trigger_text && (
                      <p className="text-[10px] italic text-muted-foreground line-clamp-1 mt-1">
                        "{s.trigger_text}"
                      </p>
                    )}
                   </Card>
                 ))}
              </div>
            </ScrollArea>
          )}
        </Card>

         <Card variant="neon" className="p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-warning" /> Top objeções
          </h3>
          {topObjections.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhuma objeção registrada.</p>
          ) : (
            <div className="space-y-2">
               {topObjections.map((o) => (
                 <Card key={o.id} variant="neon-interactive" className="p-2 text-xs mb-2">
                  <div className="flex items-center justify-between mb-1">
                    <Badge variant="outline" className="capitalize">{o.objection_type}</Badge>
                    <span className="text-muted-foreground">
                      {o.times_used} uso{o.times_used === 1 ? '' : 's'}
                    </span>
                  </div>
                  <p className="font-medium line-clamp-1">{o.objection_example}</p>
                  <p className="text-muted-foreground line-clamp-2 mt-1">{o.recommended_response}</p>
                  {o.success_rate > 0 && (
                    <Badge variant="default" className="mt-1 text-[10px]">
                      {o.success_rate}% sucesso
                    </Badge>
                  )}
                 </Card>
               ))}
            </div>
          )}
        </Card>
      </div>
    </NeonPageLayout>
  );
}
