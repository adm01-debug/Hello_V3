import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuthContext } from '@/contexts/AuthContext';

export function useMultiDeviceRing() {
  const queryClient = useQueryClient();
  const { profile } = useAuthContext();
  const agentName = profile?.full_name || profile?.email || 'agent';
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newDevice, setNewDevice] = useState({ device_name: '', device_type: 'desktop', sip_uri: '', extension: '' });

  const { data: devices = [], isLoading: devicesLoading } = useQuery({
    queryKey: ['agent-devices'],
    queryFn: async () => {
      const { data, error } = await supabase.from('agent_devices').select('*').order('ring_order', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: ringSettings, isLoading: settingsLoading } = useQuery({
    queryKey: ['agent-ring-settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('agent_ring_settings').select('*').maybeSingle();
      if (error) throw error;
      return data || { ring_strategy: 'simultaneous', ring_timeout_seconds: 30, fallback_action: 'voicemail', dnd_enabled: false };
    },
  });

  const addDevice = useMutation({
    mutationFn: async (device: typeof newDevice) => {
      const { error } = await supabase.from('agent_devices').insert({ ...device, agent_name: agentName, ring_order: devices.length });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-devices'] });
      toast.success('Dispositivo adicionado');
      setAddDialogOpen(false);
      setNewDevice({ device_name: '', device_type: 'desktop', sip_uri: '', extension: '' });
    },
    onError: () => toast.error('Erro ao adicionar dispositivo'),
  });

  const toggleDevice = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase.from('agent_devices').update({ is_enabled: enabled }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['agent-devices'] }),
  });

  const deleteDevice = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('agent_devices').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['agent-devices'] }); toast.success('Dispositivo removido'); },
  });

  const updateSettings = useMutation({
    mutationFn: async (settings: Record<string, unknown>) => {
      const { data: existing } = await supabase.from('agent_ring_settings').select('id').maybeSingle();
      if (existing) {
        const { error } = await supabase.from('agent_ring_settings').update(settings).eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('agent_ring_settings').insert({ agent_name: agentName, ...settings });
        if (error) throw error;
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['agent-ring-settings'] }); toast.success('Configurações salvas'); },
  });

  const isLoading = devicesLoading || settingsLoading;
  const enabledCount = devices.filter(d => d.is_enabled).length;

  return {
    devices, ringSettings, isLoading, enabledCount,
    addDialogOpen, setAddDialogOpen, newDevice, setNewDevice,
    addDevice, toggleDevice, deleteDevice, updateSettings,
  };
}
