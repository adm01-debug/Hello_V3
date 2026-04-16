import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

export interface TranscriptSegment {
  speaker: 'agent' | 'customer';
  text: string;
  start: number;
  end: number;
}

interface Props {
  audioUrl: string;
  segments: TranscriptSegment[];
  seekTo?: number;
}

function fmt(s: number) {
  const m = Math.floor(s / 60); const r = Math.floor(s % 60);
  return `${m}:${r.toString().padStart(2, '0')}`;
}

export function CallPlayerWithTranscript({ audioUrl, segments, seekTo }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const a = audioRef.current; if (!a) return;
    const onTime = () => setCurrent(a.currentTime);
    const onLoaded = () => setDuration(a.duration);
    const onEnd = () => setPlaying(false);
    a.addEventListener('timeupdate', onTime);
    a.addEventListener('loadedmetadata', onLoaded);
    a.addEventListener('ended', onEnd);
    return () => {
      a.removeEventListener('timeupdate', onTime);
      a.removeEventListener('loadedmetadata', onLoaded);
      a.removeEventListener('ended', onEnd);
    };
  }, []);

  useEffect(() => {
    if (typeof seekTo === 'number' && audioRef.current) {
      audioRef.current.currentTime = seekTo;
      audioRef.current.play().catch(() => {});
      setPlaying(true);
    }
  }, [seekTo]);

  const toggle = () => {
    const a = audioRef.current; if (!a) return;
    if (playing) a.pause(); else a.play();
    setPlaying(!playing);
  };

  const skip = (delta: number) => {
    const a = audioRef.current; if (!a) return;
    a.currentTime = Math.max(0, Math.min(duration, a.currentTime + delta));
  };

  const seek = (val: number[]) => {
    const a = audioRef.current; if (!a) return;
    a.currentTime = val[0];
  };

  const activeIdx = segments.findIndex(s => current >= s.start && current <= s.end);

  return (
    <Card className="p-4 space-y-3">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      <div className="flex items-center gap-2">
        <Button size="icon" variant="outline" onClick={() => skip(-10)} aria-label="Voltar 10s">
          <SkipBack className="h-4 w-4" />
        </Button>
        <Button size="icon" onClick={toggle} aria-label={playing ? 'Pausar' : 'Tocar'}>
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        <Button size="icon" variant="outline" onClick={() => skip(10)} aria-label="Avançar 10s">
          <SkipForward className="h-4 w-4" />
        </Button>
        <span className="text-xs text-muted-foreground tabular-nums">{fmt(current)} / {fmt(duration)}</span>
      </div>

      <Slider value={[current]} max={duration || 1} step={0.1} onValueChange={seek} />

      <ScrollArea className="h-[300px] pr-4" ref={scrollAreaRef as any}>
        <div className="space-y-2">
          {segments.map((s, i) => (
            <div
              key={i}
              className={cn(
                'p-2 rounded-md text-sm cursor-pointer transition-colors',
                s.speaker === 'agent' ? 'bg-primary/5' : 'bg-warning/5',
                i === activeIdx && 'ring-2 ring-primary'
              )}
              onClick={() => { if (audioRef.current) { audioRef.current.currentTime = s.start; audioRef.current.play(); setPlaying(true); } }}
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
