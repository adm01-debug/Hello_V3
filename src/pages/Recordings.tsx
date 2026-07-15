import { Play, Pause, Download, Search, Disc, Volume2, VolumeX, SkipBack, SkipForward, Loader2, Calendar, Clock, Users, Trash2, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
 import { format } from 'date-fns';
 import { ptBR } from 'date-fns/locale';
 import { formatDuration } from '@/lib/utils';
import { useRecordings } from '@/hooks/useRecordings';
import { TranscriptionDialog } from '@/components/recordings/TranscriptionDialog';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useDebouncedSearchParam } from '@/hooks/useDebouncedSearchParam';
import { useEffect } from 'react';

const formatFileSize = (bytes: number | null) => {
  if (!bytes) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function Recordings() {
  usePageTitle('Gravações');

  const {
    recordings, allRecordingsCount, loading, searchTerm, setSearchTerm,
    playingId, isPlaying, currentTime, duration, volume, setVolume, isMuted, setIsMuted,
    transcribing, analyzingSentiment, transcriptionDialog, setTranscriptionDialog, currentTranscription,
    currentRecording, handlePlay, handleSeek, handleSkip, handleDownload, handleDelete, handleTranscribe, handleAnalyzeSentiment,
  } = useRecordings();

  const {
    inputValue: searchInput,
    debouncedValue: debouncedSearch,
    setValue: setSearchInput,
  } = useDebouncedSearchParam({ paramKey: 'q', delay: 300 });

  useEffect(() => {
    if (debouncedSearch !== searchTerm) setSearchTerm(debouncedSearch);
  }, [debouncedSearch, searchTerm, setSearchTerm]);


  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gravações</h1>
          <p className="text-muted-foreground">Gerencie e reproduza gravações de chamadas</p>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2"><Disc className="h-4 w-4 mr-2" />{allRecordingsCount} gravações</Badge>
      </div>

      {playingId && currentRecording && (
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => handleSkip(-10)}><SkipBack className="h-4 w-4" /></Button>
                <Button variant="default" size="icon" className="h-12 w-12" onClick={() => handlePlay(currentRecording)}>
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleSkip(10)}><SkipForward className="h-4 w-4" /></Button>
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{formatDuration(currentTime)}</span>
                  <span className="text-foreground font-medium">{format(new Date(currentRecording.recorded_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                  <span>{formatDuration(duration)}</span>
                </div>
                <Slider value={[currentTime]} max={duration || 100} step={0.1} onValueChange={handleSeek} className="cursor-pointer" />
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => setIsMuted(!isMuted)}>{isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}</Button>
                <Slider value={[isMuted ? 0 : volume]} max={1} step={0.1} onValueChange={(v) => setVolume(v[0])} className="w-24" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por data, conferência ou sessão..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="pl-10" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader><CardTitle>Lista de Gravações</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : recordings.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground"><Disc className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>Nenhuma gravação encontrada</p></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead><TableHead>Duração</TableHead><TableHead>Participantes</TableHead>
                  <TableHead>Tamanho</TableHead><TableHead>Conferência</TableHead><TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recordings.map((recording) => (
                  <TableRow key={recording.id} className={playingId === recording.id ? 'bg-muted/50' : ''}>
                    <TableCell><div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" />{format(new Date(recording.recorded_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</div></TableCell>
                    <TableCell><div className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" />{recording.duration_seconds ? formatDuration(recording.duration_seconds) : '-'}</div></TableCell>
                    <TableCell><div className="flex items-center gap-2"><Users className="h-4 w-4 text-muted-foreground" />{recording.participant_count || 1}</div></TableCell>
                    <TableCell>{formatFileSize(recording.file_size_bytes)}</TableCell>
                    <TableCell>{recording.conference_id ? <Badge variant="outline" className="font-mono text-xs">{recording.conference_id.slice(0, 8)}...</Badge> : <span className="text-muted-foreground">-</span>}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handlePlay(recording)} className={playingId === recording.id && isPlaying ? 'text-primary' : ''}>
                          {playingId === recording.id && isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleTranscribe(recording)} disabled={transcribing === recording.id} title="Transcrever gravação">
                          {transcribing === recording.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDownload(recording)}><Download className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(recording)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <TranscriptionDialog open={transcriptionDialog} onOpenChange={setTranscriptionDialog}
        transcription={currentTranscription} onAnalyzeSentiment={handleAnalyzeSentiment} analyzingSentiment={analyzingSentiment} />
    </div>
  );
}
