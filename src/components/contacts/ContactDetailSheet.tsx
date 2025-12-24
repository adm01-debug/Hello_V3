import { useState, useEffect, useCallback } from 'react';
import { 
  Phone, 
  Mail, 
  Building2, 
  User, 
  Clock,
  MessageSquare,
  Calendar,
  Edit,
  Trash2,
  FileText,
  Brain,
  Sparkles,
  Heart,
  Target,
  TrendingUp,
  AlertCircle,
  Lightbulb,
  Loader2,
  RefreshCw,
  Route
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Contact, ContactInteraction, useContacts } from '@/hooks/useContacts';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CustomerJourneyTimeline } from './CustomerJourneyTimeline';

interface PersonalityProfile {
  personality_traits: string[];
  communication_style: string;
  preferred_contact_time: string;
  interests: string[];
  pain_points: string[];
  buying_signals: string[];
  relationship_status: string;
  engagement_level: string;
  sentiment_trend: string;
  recommendations: string[];
  summary: string;
}

interface ContactDetailSheetProps {
  contact: Contact | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (contact: Contact) => void;
  onDelete?: (contact: Contact) => void;
  onCall?: (contact: Contact) => void;
}

export function ContactDetailSheet({
  contact,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  onCall
}: ContactDetailSheetProps) {
  const { getContactInteractions, fetchContacts } = useContacts();
  const [interactions, setInteractions] = useState<ContactInteraction[]>([]);
  const [loadingInteractions, setLoadingInteractions] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [profile, setProfile] = useState<PersonalityProfile | null>(null);

  useEffect(() => {
    if (contact && open) {
      setLoadingInteractions(true);
      getContactInteractions(contact.id)
        .then(setInteractions)
        .finally(() => setLoadingInteractions(false));
      
      // Load existing profile
      if (contact.personality_insights && Object.keys(contact.personality_insights).length > 0) {
        setProfile(contact.personality_insights as unknown as PersonalityProfile);
      } else {
        setProfile(null);
      }
    }
  }, [contact, open, getContactInteractions]);

  const analyzeProfile = useCallback(async () => {
    if (!contact) return;
    
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-contact-profile', {
        body: { contactId: contact.id }
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error, { description: data.message });
        return;
      }

      setProfile(data.profile);
      toast.success('Análise de perfil concluída', {
        description: `${data.interactions_analyzed} interações analisadas`
      });
      
      // Refresh contacts to update the cache
      fetchContacts();
    } catch (err) {
      console.error('Error analyzing profile:', err);
      toast.error('Erro ao analisar perfil');
    } finally {
      setIsAnalyzing(false);
    }
  }, [contact, fetchContacts]);

  if (!contact) return null;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getSentimentColor = (sentiment: string | null) => {
    switch (sentiment?.toLowerCase()) {
      case 'positivo':
      case 'positive':
      case 'melhorando':
        return 'bg-success/10 text-success';
      case 'negativo':
      case 'negative':
      case 'piorando':
        return 'bg-destructive/10 text-destructive';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getEngagementColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'alto':
        return 'bg-success/10 text-success';
      case 'médio':
        return 'bg-warning/10 text-warning';
      case 'baixo':
        return 'bg-destructive/10 text-destructive';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getRelationshipLabel = (status: string) => {
    const labels: Record<string, string> = {
      novo: 'Novo',
      em_desenvolvimento: 'Em Desenvolvimento',
      estabelecido: 'Estabelecido',
      vip: 'VIP'
    };
    return labels[status] || status;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
                {getInitials(contact.name)}
              </div>
              <div>
                <SheetTitle className="text-left text-xl">{contact.name}</SheetTitle>
                {contact.company && (
                  <p className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Building2 className="h-3 w-3" />
                    {contact.company}
                    {contact.position && ` • ${contact.position}`}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={() => onCall?.(contact)} className="flex-1 gap-2">
              <Phone className="h-4 w-4" />
              Ligar
            </Button>
            <Button variant="outline" size="icon" onClick={() => onEdit?.(contact)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => onDelete?.(contact)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        <Separator className="my-4" />

        <Tabs defaultValue="info" className="flex-1">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="info">Info</TabsTrigger>
            <TabsTrigger value="journey" className="gap-1">
              <Route className="h-3 w-3" />
              Jornada
            </TabsTrigger>
            <TabsTrigger value="profile" className="gap-1">
              <Brain className="h-3 w-3" />
              Perfil IA
            </TabsTrigger>
            <TabsTrigger value="history">
              Histórico
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="mt-4 space-y-4">
            {/* Contact Info */}
            <div className="space-y-3">
              {contact.phone && (
                <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="font-mono">{contact.phone}</span>
                </div>
              )}
              {contact.email && (
                <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{contact.email}</span>
                </div>
              )}
            </div>

            {/* Tags */}
            {contact.tags && contact.tags.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {contact.tags.map((tag, i) => (
                    <Badge key={i} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {contact.notes && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Notas</h4>
                <p className="text-sm">{contact.notes}</p>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border p-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MessageSquare className="h-4 w-4" />
                  <span className="text-xs">Interações</span>
                </div>
                <p className="mt-1 text-2xl font-bold">{interactions.length}</p>
              </div>
              <div className="rounded-lg border p-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span className="text-xs">Desde</span>
                </div>
                <p className="mt-1 text-sm font-medium">
                  {formatDistanceToNow(new Date(contact.created_at), { 
                    locale: ptBR, 
                    addSuffix: true 
                  })}
                </p>
              </div>
            </div>

            {/* Source */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Origem</span>
              <Badge variant="outline">{contact.source}</Badge>
            </div>
          </TabsContent>

          <TabsContent value="journey" className="mt-4">
            <CustomerJourneyTimeline 
              contactId={contact.id}
              interactions={interactions}
              contactCreatedAt={contact.created_at}
            />
          </TabsContent>

          <TabsContent value="profile" className="mt-4">
            <ScrollArea className="h-[450px] pr-4">
              {!profile ? (
                <div className="py-8 text-center">
                  <Brain className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
                  <h3 className="font-semibold mb-2">Análise de Perfil IA</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Gere insights sobre personalidade, preferências e padrões de comunicação baseados no histórico de interações.
                  </p>
                  <Button 
                    onClick={analyzeProfile} 
                    disabled={isAnalyzing || interactions.length === 0}
                    className="gap-2"
                  >
                    {isAnalyzing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    {isAnalyzing ? 'Analisando...' : 'Gerar Análise'}
                  </Button>
                  {interactions.length === 0 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Registre interações para habilitar a análise
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Summary */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        Resumo do Perfil
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{profile.summary}</p>
                    </CardContent>
                  </Card>

                  {/* Status Cards */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-lg border p-2 text-center">
                      <p className="text-xs text-muted-foreground">Relacionamento</p>
                      <Badge variant="outline" className="mt-1 text-xs">
                        {getRelationshipLabel(profile.relationship_status)}
                      </Badge>
                    </div>
                    <div className="rounded-lg border p-2 text-center">
                      <p className="text-xs text-muted-foreground">Engajamento</p>
                      <Badge className={`mt-1 text-xs ${getEngagementColor(profile.engagement_level)}`}>
                        {profile.engagement_level}
                      </Badge>
                    </div>
                    <div className="rounded-lg border p-2 text-center">
                      <p className="text-xs text-muted-foreground">Tendência</p>
                      <Badge className={`mt-1 text-xs ${getSentimentColor(profile.sentiment_trend)}`}>
                        {profile.sentiment_trend}
                      </Badge>
                    </div>
                  </div>

                  {/* Personality Traits */}
                  {profile.personality_traits.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <User className="h-4 w-4 text-primary" />
                          Traços de Personalidade
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {profile.personality_traits.map((trait, i) => (
                            <Badge key={i} variant="secondary">{trait}</Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Communication Style */}
                  {profile.communication_style && profile.communication_style !== 'não identificado' && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-primary" />
                          Estilo de Comunicação
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">{profile.communication_style}</p>
                        {profile.preferred_contact_time && profile.preferred_contact_time !== 'não identificado' && (
                          <p className="text-xs text-muted-foreground mt-2">
                            <Clock className="inline h-3 w-3 mr-1" />
                            Melhor horário: {profile.preferred_contact_time}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Interests */}
                  {profile.interests.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Heart className="h-4 w-4 text-primary" />
                          Interesses
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {profile.interests.map((interest, i) => (
                            <Badge key={i} variant="outline">{interest}</Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Pain Points */}
                  {profile.pain_points.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-destructive" />
                          Pontos de Dor
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="text-sm space-y-1">
                          {profile.pain_points.map((pain, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-destructive">•</span>
                              {pain}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {/* Buying Signals */}
                  {profile.buying_signals.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Target className="h-4 w-4 text-success" />
                          Sinais de Compra
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="text-sm space-y-1">
                          {profile.buying_signals.map((signal, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-success">✓</span>
                              {signal}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {/* Recommendations */}
                  {profile.recommendations.length > 0 && (
                    <Card className="border-primary/20 bg-primary/5">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Lightbulb className="h-4 w-4 text-primary" />
                          Recomendações
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="text-sm space-y-2">
                          {profile.recommendations.map((rec, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-primary font-bold">{i + 1}.</span>
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {/* Refresh Button */}
                  <Button 
                    variant="outline" 
                    className="w-full gap-2" 
                    onClick={analyzeProfile}
                    disabled={isAnalyzing}
                  >
                    {isAnalyzing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    Atualizar Análise
                  </Button>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <ScrollArea className="h-[400px] pr-4">
              {loadingInteractions ? (
                <div className="py-8 text-center text-muted-foreground">
                  Carregando histórico...
                </div>
              ) : interactions.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <MessageSquare className="mx-auto mb-2 h-8 w-8 opacity-50" />
                  Nenhuma interação registrada
                </div>
              ) : (
                <div className="space-y-3">
                  {interactions.map((interaction) => (
                    <div
                      key={interaction.id}
                      className="rounded-lg border p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {interaction.interaction_type === 'call' ? (
                            <Phone className="h-4 w-4 text-primary" />
                          ) : (
                            <FileText className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="font-medium capitalize">
                            {interaction.interaction_type === 'call' ? 'Chamada' : interaction.interaction_type}
                          </span>
                          {interaction.direction && (
                            <Badge variant="outline" className="text-xs">
                              {interaction.direction === 'inbound' ? 'Entrada' : 'Saída'}
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(interaction.created_at), { 
                            locale: ptBR, 
                            addSuffix: true 
                          })}
                        </span>
                      </div>

                      {interaction.summary && (
                        <p className="text-sm text-muted-foreground">
                          {interaction.summary}
                        </p>
                      )}

                      <div className="flex items-center gap-2">
                        {interaction.sentiment && (
                          <Badge className={getSentimentColor(interaction.sentiment)}>
                            {interaction.sentiment}
                          </Badge>
                        )}
                        {interaction.duration_seconds && (
                          <Badge variant="secondary">
                            <Clock className="mr-1 h-3 w-3" />
                            {Math.floor(interaction.duration_seconds / 60)}min
                          </Badge>
                        )}
                        {interaction.agent_name && (
                          <Badge variant="outline">
                            <User className="mr-1 h-3 w-3" />
                            {interaction.agent_name}
                          </Badge>
                        )}
                      </div>

                      {interaction.topics && interaction.topics.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {interaction.topics.map((topic, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {topic}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
