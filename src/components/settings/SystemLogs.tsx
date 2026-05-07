 import { useQuery } from '@tanstack/react-query';
 import { supabase } from '@/integrations/supabase/client';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { History, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
 import { formatDistanceToNow } from 'date-fns';
 import { ptBR } from 'date-fns/locale';
 
 export function SystemLogs() {
   const { data: logs, isLoading, error } = useQuery({
     queryKey: ['system-audit-logs'],
     queryFn: async () => {
       const { data, error } = await supabase
         .from('audit_logs')
         .select('*')
         .order('created_at', { ascending: false })
         .limit(10);
       if (error) throw error;
       return data;
     },
     refetchInterval: 30000,
   });
 
   return (
     <Card className="mt-6">
       <CardHeader className="pb-3">
         <CardTitle className="text-sm font-medium flex items-center gap-2">
           <History className="h-4 w-4 text-muted-foreground" />
           Histórico de Auditoria
         </CardTitle>
       </CardHeader>
       <CardContent>
         {isLoading ? (
           <div className="flex justify-center py-4">
             <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
           </div>
         ) : error ? (
           <div className="flex items-center gap-2 text-destructive py-2 text-sm">
             <AlertCircle className="h-4 w-4" />
             Erro ao carregar logs
           </div>
         ) : !logs?.length ? (
           <p className="text-xs text-muted-foreground text-center py-4 italic">Nenhum log registrado recentemente</p>
         ) : (
           <div className="space-y-3">
             {logs.map((log) => (
               <div key={log.id} className="flex items-start justify-between gap-4 text-xs border-b border-border/50 pb-2 last:border-0 last:pb-0">
                 <div className="space-y-1">
                   <p className="font-medium text-foreground">{log.action}</p>
                   <p className="text-muted-foreground">{log.resource_type}: {log.resource_id || 'Global'}</p>
                   {log.user_email && <p className="text-[10px] text-muted-foreground/80">{log.user_email}</p>}
                 </div>
                 <div className="text-right shrink-0">
                   <span className="text-muted-foreground">
                     {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: ptBR })}
                   </span>
                 </div>
               </div>
             ))}
           </div>
         )}
       </CardContent>
     </Card>
   );
 }