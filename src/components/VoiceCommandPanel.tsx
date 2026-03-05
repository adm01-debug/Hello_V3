
import React, { useState } from 'react';
import { Phone, PhoneForwarded, Pause, PhoneOff, VolumeX, Volume2, Mic } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { VoiceCommandButton } from './VoiceCommandButton';
import { toast } from '@/hooks/use-toast';

interface VoiceCommand {
  action: 'call' | 'transfer' | 'hold' | 'hangup' | 'mute' | 'unmute' | 'unknown';
  target?: string;
  confidence: number;
}

interface CommandHistory {
  command: VoiceCommand;
  timestamp: Date;
}

const commandIcons = {
  call: Phone,
  transfer: PhoneForwarded,
  hold: Pause,
  hangup: PhoneOff,
  mute: VolumeX,
  unmute: Volume2,
  unknown: Mic,
};

const commandLabels: Record<string, string> = {
  call: 'Ligar',
  transfer: 'Transferir',
  hold: 'Espera',
  hangup: 'Desligar',
  mute: 'Mutar',
  unmute: 'Desmutar',
  unknown: 'Desconhecido',
};

export function VoiceCommandPanel() {
  const [history, setHistory] = useState<CommandHistory[]>([]);
  const [currentCall, setCurrentCall] = useState<{ target: string; status: string } | null>(null);

  const handleCommand = (command: VoiceCommand) => {
    // Add to history
    setHistory(prev => [{ command, timestamp: new Date() }, ...prev].slice(0, 10));

    // Execute command (mock implementation)
    switch (command.action) {
      case 'call':
        if (command.target) {
          setCurrentCall({ target: command.target, status: 'Chamando...' });
          toast({
            title: '📞 Iniciando chamada',
            description: `Ligando para ${command.target}...`,
          });
          // Simulate call connection
          setTimeout(() => {
            setCurrentCall(prev => prev ? { ...prev, status: 'Em chamada' } : null);
          }, 2000);
        }
        break;
      case 'transfer':
        if (command.target && currentCall) {
          toast({
            title: '📲 Transferindo chamada',
            description: `Transferindo para ${command.target}...`,
          });
          setCurrentCall({ target: command.target, status: 'Transferindo...' });
        } else if (!currentCall) {
          toast({
            variant: 'destructive',
            title: 'Sem chamada ativa',
            description: 'Não há chamada para transferir.',
          });
        }
        break;
      case 'hold':
        if (currentCall) {
          setCurrentCall(prev => prev ? { ...prev, status: 'Em espera' } : null);
          toast({
            title: '⏸️ Em espera',
            description: 'Chamada colocada em espera.',
          });
        }
        break;
      case 'hangup':
        if (currentCall) {
          toast({
            title: '📴 Chamada encerrada',
            description: `Chamada com ${currentCall.target} encerrada.`,
          });
          setCurrentCall(null);
        }
        break;
      case 'mute':
        toast({
          title: '🔇 Microfone silenciado',
          description: 'Seu microfone foi desativado.',
        });
        break;
      case 'unmute':
        toast({
          title: '🔊 Microfone ativado',
          description: 'Seu microfone foi reativado.',
        });
        break;
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Voice Control */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Controle por Voz
          </CardTitle>
          <CardDescription>
            Segure o botão e fale um comando
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center py-8">
          <VoiceCommandButton onVoiceCommand={handleCommand} />

          {/* Current Call Status */}
          {currentCall && (
            <div className="mt-6 w-full rounded-lg border bg-accent/50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{currentCall.target}</p>
                  <p className="text-sm text-muted-foreground">{currentCall.status}</p>
                </div>
                <Badge variant={currentCall.status === 'Em chamada' ? 'default' : 'secondary'}>
                  {currentCall.status}
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Command Examples & History */}
      <Card>
        <CardHeader>
          <CardTitle>Comandos Disponíveis</CardTitle>
          <CardDescription>
            Exemplos de comandos que você pode usar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Exemplos:</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>"Ligar para João"</li>
                <li>"Transferir chamada para Maria"</li>
                <li>"Colocar em espera"</li>
                <li>"Desligar"</li>
                <li>"Mutar" / "Desmutar"</li>
              </ul>
            </div>

            {history.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Histórico:</h4>
                <div className="max-h-48 space-y-2 overflow-y-auto">
                  {history.map((item, index) => {
                    const Icon = commandIcons[item.command.action];
                    return (
                      <div
                        key={index}
                        className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2 text-sm"
                      >
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {commandLabels[item.command.action]}
                        </span>
                        {item.command.target && (
                          <span className="text-muted-foreground">
                            → {item.command.target}
                          </span>
                        )}
                        <span className="ml-auto text-xs text-muted-foreground">
                          {item.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
