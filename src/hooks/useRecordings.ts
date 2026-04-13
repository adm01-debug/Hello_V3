import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useAuditLog } from '@/hooks/useAuditLog';
import { logger } from '@/lib/logger';

export interface Recording {
  id: string; file_path: string; conference_id: string | null;
  call_session_id: string | null; duration_seconds: number | null;
  file_size_bytes: number | null; participant_count: number | null;
  recorded_at: string; created_at: string;
}

export interface TranscriptionSegment {
  speaker: string; text: string; start_time: number | null; end_time: number | null;
}

export interface SentimentAnalysis {
  overall_sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  sentiment_score: number;
  emotions: { joy: number; sadness: number; anger: number; fear: number; surprise: number };
  key_moments: { text: string; sentiment: string; emotion: string }[];
  summary: string;
  customer_satisfaction_estimate: number;
}

export function useRecordings() {
  const { logCallRecordingDownload, logCallTranscriptionAccess } = useAuditLog();
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [transcribing, setTranscribing] = useState<string | null>(null);
  const [analyzingSentiment, setAnalyzingSentiment] = useState(false);
  const [transcriptionDialog, setTranscriptionDialog] = useState(false);
  const [currentTranscription, setCurrentTranscription] = useState<{
    text: string; segments: TranscriptionSegment[]; recording: Recording | null; sentiment?: SentimentAnalysis | null;
  } | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => { fetchRecordings(); }, []);
  useEffect(() => { if (audioRef.current) audioRef.current.volume = isMuted ? 0 : volume; }, [volume, isMuted]);

  const fetchRecordings = async () => {
    try {
      const { data, error } = await supabase.from('call_recordings').select('*').order('recorded_at', { ascending: false });
      if (error) throw error;
      setRecordings(data || []);
    } catch (error) { logger.error('Error fetching recordings:', error); toast.error('Erro ao carregar gravações'); }
    finally { setLoading(false); }
  };

  const getSignedUrl = async (filePath: string): Promise<string | null> => {
    const { data, error } = await supabase.storage.from('call-recordings').createSignedUrl(filePath, 3600);
    if (error) { logger.error('Error getting signed URL:', error); return null; }
    return data.signedUrl;
  };

  const handlePlay = async (recording: Recording) => {
    if (playingId === recording.id) {
      if (isPlaying) { audioRef.current?.pause(); setIsPlaying(false); } else { audioRef.current?.play(); setIsPlaying(true); }
      return;
    }
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    const url = await getSignedUrl(recording.file_path);
    if (!url) { toast.error('Erro ao carregar áudio'); return; }
    setPlayingId(recording.id); setCurrentTime(0);
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.volume = isMuted ? 0 : volume;
    audio.onloadedmetadata = () => setDuration(audio.duration);
    audio.ontimeupdate = () => setCurrentTime(audio.currentTime);
    audio.onended = () => { setIsPlaying(false); setCurrentTime(0); };
    audio.play(); setIsPlaying(true);
  };

  const handleSeek = (value: number[]) => { if (audioRef.current) { audioRef.current.currentTime = value[0]; setCurrentTime(value[0]); } };
  const handleSkip = (seconds: number) => { if (audioRef.current) audioRef.current.currentTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + seconds)); };

  const handleDownload = async (recording: Recording) => {
    logCallRecordingDownload(recording.id, recording.file_path);
    const url = await getSignedUrl(recording.file_path);
    if (!url) { toast.error('Erro ao baixar gravação'); return; }
    const link = document.createElement('a'); link.href = url;
    link.download = `gravacao-${format(new Date(recording.recorded_at), 'yyyy-MM-dd-HH-mm')}.webm`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    toast.success('Download iniciado');
  };

  const handleDelete = async (recording: Recording) => {
    if (!confirm('Tem certeza que deseja excluir esta gravação?')) return;
    try {
      const { error: storageError } = await supabase.storage.from('call-recordings').remove([recording.file_path]);
      if (storageError) throw storageError;
      const { error: dbError } = await supabase.from('call_recordings').delete().eq('id', recording.id);
      if (dbError) throw dbError;
      setRecordings(prev => prev.filter(r => r.id !== recording.id));
      if (playingId === recording.id) { audioRef.current?.pause(); setPlayingId(null); setIsPlaying(false); }
      toast.success('Gravação excluída');
    } catch (error) { logger.error('Error deleting recording:', error); toast.error('Erro ao excluir gravação'); }
  };

  const handleTranscribe = async (recording: Recording) => {
    setTranscribing(recording.id);
    logCallTranscriptionAccess(recording.call_session_id || recording.id);
    try {
      toast.info('Iniciando transcrição...', { duration: 3000 });
      const { data, error } = await supabase.functions.invoke('transcribe-recording', { body: { recordingId: recording.id, filePath: recording.file_path } });
      if (error) throw error;
      if (data.success) {
        const segments: TranscriptionSegment[] = [];
        if (data.words?.length > 0) {
          let currentSpeaker = '', currentText = '', startTime = 0;
          for (const word of data.words) {
            const speaker = word.speaker || 'Speaker';
            if (speaker !== currentSpeaker && currentText) { segments.push({ speaker: currentSpeaker, text: currentText.trim(), start_time: startTime, end_time: word.start }); currentText = ''; startTime = word.start; }
            currentSpeaker = speaker; currentText += word.text + ' ';
          }
          if (currentText) segments.push({ speaker: currentSpeaker, text: currentText.trim(), start_time: startTime, end_time: data.words[data.words.length - 1]?.end || 0 });
        }
        setCurrentTranscription({ text: data.text, segments, recording }); setTranscriptionDialog(true);
        toast.success('Transcrição concluída!');
      } else throw new Error(data.error || 'Erro desconhecido');
    } catch (error) { logger.error('Transcription error:', error); toast.error('Erro ao transcrever gravação'); }
    finally { setTranscribing(null); }
  };

  const handleAnalyzeSentiment = async () => {
    if (!currentTranscription?.text) return;
    setAnalyzingSentiment(true);
    try {
      toast.info('Analisando sentimento...', { duration: 3000 });
      const { data, error } = await supabase.functions.invoke('analyze-sentiment', { body: { transcription: currentTranscription.text, callSessionId: currentTranscription.recording?.call_session_id } });
      if (error) throw error;
      if (data.success) {
        setCurrentTranscription(prev => prev ? { ...prev, sentiment: { overall_sentiment: data.overall_sentiment, sentiment_score: data.sentiment_score, emotions: data.emotions, key_moments: data.key_moments, summary: data.summary, customer_satisfaction_estimate: data.customer_satisfaction_estimate } } : null);
        toast.success('Análise de sentimento concluída!');
      } else throw new Error(data.error || 'Erro desconhecido');
    } catch (error) { logger.error('Sentiment analysis error:', error); toast.error('Erro ao analisar sentimento'); }
    finally { setAnalyzingSentiment(false); }
  };

  const filteredRecordings = recordings.filter(r => {
    const s = searchTerm.toLowerCase();
    return r.conference_id?.toLowerCase().includes(s) || r.call_session_id?.toLowerCase().includes(s) || format(new Date(r.recorded_at), 'dd/MM/yyyy HH:mm').includes(s);
  });

  const currentRecording = recordings.find(r => r.id === playingId);

  return {
    recordings: filteredRecordings, allRecordingsCount: recordings.length, loading, searchTerm, setSearchTerm,
    playingId, isPlaying, currentTime, duration, volume, setVolume, isMuted, setIsMuted, transcribing,
    analyzingSentiment, transcriptionDialog, setTranscriptionDialog, currentTranscription, currentRecording,
    handlePlay, handleSeek, handleSkip, handleDownload, handleDelete, handleTranscribe, handleAnalyzeSentiment,
  };
}
