import { Phone, Play, Pause, CheckCircle, PhoneMissed, PhoneOff, Voicemail, XCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PhoneCall } from 'lucide-react';
import { DialerQueueItem } from '@/hooks/usePredictiveDialer';
import { AddContactsDialog } from './AddContactsDialog';

interface DialerControlProps {
  currentCall: DialerQueueItem | null;
  isDialing: boolean;
  callTimer: number;
  pendingQueueLength: number;
  campaignId: string;
  onStartCampaign: () => void;
  onPauseCampaign: () => void;
  onCompleteCall: (result: 'answered' | 'no_answer' | 'busy' | 'voicemail' | 'wrong_number' | 'callback') => void;
}

const formatTimer = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export function DialerControl({
  currentCall, isDialing, callTimer, pendingQueueLength, campaignId,
  onStartCampaign, onPauseCampaign, onCompleteCall,
}: DialerControlProps) {
  return (
    <Card className="lg:col-span-1">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><PhoneCall className="h-5 w-5" />Controle de Discagem</CardTitle>
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
              <Badge className="bg-success text-success-foreground">Em Chamada</Badge>
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
            <Button className="flex-1 gap-2" onClick={onStartCampaign} disabled={pendingQueueLength === 0}>
              <Play className="h-4 w-4" />Iniciar Discagem
            </Button>
          ) : (
            <Button variant="destructive" className="flex-1 gap-2" onClick={onPauseCampaign}>
              <Pause className="h-4 w-4" />Pausar
            </Button>
          )}
        </div>

        {currentCall && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Resultado da Chamada:</p>
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" variant="outline" className="gap-1 text-success hover:bg-success/10" onClick={() => onCompleteCall('answered')}>
                <CheckCircle className="h-3 w-3" />Atendida
              </Button>
              <Button size="sm" variant="outline" className="gap-1" onClick={() => onCompleteCall('no_answer')}>
                <PhoneMissed className="h-3 w-3" />Não Atendeu
              </Button>
              <Button size="sm" variant="outline" className="gap-1" onClick={() => onCompleteCall('busy')}>
                <PhoneOff className="h-3 w-3" />Ocupado
              </Button>
              <Button size="sm" variant="outline" className="gap-1" onClick={() => onCompleteCall('voicemail')}>
                <Voicemail className="h-3 w-3" />Caixa Postal
              </Button>
              <Button size="sm" variant="outline" className="gap-1 text-destructive hover:bg-destructive/10" onClick={() => onCompleteCall('wrong_number')}>
                <XCircle className="h-3 w-3" />Número Errado
              </Button>
              <Button size="sm" variant="outline" className="gap-1 text-primary hover:bg-primary/10" onClick={() => onCompleteCall('callback')}>
                <RotateCcw className="h-3 w-3" />Retornar
              </Button>
            </div>
          </div>
        )}

        <AddContactsDialog campaignId={campaignId} />
      </CardContent>
    </Card>
  );
}
