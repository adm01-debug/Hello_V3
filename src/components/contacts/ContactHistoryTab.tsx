import { Phone, FileText, MessageSquare, Clock, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { VirtualList } from '@/components/ui/VirtualList';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ContactInteraction } from '@/hooks/useContacts';

interface ContactHistoryTabProps {
  interactions: ContactInteraction[];
  loadingInteractions: boolean;
  getSentimentColor: (sentiment: string | null) => string;
}

export function ContactHistoryTab({ interactions, loadingInteractions, getSentimentColor }: ContactHistoryTabProps) {
  return (
    <div className="h-[400px]">
      {loadingInteractions ? (
        <div className="py-8 text-center text-muted-foreground">Carregando histórico...</div>
      ) : interactions.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">
          <MessageSquare className="mx-auto mb-2 h-8 w-8 opacity-50" />
          Nenhuma interação registrada
        </div>
      ) : (
        <VirtualList
          items={interactions}
          estimateSize={120}
          height="400px"
          keyExtractor={(item) => item.id}
          renderItem={(interaction) => (
            <div className="p-1">
              <div className="rounded-lg border p-3 space-y-2 bg-card hover:border-primary/30 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {interaction.interaction_type === 'call' ? (
                      <Phone className="h-4 w-4 text-primary" />
                    ) : (
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="font-medium text-sm capitalize">
                      {interaction.interaction_type === 'call' ? 'Chamada' : interaction.interaction_type}
                    </span>
                    {interaction.direction && (
                      <Badge variant="outline" className="text-[10px] h-4 px-1">
                        {interaction.direction === 'inbound' ? 'Entrada' : 'Saída'}
                      </Badge>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground font-medium">
                    {formatDistanceToNow(new Date(interaction.created_at), { locale: ptBR, addSuffix: true })}
                  </span>
                </div>
                
                {interaction.summary && (
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed italic">
                    "{interaction.summary}"
                  </p>
                )}
                
                <div className="flex flex-wrap items-center gap-2">
                  {interaction.sentiment && (
                    <Badge className={`${getSentimentColor(interaction.sentiment)} text-[9px] h-4 px-1`}>
                      {interaction.sentiment}
                    </Badge>
                  )}
                  {interaction.duration_seconds && (
                    <Badge variant="secondary" className="text-[9px] h-4 px-1">
                      <Clock className="mr-1 h-2.5 w-2.5" />
                      {Math.floor(interaction.duration_seconds / 60)}min
                    </Badge>
                  )}
                  {interaction.agent_name && (
                    <Badge variant="outline" className="text-[9px] h-4 px-1">
                      <User className="mr-1 h-2.5 w-2.5" />
                      {interaction.agent_name}
                    </Badge>
                  )}
                </div>
                
                {interaction.topics && interaction.topics.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {interaction.topics.slice(0, 3).map((topic, i) => (
                      <Badge key={i} variant="secondary" className="text-[8px] h-3.5 px-1 bg-muted/50">
                        {topic}
                      </Badge>
                    ))}
                    {interaction.topics.length > 3 && (
                      <span className="text-[8px] text-muted-foreground">
                        +{interaction.topics.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        />
      )}
    </div>
  );
}

