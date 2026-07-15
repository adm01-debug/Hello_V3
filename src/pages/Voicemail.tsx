import { useState } from 'react';
import { useDebouncedSearchParam } from '@/hooks/useDebouncedSearchParam';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
 import { Voicemail, Play, Check, Clock, Phone, AlertTriangle, Search, Trash2, MailOpen, Mail } from 'lucide-react';
 import { formatDuration } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { usePageTitle } from '@/hooks/usePageTitle';

interface VoicemailMessage {
  id: string;
  caller_name: string | null;
  caller_phone: string;
  agent_name: string | null;
  duration_seconds: number | null;
  transcription: string | null;
  is_read: boolean;
  is_urgent: boolean;
  created_at: string;
  read_at: string | null;
}

export default function VoicemailPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'urgent'>('all');

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['voicemail', filter],
    queryFn: async () => {
      let query = supabase.from('voicemail_messages').select('*').order('created_at', { ascending: false });
      if (filter === 'unread') query = query.eq('is_read', false);
      if (filter === 'urgent') query = query.eq('is_urgent', true);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as VoicemailMessage[];
    },
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('voicemail_messages')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['voicemail'] }),
  });

  const deleteMessage = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('voicemail_messages').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voicemail'] });
      toast.success('Mensagem removida');
    },
  });

  const filtered = messages.filter(m => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (m.caller_name?.toLowerCase().includes(s) || m.caller_phone.includes(s) || m.transcription?.toLowerCase().includes(s));
  });

  const unreadCount = messages.filter(m => !m.is_read).length;

   usePageTitle('Correio de Voz');

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Voicemail className="h-8 w-8 text-primary" />
            Correio de Voz Virtual
          </h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} mensagens não lidas` : 'Todas as mensagens lidas'}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:shadow-md" onClick={() => setFilter('all')}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{messages.length}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md" onClick={() => setFilter('unread')}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center">
              <MailOpen className="h-5 w-5 text-info" />
            </div>
            <div>
              <p className="text-2xl font-bold">{unreadCount}</p>
              <p className="text-xs text-muted-foreground">Não Lidas</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md" onClick={() => setFilter('urgent')}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold">{messages.filter(m => m.is_urgent).length}</p>
              <p className="text-xs text-muted-foreground">Urgentes</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input className="pl-10" placeholder="Buscar por nome, telefone ou transcrição..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Messages */}
      <div className="space-y-3">
        {isLoading ? (
          <p className="text-muted-foreground text-center py-8">Carregando...</p>
        ) : filtered.length === 0 ? (
          <Card className="p-12 text-center">
            <Voicemail className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-lg font-medium text-muted-foreground">Nenhuma mensagem de voz</p>
          </Card>
        ) : filtered.map(msg => (
          <Card key={msg.id} className={`transition-all hover:shadow-md ${!msg.is_read ? 'border-primary/50 bg-primary/5' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${msg.is_urgent ? 'bg-destructive/10' : 'bg-muted'}`}>
                    <Phone className={`h-5 w-5 ${msg.is_urgent ? 'text-destructive' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className={`font-medium ${!msg.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {msg.caller_name || msg.caller_phone}
                      </p>
                      {msg.is_urgent && <Badge variant="destructive" className="text-xs">Urgente</Badge>}
                      {!msg.is_read && <Badge className="text-xs">Nova</Badge>}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                      <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {msg.caller_phone}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {formatDuration(msg.duration_seconds)}</span>
                      <span>{formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: ptBR })}</span>
                    </div>
                    {msg.transcription && (
                      <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3 italic">
                        "{msg.transcription}"
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {!msg.is_read && (
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => markRead.mutate(msg.id)}>
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMessage.mutate(msg.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
