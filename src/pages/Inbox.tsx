import { useState, useMemo } from 'react';
import { Inbox as InboxIcon, MessageCircle, Mail, MessageSquare, Phone, Smartphone, Send, Filter, Tag, AlertTriangle } from 'lucide-react';
import { NeonPageLayout } from '@/components/layout/NeonPageLayout';
import { NeonPageHeader } from '@/components/layout/NeonPageHeader';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { usePageTitle } from '@/hooks/usePageTitle';
import {
  useConversations,
  useConversationMessages,
  useSendMessage,
  useUpdateConversation,
  type ConversationChannel,
  type ConversationStatus,
  type Conversation,
} from '@/hooks/useConversations';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const channelIcons: Record<ConversationChannel, typeof MessageCircle> = {
  voice: Phone,
  whatsapp: MessageCircle,
  email: Mail,
  chat: MessageSquare,
  sms: Smartphone,
};

const channelLabels: Record<ConversationChannel, string> = {
  voice: 'Voz',
  whatsapp: 'WhatsApp',
  email: 'E-mail',
  chat: 'Chat',
  sms: 'SMS',
};

const statusVariants: Record<ConversationStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  open: 'default',
  pending: 'destructive',
  resolved: 'secondary',
  closed: 'outline',
  snoozed: 'outline',
};

export default function Inbox() {
  usePageTitle('Inbox Omnichannel');

  const [filterChannel, setFilterChannel] = useState<ConversationChannel | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<ConversationStatus | 'all'>('open');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [isPrivateNote, setIsPrivateNote] = useState(false);

  const { data: conversations = [], isLoading } = useConversations({
    channel: filterChannel === 'all' ? undefined : filterChannel,
    status: filterStatus === 'all' ? undefined : filterStatus,
  });

  const { data: messages = [] } = useConversationMessages(selectedId);
  const sendMessage = useSendMessage();
  const updateConv = useUpdateConversation();

  const filteredConversations = useMemo(() => {
    if (!search) return conversations;
    const s = search.toLowerCase();
    return conversations.filter(
      (c) =>
        c.subject?.toLowerCase().includes(s) ||
        c.assigned_agent_name?.toLowerCase().includes(s) ||
        c.tags?.some((t) => t.toLowerCase().includes(s))
    );
  }, [conversations, search]);

  const selected = conversations.find((c) => c.id === selectedId) ?? null;

  const handleSend = () => {
    if (!selectedId || !draft.trim()) return;
    sendMessage.mutate(
      {
        conversationId: selectedId,
        content: draft.trim(),
        isPrivateNote,
      },
      {
        onSuccess: () => {
          setDraft('');
          setIsPrivateNote(false);
        },
      }
    );
  };

  return (
    <NeonPageLayout>
      <NeonPageHeader
        title="Inbox Omnichannel"
        description="Atendimento unificado em todos os canais"
        icon={InboxIcon}
      />

      <div className="grid grid-cols-12 gap-4 h-[calc(100vh-220px)]">
        {/* Lista de conversas */}
        <Card className="col-span-12 lg:col-span-4 flex flex-col p-3 bg-card/50 backdrop-blur border-primary/20">
          <div className="space-y-2 mb-3">
            <Input
              placeholder="Buscar conversas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-background/50"
            />
            <div className="grid grid-cols-2 gap-2">
              <Select value={filterChannel} onValueChange={(v) => setFilterChannel(v as ConversationChannel | 'all')}>
                <SelectTrigger className="bg-background/50">
                  <Filter className="h-3 w-3 mr-1" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos canais</SelectItem>
                  <SelectItem value="voice">Voz</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="email">E-mail</SelectItem>
                  <SelectItem value="chat">Chat</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as ConversationStatus | 'all')}>
                <SelectTrigger className="bg-background/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="open">Abertas</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="resolved">Resolvidas</SelectItem>
                  <SelectItem value="closed">Fechadas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <ScrollArea className="flex-1">
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : filteredConversations.length === 0 ? (
              <EmptyState icon={InboxIcon} title="Nenhuma conversa" description="Aguardando interações." />
            ) : (
              <div className="space-y-1.5">
                {filteredConversations.map((c) => {
                  const Icon = channelIcons[c.channel];
                  const active = c.id === selectedId;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setSelectedId(c.id)}
                      className={cn(
                        'w-full text-left rounded-lg p-3 border transition-all',
                        active
                          ? 'bg-primary/15 border-primary/40 shadow-[0_0_15px_hsl(var(--primary)/0.2)]'
                          : 'bg-background/40 border-border/40 hover:bg-background/60'
                      )}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <Icon className="h-3.5 w-3.5 shrink-0 text-primary" />
                          <span className="text-sm font-medium truncate">
                            {c.subject || `${channelLabels[c.channel]} sem assunto`}
                          </span>
                        </div>
                        {c.sla_breached && <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />}
                      </div>
                      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                        <span className="truncate">{c.assigned_agent_name || 'Não atribuída'}</span>
                        <span className="shrink-0">
                          {formatDistanceToNow(new Date(c.last_message_at), { locale: ptBR, addSuffix: true })}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        <Badge variant={statusVariants[c.status]} className="text-[10px] h-4 px-1.5">
                          {c.status}
                        </Badge>
                        {c.priority !== 'normal' && (
                          <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                            {c.priority}
                          </Badge>
                        )}
                        {c.tags?.slice(0, 2).map((t) => (
                          <Badge key={t} variant="outline" className="text-[10px] h-4 px-1.5">
                            <Tag className="h-2 w-2 mr-0.5" />
                            {t}
                          </Badge>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </Card>

        {/* Thread */}
        <Card className="col-span-12 lg:col-span-8 flex flex-col bg-card/50 backdrop-blur border-primary/20">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState
                icon={MessageSquare}
                title="Selecione uma conversa"
                description="Escolha uma conversa à esquerda para começar."
              />
            </div>
          ) : (
            <ConversationThread
              conversation={selected}
              messages={messages}
              draft={draft}
              setDraft={setDraft}
              isPrivateNote={isPrivateNote}
              setIsPrivateNote={setIsPrivateNote}
              onSend={handleSend}
              sending={sendMessage.isPending}
              onResolve={() =>
                updateConv.mutate({
                  id: selected.id,
                  updates: { status: 'resolved', resolved_at: new Date().toISOString() },
                })
              }
            />
          )}
        </Card>
      </div>
    </NeonPageLayout>
  );
}

interface ThreadProps {
  conversation: Conversation;
  messages: Array<{ id: string; direction: string; sender_type: string; sender_name: string | null; content: string; is_private_note: boolean | null; created_at: string }>;
  draft: string;
  setDraft: (v: string) => void;
  isPrivateNote: boolean;
  setIsPrivateNote: (v: boolean) => void;
  onSend: () => void;
  sending: boolean;
  onResolve: () => void;
}

function ConversationThread({ conversation, messages, draft, setDraft, isPrivateNote, setIsPrivateNote, onSend, sending, onResolve }: ThreadProps) {
  const Icon = channelIcons[conversation.channel];
  return (
    <>
      <div className="border-b border-border/40 p-3 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <Icon className="h-4 w-4 text-primary shrink-0" />
          <div className="min-w-0">
            <h3 className="font-semibold truncate">{conversation.subject || channelLabels[conversation.channel]}</h3>
            <p className="text-xs text-muted-foreground truncate">
              {conversation.assigned_agent_name || 'Não atribuída'} · {channelLabels[conversation.channel]}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {conversation.status !== 'resolved' && (
            <Button size="sm" variant="outline" onClick={onResolve}>
              Resolver
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3">
          {messages.map((m) => {
            const inbound = m.direction === 'inbound';
            const isNote = m.is_private_note;
            const isBot = m.sender_type === 'bot';
            return (
              <div key={m.id} className={cn('flex', inbound ? 'justify-start' : 'justify-end')}>
                <div
                  className={cn(
                    'max-w-[75%] rounded-lg px-3 py-2 text-sm',
                    isNote
                      ? 'bg-warning/15 border border-warning/30 text-warning-foreground'
                      : inbound
                        ? 'bg-muted/60'
                        : isBot
                          ? 'bg-accent/20 border border-accent/30'
                          : 'bg-primary/15 border border-primary/30'
                  )}
                >
                  <div className="text-[10px] uppercase tracking-wider opacity-60 mb-0.5">
                    {isNote ? 'Nota interna · ' : ''}{m.sender_name || m.sender_type}
                  </div>
                  <div className="whitespace-pre-wrap break-words">{m.content}</div>
                  <div className="text-[10px] opacity-50 mt-1 text-right">
                    {formatDistanceToNow(new Date(m.created_at), { locale: ptBR, addSuffix: true })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      <div className="border-t border-border/40 p-3 space-y-2">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={isPrivateNote ? 'default' : 'outline'}
            onClick={() => setIsPrivateNote(!isPrivateNote)}
          >
            {isPrivateNote ? '📝 Nota interna' : 'Resposta pública'}
          </Button>
        </div>
        <div className="flex gap-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={isPrivateNote ? 'Nota interna (apenas equipe vê)...' : 'Digite sua resposta...'}
            className="bg-background/50 min-h-[80px]"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) onSend();
            }}
          />
          <Button onClick={onSend} disabled={!draft.trim() || sending} size="lg" className="self-end">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  );
}
