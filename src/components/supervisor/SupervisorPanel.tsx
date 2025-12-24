import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  X,
  Users,
  PhoneCall,
  PhoneOff,
  Radio
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

interface BargeInSession {
  id: string;
  call_session_id: string;
  supervisor_name: string;
  agent_name: string;
  status: string;
  started_at: string;
}

export const SupervisorPanel = () => {
  const [activeCalls, setActiveCalls] = useState<ActiveCall[]>([]);
  const [selectedCall, setSelectedCall] = useState<ActiveCall | null>(null);
  const [whisperMessage, setWhisperMessage] = useState('');
  const [whisperHistory, setWhisperHistory] = useState<WhisperMessage[]>([]);
  const [activeBargeIn, setActiveBargeIn] = useState<BargeInSession | null>(null);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const supervisorName = 'Supervisor';

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

  const fetchActiveBargeIn = async () => {
    const { data, error } = await supabase
      .from('barge_in_sessions')
      .select('*')
      .eq('supervisor_name', supervisorName)
      .eq('status', 'active')
      .maybeSingle();

    if (!error && data) {
      setActiveBargeIn(data);
    }
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
    fetchActiveBargeIn();

    const channel = supabase
      .channel('supervisor-panel-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'call_sessions' }, () => fetchActiveCalls())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'barge_in_sessions' }, () => fetchActiveBargeIn())
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
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'whisper_messages',
          filter: `call_session_id=eq.${selectedCall.id}`
        }, () => fetchWhisperHistory(selectedCall.id))
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
      toast.error('Erro ao enviar whisper');
    } else {
      toast.success('Whisper enviado para ' + selectedCall.agent_name);
      setWhisperMessage('');
    }
    setSending(false);
  };

  const startBargeIn = async () => {
    if (!selectedCall || !selectedCall.agent_name) {
      toast.error('Selecione uma chamada primeiro');
      return;
    }

    const { error } = await supabase.from('barge_in_sessions').insert({
      call_session_id: selectedCall.id,
      supervisor_name: supervisorName,
      agent_name: selectedCall.agent_name,
      status: 'active'
    });

    if (error) {
      console.error('Error starting barge-in:', error);
      toast.error('Erro ao iniciar barge-in');
    } else {
      toast.success(`Você entrou na chamada com ${selectedCall.agent_name}`);
    }
  };

  const endBargeIn = async () => {
    if (!activeBargeIn) return;

    const { error } = await supabase
      .from('barge_in_sessions')
      .update({ status: 'ended', ended_at: new Date().toISOString() })
      .eq('id', activeBargeIn.id);

    if (error) {
      toast.error('Erro ao sair da chamada');
    } else {
      setActiveBargeIn(null);
      toast.info('Você saiu da conferência');
    }
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const getCallDuration = (startedAt: string) => {
    const seconds = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const quickWhispers = [
    "Ofereça desconto de 10%",
    "Transfira para o setor técnico",
    "Peça para aguardar",
    "Confirme os dados do cliente",
    "Finalize a ligação"
  ];

  const isCallInBargeIn = (callId: string) => {
    return activeBargeIn?.call_session_id === callId;
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Radio className="h-5 w-5 text-primary" />
          Painel do Supervisor
          {activeBargeIn && (
            <Badge variant="destructive" className="ml-2 animate-pulse">
              <PhoneCall className="h-3 w-3 mr-1" />
              Em Conferência
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Active Barge-in Banner */}
        {activeBargeIn && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-destructive" />
                <div>
                  <p className="font-medium text-sm">Conferência Ativa</p>
                  <p className="text-xs text-muted-foreground">
                    Com {activeBargeIn.agent_name} • {getCallDuration(activeBargeIn.started_at)}
                  </p>
                </div>
              </div>
              <Button variant="destructive" size="sm" onClick={endBargeIn}>
                <PhoneOff className="h-4 w-4 mr-1" />
                Sair
              </Button>
            </div>
          </div>
        )}

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
            <ScrollArea className="h-[120px]">
              <div className="space-y-2">
                {activeCalls.map(call => (
                  <div
                    key={call.id}
                    onClick={() => setSelectedCall(call)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedCall?.id === call.id
                        ? 'border-primary bg-primary/5'
                        : isCallInBargeIn(call.id)
                        ? 'border-destructive bg-destructive/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-full ${isCallInBargeIn(call.id) ? 'bg-destructive/10' : 'bg-green-500/10'}`}>
                          {isCallInBargeIn(call.id) ? (
                            <Users className="h-3 w-3 text-destructive" />
                          ) : (
                            <Phone className="h-3 w-3 text-green-500" />
                          )}
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
                        <Badge variant={isCallInBargeIn(call.id) ? 'destructive' : 'secondary'} className="text-xs">
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

        {/* Supervisor Actions */}
        {selectedCall && (
          <Tabs defaultValue="whisper" className="pt-2 border-t">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="whisper" className="text-xs">
                <Headphones className="h-3 w-3 mr-1" />
                Whisper
              </TabsTrigger>
              <TabsTrigger value="bargein" className="text-xs">
                <Users className="h-3 w-3 mr-1" />
                Barge-in
              </TabsTrigger>
            </TabsList>

            {/* Whisper Tab */}
            <TabsContent value="whisper" className="space-y-3 mt-3">
              <div className="flex items-center gap-2 text-sm">
                <Volume2 className="h-4 w-4 text-primary" />
                <span>Sussurrar para:</span>
                <Badge variant="default">{selectedCall.agent_name}</Badge>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {quickWhispers.map((qw, idx) => (
                  <Button key={idx} variant="outline" size="sm" className="text-xs h-7" onClick={() => setWhisperMessage(qw)}>
                    {qw}
                  </Button>
                ))}
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Digite sua mensagem..."
                  value={whisperMessage}
                  onChange={(e) => setWhisperMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendWhisper()}
                  className="flex-1"
                />
                <Button onClick={sendWhisper} disabled={sending || !whisperMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>

              {whisperHistory.length > 0 && (
                <ScrollArea className="h-[80px]">
                  <div className="space-y-1">
                    {whisperHistory.map(wh => (
                      <div key={wh.id} className={`p-2 rounded text-xs border ${wh.is_read ? 'bg-muted/50' : 'bg-primary/5 border-primary/20'}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-muted-foreground">{formatTime(wh.created_at)}</span>
                          {wh.is_read && <Check className="h-3 w-3 text-green-500" />}
                        </div>
                        <p>{wh.message}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>

            {/* Barge-in Tab */}
            <TabsContent value="bargein" className="space-y-3 mt-3">
              <div className="p-4 rounded-lg border bg-muted/30 text-center">
                <Users className="h-10 w-10 mx-auto mb-3 text-primary opacity-60" />
                <h4 className="font-medium mb-1">Modo Barge-in</h4>
                <p className="text-xs text-muted-foreground mb-4">
                  Entre na chamada como conferência tripartite. 
                  Tanto o agente quanto o cliente ouvirão você.
                </p>

                {isCallInBargeIn(selectedCall.id) ? (
                  <Button variant="destructive" onClick={endBargeIn} className="w-full">
                    <PhoneOff className="h-4 w-4 mr-2" />
                    Sair da Conferência
                  </Button>
                ) : activeBargeIn ? (
                  <Button disabled className="w-full">
                    Você já está em outra conferência
                  </Button>
                ) : (
                  <Button onClick={startBargeIn} className="w-full">
                    <PhoneCall className="h-4 w-4 mr-2" />
                    Entrar na Chamada
                  </Button>
                )}

                <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                  <p className="flex items-center justify-center gap-1">
                    <Phone className="h-3 w-3" />
                    Chamada: {selectedCall.caller_name || selectedCall.caller_phone}
                  </p>
                  <p className="flex items-center justify-center gap-1 mt-1">
                    <User className="h-3 w-3" />
                    Agente: {selectedCall.agent_name}
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}

        {!selectedCall && activeCalls.length > 0 && (
          <div className="text-center py-4 text-muted-foreground text-sm">
            Selecione uma chamada para gerenciar
          </div>
        )}
      </CardContent>
    </Card>
  );
};
