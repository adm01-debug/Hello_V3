import { Phone, FileText, MessageSquare, Clock, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ContactInteraction } from '@/hooks/useContacts';

const getSentimentColor = (sentiment: string | null) => {
  switch (sentiment?.toLowerCase()) {
    case 'positivo': case 'positive': case 'melhorando': return 'bg-success/10 text-success';
    case 'negativo': case 'negative': case 'piorando': return 'bg-destructive/10 text-destructive';
    default: return 'bg-muted text-muted-foreground';
  }
};

interface ContactHistoryTabProps {
  interactions: ContactInteraction[];
  loading: boolean;
}

export function ContactHistoryTab({ interactions, loading }: ContactHistoryTabProps) {
  return (
    <ScrollArea className="h-[400px] pr-4">
      {loading ? (
        <div className="py-8 text-center text-muted-foreground">Carregando histórico...</div>
      ) : interactions.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">
          <MessageSquare className="mx-auto mb-2 h-8 w-8 opacity-50" />
          Nenhuma interação registrada
        </div>
      ) : (
        <div className="space-y-3">
          {interactions.map((interaction) => (
            <div key={interaction.id} className="rounded-lg border p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {interaction.interaction_type === 'call' ? <Phone className="h-4 w-4 text-primary" /> : <FileText className="h-4 w-4 text-muted-foreground" />}
                  <span className="font-medium capitalize">{interaction.interaction_type === 'call' ? 'Chamada' : interaction.interaction_type}</span>
                  {interaction.direction && <Badge variant="outline" className="text-xs">{interaction.direction === 'inbound' ? 'Entrada' : 'Saída'}</Badge>}
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(interaction.created_at), { locale: ptBR, addSuffix: true })}
                </span>
              </div>
              {interaction.summary && <p className="text-sm text-muted-foreground">{interaction.summary}</p>}
              <div className="flex items-center gap-2">
                {interaction.sentiment && <Badge className={getSentimentColor(interaction.sentiment)}>{interaction.sentiment}</Badge>}
                {interaction.duration_seconds && <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" />{Math.floor(interaction.duration_seconds / 60)}min</Badge>}
                {interaction.agent_name && <Badge variant="outline"><User className="mr-1 h-3 w-3" />{interaction.agent_name}</Badge>}
              </div>
              {interaction.topics && interaction.topics.length > 0 && (
                <div className="flex flex-wrap gap-1">{interaction.topics.map((topic, i) => <Badge key={i} variant="secondary" className="text-xs">{topic}</Badge>)}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </ScrollArea>
  );
}
