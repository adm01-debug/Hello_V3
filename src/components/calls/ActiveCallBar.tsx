import { useState, useEffect } from 'react';
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
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDuration, mockActiveCall } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { LiveCallAnalysis } from '@/components/ai/LiveCallAnalysis';
import { LiveTranscription } from '@/components/calls/LiveTranscription';

export function ActiveCallBar() {
  const [call, setCall] = useState(mockActiveCall);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [onHold, setOnHold] = useState(false);
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);
  const [showTranscription, setShowTranscription] = useState(false);

  useEffect(() => {
    if (!call || call.status !== 'connected') return;
    
    const interval = setInterval(() => {
      setDuration(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [call]);

  if (!call) return null;

  const handleHangup = () => {
    setCall(null);
    setShowAIAnalysis(false);
    setShowTranscription(false);
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
              className="gap-2"
            >
              <PhoneOff className="h-4 w-4" />
              Encerrar
            </Button>
          </div>
        </div>
      </div>

      {/* Live Transcription Panel */}
      <LiveTranscription
        isActive={showTranscription && call.status === 'connected'}
      />

      {/* Live AI Analysis Panel */}
      <LiveCallAnalysis
        isActive={showAIAnalysis && call.status === 'connected'}
        contactName={call.contactName}
        onClose={() => setShowAIAnalysis(false)}
      />
    </>
  );
}
