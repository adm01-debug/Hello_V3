import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, PhoneCall, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface BargeInSession {
  id: string;
  call_session_id: string;
  supervisor_name: string;
  status: string;
  started_at: string;
}

interface BargeInNotificationProps {
  agentName: string;
}

export const BargeInNotification = ({ agentName }: BargeInNotificationProps) => {
  const [activeBargeIn, setActiveBargeIn] = useState<BargeInSession | null>(null);

  const playJoinSound = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Play two ascending tones
    [440, 660].forEach((freq, i) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.value = freq;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime + i * 0.15);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + i * 0.15 + 0.2);
      oscillator.start(audioContext.currentTime + i * 0.15);
      oscillator.stop(audioContext.currentTime + i * 0.15 + 0.2);
    });
  };

  const fetchActiveBargeIn = async () => {
    const { data, error } = await supabase
      .from('barge_in_sessions')
      .select('*')
      .eq('agent_name', agentName)
      .eq('status', 'active')
      .maybeSingle();

    if (!error && data) {
      if (!activeBargeIn) {
        playJoinSound();
      }
      setActiveBargeIn(data);
    } else {
      setActiveBargeIn(null);
    }
  };

  useEffect(() => {
    fetchActiveBargeIn();

    const channel = supabase
      .channel(`agent-bargein-${agentName}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'barge_in_sessions',
        filter: `agent_name=eq.${agentName}`
      }, () => fetchActiveBargeIn())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [agentName]);

  const getConferenceDuration = (startedAt: string) => {
    const seconds = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Auto-update duration
  const [, setTick] = useState(0);
  useEffect(() => {
    if (activeBargeIn) {
      const interval = setInterval(() => setTick(t => t + 1), 1000);
      return () => clearInterval(interval);
    }
  }, [activeBargeIn]);

  if (!activeBargeIn) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 animate-fade-in">
      <Card className="w-72 shadow-lg border-destructive/30 bg-destructive/5 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-full bg-destructive/20 animate-pulse">
              <Users className="h-5 w-5 text-destructive" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">Conferência Ativa</span>
                <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                  3 participantes
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {activeBargeIn.supervisor_name} entrou na chamada
              </p>
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t border-destructive/20 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <PhoneCall className="h-3 w-3 text-destructive" />
              <span>Duração: {getConferenceDuration(activeBargeIn.started_at)}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
              <span className="text-xs text-destructive font-medium">AO VIVO</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
