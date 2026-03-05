// @ts-nocheck
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DNCEntry {
  id: string;
  phone: string;
  phone_normalized: string;
  reason: string;
  source: string;
  added_by: string | null;
  notes: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CallingHoursConfig {
  id: string;
  region_code: string;
  region_name: string;
  timezone: string;
  weekday_start: string;
  weekday_end: string;
  saturday_start: string | null;
  saturday_end: string | null;
  sunday_allowed: boolean;
  sunday_start: string | null;
  sunday_end: string | null;
  holidays_allowed: boolean;
  is_active: boolean;
}

interface ComplianceSetting {
  id: string;
  setting_key: string;
  setting_value: any;
  description: string | null;
}

interface CallingHoursCheck {
  can_call: boolean;
  reason: string;
  current_time?: string;
  timezone?: string;
  day_of_week?: number;
}

export function useDNCCompliance() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isChecking, setIsChecking] = useState(false);

  // Fetch DNC List
  const { data: dncList = [], isLoading: isLoadingDNC } = useQuery({
    queryKey: ['dnc-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dnc_list')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as DNCEntry[];
    },
  });

  // Fetch Calling Hours Config
  const { data: callingHours = [], isLoading: isLoadingHours } = useQuery({
    queryKey: ['calling-hours-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('calling_hours_config')
        .select('*')
        .order('region_code');
      
      if (error) throw error;
      return data as CallingHoursConfig[];
    },
  });

  // Fetch Compliance Settings
  const { data: settings = [], isLoading: isLoadingSettings } = useQuery({
    queryKey: ['compliance-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('compliance_settings')
        .select('*')
        .order('setting_key');
      
      if (error) throw error;
      return data as ComplianceSetting[];
    },
  });

  // Check if phone is in DNC
  const checkDNC = useCallback(async (phone: string): Promise<boolean> => {
    setIsChecking(true);
    try {
      const { data, error } = await supabase.rpc('check_dnc', { p_phone: phone });
      if (error) throw error;
      return data as boolean;
    } catch (error) {
      console.error('Error checking DNC:', error);
      return false;
    } finally {
      setIsChecking(false);
    }
  }, []);

  // Check calling hours
  const checkCallingHours = useCallback(async (regionCode: string = 'BR'): Promise<CallingHoursCheck> => {
    try {
      const { data, error } = await supabase.rpc('check_calling_hours', { p_region_code: regionCode });
      if (error) throw error;
      return data as CallingHoursCheck;
    } catch (error) {
      console.error('Error checking calling hours:', error);
      return { can_call: true, reason: 'Error checking hours' };
    }
  }, []);

  // Add to DNC
  const addToDNCMutation = useMutation({
    mutationFn: async ({ 
      phone, 
      reason = 'manual', 
      source = 'manual', 
      notes = null,
      expiresAt = null 
    }: { 
      phone: string; 
      reason?: string; 
      source?: string; 
      notes?: string | null;
      expiresAt?: string | null;
    }) => {
      const { data, error } = await supabase.rpc('add_to_dnc', {
        p_phone: phone,
        p_reason: reason,
        p_source: source,
        p_notes: notes,
        p_expires_at: expiresAt,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dnc-list'] });
      toast({
        title: 'Número adicionado',
        description: 'O número foi adicionado à lista DNC com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao adicionar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Remove from DNC (deactivate)
  const removeFromDNCMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('dnc_list')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dnc-list'] });
      toast({
        title: 'Número removido',
        description: 'O número foi removido da lista DNC.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao remover',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update compliance setting
  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      const { error } = await supabase
        .from('compliance_settings')
        .update({ 
          setting_value: JSON.stringify(value),
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', key);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance-settings'] });
      toast({
        title: 'Configuração atualizada',
        description: 'A configuração de compliance foi salva.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Bulk import DNC
  const bulkImportDNC = useCallback(async (phones: string[], reason: string = 'import', source: string = 'bulk_import') => {
    const results = {
      success: 0,
      failed: 0,
      duplicates: 0,
    };

    for (const phone of phones) {
      try {
        await supabase.rpc('add_to_dnc', {
          p_phone: phone,
          p_reason: reason,
          p_source: source,
          p_notes: null,
          p_expires_at: null,
        });
        results.success++;
      } catch (error: any) {
        if (error.message?.includes('duplicate')) {
          results.duplicates++;
        } else {
          results.failed++;
        }
      }
    }

    queryClient.invalidateQueries({ queryKey: ['dnc-list'] });
    return results;
  }, [queryClient]);

  // Get setting value helper
  const getSettingValue = useCallback((key: string, defaultValue: any = null) => {
    const setting = settings.find(s => s.setting_key === key);
    if (!setting) return defaultValue;
    try {
      return JSON.parse(setting.setting_value);
    } catch {
      return setting.setting_value;
    }
  }, [settings]);

  // Pre-dial compliance check
  const preDialCheck = useCallback(async (phone: string, regionCode: string = 'BR'): Promise<{
    canDial: boolean;
    reasons: string[];
  }> => {
    const reasons: string[] = [];
    
    // Check DNC
    const isDNC = getSettingValue('dnc_enabled', true);
    if (isDNC) {
      const inDNC = await checkDNC(phone);
      if (inDNC) {
        reasons.push('Número está na lista DNC (Do Not Call)');
      }
    }

    // Check calling hours
    const hoursEnabled = getSettingValue('calling_hours_enabled', true);
    if (hoursEnabled) {
      const hoursCheck = await checkCallingHours(regionCode);
      if (!hoursCheck.can_call) {
        reasons.push(hoursCheck.reason);
      }
    }

    return {
      canDial: reasons.length === 0,
      reasons,
    };
  }, [checkDNC, checkCallingHours, getSettingValue]);

  return {
    // Data
    dncList,
    callingHours,
    settings,
    
    // Loading states
    isLoadingDNC,
    isLoadingHours,
    isLoadingSettings,
    isChecking,
    
    // Functions
    checkDNC,
    checkCallingHours,
    preDialCheck,
    getSettingValue,
    bulkImportDNC,
    
    // Mutations
    addToDNC: addToDNCMutation.mutate,
    removeFromDNC: removeFromDNCMutation.mutate,
    updateSetting: updateSettingMutation.mutate,
    
    // Mutation states
    isAddingToDNC: addToDNCMutation.isPending,
    isRemovingFromDNC: removeFromDNCMutation.isPending,
  };
}
