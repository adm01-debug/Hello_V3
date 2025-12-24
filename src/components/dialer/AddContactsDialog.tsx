import { useState } from 'react';
import { 
  Users, 
  Plus,
  Loader2,
  Upload,
  UserPlus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePredictiveDialer, AddToQueueInput } from '@/hooks/usePredictiveDialer';
import { useContacts } from '@/hooks/useContacts';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';

interface AddContactsDialogProps {
  campaignId: string;
}

export function AddContactsDialog({ campaignId }: AddContactsDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToQueue } = usePredictiveDialer();
  const { contacts } = useContacts();

  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [manualEntry, setManualEntry] = useState({
    name: '',
    phone: ''
  });
  const [bulkNumbers, setBulkNumbers] = useState('');

  const handleAddManual = async () => {
    if (!manualEntry.phone) return;

    setIsSubmitting(true);
    
    const items: AddToQueueInput[] = [{
      campaign_id: campaignId,
      phone: manualEntry.phone,
      name: manualEntry.name || undefined
    }];

    await addToQueue(items);
    setIsSubmitting(false);
    setManualEntry({ name: '', phone: '' });
  };

  const handleAddFromContacts = async () => {
    if (selectedContacts.size === 0) return;

    setIsSubmitting(true);
    
    const items: AddToQueueInput[] = Array.from(selectedContacts).map(contactId => {
      const contact = contacts.find(c => c.id === contactId);
      return {
        campaign_id: campaignId,
        phone: contact?.phone || '',
        name: contact?.name,
        contact_id: contactId
      };
    }).filter(item => item.phone);

    await addToQueue(items);
    setIsSubmitting(false);
    setSelectedContacts(new Set());
    setOpen(false);
  };

  const handleAddBulk = async () => {
    if (!bulkNumbers.trim()) return;

    setIsSubmitting(true);

    const lines = bulkNumbers.split('\n').filter(line => line.trim());
    const items: AddToQueueInput[] = lines.map(line => {
      const parts = line.split(',').map(p => p.trim());
      return {
        campaign_id: campaignId,
        phone: parts[0],
        name: parts[1] || undefined
      };
    }).filter(item => item.phone);

    if (items.length > 0) {
      await addToQueue(items);
      setBulkNumbers('');
      setOpen(false);
    }

    setIsSubmitting(false);
  };

  const toggleContact = (contactId: string) => {
    const newSet = new Set(selectedContacts);
    if (newSet.has(contactId)) {
      newSet.delete(contactId);
    } else {
      newSet.add(contactId);
    }
    setSelectedContacts(newSet);
  };

  const selectAllContacts = () => {
    if (selectedContacts.size === contacts.filter(c => c.phone).length) {
      setSelectedContacts(new Set());
    } else {
      setSelectedContacts(new Set(contacts.filter(c => c.phone).map(c => c.id)));
    }
  };

  const contactsWithPhone = contacts.filter(c => c.phone);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full gap-2">
          <UserPlus className="h-4 w-4" />
          Adicionar Contatos
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Adicionar Contatos à Fila
          </DialogTitle>
          <DialogDescription>
            Adicione contatos para a campanha de discagem
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="contacts">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="contacts">Contatos</TabsTrigger>
            <TabsTrigger value="manual">Manual</TabsTrigger>
            <TabsTrigger value="bulk">Em Massa</TabsTrigger>
          </TabsList>

          <TabsContent value="contacts" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <Label>Selecione os contatos</Label>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm"
                onClick={selectAllContacts}
              >
                {selectedContacts.size === contactsWithPhone.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
              </Button>
            </div>

            <ScrollArea className="h-[250px] border rounded-lg p-2">
              {contactsWithPhone.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Users className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">Nenhum contato com telefone</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {contactsWithPhone.map(contact => (
                    <div 
                      key={contact.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer"
                      onClick={() => toggleContact(contact.id)}
                    >
                      <Checkbox 
                        checked={selectedContacts.has(contact.id)}
                        onCheckedChange={() => toggleContact(contact.id)}
                      />
                      <div className="flex-1">
                        <p className="font-medium">{contact.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{contact.phone}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleAddFromContacts}
                disabled={isSubmitting || selectedContacts.size === 0}
                className="gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Adicionar {selectedContacts.size} Contato(s)
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="manual" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="manual_name">Nome (opcional)</Label>
              <Input
                id="manual_name"
                value={manualEntry.name}
                onChange={(e) => setManualEntry(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nome do contato"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="manual_phone">Telefone</Label>
              <Input
                id="manual_phone"
                value={manualEntry.phone}
                onChange={(e) => setManualEntry(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+55 11 99999-9999"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleAddManual}
                disabled={isSubmitting || !manualEntry.phone}
                className="gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Adicionar
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="bulk" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="bulk_numbers" className="flex items-center gap-1">
                <Upload className="h-3 w-3" />
                Lista de Números
              </Label>
              <Textarea
                id="bulk_numbers"
                value={bulkNumbers}
                onChange={(e) => setBulkNumbers(e.target.value)}
                placeholder="Um número por linha. Formato: telefone, nome (opcional)&#10;&#10;Exemplo:&#10;11999998888, João Silva&#10;11888887777, Maria Santos&#10;11777776666"
                rows={8}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                {bulkNumbers.split('\n').filter(l => l.trim()).length} números detectados
              </p>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleAddBulk}
                disabled={isSubmitting || !bulkNumbers.trim()}
                className="gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                Importar
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
