import { useState, useCallback, useRef, useEffect } from 'react';
import { Mic, MicOff, FileText, Loader2, Volume2, User, Headphones } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface TranscriptSegment {
  speaker: string;
  text: string;
  start: number;
  end: number;
}

interface TranscriptEntry {
  id: string;
  text: string;
  speaker: 'agent' | 'customer';
  speakerLabel: string;
  timestamp: Date;
}

interface LiveTranscriptionProps {
  isActive: boolean;
  onTranscript?: (transcript: TranscriptEntry) => void;
}

// Map speaker IDs to roles based on order (first speaker = agent, second = customer)
const speakerRoles: Record<string, 'agent' | 'customer'> = {};
let speakerOrder = 0;

function getSpeakerRole(speakerId: string): 'agent' | 'customer' {
  if (!speakerRoles[speakerId]) {
    // First speaker is assumed to be the agent, second is customer
    speakerRoles[speakerId] = speakerOrder === 0 ? 'agent' : 'customer';
    speakerOrder++;
  }
  return speakerRoles[speakerId];
}

function resetSpeakerMapping() {
  Object.keys(speakerRoles).forEach(key => delete speakerRoles[key]);
  speakerOrder = 0;
}

export function LiveTranscription({ isActive, onTranscript }: LiveTranscriptionProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [speakerStats, setSpeakerStats] = useState<{ agent: number; customer: number }>({ agent: 0, customer: 0 });
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new transcripts arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcripts]);

  const processAudioChunk = useCallback(async (audioBlob: Blob) => {
    if (audioBlob.size < 1000) return; // Skip very small chunks
    
    setIsProcessing(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/voice-transcribe`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Transcription failed');
      }

      const data = await response.json();
      
      // Process segments with speaker identification
      if (data.segments && data.segments.length > 0) {
        const newEntries: TranscriptEntry[] = data.segments.map((segment: TranscriptSegment) => {
          const role = getSpeakerRole(segment.speaker);
          return {
            id: crypto.randomUUID(),
            text: segment.text,
            speaker: role,
            speakerLabel: segment.speaker,
            timestamp: new Date(),
          };
        });
        
        setTranscripts(prev => [...prev, ...newEntries]);
        
        // Update speaker stats
        setSpeakerStats(prev => {
          const newStats = { ...prev };
          newEntries.forEach(entry => {
            newStats[entry.speaker]++;
          });
          return newStats;
        });
        
        newEntries.forEach(entry => onTranscript?.(entry));
      } else if (data.text && data.text.trim()) {
        // Fallback if no segments but text exists
        const newEntry: TranscriptEntry = {
          id: crypto.randomUUID(),
          text: data.text.trim(),
          speaker: 'agent',
          speakerLabel: 'speaker_0',
          timestamp: new Date(),
        };
        
        setTranscripts(prev => [...prev, newEntry]);
        onTranscript?.(newEntry);
      }
    } catch (err) {
      console.error('Processing error:', err);
      setError(err instanceof Error ? err.message : 'Erro ao processar áudio');
    } finally {
      setIsProcessing(false);
    }
  }, [onTranscript]);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      resetSpeakerMapping();
      setSpeakerStats({ agent: 0, customer: 0 });
      
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      
      streamRef.current = stream;
      chunksRef.current = [];

      // Check for supported MIME types
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
        ? 'audio/webm;codecs=opus' 
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : 'audio/mp4';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        if (chunksRef.current.length > 0) {
          const audioBlob = new Blob(chunksRef.current, { type: mimeType });
          chunksRef.current = [];
          processAudioChunk(audioBlob);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Process audio every 8 seconds for better speaker identification
      intervalRef.current = setInterval(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
          
          setTimeout(() => {
            if (streamRef.current) {
              const newMimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
                ? 'audio/webm;codecs=opus' 
                : MediaRecorder.isTypeSupported('audio/webm')
                  ? 'audio/webm'
                  : 'audio/mp4';

              const newRecorder = new MediaRecorder(streamRef.current, { mimeType: newMimeType });
              
              newRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                  chunksRef.current.push(event.data);
                }
              };

              newRecorder.onstop = () => {
                if (chunksRef.current.length > 0) {
                  const audioBlob = new Blob(chunksRef.current, { type: newMimeType });
                  chunksRef.current = [];
                  processAudioChunk(audioBlob);
                }
              };
              
              mediaRecorderRef.current = newRecorder;
              newRecorder.start();
            }
          }, 200);
        }
      }, 8000);

    } catch (err) {
      console.error('Recording error:', err);
      setError('Erro ao acessar microfone. Verifique as permissões.');
    }
  }, [processAudioChunk]);

  const stopRecording = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    mediaRecorderRef.current = null;
    setIsRecording(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, [stopRecording]);

  // Auto-start when active
  useEffect(() => {
    if (isActive && !isRecording) {
      startRecording();
    } else if (!isActive && isRecording) {
      stopRecording();
    }
  }, [isActive, isRecording, startRecording, stopRecording]);

  if (!isActive) return null;

  return (
    <div className="border-t border-border bg-card/50 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Transcrição ao Vivo</span>
          {isRecording && (
            <Badge variant="outline" className="gap-1 text-xs">
              <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
              Gravando
            </Badge>
          )}
          {isProcessing && (
            <Badge variant="outline" className="gap-1 text-xs">
              <Loader2 className="h-3 w-3 animate-spin" />
              Processando
            </Badge>
          )}
        </div>
        
        {/* Speaker Stats */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Headphones className="h-3 w-3 text-primary" />
            <span>Agente: {speakerStats.agent}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <User className="h-3 w-3 text-warning" />
            <span>Cliente: {speakerStats.customer}</span>
          </div>
          
          <Button
            variant={isRecording ? 'destructive' : 'default'}
            size="sm"
            onClick={isRecording ? stopRecording : startRecording}
            className="gap-1"
          >
            {isRecording ? (
              <>
                <MicOff className="h-3 w-3" />
                Parar
              </>
            ) : (
              <>
                <Mic className="h-3 w-3" />
                Iniciar
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Transcripts */}
      <ScrollArea className="h-[180px]" ref={scrollRef as any}>
        <div className="p-4 space-y-3">
          {transcripts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <Volume2 className="h-8 w-8 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">
                {isRecording 
                  ? 'Aguardando fala... A identificação de falantes será feita automaticamente.' 
                  : 'Clique em Iniciar para começar a transcrição'}
              </p>
            </div>
          ) : (
            transcripts.map((entry) => (
              <div
                key={entry.id}
                className={cn(
                  'flex gap-3 animate-fade-in',
                  entry.speaker === 'agent' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'max-w-[80%] rounded-lg px-3 py-2',
                    entry.speaker === 'agent'
                      ? 'bg-primary/10 border border-primary/20'
                      : 'bg-warning/10 border border-warning/20'
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {entry.speaker === 'agent' ? (
                      <Headphones className="h-3 w-3 text-primary" />
                    ) : (
                      <User className="h-3 w-3 text-warning" />
                    )}
                    <span className={cn(
                      'text-xs font-medium',
                      entry.speaker === 'agent' ? 'text-primary' : 'text-warning'
                    )}>
                      {entry.speaker === 'agent' ? 'Agente' : 'Cliente'}
                    </span>
                  </div>
                  <p className="text-sm">{entry.text}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {entry.timestamp.toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Error message */}
      {error && (
        <div className="px-4 py-2 text-sm text-destructive bg-destructive/10 border-t border-destructive/20">
          {error}
        </div>
      )}
    </div>
  );
}
