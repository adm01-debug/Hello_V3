import { useState } from 'react';
import { 
  Phone, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Pause, 
  Volume2,
  PhoneForwarded,
  Delete,
  Clock,
  Radio
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockContacts, getInitials, formatDuration } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { WebRTCCall } from '@/components/calls/WebRTCCall';

const dialPadButtons = [
  { digit: '1', letters: '' },
  { digit: '2', letters: 'ABC' },
  { digit: '3', letters: 'DEF' },
  { digit: '4', letters: 'GHI' },
  { digit: '5', letters: 'JKL' },
  { digit: '6', letters: 'MNO' },
  { digit: '7', letters: 'PQRS' },
  { digit: '8', letters: 'TUV' },
  { digit: '9', letters: 'WXYZ' },
  { digit: '*', letters: '' },
  { digit: '0', letters: '+' },
  { digit: '#', letters: '' },
];

const Calls = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isInCall, setIsInCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isOnHold, setIsOnHold] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const handleDigitPress = (digit: string) => {
    setPhoneNumber(prev => prev + digit);
  };

  const handleBackspace = () => {
    setPhoneNumber(prev => prev.slice(0, -1));
  };

  const handleCall = () => {
    if (!phoneNumber) {
      toast({
        variant: 'destructive',
        title: 'Número inválido',
        description: 'Digite um número para ligar',
      });
      return;
    }
    
    setIsInCall(true);
    toast({
      title: '📞 Chamando...',
      description: phoneNumber,
    });

    // Simulate call connection
    const interval = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    // Store interval ID for cleanup
    (window as any).callInterval = interval;
  };

  const handleHangup = () => {
    setIsInCall(false);
    setIsMuted(false);
    setIsOnHold(false);
    setCallDuration(0);
    clearInterval((window as any).callInterval);
    
    toast({
      title: '📴 Chamada encerrada',
      description: `Duração: ${formatDuration(callDuration)}`,
    });
  };

  const quickContacts = mockContacts.filter(c => c.favorite).slice(0, 4);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Chamadas</h1>
        <p className="text-muted-foreground">Faça e receba chamadas</p>
      </div>

      <Tabs defaultValue="dialpad" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="dialpad" className="gap-2">
            <Phone className="h-4 w-4" />
            Discador
          </TabsTrigger>
          <TabsTrigger value="webrtc" className="gap-2">
            <Radio className="h-4 w-4" />
            WebRTC
          </TabsTrigger>
        </TabsList>

        {/* Dial Pad Tab */}
        <TabsContent value="dialpad">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Dial Pad */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Discador</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Phone Number Display */}
                <div className="relative">
                  <Input
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Digite o número"
                    className="h-14 text-center text-2xl font-mono tracking-wider"
                  />
                  {phoneNumber && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                      onClick={handleBackspace}
                    >
                      <Delete className="h-5 w-5" />
                    </Button>
                  )}
                </div>

                {/* Dial Pad Grid */}
                <div className="grid grid-cols-3 gap-3">
                  {dialPadButtons.map(({ digit, letters }) => (
                    <Button
                      key={digit}
                      variant="outline"
                      className="h-16 flex-col gap-0.5 text-xl font-medium"
                      onClick={() => handleDigitPress(digit)}
                      disabled={isInCall}
                    >
                      <span>{digit}</span>
                      {letters && (
                        <span className="text-[10px] text-muted-foreground">{letters}</span>
                      )}
                    </Button>
                  ))}
                </div>

                {/* Call Button */}
                {!isInCall ? (
                  <Button
                    className="h-14 w-full gap-2 text-lg"
                    onClick={handleCall}
                  >
                    <Phone className="h-5 w-5" />
                    Ligar
                  </Button>
                ) : (
                  <div className="space-y-4">
                    {/* Call Status */}
                    <div className="rounded-lg border border-success/20 bg-success/5 p-4 text-center">
                      <p className="text-sm text-muted-foreground">Em chamada</p>
                      <p className="text-3xl font-mono font-bold text-success">
                        {formatDuration(callDuration)}
                      </p>
                      <p className="mt-1 font-medium">{phoneNumber}</p>
                    </div>

                    {/* Call Controls */}
                    <div className="flex justify-center gap-3">
                      <Button
                        variant="outline"
                        size="icon"
                        className={cn(
                          'h-12 w-12 rounded-full',
                          isMuted && 'bg-destructive/10 text-destructive border-destructive/20'
                        )}
                        onClick={() => setIsMuted(!isMuted)}
                      >
                        {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                      </Button>

                      <Button
                        variant="outline"
                        size="icon"
                        className={cn(
                          'h-12 w-12 rounded-full',
                          isOnHold && 'bg-warning/10 text-warning border-warning/20'
                        )}
                        onClick={() => setIsOnHold(!isOnHold)}
                      >
                        <Pause className="h-5 w-5" />
                      </Button>

                      <Button
                        variant="outline"
                        size="icon"
                        className="h-12 w-12 rounded-full"
                      >
                        <Volume2 className="h-5 w-5" />
                      </Button>

                      <Button
                        variant="outline"
                        size="icon"
                        className="h-12 w-12 rounded-full"
                      >
                        <PhoneForwarded className="h-5 w-5" />
                      </Button>
                    </div>

                    {/* Hangup Button */}
                    <Button
                      variant="destructive"
                      className="h-14 w-full gap-2 text-lg"
                      onClick={handleHangup}
                    >
                      <PhoneOff className="h-5 w-5" />
                      Encerrar
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Contacts & Recent */}
            <div className="space-y-6">
              {/* Quick Contacts */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Contatos Rápidos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {quickContacts.map((contact) => (
                      <Button
                        key={contact.id}
                        variant="outline"
                        className="h-auto flex-col gap-2 p-4"
                        onClick={() => {
                          setPhoneNumber(contact.phone.replace(/\D/g, ''));
                          toast({
                            title: 'Número selecionado',
                            description: contact.name,
                          });
                        }}
                        disabled={isInCall}
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                          {getInitials(contact.name)}
                        </div>
                        <span className="text-sm font-medium">{contact.name}</span>
                        <span className="text-xs text-muted-foreground">{contact.company}</span>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Call Tips */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Dicas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3 rounded-lg border border-border bg-accent/30 p-3">
                    <Mic className="mt-0.5 h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Comando de Voz</p>
                      <p className="text-sm text-muted-foreground">
                        Use "Ligar para [nome]" na página de comandos de voz
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 rounded-lg border border-border bg-accent/30 p-3">
                    <Clock className="mt-0.5 h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Histórico</p>
                      <p className="text-sm text-muted-foreground">
                        Veja todas as chamadas anteriores no menu Histórico
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* WebRTC Tab */}
        <TabsContent value="webrtc">
          <div className="grid gap-6 lg:grid-cols-2">
            <WebRTCCall 
              onCallStart={() => {
                toast({
                  title: '🎙️ Chamada WebRTC iniciada',
                  description: 'Fale normalmente com o agente de voz',
                });
              }}
              onCallEnd={() => {
                toast({
                  title: '📴 Chamada WebRTC encerrada',
                  description: 'A sessão foi finalizada',
                });
              }}
            />

            {/* WebRTC Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Sobre Chamadas WebRTC</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  As chamadas WebRTC permitem comunicação de voz diretamente pelo navegador, 
                  sem necessidade de telefone ou aplicativo externo.
                </p>

                <div className="space-y-3">
                  <div className="flex items-start gap-3 rounded-lg border border-success/20 bg-success/5 p-3">
                    <Radio className="mt-0.5 h-5 w-5 text-success" />
                    <div>
                      <p className="font-medium text-success">Vantagens</p>
                      <ul className="text-sm text-muted-foreground list-disc list-inside mt-1">
                        <li>Sem custo de ligação telefônica</li>
                        <li>Funciona em qualquer dispositivo com navegador</li>
                        <li>Integração com IA conversacional</li>
                        <li>Transcrição em tempo real</li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
                    <Phone className="mt-0.5 h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium text-primary">Requisitos</p>
                      <ul className="text-sm text-muted-foreground list-disc list-inside mt-1">
                        <li>Microfone funcionando</li>
                        <li>Permissão de áudio no navegador</li>
                        <li>Conexão de internet estável</li>
                        <li>ID do agente ElevenLabs</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Calls;
