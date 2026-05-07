 import { motion } from 'framer-motion';
 import { Sparkles, TrendingUp, TrendingDown, Info } from 'lucide-react';
 import { Card, CardContent } from '@/components/ui/card';
 import { Badge } from '@/components/ui/badge';
 
 export function PerformanceNarrative() {
   return (
     <motion.div
       initial={{ opacity: 0, y: 20 }}
       animate={{ opacity: 1, y: 0 }}
       transition={{ duration: 0.5 }}
       className="mb-6"
     >
       <Card className="overflow-hidden glass-neon border-primary/20 shadow-neon">
         <CardContent className="p-0">
           <div className="bg-primary/5 px-4 py-3 border-b border-primary/10 flex items-center justify-between">
             <div className="flex items-center gap-2">
               <Sparkles className="h-4 w-4 text-primary animate-pulse" />
               <span className="text-xs font-bold uppercase tracking-wider text-primary">Análise IA de Performance</span>
             </div>
             <Badge variant="outline" className="text-[9px] border-primary/20 text-primary/70">Atualizado agora</Badge>
           </div>
           <div className="p-4 flex flex-col md:flex-row md:items-center gap-6">
             <div className="flex-1 space-y-2">
               <p className="text-sm leading-relaxed text-foreground/90">
                 Sua operação apresenta um <strong>crescimento de 12%</strong> no volume de chamadas em comparação ao mesmo período de ontem. 
                 A taxa de atendimento está <strong>acima da meta (94%)</strong>, porém o tempo médio de espera subiu levemente nas últimas 2 horas.
               </p>
               <div className="flex items-center gap-4 mt-4">
                 <div className="flex items-center gap-1.5 text-[11px] font-medium text-success">
                   <TrendingUp className="h-3.5 w-3.5" />
                   Eficiência +5.2%
                 </div>
                 <div className="flex items-center gap-1.5 text-[11px] font-medium text-warning">
                   <Info className="h-3.5 w-3.5" />
                   Pico esperado às 16:00
                 </div>
               </div>
             </div>
             <div className="flex items-center gap-2 pr-2">
               <div className="h-12 w-[1px] bg-border/40 hidden md:block mx-4" />
               <div className="text-center">
                 <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Health Score</p>
                 <p className="text-3xl font-black text-gradient">9.8</p>
               </div>
             </div>
           </div>
         </CardContent>
       </Card>
     </motion.div>
   );
 }