import { useState, useCallback, useRef, useEffect } from 'react';
import { Mic, MicOff, FileText, Loader2, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface TranscriptEntry {
  id: string;
  text: string;
  speaker: 'agent' | 'customer';
  timestamp: Date;
}

interface LiveTranscriptionProps {
  isActive: boolean;
  onTranscript?: (transcript: TranscriptEntry) => void;
}

export function LiveTranscription({ isActive, onTranscript }: LiveTranscriptionProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  
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
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'audio.webm');

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
        throw new Error('Transcription failed');
      }

      const data = await response.json();
      
      if (data.text && data.text.trim()) {
        const newEntry: TranscriptEntry = {
          id: crypto.randomUUID(),
          text: data.text.trim(),
          speaker: 'agent', // In a real scenario, you'd detect the speaker
          timestamp: new Date(),
        };
        
        setTranscripts(prev => [...prev, newEntry]);
        onTranscript?.(newEntry);
      }
    } catch (err) {
      console.error('Processing error:', err);
      setError('Erro ao processar áudio');
    } finally {
      setIsProcessing(false);
    }
  }, [onTranscript]);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
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

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });
      
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Process audio every 5 seconds
      intervalRef.current = setInterval(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
          
          setTimeout(() => {
            if (chunksRef.current.length > 0) {
              const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
              chunksRef.current = [];
              processAudioChunk(audioBlob);
            }
            
            if (streamRef.current && isRecording) {
              const newRecorder = new MediaRecorder(streamRef.current, {
                mimeType: 'audio/webm;codecs=opus',
              });
              
              newRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                  chunksRef.current.push(event.data);
                }
              };
              
              mediaRecorderRef.current = newRecorder;
              newRecorder.start();
            }
          }, 100);
        }
      }, 5000);

    } catch (err) {
      console.error('Recording error:', err);
      setError('Erro ao acessar microfone');
    }
  }, [isRecording, processAudioChunk]);

  const stopRecording = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      
      setTimeout(() => {
        if (chunksRef.current.length > 0) {
          const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
          chunksRef.current = [];
          processAudioChunk(audioBlob);
        }
      }, 100);
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    mediaRecorderRef.current = null;
    setIsRecording(false);
  }, [processAudioChunk]);

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
        <div className="flex items-center gap-2">
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
      <ScrollArea className="h-[150px]" ref={scrollRef as any}>
        <div className="p-4 space-y-3">
          {transcripts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <Volume2 className="h-8 w-8 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">
                {isRecording 
                  ? 'Aguardando fala...' 
                  : 'Clique em Iniciar para começar a transcrição'}
              </p>
            </div>
          ) : (
            transcripts.map((entry) => (
              <div
                key={entry.id}
                className={cn(
                  'flex gap-3 animate-fade-in',
                  entry.speaker === 'agent' ? 'flex-row-reverse' : ''
                )}
              >
                <div
                  className={cn(
                    'max-w-[80%] rounded-lg px-3 py-2',
                    entry.speaker === 'agent'
                      ? 'bg-primary/10 text-primary'
                      : 'bg-muted'
                  )}
                >
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
