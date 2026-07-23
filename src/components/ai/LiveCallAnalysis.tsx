import { forwardRef, useState } from 'react';
import {
  Activity,
  Bot,
  Frown,
  Link2,
  Maximize2,
  Meh,
  Minimize2,
  Smile,
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { LatestInsightPanel, RiskAlert } from './live-call/InsightPanels';
import { TranscriptPreview } from './live-call/TranscriptPreview';
import { useLiveInsights } from './live-call/useLiveInsights';
import type { TranscriptEntry } from './live-call/types';

interface LiveCallAnalysisProps {
  isActive: boolean;
  contactName: string;
  onClose: () => void;
  transcripts?: TranscriptEntry[];
  inline?: boolean;
  callSessionId?: string;
  callStartedAt?: Date;
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

export const LiveCallAnalysis = forwardRef<HTMLDivElement, LiveCallAnalysisProps>(
  function LiveCallAnalysis(
    {
      isActive,
      contactName,
      onClose,
      transcripts = [],
      inline = false,
      callSessionId,
      callStartedAt,
      onAnalysis,
    },
    ref,
  ) {
    const [isExpanded, setIsExpanded] = useState(true);
    const {
      insights,
      isAnalyzing,
      overallSentiment,
      isConnectedToTranscription,
    } = useLiveInsights({ isActive, transcripts, callSessionId, callStartedAt, onAnalysis });

    if (!isActive) return null;
    const latestInsight = insights[insights.length - 1];

    return (
      <Card
        ref={ref}
        className={cn(
          'shadow-xl transition-all duration-300',
          inline ? 'w-full' : 'fixed bottom-4 right-4 z-50',
          !inline && (isExpanded ? 'w-[420px]' : 'w-[320px]'),
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
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{contactName}</p>
              <p className="text-xs text-muted-foreground">
                {transcripts.length} mensagens • {insights.length} análises
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Sentimento Geral</p>
              <div className="flex items-center gap-1.5">
                {overallSentiment >= 70 ? (
                  <Smile className="h-4 w-4 text-success" />
                ) : overallSentiment <= 30 ? (
                  <Frown className="h-4 w-4 text-destructive" />
                ) : (
                  <Meh className="h-4 w-4 text-warning" />
                )}
                <span
                  className={cn(
                    'font-bold text-lg',
                    overallSentiment >= 70
                      ? 'text-success'
                      : overallSentiment <= 30
                        ? 'text-destructive'
                        : 'text-warning',
                  )}
                >
                  {overallSentiment}%
                </span>
              </div>
            </div>
          </div>

          <Progress value={overallSentiment} className="h-2" />

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

          {latestInsight && <RiskAlert insight={latestInsight} />}
          {latestInsight && <LatestInsightPanel insight={latestInsight} />}

          {isExpanded && <TranscriptPreview transcripts={transcripts} />}

          {isAnalyzing && (
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <div className="h-2 w-2 animate-bounce rounded-full bg-primary" />
              <span>Analisando transcrição...</span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  },
);
