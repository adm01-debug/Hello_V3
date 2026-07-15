import { useState, useCallback } from 'react';
import {
  Star, Phone, Mail, Building2, MoreHorizontal, Plus, Filter, RefreshCw, CloudDownload, Loader2, Users, Zap
} from 'lucide-react';
import { SearchInput } from '@/components/ui/search-input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useContacts, Contact } from '@/hooks/useContacts';
import { useBitrix } from '@/hooks/useBitrix';
import { ContactDetailSheet } from '@/components/contacts/ContactDetailSheet';
import { CreateContactDialog } from '@/components/contacts/CreateContactDialog';
import { motion } from 'framer-motion';
import { logger } from '@/lib/logger';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useDebouncedSearchParam } from '@/hooks/useDebouncedSearchParam';

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15, scale: 0.97 },
  show: { 
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] }
  }
};

const Contacts = () => {
  usePageTitle('Contatos');
  const {
    inputValue: searchInput,
    debouncedValue: search,
    setValue: setSearch,
  } = useDebouncedSearchParam({ paramKey: 'q', delay: 250 });
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editContact, setEditContact] = useState<Contact | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const { contacts, isLoading, fetchContacts, deleteContact, createContact } = useContacts();
  const { isConfigured, getContacts: getBitrixContacts, isLoading: bitrixLoading } = useBitrix();

  const searchLower = search.toLowerCase();
  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchLower) ||
    contact.phone?.includes(search) ||
    contact.company?.toLowerCase().includes(searchLower)
  );

  const favoriteContacts = filteredContacts.filter(c => favorites.includes(c.id));
  const allContacts = filteredContacts;

  const toggleFavorite = (id: string) => {
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const handleCall = (contact: Contact) => {
    toast.info(`Ligando para ${contact.name}...`);
  };

  const handleContactClick = (contact: Contact) => {
    setSelectedContact(contact);
    setShowDetail(true);
  };

  const handleEdit = (contact: Contact) => {
    setEditContact(contact);
    setShowCreateDialog(true);
  };

  const handleDelete = async (contact: Contact) => {
    if (confirm(`Remover ${contact.name}?`)) {
      await deleteContact(contact.id);
      setShowDetail(false);
    }
  };

  const syncWithBitrix = useCallback(async () => {
    if (!isConfigured) {
      toast.error('Bitrix24 não configurado', {
        description: 'Configure a URL do webhook nas Configurações'
      });
      return;
    }

    setIsSyncing(true);
    try {
      const bitrixContacts = await getBitrixContacts();
      
      if (!bitrixContacts || bitrixContacts.length === 0) {
        toast.info('Nenhum contato encontrado no Bitrix24');
        return;
      }

      let imported = 0;
      for (const bc of bitrixContacts) {
        const phone = bc.PHONE?.[0]?.VALUE;
        const email = bc.EMAIL?.[0]?.VALUE;
        
        const exists = contacts.find(c => c.external_id === bc.ID);
        if (!exists) {
          await createContact({
            name: `${bc.NAME || ''} ${bc.LAST_NAME || ''}`.trim() || 'Sem nome',
            phone: phone,
            email: email,
            external_id: bc.ID,
            source: 'bitrix24'
          });
          imported++;
        }
      }

      await fetchContacts();
      toast.success(`Sincronização concluída`, {
        description: `${imported} novos contatos importados do Bitrix24`
      });
    } catch (error) {
      logger.error('Sync error:', error);
      toast.error('Erro ao sincronizar com Bitrix24');
    } finally {
      setIsSyncing(false);
    }
  }, [isConfigured, getBitrixContacts, contacts, createContact, fetchContacts]);

  const ContactCard = ({ contact }: { contact: Contact }) => (
    <motion.div variants={itemVariants}>
      <Card 
        className="group cursor-pointer transition-all duration-300 border-border/40 hover:border-primary/30 hover:shadow-[0_0_25px_hsl(var(--primary)/0.12)]"
        onClick={() => handleContactClick(contact)}
      >
        <CardContent className="p-4 relative overflow-hidden">
          {/* Hover glow effect */}
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
                      toggleFavorite(contact.id);
                    }}
                  >
                    <Star className={cn(
                      'h-4 w-4 transition-all',
                      favorites.includes(contact.id) 
                        ? 'fill-warning text-warning drop-shadow-[0_0_4px_hsl(var(--warning)/0.5)]' 
                        : 'text-muted-foreground'
                    )} />
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
              <Badge variant="secondary" className="font-mono text-xs bg-primary/5 text-primary border border-primary/15">
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
                handleCall(contact);
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

  const renderContactGrid = (contactList: Contact[]) => (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
    >
      {contactList.map(contact => (
        <ContactCard key={contact.id} contact={contact} />
      ))}
    </motion.div>
  );

  return (
    <div className="space-y-6 relative">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none gradient-mesh-intense opacity-30" />

      <div className="relative flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gradient">Contatos</h1>
          <p className="text-muted-foreground">
            Gerencie seus contatos e histórico de interações
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2 border-border/50 hover:border-primary/30 hover:shadow-[0_0_12px_hsl(var(--primary)/0.1)]"
            onClick={syncWithBitrix}
            disabled={isSyncing || bitrixLoading}
          >
            {isSyncing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CloudDownload className="h-4 w-4" />
            )}
            Sincronizar Bitrix
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="border-border/50 hover:border-primary/30"
            onClick={() => fetchContacts()}
            disabled={isLoading}
          >
            <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
          </Button>
          <Button className="gap-2 shadow-[0_0_15px_hsl(var(--primary)/0.2)]" onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4" />
            Novo Contato
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="relative flex items-center gap-4">
        <SearchInput
          value={searchInput}
          onValueChange={setSearch}
          placeholder="Buscar por nome, telefone ou empresa..."
          wrapperClassName="flex-1"
          className="bg-muted/30 border-border/50 focus:border-primary/40 focus:shadow-[0_0_15px_hsl(var(--primary)/0.12)] transition-shadow"
        />
        <Button variant="outline" className="gap-2 border-border/50 hover:border-primary/30">
          <Filter className="h-4 w-4" />
          Filtros
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="relative">
        <TabsList className="bg-muted/50 border border-border/30">
          <TabsTrigger value="all" className="gap-2 data-[state=active]:shadow-[0_0_10px_hsl(var(--primary)/0.15)]">
            Todos
            <Badge variant="secondary" className="ml-1 bg-primary/10 text-primary text-[10px]">{allContacts.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="favorites" className="gap-2 data-[state=active]:shadow-[0_0_10px_hsl(var(--primary)/0.15)]">
            <Star className="h-4 w-4" />
            Favoritos
            <Badge variant="secondary" className="ml-1 bg-primary/10 text-primary text-[10px]">{favoriteContacts.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="bitrix" className="gap-2 data-[state=active]:shadow-[0_0_10px_hsl(var(--primary)/0.15)]">
            Bitrix24
            <Badge variant="secondary" className="ml-1 bg-primary/10 text-primary text-[10px]">
              {contacts.filter(c => c.source === 'bitrix24').length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {isLoading ? (
            <div className="py-12 text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
              <p className="mt-2 text-muted-foreground">Carregando contatos...</p>
            </div>
          ) : (
            <>
              {renderContactGrid(allContacts)}
              {allContacts.length === 0 && (
                <div className="py-16 text-center">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground">Nenhum contato encontrado</p>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="favorites" className="mt-6">
          {renderContactGrid(favoriteContacts)}
          {favoriteContacts.length === 0 && (
            <div className="py-16 text-center">
              <Star className="mx-auto h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">Nenhum favorito encontrado</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="bitrix" className="mt-6">
          {renderContactGrid(filteredContacts.filter(c => c.source === 'bitrix24'))}
          {contacts.filter(c => c.source === 'bitrix24').length === 0 && (
            <div className="py-16 text-center">
              <CloudDownload className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
              <p className="text-muted-foreground">Nenhum contato do Bitrix24</p>
              <Button
                variant="link"
                className="mt-2 text-primary"
                onClick={syncWithBitrix}
              >
                Sincronizar agora
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Contact Detail Sheet */}
      <ContactDetailSheet
        contact={selectedContact}
        open={showDetail}
        onOpenChange={setShowDetail}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCall={handleCall}
      />

      {/* Create/Edit Contact Dialog */}
      <CreateContactDialog
        open={showCreateDialog}
        onOpenChange={(open) => {
          setShowCreateDialog(open);
          if (!open) setEditContact(null);
        }}
        editContact={editContact}
        onSuccess={() => fetchContacts()}
      />
    </div>
  );
};

export default Contacts;
