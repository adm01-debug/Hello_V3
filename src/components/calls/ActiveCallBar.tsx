import { useState, useEffect, useCallback } from 'react';
import { 
  Phone, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Pause, 
  Play,
  PhoneForwarded,
  Volume2,
  MoreHorizontal,
  Bot,
  FileText,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LiveCallAnalysis } from '@/components/ai/LiveCallAnalysis';
import { LiveTranscription } from '@/components/calls/LiveTranscription';
import { NextBestActionPanel } from '@/components/calls/NextBestActionPanel';
import { CrmSuggestionsCard } from '@/components/calls/CrmSuggestionsCard';
import { useCallSession } from '@/hooks/useCallSession';
import { useLiveAssist } from '@/hooks/useLiveAssist';
import { useContacts } from '@/hooks/useContacts';
import { buildRecentContext } from '@/lib/agent-assist-utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

interface ActiveCall {
  id: string;
  contactName: string;
  contactPhone: string;
  type: 'incoming' | 'outgoing';
  status: 'ringing' | 'connected' | 'hold' | 'transferring';
  startTime: Date;
  duration: number;
  muted: boolean;
}

interface TranscriptEntry {
  id: string;
  text: string;
  speaker: 'agent' | 'customer';
  speakerLabel: string;
  timestamp: Date;
  startTime?: number;
  endTime?: number;
}

interface AnalysisEntry {
  sentiment: string;
  urgency: string;
  emotion: string;
  suggestion: string;
  riskAlert: boolean;
  riskReason: string;
  messageAnalyzed: string;
  speakerRole: string;
}

export function ActiveCallBar() {
  const [call, setCall] = useState<ActiveCall | null>(null);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [onHold, setOnHold] = useState(false);
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);
  const [showTranscription, setShowTranscription] = useState(false);
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
  const [isEnding, setIsEnding] = useState(false);
  const [endedSessionId, setEndedSessionId] = useState<string | null>(null);
  const [endedContactId, setEndedContactId] = useState<string | null>(null);
  
  const { currentSession, isSaving, startSession, endSession, addTranscript, addAnalysis } = useCallSession();
  const { findOrCreateContact, addContactInteraction } = useContacts();
  const { analyze: analyzeLive } = useLiveAssist(currentSession?.id);

  // Start session when call connects
  useEffect(() => {
    if (call && call.status === 'connected' && !currentSession) {
      startSession(call.contactName, call.contactPhone, 'Agente Demo');
    }
  }, [call, currentSession, startSession]);

  useEffect(() => {
    if (!call || call.status !== 'connected') return;
    
    const interval = setInterval(() => {
      setDuration(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [call]);

  const handleTranscript = useCallback((entry: TranscriptEntry) => {
    setTranscripts(prev => {
      const next = [...prev, entry];
      if (currentSession?.id) {
        void analyzeLive({
          latestUtterance: entry.text,
          recentContext: buildRecentContext(next.map((t) => ({ speaker: t.speaker, text: t.text })), 8),
          speaker: entry.speaker,
          agentName: currentSession.agentName,
          timestampSeconds: Math.floor((entry.timestamp.getTime() - currentSession.startedAt.getTime()) / 1000),
        });
      }
      return next;
    });
    addTranscript(entry);
  }, [addTranscript, analyzeLive, currentSession]);

  const handleAnalysis = useCallback((analysis: AnalysisEntry) => {
    addAnalysis(analysis);
  }, [addAnalysis]);

  if (!call) {
    if (endedSessionId) {
      return (
        <div className="border-b border-border bg-card px-6 py-3">
          <CrmSuggestionsCard callSessionId={endedSessionId} contactId={endedContactId} />
        </div>
      );
    }
    return null;
  }

  const handleHangup = async () => {
    if (currentSession) {
      setIsEnding(true);
      const sessionIdSnapshot = currentSession.id;
      
      try {
        // Generate AI summary if we have transcripts
        let summary;
        if (transcripts.length > 0) {
          toast.info('Gerando resumo da chamada...');
          
          const { data, error } = await supabase.functions.invoke('generate-summary', {
            body: {
              callInfo: {
                callerName: call?.contactName || 'Cliente',
                duration,
                transcripts: transcripts.map(t => ({
                  speaker: t.speaker === 'agent' ? 'Agente' : 'Cliente',
                  text: t.text
                }))
              }
            }
          });

          if (error) {
            logger.error('Error generating summary:', error);
            toast.error('Erro ao gerar resumo, salvando sem resumo');
          } else if (data && !data.error) {
            summary = {
              summary: data.summary,
              mainTopics: data.mainTopics,
              overallSentiment: data.overallSentiment,
              customerSatisfaction: data.customerSatisfaction,
              agentPerformance: data.agentPerformance,
              nextSteps: data.nextSteps
            };
          }
        }
        
        await endSession(duration, summary);

        // Save interaction to contact + dispara extração CRM em background
        let contactIdSnapshot: string | null = null;
        if (call?.contactPhone) {
          const contact = await findOrCreateContact(call.contactPhone, call.contactName);
          if (contact) {
            contactIdSnapshot = contact.id;
            await addContactInteraction(contact.id, {
              interaction_type: 'call',
              direction: call.type === 'incoming' ? 'inbound' : 'outbound',
              summary: summary?.summary,
              transcript: transcripts.map(t => `${t.speakerLabel}: ${t.text}`).join('\n'),
              sentiment: summary?.overallSentiment,
              topics: summary?.mainTopics,
              duration_seconds: duration,
              agent_name: 'Agente Demo',
              call_session_id: sessionIdSnapshot
            });
          }
        }

        // Auto-trigger extração de campos CRM (≥60s + transcrição)
        if (duration >= 60 && transcripts.length > 0) {
          const fullTranscript = transcripts.map((t) => `[${t.speaker}] ${t.text}`).join('\n');
          void supabase.functions.invoke('extract-crm-fields', {
            body: {
              callSessionId: sessionIdSnapshot,
              transcript: fullTranscript,
              contactId: contactIdSnapshot,
            },
          }).catch((e) => logger.error('extract-crm-fields failed', e));
        }

        // Mantém referências para mostrar CrmSuggestionsCard pós-call
        setEndedSessionId(sessionIdSnapshot);
        setEndedContactId(contactIdSnapshot);

        toast.success('Chamada salva com resumo no histórico');
      } catch (error) {
        logger.error('Error ending call:', error);
        await endSession(duration);
        toast.success('Chamada salva no histórico');
      } finally {
        setIsEnding(false);
      }
    }
    setCall(null);
    setShowAIAnalysis(false);
    setShowTranscription(false);
    setTranscripts([]);
    setDuration(0);
  };

  return (
    <>
      <div className={cn(
        'relative border-b border-border bg-card px-6 py-3 animate-fade-in',
        call.status === 'connected' && 'bg-success/5 border-success/20',
        onHold && 'bg-warning/5 border-warning/20'
      )}>
        {/* Pulse indicator */}
        <div className={cn(
          'absolute left-0 top-0 h-full w-1',
          call.status === 'connected' && !onHold && 'bg-success',
          onHold && 'bg-warning animate-pulse',
          call.status === 'ringing' && 'bg-primary animate-pulse'
        )} />

        <div className="flex items-center justify-between">
          {/* Call Info */}
          <div className="flex items-center gap-4">
            <div className={cn(
              'flex h-10 w-10 items-center justify-center rounded-full',
              call.status === 'connected' && !onHold && 'bg-success/20 text-success',
              onHold && 'bg-warning/20 text-warning',
              call.status === 'ringing' && 'bg-primary/20 text-primary animate-ring'
            )}>
              <Phone className="h-5 w-5" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">
                  {call.contactName}
                </span>
                <span className={cn(
                  'rounded-full px-2 py-0.5 text-xs font-medium',
                  call.type === 'incoming' ? 'bg-primary/10 text-primary' : 'bg-secondary text-secondary-foreground'
                )}>
                  {call.type === 'incoming' ? 'Entrada' : 'Saída'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{call.contactPhone}</span>
                <span>•</span>
                <span className="font-mono">{formatDuration(duration)}</span>
                {onHold && (
                  <>
                    <span>•</span>
                    <span className="text-warning">Em espera</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Call Controls */}
          <div className="flex items-center gap-2">
            {/* Transcription Toggle */}
            <Button
              variant={showTranscription ? 'default' : 'outline'}
              size="sm"
              className={cn(
                'gap-2',
                showTranscription && 'bg-primary text-primary-foreground'
              )}
              onClick={() => setShowTranscription(!showTranscription)}
            >
              <FileText className="h-4 w-4" />
              Transcrição
            </Button>

            {/* AI Analysis Toggle */}
            <Button
              variant={showAIAnalysis ? 'default' : 'outline'}
              size="sm"
              className={cn(
                'gap-2',
                showAIAnalysis && 'bg-primary text-primary-foreground'
              )}
              onClick={() => setShowAIAnalysis(!showAIAnalysis)}
            >
              <Bot className="h-4 w-4" />
              IA
            </Button>

            <div className="mx-2 h-6 w-px bg-border" />

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMuted(!muted)}
              className={cn(muted && 'bg-destructive/10 text-destructive hover:bg-destructive/20 hover:text-destructive')}
            >
              {muted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOnHold(!onHold)}
              className={cn(onHold && 'bg-warning/10 text-warning hover:bg-warning/20 hover:text-warning')}
            >
              {onHold ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </Button>

            <Button variant="ghost" size="icon">
              <Volume2 className="h-4 w-4" />
            </Button>

            <Button variant="ghost" size="icon">
              <PhoneForwarded className="h-4 w-4" />
            </Button>

            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>

            <div className="mx-2 h-6 w-px bg-border" />

            <Button
              variant="destructive"
              size="sm"
              onClick={handleHangup}
              disabled={isEnding}
              className="gap-2"
            >
              {isEnding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <PhoneOff className="h-4 w-4" />
              )}
              {isEnding ? 'Gerando resumo...' : 'Encerrar'}
            </Button>
          </div>
        </div>
      </div>

      {/* Live Transcription Panel */}
      <LiveTranscription
        isActive={showTranscription && call.status === 'connected'}
        onTranscript={handleTranscript}
      />

      {/* Live AI Analysis Panel - Now connected to transcripts */}
      <LiveCallAnalysis
        isActive={showAIAnalysis && call.status === 'connected'}
        contactName={call.contactName}
        onClose={() => setShowAIAnalysis(false)}
        transcripts={transcripts}
        onAnalysis={handleAnalysis}
      />
    </>
  );
}
