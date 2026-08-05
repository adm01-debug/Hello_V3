import { useEffect, useMemo, useState } from 'react';
import {
  CloudDownload,
  Loader2,
  Plus,
  RefreshCw,
  Star,
  Users,
} from 'lucide-react';
import { SearchInput } from '@/components/ui/search-input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useContacts, type Contact } from '@/hooks/useContacts';
import { ContactDetailSheet } from '@/components/contacts/ContactDetailSheet';
import { CreateContactDialog } from '@/components/contacts/CreateContactDialog';
import { ContactGrid } from '@/components/contacts/ContactGrid';
import {
  ContactFilters,
  defaultContactFilters,
  type ContactFiltersState,
} from '@/components/contacts/ContactFilters';
import {
  ContactPagination,
  type PageSize,
} from '@/components/contacts/ContactPagination';
import { useBitrixSync } from '@/components/contacts/useBitrixSync';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useDebouncedSearchParam } from '@/hooks/useDebouncedSearchParam';

const DEFAULT_PAGE_SIZE: PageSize = 24;

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
  const [filters, setFilters] = useState<ContactFiltersState>(defaultContactFilters);
  const [tab, setTab] = useState<'all' | 'favorites' | 'bitrix'>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(DEFAULT_PAGE_SIZE);

  const { contacts, isLoading, fetchContacts, deleteContact, createContact } = useContacts();
  const { syncWithBitrix, isSyncing, bitrixLoading } = useBitrixSync({
    contacts,
    createContact,
    fetchContacts,
  });

  // Aplicação combinada de busca + filtros + ordenação
  const filteredContacts = useMemo(() => {
    const term = search.trim().toLowerCase();
    const digits = term.replace(/\D/g, '');

    const matched = contacts.filter((c) => {
      // Busca textual multi-campo
      if (term) {
        const hitsText =
          c.name.toLowerCase().includes(term) ||
          (c.company?.toLowerCase().includes(term) ?? false) ||
          (c.email?.toLowerCase().includes(term) ?? false) ||
          (c.tags?.some((t) => t.toLowerCase().includes(term)) ?? false);
        const hitsPhone =
          digits.length > 0 && (c.phone?.replace(/\D/g, '').includes(digits) ?? false);
        if (!hitsText && !hitsPhone) return false;
      }

      if (filters.source !== 'all' && c.source !== filters.source) return false;
      if (filters.hasPhone && !c.phone) return false;
      if (filters.hasEmail && !c.email) return false;
      if (filters.company && c.company !== filters.company) return false;
      if (filters.tag && !c.tags?.includes(filters.tag)) return false;
      return true;
    });

    const sorted = [...matched];
    switch (filters.sort) {
      case 'name-asc':
        sorted.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
        break;
      case 'name-desc':
        sorted.sort((a, b) => b.name.localeCompare(a.name, 'pt-BR'));
        break;
      case 'company':
        sorted.sort((a, b) =>
          (a.company ?? '').localeCompare(b.company ?? '', 'pt-BR') ||
          a.name.localeCompare(b.name, 'pt-BR'),
        );
        break;
      case 'recent':
      default:
        sorted.sort(
          (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
        );
    }
    return sorted;
  }, [contacts, search, filters]);

  const favoriteContacts = useMemo(
    () => filteredContacts.filter((c) => favorites.includes(c.id)),
    [filteredContacts, favorites],
  );
  const bitrixContacts = useMemo(
    () => filteredContacts.filter((c) => c.source === 'bitrix24'),
    [filteredContacts],
  );
  const totalBitrix = useMemo(
    () => contacts.filter((c) => c.source === 'bitrix24').length,
    [contacts],
  );

  const activeList =
    tab === 'favorites' ? favoriteContacts : tab === 'bitrix' ? bitrixContacts : filteredContacts;

  // Reset da paginação quando filtros/busca/aba mudam
  useEffect(() => {
    setPage(1);
  }, [search, filters, tab, pageSize]);

  const total = activeList.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginated = useMemo(
    () => activeList.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [activeList, currentPage, pageSize],
  );

  const toggleFavorite = (id: string) =>
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id],
    );

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

  const gridProps = {
    favorites,
    onToggleFavorite: toggleFavorite,
    onSelect: handleContactClick,
    onCall: handleCall,
  };

  const showPagination = total > pageSize;

  return (
    <div className="space-y-6 relative">
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
            aria-label="Recarregar contatos"
          >
            <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
          </Button>
          <Button
            className="gap-2 shadow-[0_0_15px_hsl(var(--primary)/0.2)]"
            onClick={() => setShowCreateDialog(true)}
          >
            <Plus className="h-4 w-4" />
            Novo Contato
          </Button>
        </div>
      </div>

      <div className="relative flex items-center gap-4">
        <SearchInput
          value={searchInput}
          onValueChange={setSearch}
          placeholder="Buscar por nome, telefone, email, empresa ou tag..."
          wrapperClassName="flex-1"
          className="bg-muted/30 border-border/50 focus:border-primary/40 focus:shadow-[0_0_15px_hsl(var(--primary)/0.12)] transition-shadow"
        />
        <ContactFilters contacts={contacts} value={filters} onChange={setFilters} />
      </div>

      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as 'all' | 'favorites' | 'bitrix')}
        className="relative"
      >
        <TabsList className="bg-muted/50 border border-border/30">
          <TabsTrigger
            value="all"
            className="gap-2 data-[state=active]:shadow-[0_0_10px_hsl(var(--primary)/0.15)]"
          >
            Todos
            <Badge variant="secondary" className="ml-1 bg-primary/10 text-primary text-[10px]">
              {filteredContacts.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger
            value="favorites"
            className="gap-2 data-[state=active]:shadow-[0_0_10px_hsl(var(--primary)/0.15)]"
          >
            <Star className="h-4 w-4" />
            Favoritos
            <Badge variant="secondary" className="ml-1 bg-primary/10 text-primary text-[10px]">
              {favoriteContacts.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger
            value="bitrix"
            className="gap-2 data-[state=active]:shadow-[0_0_10px_hsl(var(--primary)/0.15)]"
          >
            Bitrix24
            <Badge variant="secondary" className="ml-1 bg-primary/10 text-primary text-[10px]">
              {totalBitrix}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-6 space-y-4">
          {isLoading ? (
            <div className="py-12 text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
              <p className="mt-2 text-muted-foreground">Carregando contatos...</p>
            </div>
          ) : total === 0 ? (
            <div className="py-16 text-center">
              {tab === 'favorites' ? (
                <>
                  <Star className="mx-auto h-12 w-12 text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground">Nenhum favorito encontrado</p>
                </>
              ) : tab === 'bitrix' && totalBitrix === 0 ? (
                <>
                  <CloudDownload className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
                  <p className="text-muted-foreground">Nenhum contato do Bitrix24</p>
                  <Button variant="link" className="mt-2 text-primary" onClick={syncWithBitrix}>
                    Sincronizar agora
                  </Button>
                </>
              ) : (
                <>
                  <Users className="mx-auto h-12 w-12 text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground">Nenhum contato encontrado</p>
                  {(search || filters !== defaultContactFilters) && (
                    <Button
                      variant="link"
                      className="mt-2 text-primary"
                      onClick={() => {
                        setSearch('');
                        setFilters(defaultContactFilters);
                      }}
                    >
                      Limpar busca e filtros
                    </Button>
                  )}
                </>
              )}
            </div>
          ) : (
            <>
              <ContactGrid contacts={paginated} {...gridProps} />
              {showPagination && (
                <ContactPagination
                  page={currentPage}
                  pageSize={pageSize}
                  total={total}
                  onPageChange={setPage}
                  onPageSizeChange={setPageSize}
                />
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      <ContactDetailSheet
        contact={selectedContact}
        open={showDetail}
        onOpenChange={setShowDetail}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCall={handleCall}
      />

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
