import { useState, useCallback, useRef, useEffect } from 'react';
import { logger } from '@/lib/logger';
import type { TranscriptEntry, TranscriptSegment, SpeakerStats } from './types';

const speakerRoles: Record<string, 'agent' | 'customer'> = {};
let speakerOrder = 0;

function getSpeakerRole(speakerId: string): 'agent' | 'customer' {
  if (!speakerRoles[speakerId]) {
    speakerRoles[speakerId] = speakerOrder === 0 ? 'agent' : 'customer';
    speakerOrder++;
  }
  return speakerRoles[speakerId];
}

function resetSpeakerMapping() {
  Object.keys(speakerRoles).forEach((k) => delete speakerRoles[k]);
  speakerOrder = 0;
}

function pickMimeType(): string {
  return MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
    ? 'audio/webm;codecs=opus'
    : MediaRecorder.isTypeSupported('audio/webm')
      ? 'audio/webm'
      : 'audio/mp4';
}

interface Options {
  onTranscript?: (t: TranscriptEntry) => void;
  onNewText?: (text: string) => void;
}

export function useLiveTranscription({ onTranscript, onNewText }: Options) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [speakerStats, setSpeakerStats] = useState<SpeakerStats>({ agent: 0, customer: 0 });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const processAudioChunk = useCallback(async (audioBlob: Blob) => {
    if (audioBlob.size < 1000) return;
    setIsProcessing(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/voice-transcribe`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
          body: formData,
        },
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Transcription failed');
      }
      const data = await response.json();
      if (data.segments && data.segments.length > 0) {
        const newEntries: TranscriptEntry[] = data.segments.map((s: TranscriptSegment) => ({
          id: crypto.randomUUID(),
          text: s.text,
          speaker: getSpeakerRole(s.speaker),
          speakerLabel: s.speaker,
          timestamp: new Date(),
        }));
        setTranscripts((prev) => [...prev, ...newEntries]);
        setSpeakerStats((prev) => {
          const next = { ...prev };
          newEntries.forEach((e) => { next[e.speaker]++; });
          return next;
        });
        newEntries.forEach((e) => { onTranscript?.(e); onNewText?.(e.text); });
      } else if (data.text && data.text.trim()) {
        const entry: TranscriptEntry = {
          id: crypto.randomUUID(),
          text: data.text.trim(),
          speaker: 'agent',
          speakerLabel: 'speaker_0',
          timestamp: new Date(),
        };
        setTranscripts((prev) => [...prev, entry]);
        onTranscript?.(entry);
        onNewText?.(entry.text);
      }
    } catch (err) {
      logger.error('Processing error:', err);
      setError(err instanceof Error ? err.message : 'Erro ao processar áudio');
    } finally {
      setIsProcessing(false);
    }
  }, [onTranscript, onNewText]);

  const attachRecorder = useCallback((stream: MediaStream, mimeType: string) => {
    const recorder = new MediaRecorder(stream, { mimeType });
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    recorder.onstop = () => {
      if (chunksRef.current.length > 0) {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        chunksRef.current = [];
        processAudioChunk(blob);
      }
    };
    return recorder;
  }, [processAudioChunk]);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      resetSpeakerMapping();
      setSpeakerStats({ agent: 0, customer: 0 });
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { sampleRate: 16000, channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      streamRef.current = stream;
      chunksRef.current = [];
      const mimeType = pickMimeType();
      const recorder = attachRecorder(stream, mimeType);
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);

      intervalRef.current = setInterval(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          mediaRecorderRef.current.stop();
          setTimeout(() => {
            if (streamRef.current) {
              const newMime = pickMimeType();
              const newRec = attachRecorder(streamRef.current, newMime);
              mediaRecorderRef.current = newRec;
              newRec.start();
            }
          }, 200);
        }
      }, 8000);
    } catch (err) {
      logger.error('Recording error:', err);
      setError('Erro ao acessar microfone. Verifique as permissões.');
    }
  }, [attachRecorder]);

  const stopRecording = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
    setIsRecording(false);
  }, []);

  useEffect(() => () => stopRecording(), [stopRecording]);

  return { isRecording, isProcessing, transcripts, error, speakerStats, startRecording, stopRecording };
}
