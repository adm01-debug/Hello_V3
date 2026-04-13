import { useState, useEffect, useCallback } from 'react';
import { Phone, Mail, Building2, User, Clock, MessageSquare, Calendar, Edit, Trash2, Brain, Route } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Contact, ContactInteraction, useContacts } from '@/hooks/useContacts';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CustomerJourneyTimeline } from './CustomerJourneyTimeline';
import { ContactProfileTab } from './ContactProfileTab';
import { ContactHistoryTab } from './ContactHistoryTab';
import { useAuditLog } from '@/hooks/useAuditLog';
import { logger } from '@/lib/logger';

interface PersonalityProfile {
  personality_traits: string[]; communication_style: string; preferred_contact_time: string;
  interests: string[]; pain_points: string[]; buying_signals: string[];
  relationship_status: string; engagement_level: string; sentiment_trend: string;
  recommendations: string[]; summary: string;
}

interface ContactDetailSheetProps {
  contact: Contact | null; open: boolean; onOpenChange: (open: boolean) => void;
  onEdit?: (contact: Contact) => void; onDelete?: (contact: Contact) => void; onCall?: (contact: Contact) => void;
}

export function ContactDetailSheet({ contact, open, onOpenChange, onEdit, onDelete, onCall }: ContactDetailSheetProps) {
  const { getContactInteractions, fetchContacts } = useContacts();
  const { logContactAccess } = useAuditLog();
  const [interactions, setInteractions] = useState<ContactInteraction[]>([]);
  const [loadingInteractions, setLoadingInteractions] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [profile, setProfile] = useState<PersonalityProfile | null>(null);

  useEffect(() => {
    if (contact && open) {
      logContactAccess(contact.id, contact.name);
      setLoadingInteractions(true);
      getContactInteractions(contact.id).then(setInteractions).finally(() => setLoadingInteractions(false));
      if (contact.personality_insights && Object.keys(contact.personality_insights).length > 0) {
        setProfile(contact.personality_insights as unknown as PersonalityProfile);
      } else { setProfile(null); }
    }
  }, [contact, open, getContactInteractions, logContactAccess]);

  const analyzeProfile = useCallback(async () => {
    if (!contact) return;
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-contact-profile', { body: { contactId: contact.id } });
      if (error) throw error;
      if (data.error) { toast.error(data.error, { description: data.message }); return; }
      setProfile(data.profile);
      toast.success('Análise de perfil concluída', { description: `${data.interactions_analyzed} interações analisadas` });
      fetchContacts();
    } catch (err) { logger.error('Error analyzing profile:', err); toast.error('Erro ao analisar perfil'); }
    finally { setIsAnalyzing(false); }
  }, [contact, fetchContacts]);

  if (!contact) return null;

  const getInitials = (name: string) => name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const getSentimentColor = (sentiment: string | null) => {
    switch (sentiment?.toLowerCase()) {
      case 'positivo': case 'positive': case 'melhorando': return 'bg-success/10 text-success';
      case 'negativo': case 'negative': case 'piorando': return 'bg-destructive/10 text-destructive';
      default: return 'bg-muted text-muted-foreground';
    }
  };
  const getEngagementColor = (level: string) => {
    switch (level?.toLowerCase()) { case 'alto': return 'bg-success/10 text-success'; case 'médio': return 'bg-warning/10 text-warning'; case 'baixo': return 'bg-destructive/10 text-destructive'; default: return 'bg-muted text-muted-foreground'; }
  };
  const getRelationshipLabel = (status: string) => ({ novo: 'Novo', em_desenvolvimento: 'Em Desenvolvimento', estabelecido: 'Estabelecido', vip: 'VIP' }[status] || status);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">{getInitials(contact.name)}</div>
              <div>
                <SheetTitle className="text-left text-xl">{contact.name}</SheetTitle>
                {contact.company && <p className="flex items-center gap-1 text-sm text-muted-foreground"><Building2 className="h-3 w-3" />{contact.company}{contact.position && ` • ${contact.position}`}</p>}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => onCall?.(contact)} className="flex-1 gap-2"><Phone className="h-4 w-4" />Ligar</Button>
            <Button variant="outline" size="icon" onClick={() => onEdit?.(contact)}><Edit className="h-4 w-4" /></Button>
            <Button variant="outline" size="icon" onClick={() => onDelete?.(contact)}><Edit className="h-4 w-4" /></Button>
          </div>
        </SheetHeader>
        <Separator className="my-4" />
        <Tabs defaultValue="info" className="flex-1">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="info">Info</TabsTrigger>
            <TabsTrigger value="journey" className="gap-1"><Route className="h-3 w-3" />Jornada</TabsTrigger>
            <TabsTrigger value="profile" className="gap-1"><Brain className="h-3 w-3" />Perfil IA</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
          </TabsList>
          <TabsContent value="info" className="mt-4 space-y-4">
            <div className="space-y-3">
              {contact.phone && <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3"><Phone className="h-4 w-4 text-muted-foreground" /><span className="font-mono">{contact.phone}</span></div>}
              {contact.email && <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3"><Mail className="h-4 w-4 text-muted-foreground" /><span>{contact.email}</span></div>}
            </div>
            {contact.tags && contact.tags.length > 0 && <div className="space-y-2"><h4 className="text-sm font-medium text-muted-foreground">Tags</h4><div className="flex flex-wrap gap-2">{contact.tags.map((tag, i) => <Badge key={i} variant="secondary">{tag}</Badge>)}</div></div>}
            {contact.notes && <div className="space-y-2"><h4 className="text-sm font-medium text-muted-foreground">Notas</h4><p className="text-sm">{contact.notes}</p></div>}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border p-3"><div className="flex items-center gap-2 text-muted-foreground"><MessageSquare className="h-4 w-4" /><span className="text-xs">Interações</span></div><p className="mt-1 text-2xl font-bold">{interactions.length}</p></div>
              <div className="rounded-lg border p-3"><div className="flex items-center gap-2 text-muted-foreground"><Calendar className="h-4 w-4" /><span className="text-xs">Desde</span></div><p className="mt-1 text-sm font-medium">{formatDistanceToNow(new Date(contact.created_at), { locale: ptBR, addSuffix: true })}</p></div>
            </div>
            <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Origem</span><Badge variant="outline">{contact.source}</Badge></div>
          </TabsContent>
          <TabsContent value="journey" className="mt-4"><CustomerJourneyTimeline contactId={contact.id} interactions={interactions} contactCreatedAt={contact.created_at} /></TabsContent>
          <TabsContent value="profile" className="mt-4">
            <ContactProfileTab profile={profile} isAnalyzing={isAnalyzing} interactionsCount={interactions.length} onAnalyze={analyzeProfile} getEngagementColor={getEngagementColor} getSentimentColor={getSentimentColor} getRelationshipLabel={getRelationshipLabel} />
          </TabsContent>
          <TabsContent value="history" className="mt-4">
            <ContactHistoryTab interactions={interactions} loadingInteractions={loadingInteractions} getSentimentColor={getSentimentColor} />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
