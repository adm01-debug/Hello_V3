import { motion } from 'framer-motion';
import { Building2, Mail, MoreHorizontal, Phone, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Contact } from '@/hooks/useContacts';

const getInitials = (name: string) =>
  name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

const itemVariants = {
  hidden: { opacity: 0, y: 15, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
    },
  },
};

interface ContactCardProps {
  contact: Contact;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onSelect: (contact: Contact) => void;
  onCall: (contact: Contact) => void;
}

export const ContactCard = ({
  contact,
  isFavorite,
  onToggleFavorite,
  onSelect,
  onCall,
}: ContactCardProps) => (
  <motion.div variants={itemVariants}>
    <Card
      className="group cursor-pointer transition-all duration-300 border-border/40 hover:border-primary/30 hover:shadow-[0_0_25px_hsl(var(--primary)/0.12)]"
      onClick={() => onSelect(contact)}
    >
      <CardContent className="p-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-primary/5 blur-2xl" />
        </div>

        <div className="relative flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary border border-primary/20 group-hover:shadow-[0_0_12px_hsl(var(--primary)/0.25)] transition-shadow duration-300">
                {getInitials(contact.name)}
              </div>
              {contact.source === 'bitrix24' && (
                <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-warning flex items-center justify-center shadow-[0_0_8px_hsl(var(--warning)/0.5)]">
                  <span className="text-[8px] text-warning-foreground font-bold">B</span>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{contact.name}</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(contact.id);
                  }}
                >
                  <Star
                    className={cn(
                      'h-4 w-4 transition-all',
                      isFavorite
                        ? 'fill-warning text-warning drop-shadow-[0_0_4px_hsl(var(--warning)/0.5)]'
                        : 'text-muted-foreground',
                    )}
                  />
                </Button>
              </div>

              {contact.company && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Building2 className="h-3 w-3" />
                  <span>{contact.company}</span>
                </div>
              )}
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-4 flex items-center gap-2 flex-wrap">
          {contact.phone && (
            <Badge
              variant="secondary"
              className="font-mono text-xs bg-primary/5 text-primary border border-primary/15"
            >
              {contact.phone}
            </Badge>
          )}
          {contact.email && (
            <Badge variant="outline" className="text-xs border-border/50">
              <Mail className="mr-1 h-3 w-3" />
              Email
            </Badge>
          )}
          {contact.tags && contact.tags.length > 0 && (
            <Badge variant="outline" className="text-xs border-border/50">
              +{contact.tags.length} tags
            </Badge>
          )}
        </div>

        <div className="mt-4 flex gap-2 opacity-0 transition-all duration-300 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0">
          <Button
            size="sm"
            className="flex-1 gap-2 shadow-[0_0_12px_hsl(var(--primary)/0.2)]"
            onClick={(e) => {
              e.stopPropagation();
              onCall(contact);
            }}
          >
            <Phone className="h-4 w-4" />
            Ligar
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-border/50 hover:border-primary/30"
            onClick={(e) => e.stopPropagation()}
          >
            <Mail className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);
