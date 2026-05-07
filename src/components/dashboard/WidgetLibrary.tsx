 import { Plus, Eye, EyeOff, LayoutGrid } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { 
   Sheet, 
   SheetContent, 
   SheetDescription, 
   SheetHeader, 
   SheetTitle, 
   SheetTrigger 
 } from '@/components/ui/sheet';
 import { WidgetId, WidgetLayout } from '@/hooks/useDashboardLayout';
 import { Badge } from '@/components/ui/badge';
 
 interface WidgetLibraryProps {
   layout: WidgetLayout[];
   toggleWidget: (id: WidgetId) => void;
 }
 
 const WIDGET_LABELS: Record<WidgetId, string> = {
   'stats': 'Métricas Principais',
   'active-calls': 'Chamadas em Tempo Real',
   'call-volume': 'Volume de Chamadas',
   'queue-status': 'Status da Fila',
   'callbacks': 'Retornos Agendados',
   'supervisor': 'Painel do Supervisor',
   'recent-calls': 'Chamadas Recentes',
   'agents-list': 'Lista de Agentes'
 };
 
 export function WidgetLibrary({ layout, toggleWidget }: WidgetLibraryProps) {
   return (
     <Sheet>
       <SheetTrigger asChild>
         <Button variant="outline" size="sm" className="gap-2">
           <LayoutGrid className="h-4 w-4" />
           Biblioteca de Widgets
         </Button>
       </SheetTrigger>
       <SheetContent className="glass-neon border-primary/20">
         <SheetHeader className="pb-4">
           <SheetTitle className="text-xl font-bold">Widgets do Dashboard</SheetTitle>
           <SheetDescription>
             Ative ou desative os widgets que deseja visualizar no seu dashboard principal.
           </SheetDescription>
         </SheetHeader>
         
         <div className="space-y-3 mt-6">
           {layout.map((widget) => (
             <div 
               key={widget.id}
               className="flex items-center justify-between p-3 rounded-lg border border-border/40 hover:bg-muted/30 transition-colors group"
             >
               <div className="flex items-center gap-3">
                 <div className={`h-8 w-8 rounded-md flex items-center justify-center ${widget.visible ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                   {widget.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                 </div>
                 <div>
                   <p className={`text-sm font-medium ${!widget.visible && 'text-muted-foreground'}`}>
                     {WIDGET_LABELS[widget.id]}
                   </p>
                   {widget.visible ? (
                     <Badge variant="secondary" className="text-[9px] h-4 px-1.5 font-bold uppercase">Ativo</Badge>
                   ) : (
                     <Badge variant="outline" className="text-[9px] h-4 px-1.5 font-bold uppercase opacity-50">Inativo</Badge>
                   )}
                 </div>
               </div>
               <Button 
                 variant={widget.visible ? "ghost" : "primary"} 
                 size="sm"
                 className={`text-xs h-8 ${widget.visible ? 'text-destructive hover:bg-destructive/10' : 'bg-primary text-primary-foreground'}`}
                 onClick={() => toggleWidget(widget.id)}
               >
                 {widget.visible ? 'Desativar' : 'Ativar'}
               </Button>
             </div>
           ))}
         </div>
         
         <div className="mt-8 p-4 rounded-lg bg-primary/5 border border-primary/10">
           <p className="text-xs text-muted-foreground leading-relaxed">
             <strong>Dica:</strong> Você também pode reorganizar os widgets clicando no botão "Customizar" no cabeçalho do dashboard.
           </p>
         </div>
       </SheetContent>
     </Sheet>
   );
 }