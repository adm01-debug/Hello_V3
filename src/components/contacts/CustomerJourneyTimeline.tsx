import { useState, useEffect, useMemo } from 'react';
import { 
  Phone, 
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Mail,
  MessageSquare,
  AlertCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  Star,
  Calendar,
  User,
  FileText,
  Zap
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { format, formatDistanceToNow, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ContactInteraction } from '@/hooks/useContacts';
import { supabase } from '@/integrations/supabase/client';

interface JourneyEvent {
  id: string;
  type: 'call' | 'email' | 'note' | 'alert' | 'created';
  subtype?: 'inbound' | 'outbound' | 'missed';
  title: string;
  description?: string;
  sentiment?: string | null;
  duration?: number | null;
  agent?: string | null;
  topics?: string[] | null;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

interface CustomerJourneyTimelineProps {
  contactId: string;
  interactions: ContactInteraction[];
  contactCreatedAt: string;
}

export function CustomerJourneyTimeline({ 
  contactId, 
  interactions,
  contactCreatedAt
}: CustomerJourneyTimelineProps) {
  const [alerts, setAlerts] = useState<Array<{
    id: string;
    title: string;
    message: string;
    severity: string;
    alert_type: string;
    created_at: string;
  }>>([]);

  useEffect(() => {
    const fetchAlerts = async () => {
      const { data } = await supabase
        .from('contact_alerts')
        .select('id, title, message, severity, alert_type, created_at')
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false });
      
      if (data) setAlerts(data);
    };

    fetchAlerts();
  }, [contactId]);

  // Convert all data into timeline events
  const journeyEvents = useMemo((): JourneyEvent[] => {
    const events: JourneyEvent[] = [];

    // Add contact creation event
    events.push({
      id: 'contact-created',
      type: 'created',
      title: 'Contato Criado',
      description: 'Início do relacionamento',
      timestamp: parseISO(contactCreatedAt)
    });

    // Add interactions
    interactions.forEach(interaction => {
      const subtype = interaction.direction === 'inbound' 
        ? 'inbound' 
        : interaction.direction === 'outbound' 
          ? 'outbound' 
          : undefined;

      events.push({
        id: interaction.id,
        type: interaction.interaction_type as 'call' | 'email' | 'note',
        subtype,
        title: getInteractionTitle(interaction),
        description: interaction.summary || undefined,
        sentiment: interaction.sentiment,
        duration: interaction.duration_seconds,
        agent: interaction.agent_name,
        topics: interaction.topics,
        timestamp: parseISO(interaction.created_at),
        metadata: interaction.metadata
      });
    });

    // Add alerts
    alerts.forEach(alert => {
      events.push({
        id: alert.id,
        type: 'alert',
        title: alert.title,
        description: alert.message,
        timestamp: parseISO(alert.created_at),
        metadata: { severity: alert.severity, alert_type: alert.alert_type }
      });
    });

    // Sort by timestamp descending (most recent first)
    return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [interactions, alerts, contactCreatedAt]);

  // Group events by date
  const groupedEvents = useMemo(() => {
    const groups: { date: Date; events: JourneyEvent[] }[] = [];
    
    journeyEvents.forEach(event => {
      const existingGroup = groups.find(g => isSameDay(g.date, event.timestamp));
      if (existingGroup) {
        existingGroup.events.push(event);
      } else {
        groups.push({ date: event.timestamp, events: [event] });
      }
    });

    return groups;
  }, [journeyEvents]);

  // Calculate journey stats
  const stats = useMemo(() => {
    const callEvents = journeyEvents.filter(e => e.type === 'call');
    const totalDuration = callEvents.reduce((acc, e) => acc + (e.duration || 0), 0);
    const sentiments = callEvents.map(e => e.sentiment).filter(Boolean);
    const positiveSentiments = sentiments.filter(s => 
      s?.toLowerCase() === 'positivo' || s?.toLowerCase() === 'positive'
    ).length;
    
    return {
      totalInteractions: journeyEvents.filter(e => e.type !== 'created' && e.type !== 'alert').length,
      totalCalls: callEvents.length,
      totalDuration,
      avgDuration: callEvents.length > 0 ? Math.round(totalDuration / callEvents.length) : 0,
      sentimentScore: sentiments.length > 0 
        ? Math.round((positiveSentiments / sentiments.length) * 100) 
        : null
    };
  }, [journeyEvents]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      {/* Journey Stats */}
      <div className="grid grid-cols-4 gap-2">
        <Card className="bg-muted/30">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold">{stats.totalInteractions}</p>
            <p className="text-xs text-muted-foreground">Interações</p>
          </CardContent>
        </Card>
        <Card className="bg-muted/30">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold">{stats.totalCalls}</p>
            <p className="text-xs text-muted-foreground">Chamadas</p>
          </CardContent>
        </Card>
        <Card className="bg-muted/30">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold">{formatDuration(stats.avgDuration)}</p>
            <p className="text-xs text-muted-foreground">Tempo Médio</p>
          </CardContent>
        </Card>
        <Card className="bg-muted/30">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold">
              {stats.sentimentScore !== null ? `${stats.sentimentScore}%` : '-'}
            </p>
            <p className="text-xs text-muted-foreground">Satisfação</p>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Timeline */}
      <ScrollArea className="h-[350px] pr-4">
        {groupedEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Calendar className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-sm">Nenhum evento registrado ainda</p>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedEvents.map((group, groupIndex) => (
              <div key={groupIndex} className="relative">
                {/* Date Header */}
                <div className="sticky top-0 z-10 mb-3 flex items-center gap-2 bg-background/95 py-1 backdrop-blur">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold">
                    {format(group.date, "d 'de' MMMM, yyyy", { locale: ptBR })}
                  </span>
                  <Badge variant="outline" className="ml-auto text-xs">
                    {group.events.length} {group.events.length === 1 ? 'evento' : 'eventos'}
                  </Badge>
                </div>

                {/* Events */}
                <div className="relative ml-2 border-l-2 border-muted pl-4 space-y-4">
                  {group.events.map((event, eventIndex) => (
                    <TimelineEvent 
                      key={event.id} 
                      event={event} 
                      isLast={eventIndex === group.events.length - 1}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

function TimelineEvent({ event, isLast }: { event: JourneyEvent; isLast: boolean }) {
  const getEventIcon = () => {
    switch (event.type) {
      case 'call':
        if (event.subtype === 'inbound') return <PhoneIncoming className="h-4 w-4" />;
        if (event.subtype === 'outbound') return <PhoneOutgoing className="h-4 w-4" />;
        if (event.subtype === 'missed') return <PhoneMissed className="h-4 w-4" />;
        return <Phone className="h-4 w-4" />;
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'note':
        return <FileText className="h-4 w-4" />;
      case 'alert':
        return <AlertCircle className="h-4 w-4" />;
      case 'created':
        return <Star className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getEventColor = () => {
    if (event.type === 'alert') {
      const severity = event.metadata?.severity as string;
      if (severity === 'critical') return 'bg-destructive text-destructive-foreground';
      if (severity === 'warning') return 'bg-warning text-warning-foreground';
      return 'bg-muted text-muted-foreground';
    }
    if (event.type === 'created') return 'bg-primary text-primary-foreground';
    if (event.type === 'call') {
      if (event.subtype === 'missed') return 'bg-destructive/10 text-destructive border border-destructive/20';
      return 'bg-success/10 text-success border border-success/20';
    }
    return 'bg-muted text-muted-foreground';
  };

  const getSentimentIcon = () => {
    if (!event.sentiment) return null;
    const s = event.sentiment.toLowerCase();
    if (s === 'positivo' || s === 'positive') return <TrendingUp className="h-3 w-3 text-success" />;
    if (s === 'negativo' || s === 'negative') return <TrendingDown className="h-3 w-3 text-destructive" />;
    return <Minus className="h-3 w-3 text-muted-foreground" />;
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <TooltipProvider>
      <div className="relative">
        {/* Timeline Dot */}
        <div className={`absolute -left-[22px] top-1 flex h-6 w-6 items-center justify-center rounded-full ${getEventColor()}`}>
          {getEventIcon()}
        </div>

        {/* Event Content */}
        <Card className="overflow-hidden transition-all hover:shadow-md">
          <CardContent className="p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">{event.title}</span>
                  {event.sentiment && (
                    <Tooltip>
                      <TooltipTrigger>
                        <Badge variant="outline" className="text-xs gap-1">
                          {getSentimentIcon()}
                          {event.sentiment}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>Sentimento da interação</TooltipContent>
                    </Tooltip>
                  )}
                </div>

                {event.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {event.description}
                  </p>
                )}

                {/* Topics */}
                {event.topics && event.topics.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {event.topics.slice(0, 3).map((topic, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {topic}
                      </Badge>
                    ))}
                    {event.topics.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{event.topics.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Meta info */}
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {format(event.timestamp, 'HH:mm', { locale: ptBR })}
                  </span>
                  {event.duration && (
                    <span className="flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      {formatDuration(event.duration)}
                    </span>
                  )}
                  {event.agent && (
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {event.agent}
                    </span>
                  )}
                </div>
              </div>

              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {formatDistanceToNow(event.timestamp, { 
                  locale: ptBR, 
                  addSuffix: true 
                })}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}

function getInteractionTitle(interaction: ContactInteraction): string {
  const direction = interaction.direction === 'inbound' 
    ? 'Recebida' 
    : interaction.direction === 'outbound' 
      ? 'Realizada' 
      : '';

  switch (interaction.interaction_type) {
    case 'call':
      return `Chamada ${direction}`.trim();
    case 'email':
      return `E-mail ${direction}`.trim();
    case 'note':
      return 'Nota Adicionada';
    default:
      return 'Interação';
  }
}
