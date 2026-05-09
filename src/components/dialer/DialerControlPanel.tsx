 import { useState, useEffect } from 'react';
 import { Phone, Play, Pause, CheckCircle, PhoneMissed, PhoneOff, Voicemail, XCircle, RotateCcw, FileText, Mic, MicOff, PhoneForwarded, PhonePaused } from 'lucide-react';
import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
import { PhoneCall } from 'lucide-react';
 import { AddContactsDialog } from './AddContactsDialog';
 import { DialerQueueItem } from '@/hooks/usePredictiveDialer';
 import { useSipCall } from '@/hooks/useSipCall';

interface DialerControlPanelProps {
  currentCall: DialerQueueItem | null;
  isDialing: boolean;
  callTimer: number;
  campaignId: string;
  pendingCount: number;
  onStartCampaign: (id: string) => void;
  onPauseCampaign: (id: string) => void;
   onCompleteCall: (result: 'answered' | 'no_answer' | 'busy' | 'voicemail' | 'wrong_number' | 'callback', notes?: string) => void;
}

const formatTimer = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

  export function DialerControlPanel({
    currentCall, isDialing, callTimer, campaignId, pendingCount,
    onStartCampaign, onPauseCampaign, onCompleteCall,
  }: DialerControlPanelProps) {
    const [notes, setNotes] = useState('');
    const { toggleMute, toggleHold } = useSipCall();
    const [isMuted, setIsMuted] = useState(false);
    const [isOnHold, setIsOnHold] = useState(false);
  
    useEffect(() => {
      if (!currentCall) {
        setNotes('');
        setIsMuted(false);
        setIsOnHold(false);
      }
    }, [currentCall]);

    const handleToggleMute = () => {
      const newMuted = !isMuted;
      setIsMuted(newMuted);
      toggleMute(newMuted);
    };

    const handleToggleHold = () => {
      const newHold = !isOnHold;
      setIsOnHold(newHold);
      toggleHold(newHold);
    };
  return (
    <Card className="lg:col-span-1">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PhoneCall className="h-5 w-5" />
          Controle de Discagem
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
              <div className="text-3xl font-mono font-bold text-primary">{formatTimer(callTimer)}</div>
               <div className="flex flex-col items-center gap-2">
                 <Badge className="bg-success text-success-foreground">Em Chamada</Badge>
                 <div className="flex gap-2">
                   {isMuted && <Badge variant="outline" className="text-destructive border-destructive/50">Mudo</Badge>}
                   {isOnHold && <Badge variant="outline" className="text-warning border-warning/50">Em Espera</Badge>}
                 </div>
               </div>

               <div className="flex items-center justify-center gap-4 mt-4">
                 <Button
                   variant={isMuted ? "destructive" : "outline"}
                   size="icon"
                   onClick={handleToggleMute}
                   className="h-12 w-12 rounded-full shadow-sm"
                   title={isMuted ? "Desativar Mudo" : "Mudar"}
                 >
                   {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                 </Button>
                 <Button
                   variant={isOnHold ? "secondary" : "outline"}
                   size="icon"
                   onClick={handleToggleHold}
                   className={`h-12 w-12 rounded-full shadow-sm ${isOnHold ? 'bg-warning text-warning-foreground hover:bg-warning/90' : ''}`}
                   title={isOnHold ? "Retomar Chamada" : "Colocar em Espera"}
                 >
                   {isOnHold ? <PhoneForwarded className="h-5 w-5" /> : <PhonePaused className="h-5 w-5" />}
                 </Button>
               </div>
            </div>
          ) : (
            <div className="space-y-3 py-4">
              <Phone className="h-12 w-12 mx-auto text-muted-foreground/30" />
              <p className="text-muted-foreground">{isDialing ? 'Buscando próximo contato...' : 'Discador pausado'}</p>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {!isDialing ? (
            <Button className="flex-1 gap-2" onClick={() => onStartCampaign(campaignId)} disabled={pendingCount === 0}>
              <Play className="h-4 w-4" /> Iniciar Discagem
            </Button>
          ) : (
            <Button variant="destructive" className="flex-1 gap-2" onClick={() => onPauseCampaign(campaignId)}>
              <Pause className="h-4 w-4" /> Pausar
            </Button>
          )}
        </div>

         {currentCall && (
           <div className="space-y-4 pt-2">
             <div className="space-y-2">
               <Label htmlFor="call-notes" className="text-xs flex items-center gap-1">
                 <FileText className="h-3 w-3" /> Observações
               </Label>
               <Input 
                 id="call-notes"
                 value={notes}
                 onChange={(e) => setNotes(e.target.value)}
                 placeholder="Notas da chamada..."
                 className="text-sm"
               />
             </div>
             <div className="space-y-2">
               <p className="text-sm font-medium">Resultado da Chamada:</p>
               <div className="grid grid-cols-2 gap-2">
                 <Button size="sm" variant="outline" className="gap-1 text-success hover:bg-success/10" onClick={() => onCompleteCall('answered', notes)}>
                   <CheckCircle className="h-3 w-3" /> Atendida
                 </Button>
                 <Button size="sm" variant="outline" className="gap-1" onClick={() => onCompleteCall('no_answer', notes)}>
                   <PhoneMissed className="h-3 w-3" /> Não Atendeu
                 </Button>
                 <Button size="sm" variant="outline" className="gap-1" onClick={() => onCompleteCall('busy', notes)}>
                   <PhoneOff className="h-3 w-3" /> Ocupado
                 </Button>
                 <Button size="sm" variant="outline" className="gap-1" onClick={() => onCompleteCall('voicemail', notes)}>
                   <Voicemail className="h-3 w-3" /> Caixa Postal
                 </Button>
                 <Button size="sm" variant="outline" className="gap-1 text-destructive hover:bg-destructive/10" onClick={() => onCompleteCall('wrong_number', notes)}>
                   <XCircle className="h-3 w-3" /> Número Errado
                 </Button>
                 <Button size="sm" variant="outline" className="gap-1 text-primary hover:bg-primary/10" onClick={() => onCompleteCall('callback', notes)}>
                   <RotateCcw className="h-3 w-3" /> Retornar
                 </Button>
               </div>
             </div>
           </div>
         )}

        <AddContactsDialog campaignId={campaignId} />
      </CardContent>
    </Card>
  );
}
