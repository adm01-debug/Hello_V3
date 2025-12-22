import { useState } from 'react';
import { 
  Search, 
  Star, 
  Phone, 
  Mail, 
  Building2, 
  MoreHorizontal,
  Plus,
  Filter
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockContacts, getInitials } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

const Contacts = () => {
  const [search, setSearch] = useState('');
  const [favorites, setFavorites] = useState<string[]>(
    mockContacts.filter(c => c.favorite).map(c => c.id)
  );

  const filteredContacts = mockContacts.filter(contact =>
    contact.name.toLowerCase().includes(search.toLowerCase()) ||
    contact.phone.includes(search) ||
    contact.company?.toLowerCase().includes(search.toLowerCase())
  );

  const favoriteContacts = filteredContacts.filter(c => favorites.includes(c.id));
  const allContacts = filteredContacts;

  const toggleFavorite = (id: string) => {
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const handleCall = (name: string, phone: string) => {
    toast({
      title: '📞 Iniciando chamada',
      description: `Ligando para ${name}...`,
    });
  };

  const ContactCard = ({ contact }: { contact: typeof mockContacts[0] }) => (
    <Card className="group transition-all hover:border-primary/50 hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
                {getInitials(contact.name)}
              </div>
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{contact.name}</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => toggleFavorite(contact.id)}
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

          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <Badge variant="secondary" className="font-mono text-xs">
            {contact.phone}
          </Badge>
          {contact.email && (
            <Badge variant="outline" className="text-xs">
              <Mail className="mr-1 h-3 w-3" />
              Email
            </Badge>
          )}
        </div>

        <div className="mt-4 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
          <Button 
            size="sm" 
            className="flex-1 gap-2"
            onClick={() => handleCall(contact.name, contact.phone)}
          >
            <Phone className="h-4 w-4" />
            Ligar
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
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
          <p className="text-muted-foreground">Gerencie seus contatos e favoritos</p>
        </div>
        
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Contato
        </Button>
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
        </TabsList>

        <TabsContent value="all" className="mt-6">
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
      </Tabs>
    </div>
  );
};

export default Contacts;
