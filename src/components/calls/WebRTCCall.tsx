import { useState, useCallback } from 'react';
import { useConversation } from '@elevenlabs/react';
import { 
  Phone, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Volume2,
  VolumeX,
  Loader2,
  Radio,
  Waves
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface WebRTCCallProps {
  onTranscript?: (text: string, speaker: 'user' | 'agent') => void;
  onCallStart?: () => void;
  onCallEnd?: () => void;
}

export function WebRTCCall({ onTranscript, onCallStart, onCallEnd }: WebRTCCallProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [agentId, setAgentId] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [transcripts, setTranscripts] = useState<Array<{ role: string; text: string }>>([]);

  const conversation = useConversation({
    onConnect: () => {
      console.log('Connected to ElevenLabs agent');
      toast.success('Conectado ao agente de voz');
      onCallStart?.();
    },
    onDisconnect: () => {
      console.log('Disconnected from agent');
      toast.info('Chamada encerrada');
      onCallEnd?.();
    },
    onMessage: (message) => {
      console.log('Message received:', message);
      
      // Handle different message types from ElevenLabs
      const msgAny = message as any;
      
      if (msgAny.user_transcription_event?.user_transcript) {
        const text = msgAny.user_transcription_event.user_transcript;
        setTranscripts(prev => [...prev, { role: 'user', text }]);
        onTranscript?.(text, 'user');
      } else if (msgAny.agent_response_event?.agent_response) {
        const text = msgAny.agent_response_event.agent_response;
        setTranscripts(prev => [...prev, { role: 'agent', text }]);
        onTranscript?.(text, 'agent');
      }
    },
    onError: (error) => {
      console.error('Conversation error:', error);
      toast.error('Erro na conexão de voz');
      setIsConnecting(false);
    },
  });

  const startConversation = useCallback(async () => {
    if (!agentId.trim()) {
      toast.error('Por favor, insira o ID do agente ElevenLabs');
      return;
    }

    setIsConnecting(true);
    setTranscripts([]);

    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Get signed URL from edge function
      const { data, error } = await supabase.functions.invoke('elevenlabs-conversation-token', {
        body: { agentId: agentId.trim() }
      });

      if (error || !data?.signed_url) {
        throw new Error(data?.error || 'Falha ao obter token de conversação');
      }

      // Start the conversation with WebSocket (signed URL)
      await conversation.startSession({
        signedUrl: data.signed_url,
      });

    } catch (error) {
      console.error('Failed to start conversation:', error);
      toast.error(error instanceof Error ? error.message : 'Falha ao iniciar chamada');
    } finally {
      setIsConnecting(false);
    }
  }, [conversation, agentId, onCallStart]);

  const endConversation = useCallback(async () => {
    await conversation.endSession();
  }, [conversation]);

  const toggleMute = useCallback(async () => {
    // Note: ElevenLabs SDK doesn't have a direct mute, 
    // we'd need to manage audio track manually
    setIsMuted(!isMuted);
    toast.info(isMuted ? 'Microfone ativado' : 'Microfone desativado');
  }, [isMuted]);

  const toggleVolume = useCallback(async () => {
    const newVolume = volume > 0 ? 0 : 1;
    setVolume(newVolume);
    await conversation.setVolume({ volume: newVolume });
    toast.info(newVolume > 0 ? 'Som ativado' : 'Som desativado');
  }, [volume, conversation]);

  const isConnected = conversation.status === 'connected';
  const isSpeaking = conversation.isSpeaking;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Radio className="h-5 w-5 text-primary" />
          Chamada WebRTC
        </CardTitle>
        <CardDescription>
          Chamadas de voz via navegador com IA conversacional
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Agent ID Input */}
        {!isConnected && (
          <div className="space-y-2">
            <Label htmlFor="agentId">ID do Agente ElevenLabs</Label>
            <Input
              id="agentId"
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
              placeholder="Cole o ID do agente aqui"
              disabled={isConnecting}
            />
            <p className="text-xs text-muted-foreground">
              Crie um agente em{' '}
              <a 
                href="https://elevenlabs.io/app/conversational-ai" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                elevenlabs.io
              </a>
            </p>
          </div>
        )}

        {/* Call Status */}
        {isConnected && (
          <div className={cn(
            "rounded-lg border p-4 text-center transition-colors",
            isSpeaking 
              ? "border-primary/50 bg-primary/5" 
              : "border-success/50 bg-success/5"
          )}>
            <div className="flex items-center justify-center gap-2 mb-2">
              <Badge variant={isSpeaking ? "default" : "secondary"}>
                {isSpeaking ? (
                  <>
                    <Waves className="h-3 w-3 mr-1 animate-pulse" />
                    Agente falando
                  </>
                ) : (
                  <>
                    <Mic className="h-3 w-3 mr-1" />
                    Ouvindo você
                  </>
                )}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Chamada em andamento
            </p>
          </div>
        )}

        {/* Transcripts */}
        {transcripts.length > 0 && (
          <div className="max-h-48 overflow-y-auto space-y-2 rounded-lg border bg-muted/30 p-3">
            {transcripts.map((t, i) => (
              <div 
                key={i}
                className={cn(
                  "text-sm p-2 rounded",
                  t.role === 'user' 
                    ? "bg-primary/10 text-primary-foreground ml-8" 
                    : "bg-secondary mr-8"
                )}
              >
                <span className="font-medium">
                  {t.role === 'user' ? 'Você: ' : 'Agente: '}
                </span>
                {t.text}
              </div>
            ))}
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          {isConnected && (
            <>
              <Button
                variant="outline"
                size="icon"
                className={cn(
                  "h-12 w-12 rounded-full",
                  isMuted && "bg-destructive/10 text-destructive border-destructive/20"
                )}
                onClick={toggleMute}
              >
                {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </Button>

              <Button
                variant="outline"
                size="icon"
                className={cn(
                  "h-12 w-12 rounded-full",
                  volume === 0 && "bg-warning/10 text-warning border-warning/20"
                )}
                onClick={toggleVolume}
              >
                {volume > 0 ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
              </Button>
            </>
          )}

          {!isConnected ? (
            <Button
              className="h-14 px-8 gap-2 text-lg"
              onClick={startConversation}
              disabled={isConnecting || !agentId.trim()}
            >
              {isConnecting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Phone className="h-5 w-5" />
              )}
              {isConnecting ? 'Conectando...' : 'Iniciar Chamada'}
            </Button>
          ) : (
            <Button
              variant="destructive"
              className="h-14 px-8 gap-2 text-lg"
              onClick={endConversation}
            >
              <PhoneOff className="h-5 w-5" />
              Encerrar
            </Button>
          )}
        </div>

        {/* Info */}
        <div className="rounded-lg border border-border bg-accent/30 p-3 text-sm text-muted-foreground">
          <p className="font-medium text-foreground mb-1">Como funciona:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Crie um agente de voz no ElevenLabs</li>
            <li>Cole o ID do agente acima</li>
            <li>Clique em "Iniciar Chamada" e fale normalmente</li>
            <li>O agente responderá com voz natural</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
