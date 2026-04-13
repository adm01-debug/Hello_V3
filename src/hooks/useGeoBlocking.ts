import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const COUNTRIES = [
  { code: 'BR', name: 'Brasil' }, { code: 'US', name: 'Estados Unidos' }, { code: 'PT', name: 'Portugal' },
  { code: 'ES', name: 'Espanha' }, { code: 'FR', name: 'França' }, { code: 'DE', name: 'Alemanha' },
  { code: 'IT', name: 'Itália' }, { code: 'GB', name: 'Reino Unido' }, { code: 'CA', name: 'Canadá' },
  { code: 'MX', name: 'México' }, { code: 'AR', name: 'Argentina' }, { code: 'CL', name: 'Chile' },
  { code: 'CO', name: 'Colômbia' }, { code: 'PE', name: 'Peru' }, { code: 'JP', name: 'Japão' },
  { code: 'CN', name: 'China' }, { code: 'IN', name: 'Índia' }, { code: 'AU', name: 'Austrália' },
  { code: 'NZ', name: 'Nova Zelândia' }, { code: 'ZA', name: 'África do Sul' }, { code: 'RU', name: 'Rússia' },
  { code: 'KR', name: 'Coreia do Sul' }, { code: 'AE', name: 'Emirados Árabes' }, { code: 'SA', name: 'Arábia Saudita' },
  { code: 'IL', name: 'Israel' }, { code: 'SG', name: 'Singapura' }, { code: 'HK', name: 'Hong Kong' },
  { code: 'TW', name: 'Taiwan' }, { code: 'TH', name: 'Tailândia' }, { code: 'VN', name: 'Vietnã' },
  { code: 'PH', name: 'Filipinas' }, { code: 'ID', name: 'Indonésia' }, { code: 'MY', name: 'Malásia' },
  { code: 'NL', name: 'Holanda' }, { code: 'BE', name: 'Bélgica' }, { code: 'CH', name: 'Suíça' },
  { code: 'AT', name: 'Áustria' }, { code: 'PL', name: 'Polônia' }, { code: 'SE', name: 'Suécia' },
  { code: 'NO', name: 'Noruega' }, { code: 'DK', name: 'Dinamarca' }, { code: 'FI', name: 'Finlândia' },
  { code: 'IE', name: 'Irlanda' }, { code: 'GR', name: 'Grécia' }, { code: 'TR', name: 'Turquia' },
  { code: 'EG', name: 'Egito' }, { code: 'NG', name: 'Nigéria' }, { code: 'KE', name: 'Quênia' },
  { code: 'UY', name: 'Uruguai' }, { code: 'PY', name: 'Paraguai' }, { code: 'BO', name: 'Bolívia' },
  { code: 'EC', name: 'Equador' }, { code: 'VE', name: 'Venezuela' }, { code: 'PA', name: 'Panamá' },
  { code: 'CR', name: 'Costa Rica' }, { code: 'CU', name: 'Cuba' }, { code: 'DO', name: 'República Dominicana' },
  { code: 'GT', name: 'Guatemala' }, { code: 'HN', name: 'Honduras' }, { code: 'NI', name: 'Nicarágua' },
  { code: 'SV', name: 'El Salvador' },
].sort((a, b) => a.name.localeCompare(b.name));

export interface GeoSettings {
  id: string;
  enabled: boolean;
  mode: string;
  log_blocked_attempts: boolean;
  notify_on_block: boolean;
}

export interface GeoRestriction {
  id: string;
  country_code: string;
  country_name: string;
  restriction_type: string;
  reason: string | null;
  created_at: string;
  created_by: string | null;
}

export function useGeoBlocking() {
  const queryClient = useQueryClient();
  const [selectedCountry, setSelectedCountry] = useState('');
  const [reason, setReason] = useState('');
  const [testIp, setTestIp] = useState('');
  const [testResult, setTestResult] = useState<Record<string, unknown> | null>(null);

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['geo-settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('geo_settings').select('*').limit(1).maybeSingle();
      if (error) throw error;
      return data as GeoSettings | null;
    }
  });

  const { data: restrictions = [], isLoading: restrictionsLoading } = useQuery({
    queryKey: ['geo-restrictions'],
    queryFn: async () => {
      const { data, error } = await supabase.from('geo_restrictions').select('*').order('country_name', { ascending: true });
      if (error) throw error;
      return data as GeoRestriction[];
    }
  });

  const { data: accessLogs = [] } = useQuery({
    queryKey: ['geo-access-logs'],
    queryFn: async () => {
      const { data, error } = await supabase.from('geo_access_logs').select('*').order('created_at', { ascending: false }).limit(50);
      if (error) throw error;
      return data;
    }
  });

  const initializeSettings = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.from('geo_settings').insert({ enabled: false, mode: 'allowlist', log_blocked_attempts: true, notify_on_block: false }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['geo-settings'] }),
  });

  const updateSettings = useMutation({
    mutationFn: async (updates: Partial<GeoSettings>) => {
      if (!settings?.id) return;
      const { error } = await supabase.from('geo_settings').update(updates).eq('id', settings.id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['geo-settings'] }); toast.success('Configurações atualizadas'); },
    onError: () => toast.error('Erro ao atualizar configurações'),
  });

  const addCountry = useMutation({
    mutationFn: async () => {
      const country = COUNTRIES.find(c => c.code === selectedCountry);
      if (!country) throw new Error('País não encontrado');
      const { error } = await supabase.from('geo_restrictions').insert({ country_code: country.code, country_name: country.name, restriction_type: 'allow', reason: reason || null });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['geo-restrictions'] }); setSelectedCountry(''); setReason(''); toast.success('País adicionado à whitelist'); },
    onError: (error: Error) => toast.error(error.message.includes('duplicate') ? 'Este país já está na lista' : 'Erro ao adicionar país'),
  });

  const removeCountry = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('geo_restrictions').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['geo-restrictions'] }); toast.success('País removido da whitelist'); },
    onError: () => toast.error('Erro ao remover país'),
  });

  const testGeoValidation = useMutation({
    mutationFn: async (ip: string) => { const { data, error } = await supabase.functions.invoke('validate-geo', { body: { ip_address: ip } }); if (error) throw error; return data; },
    onSuccess: (data) => {
      setTestResult(data as Record<string, unknown>);
      if (data?.allowed) toast.success('IP permitido', { description: `País: ${data.country_name || 'Desconhecido'}` });
      else toast.error('IP bloqueado', { description: `País: ${data.country_name || 'Desconhecido'} — ${data.reason || 'Não autorizado'}` });
    },
    onError: () => toast.error('Erro ao validar IP'),
  });

  useEffect(() => { if (!settingsLoading && !settings) initializeSettings.mutate(); }, [settingsLoading, settings]);

  const allowedCountries = restrictions.filter(r => r.restriction_type === 'allow');
  const availableCountries = COUNTRIES.filter(c => !allowedCountries.some(r => r.country_code === c.code));
  const blockedLogs = accessLogs.filter(log => log.action === 'blocked');

  return {
    settings, settingsLoading, restrictionsLoading,
    selectedCountry, setSelectedCountry, reason, setReason,
    testIp, setTestIp, testResult,
    allowedCountries, availableCountries, blockedLogs,
    updateSettings, addCountry, removeCountry, testGeoValidation,
  };
}
