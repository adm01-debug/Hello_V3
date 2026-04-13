import { Phone, Mail, Calendar, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Contact, ContactInteraction } from '@/hooks/useContacts';

interface ContactInfoTabProps {
  contact: Contact;
  interactions: ContactInteraction[];
}

export function ContactInfoTab({ contact, interactions }: ContactInfoTabProps) {
  return (
    <div className="space-y-4">
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

      {contact.tags && contact.tags.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Tags</h4>
          <div className="flex flex-wrap gap-2">
            {contact.tags.map((tag, i) => <Badge key={i} variant="secondary">{tag}</Badge>)}
          </div>
        </div>
      )}

      {contact.notes && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Notas</h4>
          <p className="text-sm">{contact.notes}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border p-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MessageSquare className="h-4 w-4" /><span className="text-xs">Interações</span>
          </div>
          <p className="mt-1 text-2xl font-bold">{interactions.length}</p>
        </div>
        <div className="rounded-lg border p-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" /><span className="text-xs">Desde</span>
          </div>
          <p className="mt-1 text-sm font-medium">
            {formatDistanceToNow(new Date(contact.created_at), { locale: ptBR, addSuffix: true })}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Origem</span>
        <Badge variant="outline">{contact.source}</Badge>
      </div>
    </div>
  );
}
