import { useState, useEffect, useCallback } from 'react';
import { 
  Bot, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  AlertTriangle,
  Lightbulb,
  Activity,
  Smile,
  Meh,
  Frown,
  Angry,
  HelpCircle,
  Zap,
  MessageSquare,
  X,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface RealtimeInsight {
  sentiment: 'positive' | 'neutral' | 'negative';
  urgency: 'low' | 'medium' | 'high';
  emotion: string;
  suggestion: string;
  keywords: string[];
  riskAlert: boolean;
  riskReason: string;
  timestamp: Date;
}

interface ConversationMessage {
  role: 'agent' | 'customer';
  text: string;
  timestamp: Date;
}

interface LiveCallAnalysisProps {
  isActive: boolean;
  contactName: string;
  onClose: () => void;
}

const emotionIcons: Record<string, React.ReactNode> = {
  calmo: <Smile className="h-4 w-4 text-success" />,
  satisfeito: <Smile className="h-4 w-4 text-success" />,
  frustrado: <Meh className="h-4 w-4 text-warning" />,
  irritado: <Angry className="h-4 w-4 text-destructive" />,
  ansioso: <Frown className="h-4 w-4 text-warning" />,
  confuso: <HelpCircle className="h-4 w-4 text-muted-foreground" />,
};

// Simulated conversation for demo
const simulatedConversation: ConversationMessage[] = [
  { role: 'agent', text: 'Bom dia! Meu nome é Lucas, como posso ajudar?', timestamp: new Date() },
  { role: 'customer', text: 'Oi, preciso resolver um problema com minha fatura. Está vindo cobrança errada há 3 meses!', timestamp: new Date() },
  { role: 'agent', text: 'Entendo sua frustração. Deixe-me verificar sua conta para resolver isso.', timestamp: new Date() },
  { role: 'customer', text: 'Espero que resolvam dessa vez porque já liguei várias vezes.', timestamp: new Date() },
  { role: 'agent', text: 'Peço desculpas pelos transtornos. Encontrei o erro e vou corrigir agora mesmo.', timestamp: new Date() },
  { role: 'customer', text: 'Obrigado, fico no aguardo.', timestamp: new Date() },
];

export function LiveCallAnalysis({ isActive, contactName, onClose }: LiveCallAnalysisProps) {
  const [insights, setInsights] = useState<RealtimeInsight[]>([]);
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [overallSentiment, setOverallSentiment] = useState(50);

  const analyzeMessage = useCallback(async (message: ConversationMessage, context: string) => {
    setIsAnalyzing(true);
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/realtime-analysis`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            latestMessage: message.text,
            conversationContext: context,
            speakerRole: message.role,
          }),
        }
      );

      if (response.ok) {
        const insight: RealtimeInsight = await response.json();
        insight.timestamp = new Date();
        
        setInsights(prev => [...prev, insight]);

        // Update overall sentiment
        const sentimentValue = insight.sentiment === 'positive' ? 75 : 
                              insight.sentiment === 'negative' ? 25 : 50;
        setOverallSentiment(prev => Math.round((prev + sentimentValue) / 2));
      }
    } catch (error) {
      console.error('Analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  // Simulate real-time conversation
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      if (currentMessageIndex < simulatedConversation.length) {
        const newMessage = {
          ...simulatedConversation[currentMessageIndex],
          timestamp: new Date(),
        };
        
        setConversation(prev => {
          const updated = [...prev, newMessage];
          const context = updated.slice(-5).map(m => `${m.role}: ${m.text}`).join('\n');
          analyzeMessage(newMessage, context);
          return updated;
        });
        
        setCurrentMessageIndex(prev => prev + 1);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [isActive, currentMessageIndex, analyzeMessage]);

  const latestInsight = insights[insights.length - 1];

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-success';
      case 'negative': return 'text-destructive';
      default: return 'text-warning';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-destructive text-destructive-foreground';
      case 'medium': return 'bg-warning text-warning-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (!isActive) return null;

  return (
    <Card className={cn(
      'fixed bottom-4 right-4 z-50 shadow-2xl transition-all duration-300',
      isExpanded ? 'w-[420px]' : 'w-[320px]'
    )}>
      <CardHeader className="flex flex-row items-center justify-between border-b border-border py-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="relative">
            <Bot className="h-5 w-5 text-primary" />
            {isAnalyzing && (
              <span className="absolute -right-1 -top-1 h-2 w-2 animate-ping rounded-full bg-primary" />
            )}
          </div>
          Análise ao Vivo
          <Badge variant="outline" className="ml-2 gap-1 text-xs">
            <Activity className="h-3 w-3 animate-pulse text-success" />
            Ativo
          </Badge>
        </CardTitle>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* Contact & Sentiment Overview */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">{contactName}</p>
            <p className="text-xs text-muted-foreground">{conversation.length} mensagens</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Sentimento Geral</p>
            <div className="flex items-center gap-1">
              {overallSentiment >= 60 ? (
                <TrendingUp className="h-4 w-4 text-success" />
              ) : overallSentiment <= 40 ? (
                <TrendingDown className="h-4 w-4 text-destructive" />
              ) : (
                <Minus className="h-4 w-4 text-warning" />
              )}
              <span className={cn(
                'font-bold',
                overallSentiment >= 60 ? 'text-success' : 
                overallSentiment <= 40 ? 'text-destructive' : 'text-warning'
              )}>
                {overallSentiment}%
              </span>
            </div>
          </div>
        </div>

        <Progress value={overallSentiment} className="h-2" />

        {/* Risk Alert */}
        {latestInsight?.riskAlert && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 animate-pulse">
            <AlertTriangle className="h-4 w-4 shrink-0 text-destructive mt-0.5" />
            <div>
              <p className="text-sm font-medium text-destructive">Alerta de Risco</p>
              <p className="text-xs text-destructive/80">{latestInsight.riskReason}</p>
            </div>
          </div>
        )}

        {/* Latest Insight */}
        {latestInsight && (
          <div className="space-y-3">
            {/* Current State */}
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={cn('gap-1', getSentimentColor(latestInsight.sentiment))}>
                {latestInsight.sentiment === 'positive' ? <TrendingUp className="h-3 w-3" /> :
                 latestInsight.sentiment === 'negative' ? <TrendingDown className="h-3 w-3" /> :
                 <Minus className="h-3 w-3" />}
                {latestInsight.sentiment}
              </Badge>
              
              <Badge variant="outline" className="gap-1">
                {emotionIcons[latestInsight.emotion] || <Meh className="h-3 w-3" />}
                {latestInsight.emotion}
              </Badge>
              
              <Badge className={cn('gap-1', getUrgencyColor(latestInsight.urgency))}>
                <Zap className="h-3 w-3" />
                {latestInsight.urgency}
              </Badge>
            </div>

            {/* AI Suggestion */}
            {latestInsight.suggestion && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                <div className="flex items-start gap-2">
                  <Lightbulb className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-primary">Sugestão</p>
                    <p className="text-sm text-foreground">{latestInsight.suggestion}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Keywords */}
            {latestInsight.keywords.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {latestInsight.keywords.map((keyword, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {keyword}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Conversation Preview */}
        {isExpanded && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              Conversa
            </p>
            <ScrollArea className="h-[120px] rounded-lg border border-border bg-accent/30 p-2">
              <div className="space-y-2">
                {conversation.slice(-4).map((msg, index) => (
                  <div
                    key={index}
                    className={cn(
                      'rounded-lg p-2 text-xs',
                      msg.role === 'agent' 
                        ? 'bg-primary/10 text-primary ml-4' 
                        : 'bg-muted mr-4'
                    )}
                  >
                    <span className="font-medium">
                      {msg.role === 'agent' ? 'Agente:' : 'Cliente:'}
                    </span>{' '}
                    {msg.text}
                  </div>
                ))}
                {conversation.length === 0 && (
                  <p className="text-center text-xs text-muted-foreground py-4">
                    Aguardando conversa...
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Processing indicator */}
        {isAnalyzing && (
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <div className="h-2 w-2 animate-bounce rounded-full bg-primary" />
            <span>Analisando...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
