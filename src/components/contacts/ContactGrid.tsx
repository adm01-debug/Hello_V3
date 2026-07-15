import { motion } from 'framer-motion';
import type { Contact } from '@/hooks/useContacts';
import { ContactCard } from './ContactCard';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

interface Props {
  contacts: Contact[];
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  onSelect: (contact: Contact) => void;
  onCall: (contact: Contact) => void;
}

export const ContactGrid = ({
  contacts,
  favorites,
  onToggleFavorite,
  onSelect,
  onCall,
}: Props) => (
  <motion.div
    variants={containerVariants}
    initial="hidden"
    animate="show"
    className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
  >
    {contacts.map((contact) => (
      <ContactCard
        key={contact.id}
        contact={contact}
        isFavorite={favorites.includes(contact.id)}
        onToggleFavorite={onToggleFavorite}
        onSelect={onSelect}
        onCall={onCall}
      />
    ))}
  </motion.div>
);
