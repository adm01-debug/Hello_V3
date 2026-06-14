import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Phone, Mail, MessageSquare, Calendar, type LucideIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Interaction {
  id: string;
  interaction_type: string;
  created_at: string;
  summary?: string | null;
  sentiment?: string | null;
  direction?: string | null;
  duration_seconds?: number | null;
  agent_name?: string | null;
}

interface CustomerJourneyTimelineProps {
  contactId: string;
  interactions: Interaction[];
  contactCreatedAt?: string;
}

const typeIcons: Record<string, LucideIcon> = {
  call: Phone,
  email: Mail,
  chat: MessageSquare,
};

const sentimentColors: Record<string, string> = {
  positive: 'bg-success/10 text-success border-success/20',
  neutral: 'bg-warning/10 text-warning border-warning/20',
  negative: 'bg-destructive/10 text-destructive border-destructive/20',
};

export function CustomerJourneyTimeline({ contactId, interactions }: CustomerJourneyTimelineProps) {
  if (!interactions.length) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Nenhuma interação registrada
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {interactions.map((interaction, index) => {
        const Icon = typeIcons[interaction.interaction_type] || Calendar;
        return (
          <div key={interaction.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="p-2 rounded-full bg-primary/10">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              {index < interactions.length - 1 && (
                <div className="w-px h-full bg-border mt-1" />
              )}
            </div>
            <div className="flex-1 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium capitalize">
                  {interaction.interaction_type}
                </span>
                {interaction.sentiment && (
                  <Badge variant="outline" className={cn('text-xs', sentimentColors[interaction.sentiment])}>
                    {interaction.sentiment}
                  </Badge>
                )}
                {interaction.direction && (
                  <Badge variant="outline" className="text-xs">
                    {interaction.direction === 'inbound' ? 'Entrada' : 'Saída'}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {format(new Date(interaction.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                {interaction.agent_name && ` • ${interaction.agent_name}`}
              </p>
              {interaction.summary && (
                <p className="text-sm mt-1 text-muted-foreground">{interaction.summary}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
