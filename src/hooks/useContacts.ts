import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

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
      
      // Type assertion since DB types may not be updated yet
      setContacts((data || []) as Contact[]);
      return data as Contact[];
    } catch (err) {
      log.error('Error fetching contacts', err);
      setError('Erro ao carregar contatos');
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
    } catch (err) {
      log.error('Error finding contact by phone', err);
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
    } catch (err) {
      log.error('Error creating contact', err);
      toast.error('Erro ao criar contato');
      return null;
    }
  }, [fetchContacts]);

  const updateContact = useCallback(async (id: string, updates: Partial<CreateContactInput>): Promise<Contact | null> => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Contato atualizado');
      await fetchContacts();
      return data as Contact;
    } catch (err) {
      log.error('Error updating contact', err);
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
    } catch (err) {
      log.error('Error deleting contact', err);
      toast.error('Erro ao remover contato');
      return false;
    }
  }, [fetchContacts]);

  // Contact Interactions
  const getContactInteractions = useCallback(async (contactId: string): Promise<ContactInteraction[]> => {
    try {
      const { data, error } = await supabase
        .from('contact_interactions')
        .select('*')
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as ContactInteraction[];
    } catch (err) {
      log.error('Error fetching interactions', err);
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
      // Build the insert object with explicit typing
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
    } catch (err) {
      log.error('Error adding interaction', err);
      return null;
    }
  }, []);

  // Find or create contact by phone
  const findOrCreateContact = useCallback(async (phone: string, name?: string): Promise<Contact | null> => {
    const existing = await getContactByPhone(phone);
    if (existing) return existing;

    // Create new contact
    return createContact({
      name: name || `Contato ${phone}`,
      phone: phone.replace(/\D/g, ''),
      source: 'auto'
    });
  }, [getContactByPhone, createContact]);

  // Load contacts on mount
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
