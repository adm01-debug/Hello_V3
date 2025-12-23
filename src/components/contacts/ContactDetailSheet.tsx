import { useState, useEffect } from 'react';
import { 
  Phone, 
  Mail, 
  Building2, 
  User, 
  Clock,
  MessageSquare,
  TrendingUp,
  Calendar,
  X,
  Edit,
  Trash2,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Contact, ContactInteraction, useContacts } from '@/hooks/useContacts';

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
  const { getContactInteractions } = useContacts();
  const [interactions, setInteractions] = useState<ContactInteraction[]>([]);
  const [loadingInteractions, setLoadingInteractions] = useState(false);

  useEffect(() => {
    if (contact && open) {
      setLoadingInteractions(true);
      getContactInteractions(contact.id)
        .then(setInteractions)
        .finally(() => setLoadingInteractions(false));
    }
  }, [contact, open, getContactInteractions]);

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
        return 'bg-success/10 text-success';
      case 'negativo':
      case 'negative':
        return 'bg-destructive/10 text-destructive';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg">
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
          <TabsList className="w-full">
            <TabsTrigger value="info" className="flex-1">Informações</TabsTrigger>
            <TabsTrigger value="history" className="flex-1">
              Histórico ({interactions.length})
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
