import { useState, useEffect, useCallback, useRef, forwardRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
  Minimize2,
  Link2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';

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

interface TranscriptEntry {
  id: string;
  text: string;
  speaker: 'agent' | 'customer';
  speakerLabel: string;
  timestamp: Date;
}

interface LiveCallAnalysisProps {
  isActive: boolean;
  contactName: string;
  onClose: () => void;
  transcripts?: TranscriptEntry[];
  inline?: boolean;
  onAnalysis?: (analysis: {
    sentiment: string;
    urgency: string;
    emotion: string;
    suggestion: string;
    riskAlert: boolean;
    riskReason: string;
    messageAnalyzed: string;
    speakerRole: string;
  }) => void;
}

const emotionIcons: Record<string, React.ReactNode> = {
  calmo: <Smile className="h-4 w-4 text-success" />,
  satisfeito: <Smile className="h-4 w-4 text-success" />,
  frustrado: <Meh className="h-4 w-4 text-warning" />,
  irritado: <Angry className="h-4 w-4 text-destructive" />,
  ansioso: <Frown className="h-4 w-4 text-warning" />,
  confuso: <HelpCircle className="h-4 w-4 text-muted-foreground" />,
  neutro: <Meh className="h-4 w-4 text-muted-foreground" />,
};

export const LiveCallAnalysis = forwardRef<HTMLDivElement, LiveCallAnalysisProps>(
  function LiveCallAnalysis({ isActive, contactName, onClose, transcripts = [], inline = false, onAnalysis }, ref) {
  const [insights, setInsights] = useState<RealtimeInsight[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [overallSentiment, setOverallSentiment] = useState(50);
  const [isConnectedToTranscription, setIsConnectedToTranscription] = useState(false);
  const lastAnalyzedIndexRef = useRef(0);

  const analyzeTranscript = useCallback(async (text: string, speaker: string, context: string) => {
    setIsAnalyzing(true);
    
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      if (!accessToken) {
        logger.warn('No active session for realtime analysis');
        setIsAnalyzing(false);
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/realtime-analysis`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            latestMessage: text,
            conversationContext: context,
            speakerRole: speaker,
          }),
        }
      );

      if (response.ok) {
        const insight: RealtimeInsight = await response.json();
        insight.timestamp = new Date();
        
        setInsights(prev => [...prev.slice(-9), insight]); // Keep last 10 insights

        // Update overall sentiment
        const sentimentValue = insight.sentiment === 'positive' ? 75 : 
                              insight.sentiment === 'negative' ? 25 : 50;
        setOverallSentiment(prev => Math.round((prev * 0.7) + (sentimentValue * 0.3)));

        // Send analysis to parent for saving
        onAnalysis?.({
          sentiment: insight.sentiment,
          urgency: insight.urgency,
          emotion: insight.emotion,
          suggestion: insight.suggestion,
          riskAlert: insight.riskAlert,
          riskReason: insight.riskReason,
          messageAnalyzed: text,
          speakerRole: speaker,
        });
      }
    } catch (error) {
      logger.error('Analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [onAnalysis]);

  // Analyze new transcripts when they arrive
  useEffect(() => {
    if (!isActive || transcripts.length === 0) return;
    
    // Check if we have new transcripts to analyze
    if (transcripts.length > lastAnalyzedIndexRef.current) {
      setIsConnectedToTranscription(true);
      
      // Get new transcripts since last analysis
      const newTranscripts = transcripts.slice(lastAnalyzedIndexRef.current);
      lastAnalyzedIndexRef.current = transcripts.length;
      
      // Build context from last 5 messages
      const context = transcripts
        .slice(-5)
        .map(t => `${t.speaker === 'agent' ? 'Agente' : 'Cliente'}: ${t.text}`)
        .join('\n');
      
      // Analyze the latest transcript
      const latestTranscript = newTranscripts[newTranscripts.length - 1];
      if (latestTranscript) {
        analyzeTranscript(latestTranscript.text, latestTranscript.speaker, context);
      }
    }
  }, [isActive, transcripts, analyzeTranscript]);

  // Reset when deactivated
  useEffect(() => {
    if (!isActive) {
      lastAnalyzedIndexRef.current = 0;
      setIsConnectedToTranscription(false);
    }
  }, [isActive]);

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
    <Card 
      ref={ref}
      className={cn(
        'shadow-xl transition-all duration-300',
        inline ? 'w-full' : 'fixed bottom-4 right-4 z-50',
        !inline && (isExpanded ? 'w-[420px]' : 'w-[320px]')
      )}
    >
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
          {isConnectedToTranscription && (
            <Badge variant="secondary" className="ml-1 gap-1 text-xs">
              <Link2 className="h-3 w-3" />
              Conectado
            </Badge>
          )}
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
            <p className="text-xs text-muted-foreground">
              {transcripts.length} mensagens • {insights.length} análises
            </p>
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

        {/* Connection Status */}
        {!isConnectedToTranscription && transcripts.length === 0 && (
          <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3">
            <Link2 className="h-4 w-4 text-primary" />
            <div>
              <p className="text-sm font-medium text-primary">Aguardando transcrição</p>
              <p className="text-xs text-muted-foreground">
                Ative a transcrição ao vivo para análise em tempo real
              </p>
            </div>
          </div>
        )}

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
            <div className="flex items-center gap-2 flex-wrap">
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

        {/* Conversation Preview from Real Transcripts */}
        {isExpanded && transcripts.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              Transcrição Recente
            </p>
            <ScrollArea className="h-[120px] rounded-lg border border-border bg-accent/30 p-2">
              <div className="space-y-2">
                {transcripts.slice(-4).map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      'rounded-lg p-2 text-xs',
                      msg.speaker === 'agent' 
                        ? 'bg-primary/10 text-primary ml-4' 
                        : 'bg-warning/10 text-warning mr-4'
                    )}
                  >
                    <span className="font-medium">
                      {msg.speaker === 'agent' ? 'Agente:' : 'Cliente:'}
                    </span>{' '}
                    {msg.text}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Waiting state when no transcripts */}
        {isExpanded && transcripts.length === 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              Conversa
            </p>
            <div className="h-[120px] rounded-lg border border-border bg-accent/30 p-2 flex items-center justify-center">
              <p className="text-center text-xs text-muted-foreground">
                Aguardando transcrição...
              </p>
            </div>
          </div>
        )}

        {/* Processing indicator */}
        {isAnalyzing && (
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <div className="h-2 w-2 animate-bounce rounded-full bg-primary" />
            <span>Analisando transcrição...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
});
