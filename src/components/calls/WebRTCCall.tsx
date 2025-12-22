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
  Waves,
  Headphones,
  Bot
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

// Pre-configured agent templates for customer service
const AGENT_TEMPLATES = [
  {
    id: 'atendimento-geral',
    name: 'Atendimento Geral',
    description: 'Agente para atendimento ao cliente em geral',
    icon: Headphones,
    systemPrompt: `Você é um agente de atendimento ao cliente profissional e amigável. 
Suas diretrizes:
- Sempre cumprimente o cliente de forma cordial
- Fale em português do Brasil de forma clara e natural
- Seja prestativo e resolva problemas de forma eficiente
- Mantenha um tom profissional mas acolhedor
- Confirme informações importantes repetindo-as
- Ao encerrar, agradeça e pergunte se pode ajudar em mais algo`
  },
  {
    id: 'suporte-tecnico',
    name: 'Suporte Técnico',
    description: 'Agente especializado em suporte técnico',
    icon: Bot,
    systemPrompt: `Você é um agente de suporte técnico especializado.
Suas diretrizes:
- Fale em português do Brasil de forma clara
- Faça perguntas para entender o problema técnico
- Guie o cliente passo a passo na resolução
- Use linguagem simples, evitando jargões técnicos desnecessários
- Confirme se cada etapa foi concluída com sucesso
- Ofereça alternativas quando a primeira solução não funcionar
- Registre o número do protocolo ao final`
  },
  {
    id: 'vendas',
    name: 'Vendas',
    description: 'Agente focado em vendas e conversão',
    icon: Phone,
    systemPrompt: `Você é um agente de vendas consultivo e persuasivo.
Suas diretrizes:
- Fale em português do Brasil de forma entusiasmada mas profissional
- Identifique as necessidades do cliente fazendo perguntas
- Apresente soluções que atendam às necessidades identificadas
- Destaque benefícios, não apenas características
- Trate objeções de forma empática e informativa
- Crie senso de urgência quando apropriado
- Sempre agradeça o interesse do cliente`
  }
];

type AgentMode = 'template' | 'custom';

interface WebRTCCallProps {
  onTranscript?: (text: string, speaker: 'user' | 'agent') => void;
  onCallStart?: () => void;
  onCallEnd?: () => void;
}

export function WebRTCCall({ onTranscript, onCallStart, onCallEnd }: WebRTCCallProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [agentId, setAgentId] = useState('');
  const [agentMode, setAgentMode] = useState<AgentMode>('template');
  const [selectedTemplate, setSelectedTemplate] = useState(AGENT_TEMPLATES[0].id);
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
    const finalAgentId = agentMode === 'custom' ? agentId.trim() : '';
    
    if (agentMode === 'custom' && !finalAgentId) {
      toast.error('Por favor, insira o ID do agente ElevenLabs');
      return;
    }

    if (agentMode === 'template' && !selectedTemplate) {
      toast.error('Por favor, selecione um tipo de agente');
      return;
    }

    setIsConnecting(true);
    setTranscripts([]);

    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Get template system prompt if using template mode
      const template = agentMode === 'template' 
        ? AGENT_TEMPLATES.find(t => t.id === selectedTemplate) 
        : null;

      // Get signed URL from edge function
      const { data, error } = await supabase.functions.invoke('elevenlabs-conversation-token', {
        body: { 
          agentId: finalAgentId || undefined,
          useDefaultAgent: agentMode === 'template',
          systemPrompt: template?.systemPrompt
        }
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
  }, [conversation, agentId, agentMode, selectedTemplate, onCallStart]);

  const endConversation = useCallback(async () => {
    await conversation.endSession();
  }, [conversation]);

  const toggleMute = useCallback(async () => {
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
  const currentTemplate = AGENT_TEMPLATES.find(t => t.id === selectedTemplate);

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
        {/* Agent Selection - Only show when not connected */}
        {!isConnected && (
          <Tabs value={agentMode} onValueChange={(v) => setAgentMode(v as AgentMode)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="template">Agentes Pré-configurados</TabsTrigger>
              <TabsTrigger value="custom">Agente Personalizado</TabsTrigger>
            </TabsList>
            
            <TabsContent value="template" className="space-y-4">
              <div className="grid gap-3">
                {AGENT_TEMPLATES.map((template) => {
                  const Icon = template.icon;
                  return (
                    <div
                      key={template.id}
                      className={cn(
                        "flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors",
                        selectedTemplate === template.id 
                          ? "border-primary bg-primary/5" 
                          : "border-border hover:border-primary/50"
                      )}
                      onClick={() => setSelectedTemplate(template.id)}
                    >
                      <div className={cn(
                        "p-2 rounded-lg",
                        selectedTemplate === template.id 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-muted"
                      )}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{template.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {template.description}
                        </p>
                      </div>
                      {selectedTemplate === template.id && (
                        <Badge variant="secondary">Selecionado</Badge>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {currentTemplate && (
                <div className="rounded-lg border bg-muted/30 p-3">
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    Instruções do agente:
                  </p>
                  <p className="text-xs text-muted-foreground whitespace-pre-line">
                    {currentTemplate.systemPrompt}
                  </p>
                </div>
              )}
              
              <div className="rounded-lg border border-warning/50 bg-warning/10 p-3 text-sm">
                <p className="font-medium text-warning-foreground mb-1">⚠️ Configuração necessária</p>
                <p className="text-muted-foreground text-xs">
                  Para usar os agentes pré-configurados, você precisa criar um agente no{' '}
                  <a 
                    href="https://elevenlabs.io/app/conversational-ai" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    ElevenLabs
                  </a>
                  {' '}com as instruções acima e habilitar "Override" nas configurações.
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="custom" className="space-y-4">
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
            </TabsContent>
          </Tabs>
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
              {agentMode === 'template' && currentTemplate && (
                <span className="block mt-1 text-xs">
                  Agente: {currentTemplate.name}
                </span>
              )}
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
              disabled={isConnecting || (agentMode === 'custom' && !agentId.trim())}
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
        {!isConnected && (
          <div className="rounded-lg border border-border bg-accent/30 p-3 text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Como funciona:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Selecione um tipo de agente ou use um personalizado</li>
              <li>Clique em "Iniciar Chamada" e fale normalmente</li>
              <li>O agente responderá com voz natural em português</li>
              <li>A transcrição aparecerá em tempo real</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
