import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Play,
  Pause,
  Download,
  Search,
  Disc,
  Volume2,
  VolumeX,
  SkipBack,
  SkipForward,
  Loader2,
  Calendar,
  Clock,
  Users,
  Trash2,
  FileText,
  Sparkles,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface Recording {
  id: string;
  file_path: string;
  conference_id: string | null;
  call_session_id: string | null;
  duration_seconds: number | null;
  file_size_bytes: number | null;
  participant_count: number | null;
  recorded_at: string;
  created_at: string;
}

interface TranscriptionSegment {
  speaker: string;
  text: string;
  start_time: number | null;
  end_time: number | null;
}

export default function Recordings() {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [transcribing, setTranscribing] = useState<string | null>(null);
  const [transcriptionDialog, setTranscriptionDialog] = useState(false);
  const [currentTranscription, setCurrentTranscription] = useState<{
    text: string;
    segments: TranscriptionSegment[];
    recording: Recording | null;
  } | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetchRecordings();
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const fetchRecordings = async () => {
    try {
      const { data, error } = await supabase
        .from('call_recordings')
        .select('*')
        .order('recorded_at', { ascending: false });

      if (error) throw error;
      setRecordings(data || []);
    } catch (error) {
      console.error('Error fetching recordings:', error);
      toast.error('Erro ao carregar gravações');
    } finally {
      setLoading(false);
    }
  };

  const getSignedUrl = async (filePath: string): Promise<string | null> => {
    const { data, error } = await supabase.storage
      .from('call-recordings')
      .createSignedUrl(filePath, 3600);

    if (error) {
      console.error('Error getting signed URL:', error);
      return null;
    }
    return data.signedUrl;
  };

  const handlePlay = async (recording: Recording) => {
    if (playingId === recording.id) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        audioRef.current?.play();
        setIsPlaying(true);
      }
      return;
    }

    // Stop current audio if playing
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    const url = await getSignedUrl(recording.file_path);
    if (!url) {
      toast.error('Erro ao carregar áudio');
      return;
    }

    setAudioUrl(url);
    setPlayingId(recording.id);
    setCurrentTime(0);

    const audio = new Audio(url);
    audioRef.current = audio;
    audio.volume = isMuted ? 0 : volume;

    audio.onloadedmetadata = () => {
      setDuration(audio.duration);
    };

    audio.ontimeupdate = () => {
      setCurrentTime(audio.currentTime);
    };

    audio.onended = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.play();
    setIsPlaying(true);
  };

  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const handleSkip = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + seconds));
    }
  };

  const handleDownload = async (recording: Recording) => {
    const url = await getSignedUrl(recording.file_path);
    if (!url) {
      toast.error('Erro ao baixar gravação');
      return;
    }

    const link = document.createElement('a');
    link.href = url;
    link.download = `gravacao-${format(new Date(recording.recorded_at), 'yyyy-MM-dd-HH-mm')}.webm`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Download iniciado');
  };

  const handleDelete = async (recording: Recording) => {
    if (!confirm('Tem certeza que deseja excluir esta gravação?')) return;

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('call-recordings')
        .remove([recording.file_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('call_recordings')
        .delete()
        .eq('id', recording.id);

      if (dbError) throw dbError;

      setRecordings(prev => prev.filter(r => r.id !== recording.id));
      
      if (playingId === recording.id) {
        audioRef.current?.pause();
        setPlayingId(null);
        setIsPlaying(false);
      }

      toast.success('Gravação excluída');
    } catch (error) {
      console.error('Error deleting recording:', error);
      toast.error('Erro ao excluir gravação');
    }
  };

  const handleTranscribe = async (recording: Recording) => {
    setTranscribing(recording.id);
    
    try {
      toast.info('Iniciando transcrição...', { duration: 3000 });
      
      const { data, error } = await supabase.functions.invoke('transcribe-recording', {
        body: {
          recordingId: recording.id,
          filePath: recording.file_path,
        },
      });

      if (error) throw error;

      if (data.success) {
        // Parse segments from words if available
        const segments: TranscriptionSegment[] = [];
        if (data.words && data.words.length > 0) {
          let currentSpeaker = '';
          let currentText = '';
          let startTime = 0;
          
          for (const word of data.words) {
            const speaker = word.speaker || 'Speaker';
            if (speaker !== currentSpeaker && currentText) {
              segments.push({
                speaker: currentSpeaker,
                text: currentText.trim(),
                start_time: startTime,
                end_time: word.start,
              });
              currentText = '';
              startTime = word.start;
            }
            currentSpeaker = speaker;
            currentText += word.text + ' ';
          }
          
          if (currentText) {
            segments.push({
              speaker: currentSpeaker,
              text: currentText.trim(),
              start_time: startTime,
              end_time: data.words[data.words.length - 1]?.end || 0,
            });
          }
        }

        setCurrentTranscription({
          text: data.text,
          segments,
          recording,
        });
        setTranscriptionDialog(true);
        toast.success('Transcrição concluída!');
      } else {
        throw new Error(data.error || 'Erro desconhecido');
      }
    } catch (error) {
      console.error('Transcription error:', error);
      toast.error('Erro ao transcrever gravação');
    } finally {
      setTranscribing(null);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const filteredRecordings = recordings.filter(recording => {
    const searchLower = searchTerm.toLowerCase();
    return (
      recording.conference_id?.toLowerCase().includes(searchLower) ||
      recording.call_session_id?.toLowerCase().includes(searchLower) ||
      format(new Date(recording.recorded_at), 'dd/MM/yyyy HH:mm').includes(searchLower)
    );
  });

  const currentRecording = recordings.find(r => r.id === playingId);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gravações</h1>
          <p className="text-muted-foreground">Gerencie e reproduza gravações de chamadas</p>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          <Disc className="h-4 w-4 mr-2" />
          {recordings.length} gravações
        </Badge>
      </div>

      {/* Player */}
      {playingId && currentRecording && (
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleSkip(-10)}
                >
                  <SkipBack className="h-4 w-4" />
                </Button>
                <Button
                  variant="default"
                  size="icon"
                  className="h-12 w-12"
                  onClick={() => handlePlay(currentRecording)}
                >
                  {isPlaying ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <Play className="h-5 w-5" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleSkip(10)}
                >
                  <SkipForward className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{formatDuration(currentTime)}</span>
                  <span className="text-foreground font-medium">
                    {format(new Date(currentRecording.recorded_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </span>
                  <span>{formatDuration(duration)}</span>
                </div>
                <Slider
                  value={[currentTime]}
                  max={duration || 100}
                  step={0.1}
                  onValueChange={handleSeek}
                  className="cursor-pointer"
                />
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMuted(!isMuted)}
                >
                  {isMuted ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </Button>
                <Slider
                  value={[isMuted ? 0 : volume]}
                  max={1}
                  step={0.1}
                  onValueChange={(v) => setVolume(v[0])}
                  className="w-24"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por data, conferência ou sessão..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Recordings Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Lista de Gravações</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredRecordings.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Disc className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma gravação encontrada</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Duração</TableHead>
                  <TableHead>Participantes</TableHead>
                  <TableHead>Tamanho</TableHead>
                  <TableHead>Conferência</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecordings.map((recording) => (
                  <TableRow 
                    key={recording.id}
                    className={playingId === recording.id ? 'bg-muted/50' : ''}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {format(new Date(recording.recorded_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {recording.duration_seconds 
                            ? formatDuration(recording.duration_seconds)
                            : '-'
                          }
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{recording.participant_count || 1}</span>
                      </div>
                    </TableCell>
                    <TableCell>{formatFileSize(recording.file_size_bytes)}</TableCell>
                    <TableCell>
                      {recording.conference_id ? (
                        <Badge variant="outline" className="font-mono text-xs">
                          {recording.conference_id.slice(0, 8)}...
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handlePlay(recording)}
                          className={playingId === recording.id && isPlaying ? 'text-primary' : ''}
                        >
                          {playingId === recording.id && isPlaying ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleTranscribe(recording)}
                          disabled={transcribing === recording.id}
                          title="Transcrever gravação"
                        >
                          {transcribing === recording.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <FileText className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownload(recording)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(recording)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Transcription Dialog */}
      <Dialog open={transcriptionDialog} onOpenChange={setTranscriptionDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Transcrição da Gravação
            </DialogTitle>
          </DialogHeader>
          
          {currentTranscription && (
            <div className="space-y-4">
              {currentTranscription.recording && (
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(currentTranscription.recording.recorded_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </div>
                  {currentTranscription.recording.duration_seconds && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {formatDuration(currentTranscription.recording.duration_seconds)}
                    </div>
                  )}
                </div>
              )}

              <ScrollArea className="h-[400px] rounded-md border p-4">
                {currentTranscription.segments.length > 0 ? (
                  <div className="space-y-4">
                    {currentTranscription.segments.map((segment, index) => (
                      <div key={index} className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {segment.speaker}
                          </Badge>
                          {segment.start_time !== null && (
                            <span className="text-xs text-muted-foreground">
                              {formatDuration(segment.start_time)}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-foreground pl-2 border-l-2 border-primary/30">
                          {segment.text}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-foreground whitespace-pre-wrap">
                    {currentTranscription.text}
                  </p>
                )}
              </ScrollArea>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(currentTranscription.text);
                    toast.success('Transcrição copiada!');
                  }}
                >
                  Copiar Texto
                </Button>
                <Button onClick={() => setTranscriptionDialog(false)}>
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
