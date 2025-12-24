import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Headphones, 
  Phone, 
  Send, 
  MessageSquare, 
  User, 
  Clock,
  Volume2,
  Check,
  X
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ActiveCall {
  id: string;
  caller_name: string | null;
  caller_phone: string | null;
  agent_name: string | null;
  started_at: string;
  status: string | null;
}

interface WhisperMessage {
  id: string;
  message: string;
  created_at: string;
  is_read: boolean;
}

export const WhisperPanel = () => {
  const [activeCalls, setActiveCalls] = useState<ActiveCall[]>([]);
  const [selectedCall, setSelectedCall] = useState<ActiveCall | null>(null);
  const [whisperMessage, setWhisperMessage] = useState('');
  const [whisperHistory, setWhisperHistory] = useState<WhisperMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const supervisorName = 'Supervisor'; // In real app, get from auth

  const fetchActiveCalls = async () => {
    const { data, error } = await supabase
      .from('call_sessions')
      .select('*')
      .eq('status', 'active')
      .order('started_at', { ascending: false });

    if (!error && data) {
      setActiveCalls(data);
    }
    setLoading(false);
  };

  const fetchWhisperHistory = async (callId: string) => {
    const { data, error } = await supabase
      .from('whisper_messages')
      .select('*')
      .eq('call_session_id', callId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (!error && data) {
      setWhisperHistory(data);
    }
  };

  useEffect(() => {
    fetchActiveCalls();

    const channel = supabase
      .channel('whisper-panel-calls')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'call_sessions'
        },
        () => {
          fetchActiveCalls();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (selectedCall) {
      fetchWhisperHistory(selectedCall.id);

      const channel = supabase
        .channel(`whisper-history-${selectedCall.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'whisper_messages',
            filter: `call_session_id=eq.${selectedCall.id}`
          },
          () => {
            fetchWhisperHistory(selectedCall.id);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedCall]);

  const sendWhisper = async () => {
    if (!selectedCall || !whisperMessage.trim() || !selectedCall.agent_name) {
      toast.error('Selecione uma chamada e digite uma mensagem');
      return;
    }

    setSending(true);
    const { error } = await supabase.from('whisper_messages').insert({
      call_session_id: selectedCall.id,
      supervisor_name: supervisorName,
      agent_name: selectedCall.agent_name,
      message: whisperMessage.trim()
    });

    if (error) {
      console.error('Error sending whisper:', error);
      toast.error('Erro ao enviar whisper');
    } else {
      toast.success('Whisper enviado para ' + selectedCall.agent_name);
      setWhisperMessage('');
    }
    setSending(false);
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getCallDuration = (startedAt: string) => {
    const seconds = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Quick whisper templates
  const quickWhispers = [
    "Ofereça desconto de 10%",
    "Transfira para o setor técnico",
    "Peça para aguardar",
    "Confirme os dados do cliente",
    "Finalize a ligação"
  ];

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Headphones className="h-5 w-5 text-primary" />
          Whisper Mode
          <Badge variant="outline" className="ml-2 text-xs">
            Supervisor
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Active Calls List */}
        <div>
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Chamadas Ativas ({activeCalls.length})
          </h4>
          
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
            </div>
          ) : activeCalls.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground text-sm">
              Nenhuma chamada ativa
            </div>
          ) : (
            <ScrollArea className="h-[150px]">
              <div className="space-y-2">
                {activeCalls.map(call => (
                  <div
                    key={call.id}
                    onClick={() => setSelectedCall(call)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedCall?.id === call.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-full bg-green-500/10">
                          <Phone className="h-3 w-3 text-green-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {call.caller_name || call.caller_phone || 'Desconhecido'}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {call.agent_name || 'Sem agente'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          {getCallDuration(call.started_at)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Whisper Input */}
        {selectedCall && (
          <div className="space-y-3 pt-2 border-t">
            <div className="flex items-center gap-2 text-sm">
              <Volume2 className="h-4 w-4 text-primary" />
              <span>Sussurrar para:</span>
              <Badge variant="default">{selectedCall.agent_name}</Badge>
            </div>

            {/* Quick Whispers */}
            <div className="flex flex-wrap gap-1.5">
              {quickWhispers.map((qw, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => setWhisperMessage(qw)}
                >
                  {qw}
                </Button>
              ))}
            </div>

            {/* Message Input */}
            <div className="flex gap-2">
              <Input
                placeholder="Digite sua mensagem..."
                value={whisperMessage}
                onChange={(e) => setWhisperMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendWhisper()}
                className="flex-1"
              />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      onClick={sendWhisper} 
                      disabled={sending || !whisperMessage.trim()}
                      className="shrink-0"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Enviar whisper</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Whisper History */}
            {whisperHistory.length > 0 && (
              <div className="pt-2">
                <h5 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  Histórico de Whispers
                </h5>
                <ScrollArea className="h-[100px]">
                  <div className="space-y-2">
                    {whisperHistory.map(wh => (
                      <div
                        key={wh.id}
                        className={`p-2 rounded text-xs border ${
                          wh.is_read 
                            ? 'bg-muted/50 border-border' 
                            : 'bg-primary/5 border-primary/20'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-muted-foreground">
                            {formatTime(wh.created_at)}
                          </span>
                          {wh.is_read ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <span className="text-primary text-[10px]">Não lido</span>
                          )}
                        </div>
                        <p>{wh.message}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
        )}

        {!selectedCall && activeCalls.length > 0 && (
          <div className="text-center py-4 text-muted-foreground text-sm">
            Selecione uma chamada para enviar whispers
          </div>
        )}
      </CardContent>
    </Card>
  );
};
