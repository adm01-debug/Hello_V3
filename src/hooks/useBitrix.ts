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

  const callBitrixApi = useCallback(async (action: string, params?: Record<string, unknown>) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('bitrix-api', {
        body: { action, params }
      });

      if (error) {
        let isNotConfigured = false;
        let description = error.message;

        const responseContext = (error as { context?: Response }).context;
        if (responseContext instanceof Response) {
          try {
            const payload = await responseContext.clone().json() as {
              configured?: boolean;
              error?: string;
              message?: string;
            };

            const configMessage = payload?.error || payload?.message;
            isNotConfigured = payload?.configured === false || configMessage === 'Serviço não configurado';

            if (configMessage) {
              description = configMessage;
            }
          } catch {
            // Ignore parse errors and fallback to default error handling
          }
        }

        if (isNotConfigured) {
          setIsConfigured(false);
          return { success: false, configured: false };
        }

        console.error('Bitrix API error:', error);
        toast.error('Erro ao comunicar com Bitrix', {
          description
        });
        return null;
      }

      if (data?.configured === false) {
        setIsConfigured(false);
        return null;
      }

      setIsConfigured(true);
      return data;
    } catch (err) {
      console.error('Bitrix call error:', err);
      toast.error('Erro na integração Bitrix');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

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
    const result = await callBitrixApi('create_lead', leadData);
    if (result?.success) {
      toast.success('Lead criado no Bitrix24');
      return result.data;
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
    findContactByPhone
  };
};
