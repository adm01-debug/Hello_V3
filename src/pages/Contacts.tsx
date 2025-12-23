import { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  Star, 
  Phone, 
  Mail, 
  Building2, 
  MoreHorizontal,
  Plus,
  Filter,
  RefreshCw,
  CloudDownload,
  Loader2
} from 'lucide-react';
import { Input } from '@/components/ui/input';
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

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const Contacts = () => {
  const [search, setSearch] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editContact, setEditContact] = useState<Contact | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const { contacts, isLoading, fetchContacts, deleteContact, createContact } = useContacts();
  const { isConfigured, getContacts: getBitrixContacts, isLoading: bitrixLoading } = useBitrix();

  // Filter contacts
  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(search.toLowerCase()) ||
    contact.phone?.includes(search) ||
    contact.company?.toLowerCase().includes(search.toLowerCase())
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

  // Sync with Bitrix24
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
        
        // Check if contact already exists by external_id
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
      console.error('Sync error:', error);
      toast.error('Erro ao sincronizar com Bitrix24');
    } finally {
      setIsSyncing(false);
    }
  }, [isConfigured, getBitrixContacts, contacts, createContact, fetchContacts]);

  const ContactCard = ({ contact }: { contact: Contact }) => (
    <Card 
      className="group cursor-pointer transition-all hover:border-primary/50 hover:shadow-md"
      onClick={() => handleContactClick(contact)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
                {getInitials(contact.name)}
              </div>
              {contact.source === 'bitrix24' && (
                <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-orange-500 flex items-center justify-center">
                  <span className="text-[8px] text-white font-bold">B</span>
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
                    'h-4 w-4',
                    favorites.includes(contact.id) 
                      ? 'fill-warning text-warning' 
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

        <div className="mt-4 flex items-center gap-2">
          {contact.phone && (
            <Badge variant="secondary" className="font-mono text-xs">
              {contact.phone}
            </Badge>
          )}
          {contact.email && (
            <Badge variant="outline" className="text-xs">
              <Mail className="mr-1 h-3 w-3" />
              Email
            </Badge>
          )}
          {contact.tags && contact.tags.length > 0 && (
            <Badge variant="outline" className="text-xs">
              +{contact.tags.length} tags
            </Badge>
          )}
        </div>

        <div className="mt-4 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
          <Button 
            size="sm" 
            className="flex-1 gap-2"
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
            className="gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <Mail className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contatos</h1>
          <p className="text-muted-foreground">
            Gerencie seus contatos e histórico de interações
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2"
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
            onClick={() => fetchContacts()}
            disabled={isLoading}
          >
            <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
          </Button>
          <Button className="gap-2" onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4" />
            Novo Contato
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, telefone ou empresa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          Filtros
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all" className="gap-2">
            Todos
            <Badge variant="secondary" className="ml-1">{allContacts.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="favorites" className="gap-2">
            <Star className="h-4 w-4" />
            Favoritos
            <Badge variant="secondary" className="ml-1">{favoriteContacts.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="bitrix" className="gap-2">
            Bitrix24
            <Badge variant="secondary" className="ml-1">
              {contacts.filter(c => c.source === 'bitrix24').length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {isLoading ? (
            <div className="py-12 text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
              <p className="mt-2 text-muted-foreground">Carregando contatos...</p>
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {allContacts.map(contact => (
                  <ContactCard key={contact.id} contact={contact} />
                ))}
              </div>
              {allContacts.length === 0 && (
                <div className="py-12 text-center text-muted-foreground">
                  Nenhum contato encontrado
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="favorites" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {favoriteContacts.map(contact => (
              <ContactCard key={contact.id} contact={contact} />
            ))}
          </div>
          {favoriteContacts.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              Nenhum favorito encontrado
            </div>
          )}
        </TabsContent>

        <TabsContent value="bitrix" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredContacts
              .filter(c => c.source === 'bitrix24')
              .map(contact => (
                <ContactCard key={contact.id} contact={contact} />
              ))
            }
          </div>
          {contacts.filter(c => c.source === 'bitrix24').length === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              <CloudDownload className="mx-auto mb-2 h-8 w-8 opacity-50" />
              <p>Nenhum contato do Bitrix24</p>
              <Button
                variant="link"
                className="mt-2"
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
