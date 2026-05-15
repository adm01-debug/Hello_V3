import { logger } from '@/lib/logger';
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface BitrixContact {
  ID: string;
  NAME: string;
  LAST_NAME: string;
  PHONE: Array<{ VALUE: string; VALUE_TYPE: string }>;
  EMAIL: Array<{ VALUE: string; VALUE_TYPE: string }>;
}

export interface BitrixLead {
  ID: string;
  TITLE: string;
  NAME: string;
  PHONE: Array<{ VALUE: string; VALUE_TYPE: string }>;
  STATUS_ID: string;
  SOURCE_ID: string;
}

export interface BitrixDeal {
  ID: string;
  TITLE: string;
  STAGE_ID: string;
  OPPORTUNITY: string;
  CURRENCY_ID: string;
  CONTACT_ID: string;
}

export interface BitrixCallData {
  CALL_ID?: string;
  USER_PHONE_INNER?: string;
  USER_ID?: string;
  PHONE_NUMBER: string;
  TYPE: 1 | 2; // 1 = outbound, 2 = inbound
  CRM_CREATE?: 0 | 1;
  SHOW?: 0 | 1;
}

export const useBitrix = () => {
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [contacts, setContacts] = useState<BitrixContact[]>([]);
  const [leads, setLeads] = useState<BitrixLead[]>([]);
  const [deals, setDeals] = useState<BitrixDeal[]>([]);

  const callBitrixApi = useCallback(async (action: string, params?: Record<string, unknown>, maxRetries = 2) => {
    setIsLoading(true);
    let lastError: any = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const { data, error } = await supabase.functions.invoke('bitrix-api', {
          body: { action, params }
        });

        if (!error) {
          if (data?.configured === false) {
            setIsConfigured(false);
            setIsLoading(false);
            return null;
          }
          setIsConfigured(true);
          setIsLoading(false);
          return data;
        }

        lastError = error;
        if (attempt < maxRetries) {
          await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
          continue;
        }
      } catch (err) {
        lastError = err;
        if (attempt < maxRetries) {
          await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
          continue;
        }
      }
    }

    setIsLoading(false);
    return null;
  }, []);

  const syncAgents = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await callBitrixApi('get_users', { FILTER: { ACTIVE: 'Y' } });
      if (result?.data) {
        const users = result.data;
        for (const user of users) {
          await supabase.from('bitrix_users').upsert({
            id: user.ID,
            name: user.NAME,
            last_name: user.LAST_NAME,
            email: user.EMAIL,
            work_phone: user.WORK_PHONE,
            personal_phone: user.PERSONAL_PHONE,
            active: user.ACTIVE === 'Y'
          });
        }
        toast.success('Agentes sincronizados com sucesso');
        return users;
      }
    } catch (error) {
      logger.error('Error syncing agents:', error);
      toast.error('Erro ao sincronizar agentes');
    } finally {
      setIsLoading(false);
    }
    return null;
  }, [callBitrixApi]);

  const syncDepartments = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await callBitrixApi('get_departments');
      if (result?.data) {
        const departments = result.data;
        for (const dept of departments) {
          await supabase.from('bitrix_departments').upsert({
            id: dept.ID,
            name: dept.NAME,
            parent_id: dept.PARENT
          });
        }
        toast.success('Departamentos sincronizados');
        return departments;
      }
    } catch (error) {
      logger.error('Error syncing departments:', error);
    } finally {
      setIsLoading(false);
    }
    return null;
  }, [callBitrixApi]);

  const checkConfiguration = useCallback(async () => {
    const result = await callBitrixApi('get_user');
    return result?.configured === true;
  }, [callBitrixApi]);

  // CRM Functions
  const getContacts = useCallback(async (filter?: Record<string, unknown>) => {
    const result = await callBitrixApi('get_contacts', { filter, select: ['ID', 'NAME', 'LAST_NAME', 'PHONE', 'EMAIL'] });
    if (result?.data) {
      setContacts(result.data);
      return result.data;
    }
    return [];
  }, [callBitrixApi]);

  const getLeads = useCallback(async (filter?: Record<string, unknown>) => {
    const result = await callBitrixApi('get_leads', { filter, select: ['ID', 'TITLE', 'NAME', 'PHONE', 'STATUS_ID', 'SOURCE_ID'] });
    if (result?.data) {
      setLeads(result.data);
      return result.data;
    }
    return [];
  }, [callBitrixApi]);

   const createLead = useCallback(async (leadData: Partial<BitrixLead>) => {
     // 1. Tentar sincronização imediata
     const result = await callBitrixApi('create_lead', leadData);
     
     if (result?.success) {
       toast.success('Lead criado no Bitrix24');
       return result.data;
     }
 
     // 2. Se falhar por rede/indisponibilidade, enfileirar (offline-first strategy)
     const { error: queueError } = await supabase.from('crm_sync_queue').insert({
       action: 'create_lead',
       payload: leadData,
       status: 'pending'
     });
 
     if (!queueError) {
       toast.info('Lead agendado para sincronização', { 
         description: 'O Bitrix24 está temporariamente instável. Sincronizaremos em breve.' 
       });
       return { queued: true };
     }
 
     return null;
   }, [callBitrixApi]);

  const getDeals = useCallback(async (filter?: Record<string, unknown>) => {
    const result = await callBitrixApi('get_deals', { filter, select: ['ID', 'TITLE', 'STAGE_ID', 'OPPORTUNITY', 'CURRENCY_ID', 'CONTACT_ID'] });
    if (result?.data) {
      setDeals(result.data);
      return result.data;
    }
    return [];
  }, [callBitrixApi]);

  // Telephony Functions
   const registerCall = useCallback(async (callData: BitrixCallData) => {
     const result = await callBitrixApi('register_call', callData as unknown as Record<string, unknown>);
     
     if (result?.success) {
       logger.create('Bitrix').debug('Call registered:', result.data);
       return result.data;
     }
 
     // Enfileirar registro de chamada se falhar
     await supabase.from('crm_sync_queue').insert({
       action: 'register_call',
       payload: callData as any,
       status: 'pending'
     });
 
     return null;
   }, [callBitrixApi]);

  const finishCall = useCallback(async (callId: string, duration: number, statusCode: string = '200') => {
    const result = await callBitrixApi('finish_call', {
      CALL_ID: callId,
      DURATION: duration,
      STATUS_CODE: statusCode
    });
    if (result?.success) {
      logger.create('Bitrix').debug('Call finished:', result.data);
      return result.data;
    }
    return null;
  }, [callBitrixApi]);

  // Search contact by phone
  const findContactByPhone = useCallback(async (phone: string) => {
    const normalizedPhone = phone.replace(/\D/g, '');
    const result = await callBitrixApi('get_contacts', {
      filter: { PHONE: normalizedPhone },
      select: ['ID', 'NAME', 'LAST_NAME', 'PHONE', 'EMAIL']
    });
    return result?.data?.[0] || null;
  }, [callBitrixApi]);

  return {
    isConfigured,
    isLoading,
    contacts,
    leads,
    deals,
    checkConfiguration,
    getContacts,
    getLeads,
    createLead,
    getDeals,
    registerCall,
    finishCall,
    syncAgents,
    syncDepartments,
    findContactByPhone
  };
};
