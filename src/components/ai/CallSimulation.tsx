import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw,
  Phone,
  User,
  Headphones,
   Activity
 import { formatDuration } from '@/lib/utils';
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LiveCallAnalysis } from './LiveCallAnalysis';

interface SimulatedMessage {
  id: string;
  text: string;
  speaker: 'agent' | 'customer';
  speakerLabel: string;
  timestamp: Date;
  delay: number; // ms delay before showing this message
}

const simulatedConversation: Omit<SimulatedMessage, 'id' | 'timestamp'>[] = [
  { speaker: 'agent', speakerLabel: 'Agente Maria', text: 'Olá, bom dia! Meu nome é Maria, como posso ajudá-lo hoje?', delay: 1000 },
  { speaker: 'customer', speakerLabel: 'Cliente João', text: 'Bom dia, estou ligando porque minha internet está muito lenta há três dias e já tentei reiniciar o modem várias vezes.', delay: 3000 },
  { speaker: 'agent', speakerLabel: 'Agente Maria', text: 'Entendo sua frustração, senhor João. Vou verificar seu cadastro e analisar a conexão. Pode me confirmar o CPF cadastrado?', delay: 3500 },
  { speaker: 'customer', speakerLabel: 'Cliente João', text: 'Claro, é 123.456.789-00. Mas olha, isso já está me atrapalhando no trabalho, preciso resolver urgente!', delay: 4000 },
  { speaker: 'agent', speakerLabel: 'Agente Maria', text: 'Compreendo perfeitamente a urgência. Estou verificando aqui... identifico uma instabilidade na sua região. Vou abrir um chamado prioritário para você.', delay: 4500 },
  { speaker: 'customer', speakerLabel: 'Cliente João', text: 'Finalmente alguém que entende! Qual o prazo para resolver?', delay: 3000 },
  { speaker: 'agent', speakerLabel: 'Agente Maria', text: 'Nossa equipe técnica irá até seu endereço em até 24 horas. Posso agendar para amanhã pela manhã, entre 8h e 12h?', delay: 4000 },
  { speaker: 'customer', speakerLabel: 'Cliente João', text: 'Perfeito, pode agendar. Obrigado pela atenção, Maria. Você foi muito prestativa!', delay: 3500 },
  { speaker: 'agent', speakerLabel: 'Agente Maria', text: 'Eu que agradeço, senhor João! Número do protocolo é 2024-789456. Algo mais em que posso ajudar?', delay: 3000 },
  { speaker: 'customer', speakerLabel: 'Cliente João', text: 'Não, era só isso. Muito obrigado!', delay: 2000 },
  { speaker: 'agent', speakerLabel: 'Agente Maria', text: 'Por nada! Tenha um ótimo dia e qualquer dúvida, estamos à disposição. Até logo!', delay: 2500 },
];

export function CallSimulation() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [transcripts, setTranscripts] = useState<SimulatedMessage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [callDuration, setCallDuration] = useState(0);
  const [showAnalysis, setShowAnalysis] = useState(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const addNextMessage = useCallback(() => {
    if (currentIndex >= simulatedConversation.length) {
      setIsPlaying(false);
      return;
    }

    const message = simulatedConversation[currentIndex];
    const newMessage: SimulatedMessage = {
      ...message,
      id: `sim-${Date.now()}-${currentIndex}`,
      timestamp: new Date(),
    };

    setTranscripts(prev => [...prev, newMessage]);
    setCurrentIndex(prev => prev + 1);
  }, [currentIndex]);

  useEffect(() => {
    if (isPlaying && currentIndex < simulatedConversation.length) {
      const delay = simulatedConversation[currentIndex]?.delay || 2000;
      timeoutRef.current = setTimeout(addNextMessage, delay);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isPlaying, currentIndex, addNextMessage]);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying]);

  const handlePlay = () => {
    setIsPlaying(true);
    setShowAnalysis(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setTranscripts([]);
    setCurrentIndex(0);
    setCallDuration(0);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const progress = (currentIndex / simulatedConversation.length) * 100;
  const isComplete = currentIndex >= simulatedConversation.length;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-primary" />
              Simulação de Chamada em Tempo Real
            </div>
            <div className="flex items-center gap-2">
              {isPlaying && (
                <Badge className="gap-1 bg-success text-success-foreground animate-pulse">
                  <Activity className="h-3 w-3" />
                  Ao Vivo
                </Badge>
              )}
              {isComplete && (
                <Badge variant="secondary">Finalizada</Badge>
              )}
              <Badge variant="outline">{formatDuration(callDuration)}</Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Call Info */}
          <div className="flex items-center justify-between rounded-lg border border-border bg-accent/30 p-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">João Silva</p>
                  <p className="text-xs text-muted-foreground">Cliente</p>
                </div>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
                  <Headphones className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm font-medium">Maria Santos</p>
                  <p className="text-xs text-muted-foreground">Agente</p>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progresso da chamada</span>
              <span>{currentIndex} / {simulatedConversation.length} mensagens</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleReset}
              disabled={currentIndex === 0 && !isPlaying}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            
            {isPlaying ? (
              <Button size="lg" onClick={handlePause} className="gap-2">
                <Pause className="h-5 w-5" />
                Pausar
              </Button>
            ) : (
              <Button 
                size="lg" 
                onClick={handlePlay} 
                disabled={isComplete}
                className="gap-2"
              >
                <Play className="h-5 w-5" />
                {currentIndex === 0 ? 'Iniciar Simulação' : 'Continuar'}
              </Button>
            )}
          </div>

          {/* Transcription Preview */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto rounded-lg border border-border bg-background p-4">
            {transcripts.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">
                Clique em "Iniciar Simulação" para ver a análise em tempo real
              </p>
            ) : (
              transcripts.map((msg) => (
                <div
                  key={msg.id}
                  className={`rounded-lg p-3 text-sm animate-fade-in ${
                    msg.speaker === 'agent'
                      ? 'bg-primary/10 ml-8'
                      : 'bg-muted mr-8'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {msg.speaker === 'agent' ? (
                      <Headphones className="h-3 w-3 text-primary" />
                    ) : (
                      <User className="h-3 w-3 text-muted-foreground" />
                    )}
                    <span className="text-xs font-medium text-muted-foreground">
                      {msg.speakerLabel}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {msg.timestamp.toLocaleTimeString('pt-BR')}
                    </span>
                  </div>
                  <p>{msg.text}</p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Live Analysis Panel */}
      {showAnalysis && (
        <LiveCallAnalysis
          isActive={isPlaying || transcripts.length > 0}
          contactName="João Silva"
          onClose={() => setShowAnalysis(false)}
          transcripts={transcripts}
          inline={true}
        />
      )}
    </div>
  );
}
