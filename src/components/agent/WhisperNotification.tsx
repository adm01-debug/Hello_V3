import { useEffect, useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Headphones, 
  X, 
  Volume2,
  ChevronDown,
  ChevronUp,
  Check
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface WhisperMessage {
  id: string;
  supervisor_name: string;
  message: string;
  created_at: string;
  is_read: boolean;
  call_session_id: string;
}

interface WhisperNotificationProps {
  agentName: string;
}

export const WhisperNotification = ({ agentName }: WhisperNotificationProps) => {
  const [whispers, setWhispers] = useState<WhisperMessage[]>([]);
  const [latestWhisper, setLatestWhisper] = useState<WhisperMessage | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playNotificationSound = () => {
    // Create a simple notification sound using Web Audio API
    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 880; // A5 note
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  };

  const fetchUnreadWhispers = async () => {
    const { data, error } = await supabase
      .from('whisper_messages')
      .select('*')
      .eq('agent_name', agentName)
      .eq('is_read', false)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setWhispers(data as WhisperMessage[]);
      if (data.length > 0) {
        setShowNotification(true);
        setLatestWhisper(data[0] as WhisperMessage);
      }
    }
  };

  useEffect(() => {
    fetchUnreadWhispers();

    // Subscribe to new whispers
    const channel = supabase
      .channel(`agent-whispers-${agentName}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'whisper_messages',
          filter: `agent_name=eq.${agentName}`
        },
        (payload) => {
          const newWhisper = payload.new as WhisperMessage;
          setWhispers(prev => [newWhisper, ...prev]);
          setLatestWhisper(newWhisper);
          setShowNotification(true);
          playNotificationSound();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [agentName]);

  const markAsRead = async (whisperId: string) => {
    await supabase
      .from('whisper_messages')
      .update({ is_read: true })
      .eq('id', whisperId);

    setWhispers(prev => prev.filter(w => w.id !== whisperId));
    
    if (whispers.length <= 1) {
      setShowNotification(false);
      setLatestWhisper(null);
    } else {
      setLatestWhisper(whispers[1] || null);
    }
  };

  const markAllAsRead = async () => {
    const ids = whispers.map(w => w.id);
    await supabase
      .from('whisper_messages')
      .update({ is_read: true })
      .in('id', ids);

    setWhispers([]);
    setShowNotification(false);
    setLatestWhisper(null);
    setIsExpanded(false);
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!showNotification || whispers.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-fade-in">
      <Card className="w-80 shadow-lg border-primary/20 bg-card/95 backdrop-blur-sm">
        <div 
          className="flex items-center justify-between p-3 bg-primary/10 rounded-t-lg cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-full bg-primary/20 animate-pulse">
              <Headphones className="h-4 w-4 text-primary" />
            </div>
            <div>
              <span className="font-medium text-sm">Whisper do Supervisor</span>
              <Badge variant="destructive" className="ml-2 text-xs">
                {whispers.length}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                markAllAsRead();
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <CardContent className="p-3">
          {/* Latest Whisper - Always Visible */}
          {latestWhisper && (
            <div className="p-3 bg-primary/5 rounded-lg border border-primary/20 mb-2">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">
                    {latestWhisper.supervisor_name} • {formatTime(latestWhisper.created_at)}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => markAsRead(latestWhisper.id)}
                >
                  <Check className="h-4 w-4 text-success" />
                </Button>
              </div>
              <p className="text-sm font-medium">{latestWhisper.message}</p>
            </div>
          )}

          {/* Expanded History */}
          {isExpanded && whispers.length > 1 && (
            <ScrollArea className="h-[150px]">
              <div className="space-y-2">
                {whispers.slice(1).map(whisper => (
                  <div
                    key={whisper.id}
                    className="p-2 rounded border border-border bg-muted/30"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">
                        {whisper.supervisor_name} • {formatTime(whisper.created_at)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={() => markAsRead(whisper.id)}
                      >
                        <Check className="h-3 w-3 text-success" />
                      </Button>
                    </div>
                    <p className="text-xs">{whisper.message}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          {whispers.length > 1 && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-2 text-xs"
              onClick={markAllAsRead}
            >
              Marcar todas como lidas
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
