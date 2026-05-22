import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { reportError } from '@/lib/error-tracking';

const log = logger.create('Contacts');

export interface Contact {
  id: string;
  external_id: string | null;
  name: string;
  phone: string | null;
  email: string | null;
  company: string | null;
  position: string | null;
  notes: string | null;
  tags: string[] | null;
  preferences: Record<string, unknown>;
  personality_insights: Record<string, unknown>;
  source: string;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface ContactInteraction {
  id: string;
  contact_id: string;
  call_session_id: string | null;
  interaction_type: string;
  direction: string | null;
  summary: string | null;
  transcript: string | null;
  sentiment: string | null;
  topics: string[] | null;
  duration_seconds: number | null;
  agent_name: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface CreateContactInput {
  name: string;
  phone?: string;
  email?: string;
  company?: string;
  position?: string;
  notes?: string;
  tags?: string[];
  external_id?: string;
  source?: string;
}

export const useContacts = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchContacts = useCallback(async (search?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('contacts')
        .select('*')
        .order('updated_at', { ascending: false });

      if (search) {
        query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,company.ilike.%${search}%`);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      
      setContacts((data || []) as Contact[]);
      return data as Contact[];
    } catch (err: any) {
      log.error('Error fetching contacts', err);
      // Silent error reporting for background refresh
      if (!contacts.length) {
        reportError({
          message: 'Erro ao carregar contatos (falha inicial)',
          type: 'network-error',
          error: err,
          metadata: { search }
        });
        setError('Erro ao carregar contatos');
        toast.error('Erro ao carregar lista de contatos');
      }
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getContactByPhone = useCallback(async (phone: string): Promise<Contact | null> => {
    try {
      const normalizedPhone = phone.replace(/\D/g, '');
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .or(`phone.eq.${normalizedPhone},phone.eq.${phone}`)
        .maybeSingle();

      if (error) throw error;
      return data as Contact | null;
    } catch (err: any) {
      log.error('Error finding contact by phone', err);
      reportError({
        message: 'Erro ao buscar contato por telefone',
        type: 'network-error',
        error: err,
        metadata: { phone }
      });
      toast.error('Erro ao buscar contato por telefone');
      return null;
    }
  }, []);

  const createContact = useCallback(async (input: CreateContactInput): Promise<Contact | null> => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .insert({
          name: input.name,
          phone: input.phone,
          email: input.email,
          company: input.company,
          position: input.position,
          notes: input.notes,
          tags: input.tags,
          external_id: input.external_id,
          source: input.source || 'manual'
        })
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Contato criado com sucesso');
      await fetchContacts();
      return data as Contact;
    } catch (err: any) {
      log.error('Error creating contact', err);
      reportError({
        message: 'Erro ao criar contato',
        type: 'network-error',
        error: err,
        metadata: { input }
      });
      toast.error('Erro ao criar contato');
      return null;
    }
  }, [fetchContacts]);

  const updateContact = useCallback(async (id: string, updates: Partial<CreateContactInput> & { version?: number }): Promise<Contact | null> => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.message?.includes('OPTIMISTIC_LOCK_CONFLICT')) {
          toast.error('Este contato foi alterado por outro usuário. Recarregando...');
          await fetchContacts();
          return null;
        }
        throw error;
      }
      
      toast.success('Contato atualizado');
      await fetchContacts();
      return data as Contact;
    } catch (err: any) {
      log.error('Error updating contact', err);
      reportError({
        message: 'Erro ao atualizar contato',
        type: 'network-error',
        error: err,
        metadata: { id, updates }
      });
      toast.error('Erro ao atualizar contato');
      return null;
    }
  }, [fetchContacts]);

  const deleteContact = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Contato removido');
      await fetchContacts();
      return true;
    } catch (err: any) {
      log.error('Error deleting contact', err);
      reportError({
        message: 'Erro ao remover contato',
        type: 'network-error',
        error: err,
        metadata: { id }
      });
      toast.error('Erro ao remover contato');
      return false;
    }
  }, [fetchContacts]);

  const getContactInteractions = useCallback(async (contactId: string): Promise<ContactInteraction[]> => {
    try {
      const { data, error } = await supabase
        .from('contact_interactions')
        .select('*')
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as ContactInteraction[];
    } catch (err: any) {
      log.error('Error fetching interactions', err);
      reportError({
        message: 'Erro ao carregar histórico de interações',
        type: 'network-error',
        error: err,
        metadata: { contactId }
      });
      toast.error('Erro ao carregar histórico de interações');
      return [];
    }
  }, []);

  const addContactInteraction = useCallback(async (
    contactId: string,
    interaction: {
      interaction_type: string;
      direction?: string;
      summary?: string;
      transcript?: string;
      sentiment?: string;
      topics?: string[];
      duration_seconds?: number;
      agent_name?: string;
      call_session_id?: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<ContactInteraction | null> => {
    try {
      const insertData = {
        contact_id: contactId,
        interaction_type: interaction.interaction_type,
        direction: interaction.direction,
        summary: interaction.summary,
        transcript: interaction.transcript,
        sentiment: interaction.sentiment,
        topics: interaction.topics,
        duration_seconds: interaction.duration_seconds,
        agent_name: interaction.agent_name,
        call_session_id: interaction.call_session_id,
        metadata: interaction.metadata as Record<string, unknown> | undefined
      };

      const { data, error } = await supabase
        .from('contact_interactions')
        .insert(insertData as never)
        .select()
        .single();

      if (error) throw error;
      return data as ContactInteraction;
    } catch (err: any) {
      log.error('Error adding interaction', err);
      reportError({
        message: 'Erro ao adicionar interação',
        type: 'network-error',
        error: err,
        metadata: { contactId, interaction }
      });
      return null;
    }
  }, []);

  const findOrCreateContact = useCallback(async (phone: string, name?: string): Promise<Contact | null> => {
    const existing = await getContactByPhone(phone);
    if (existing) return existing;

    return createContact({
      name: name || `Contato ${phone}`,
      phone: phone.replace(/\D/g, ''),
      source: 'auto'
    });
  }, [getContactByPhone, createContact]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  return {
    contacts,
    isLoading,
    error,
    fetchContacts,
    getContactByPhone,
    createContact,
    updateContact,
    deleteContact,
    getContactInteractions,
    addContactInteraction,
    findOrCreateContact
  };
};

