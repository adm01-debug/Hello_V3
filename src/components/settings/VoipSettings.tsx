 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Phone } from 'lucide-react';
 import { useNavigate } from 'react-router-dom';
 
 export function VoipSettings() {
   const navigate = useNavigate();
 
   return (
     <Card>
       <CardHeader>
         <CardTitle>Configurações VoIP</CardTitle>
         <CardDescription>Configure sua conexão com a operadora</CardDescription>
       </CardHeader>
       <CardContent className="space-y-6">
         <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
           <div className="flex items-start gap-3">
             <Phone className="h-5 w-5 text-primary mt-0.5" />
             <div className="flex-1">
               <p className="font-medium">Painel de Linhas VoIP</p>
               <p className="text-sm text-muted-foreground">
                 Cadastre múltiplas operadoras (Nvoip, Directcall, TotalVoice, Wavoip, SIP genérico) e atribua linhas aos agentes.
               </p>
             </div>
           </div>
           <Button
             className="gap-2"
             onClick={() => navigate('/admin/voip-trunks')}
           >
             <Phone className="h-4 w-4" />
             Gerenciar Linhas VoIP
           </Button>
         </div>
       </CardContent>
     </Card>
   );
 }