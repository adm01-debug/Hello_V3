import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { useBitrix } from '@/hooks/useBitrix';
import type { Contact, CreateContactInput } from '@/hooks/useContacts';

interface Options {
  contacts: Contact[];
  createContact: (input: CreateContactInput) => Promise<Contact | null>;
  fetchContacts: () => Promise<unknown> | void;
}

export function useBitrixSync({ contacts, createContact, fetchContacts }: Options) {
  const { isConfigured, getContacts: getBitrixContacts, isLoading: bitrixLoading } = useBitrix();
  const [isSyncing, setIsSyncing] = useState(false);

  const syncWithBitrix = useCallback(async () => {
    if (!isConfigured) {
      toast.error('Bitrix24 não configurado', {
        description: 'Configure a URL do webhook nas Configurações',
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
        const exists = contacts.find((c) => c.external_id === bc.ID);
        if (!exists) {
          await createContact({
            name: `${bc.NAME || ''} ${bc.LAST_NAME || ''}`.trim() || 'Sem nome',
            phone,
            email,
            external_id: bc.ID,
            source: 'bitrix24',
          });
          imported++;
        }
      }

      await fetchContacts();
      toast.success('Sincronização concluída', {
        description: `${imported} novos contatos importados do Bitrix24`,
      });
    } catch (error) {
      logger.error('Sync error:', error);
      toast.error('Erro ao sincronizar com Bitrix24');
    } finally {
      setIsSyncing(false);
    }
  }, [isConfigured, getBitrixContacts, contacts, createContact, fetchContacts]);

  return { syncWithBitrix, isSyncing, bitrixLoading };
}
