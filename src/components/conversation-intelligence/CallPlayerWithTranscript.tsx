import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Play, Pause, SkipBack, SkipForward, Sparkles, Lightbulb } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

export interface TranscriptSegment {
  speaker: 'agent' | 'customer';
  text: string;
  start: number;
  end: number;
}

export interface PlayerMarker {
  type: 'moment' | 'coaching';
  timestamp: number;
  label: string;
  severity?: 'info' | 'warning' | 'critical';
}

interface Props {
  audioUrl?: string;
  segments: TranscriptSegment[];
  seekTo?: number;
  markers?: PlayerMarker[];
  onSeek?: (seconds: number) => void;
}

function fmt(s: number) {
  const m = Math.floor(s / 60); const r = Math.floor(s % 60);
  return `${m}:${r.toString().padStart(2, '0')}`;
}

export function CallPlayerWithTranscript({ audioUrl, segments, seekTo, markers = [], onSeek }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const a = audioRef.current; if (!a) return;
    const onTime = () => setCurrent(a.currentTime);
    const onLoaded = () => setDuration(a.duration || 0);
    const onEnd = () => setPlaying(false);
    a.addEventListener('timeupdate', onTime);
    a.addEventListener('loadedmetadata', onLoaded);
    a.addEventListener('ended', onEnd);
    return () => {
      a.removeEventListener('timeupdate', onTime);
      a.removeEventListener('loadedmetadata', onLoaded);
      a.removeEventListener('ended', onEnd);
    };
  }, [audioUrl]);

  useEffect(() => {
    if (typeof seekTo === 'number' && audioRef.current) {
      audioRef.current.currentTime = seekTo;
      audioRef.current.play().catch(() => {});
      setPlaying(true);
    }
  }, [seekTo]);

  const totalDuration = duration || (segments.length > 0 ? segments[segments.length - 1].end : 0) || 1;

  const toggle = () => {
    const a = audioRef.current; if (!a || !audioUrl) return;
    if (playing) a.pause(); else a.play();
    setPlaying(!playing);
  };

  const skip = (delta: number) => {
    const a = audioRef.current; if (!a) return;
    a.currentTime = Math.max(0, Math.min(totalDuration, a.currentTime + delta));
  };

  const seek = (val: number[]) => {
    setCurrent(val[0]);
    if (audioRef.current) audioRef.current.currentTime = val[0];
    onSeek?.(val[0]);
  };

  const seekToTimestamp = (ts: number) => {
    setCurrent(ts);
    if (audioRef.current) {
      audioRef.current.currentTime = ts;
      audioRef.current.play().catch(() => {});
      setPlaying(true);
    }
    onSeek?.(ts);
  };

  const activeIdx = segments.findIndex(s => current >= s.start && current <= s.end);

  return (
    <Card className="p-4 space-y-3">
      {audioUrl ? <audio ref={audioRef} src={audioUrl} preload="metadata" /> : null}

      <div className="flex items-center gap-2">
        <Button size="icon" variant="outline" onClick={() => skip(-10)} aria-label="Voltar 10s" disabled={!audioUrl}>
          <SkipBack className="h-4 w-4" />
        </Button>
        <Button size="icon" onClick={toggle} aria-label={playing ? 'Pausar' : 'Tocar'} disabled={!audioUrl}>
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        <Button size="icon" variant="outline" onClick={() => skip(10)} aria-label="Avançar 10s" disabled={!audioUrl}>
          <SkipForward className="h-4 w-4" />
        </Button>
        <span className="text-xs text-muted-foreground tabular-nums">{fmt(current)} / {fmt(totalDuration)}</span>
        {!audioUrl && <span className="text-xs text-muted-foreground ml-auto">Áudio indisponível — modo navegação</span>}
      </div>

      <div className="relative">
        <Slider value={[current]} max={totalDuration} step={0.1} onValueChange={seek} />
        {markers.length > 0 && totalDuration > 0 && (
          <div className="absolute inset-x-0 -top-1 h-3 pointer-events-none">
            {markers.map((m, i) => {
              const left = `${Math.min(100, (m.timestamp / totalDuration) * 100)}%`;
              const color = m.type === 'moment'
                ? 'bg-primary shadow-[0_0_10px_hsl(var(--primary))]'
                : m.severity === 'critical' ? 'bg-destructive shadow-[0_0_10px_hsl(var(--destructive))]'
                : m.severity === 'warning' ? 'bg-warning shadow-[0_0_10px_hsl(var(--warning))]'
                : 'bg-success shadow-[0_0_10px_hsl(var(--success))]';
              return (
                <button
                  key={i}
                  type="button"
                  className={cn('absolute top-0 h-3 w-1.5 rounded-sm pointer-events-auto cursor-pointer hover:scale-150 transition-transform', color)}
                  style={{ left }}
                  title={`${fmt(m.timestamp)} — ${m.label}`}
                  onClick={() => seekToTimestamp(m.timestamp)}
                  aria-label={`Pular para ${fmt(m.timestamp)}: ${m.label}`}
                />
              );
            })}
          </div>
        )}
      </div>

      {markers.length > 0 && (
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Sparkles className="h-3 w-3 text-primary" /> Momentos</span>
          <span className="flex items-center gap-1"><Lightbulb className="h-3 w-3 text-success" /> Coaching</span>
        </div>
      )}

      <ScrollArea className="h-[300px] pr-4" ref={scrollAreaRef as any}>
        <div className="space-y-2">
          {segments.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-6">Nenhuma transcrição segmentada disponível.</p>
          ) : segments.map((s, i) => (
            <div
              key={i}
              className={cn(
                'p-2 rounded-md text-sm cursor-pointer transition-colors',
                s.speaker === 'agent' ? 'bg-primary/5 hover:bg-primary/10' : 'bg-warning/5 hover:bg-warning/10',
                i === activeIdx && 'ring-2 ring-primary'
              )}
              onClick={() => seekToTimestamp(s.start)}
            >
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-0.5">
                <span className={s.speaker === 'agent' ? 'text-primary font-medium' : 'text-warning font-medium'}>
                  {s.speaker === 'agent' ? 'Agente' : 'Cliente'}
                </span>
                <span>{fmt(s.start)}</span>
              </div>
              <p>{s.text}</p>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}
