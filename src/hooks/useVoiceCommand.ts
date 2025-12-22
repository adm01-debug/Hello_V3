import { useState, useRef, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

interface VoiceCommand {
  action: 'call' | 'transfer' | 'hold' | 'hangup' | 'mute' | 'unmute' | 'unknown';
  target?: string;
  confidence: number;
}

interface UseVoiceCommandReturn {
  isRecording: boolean;
  isProcessing: boolean;
  transcript: string | null;
  command: VoiceCommand | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  error: string | null;
}

export function useVoiceCommand(onCommand?: (command: VoiceCommand) => void): UseVoiceCommandReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [command, setCommand] = useState<VoiceCommand | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setTranscript(null);
      setCommand(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(100); // Collect data every 100ms
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);

      console.log('Recording started');
    } catch (err) {
      console.error('Failed to start recording:', err);
      setError('Não foi possível acessar o microfone');
      toast({
        variant: 'destructive',
        title: 'Erro de Microfone',
        description: 'Não foi possível acessar o microfone. Verifique as permissões.',
      });
    }
  }, []);

  const stopRecording = useCallback(async () => {
    if (!mediaRecorderRef.current || !isRecording) return;

    return new Promise<void>((resolve) => {
      const mediaRecorder = mediaRecorderRef.current!;

      mediaRecorder.onstop = async () => {
        console.log('Recording stopped, processing...');
        setIsRecording(false);
        setIsProcessing(true);

        // Stop all tracks
        mediaRecorder.stream.getTracks().forEach(track => track.stop());

        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        console.log('Audio blob size:', audioBlob.size);

        try {
          // Step 1: Transcribe audio
          const formData = new FormData();
          formData.append('audio', audioBlob, 'recording.webm');

          const transcribeResponse = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/voice-transcribe`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
              },
              body: formData,
            }
          );

          if (!transcribeResponse.ok) {
            throw new Error('Falha na transcrição');
          }

          const { text } = await transcribeResponse.json();
          console.log('Transcription:', text);
          setTranscript(text);

          if (!text || text.trim() === '') {
            toast({
              variant: 'destructive',
              title: 'Nenhum áudio detectado',
              description: 'Não foi possível captar sua fala. Tente novamente.',
            });
            setIsProcessing(false);
            resolve();
            return;
          }

          // Step 2: Parse command
          const commandResponse = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/voice-command`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
              },
              body: JSON.stringify({ transcript: text }),
            }
          );

          if (!commandResponse.ok) {
            const errorData = await commandResponse.json();
            throw new Error(errorData.error || 'Falha ao processar comando');
          }

          const parsedCommand: VoiceCommand = await commandResponse.json();
          console.log('Parsed command:', parsedCommand);
          setCommand(parsedCommand);

          if (parsedCommand.action === 'unknown') {
            toast({
              variant: 'destructive',
              title: 'Comando não reconhecido',
              description: `"${text}" não é um comando válido.`,
            });
          } else {
            onCommand?.(parsedCommand);
          }
        } catch (err) {
          console.error('Processing error:', err);
          const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
          setError(errorMessage);
          toast({
            variant: 'destructive',
            title: 'Erro ao processar',
            description: errorMessage,
          });
        } finally {
          setIsProcessing(false);
          resolve();
        }
      };

      mediaRecorder.stop();
    });
  }, [isRecording, onCommand]);

  return {
    isRecording,
    isProcessing,
    transcript,
    command,
    startRecording,
    stopRecording,
    error,
  };
}
