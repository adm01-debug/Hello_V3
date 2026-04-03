import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

const log = logger.create('AgentStatus');

export type AgentStatus = 'available' | 'busy' | 'away' | 'offline';

interface Agent {
  id: string;
  name: string;
  extension: string;
  email: string | null;
  status: string;
  department: string | null;
}

const STORAGE_KEY_AGENT_ID = 'currentAgentId';

const loadSavedAgentId = (): string | null => {
  try {
    return localStorage.getItem(STORAGE_KEY_AGENT_ID);
  } catch {
    log.warn('Failed to load agent ID from localStorage');
    return null;
  }
};

export function useAgentStatus() {
  const [currentAgentId, setCurrentAgentId] = useState<string | null>(loadSavedAgentId);
  const [currentAgent, setCurrentAgent] = useState<Agent | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAgents = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('agents').select('*').order('name');
      if (error) throw error;
      setAgents(data || []);
      if (currentAgentId && data) {
        const agent = data.find(a => a.id === currentAgentId);
        setCurrentAgent(agent || null);
      }
    } catch (error) {
      log.error('Error fetching agents', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentAgentId]);

  const setAgent = useCallback((agentId: string) => {
    setCurrentAgentId(agentId);
    try {
      localStorage.setItem(STORAGE_KEY_AGENT_ID, agentId);
    } catch {
      log.warn('Failed to save agent ID to localStorage');
    }
    const agent = agents.find(a => a.id === agentId);
    setCurrentAgent(agent || null);
    if (agent) toast.success(`Logado como ${agent.name}`);
  }, [agents]);

  const clearAgent = useCallback(() => {
    setCurrentAgentId(null);
    setCurrentAgent(null);
    try {
      localStorage.removeItem(STORAGE_KEY_AGENT_ID);
    } catch {
      log.warn('Failed to remove agent ID from localStorage');
    }
  }, []);

  const updateStatus = useCallback(async (status: AgentStatus) => {
    if (!currentAgentId) {
      log.debug('No agent selected');
      return false;
    }
    try {
      const { error } = await supabase.from('agents').update({ status }).eq('id', currentAgentId);
      if (error) throw error;
      log.debug(`Updated to: ${status}`);
      return true;
    } catch (error) {
      log.error('Update failed', error);
      toast.error('Erro ao atualizar status');
      return false;
    }
  }, [currentAgentId]);

  const setStatusBusy = useCallback(() => updateStatus('busy'), [updateStatus]);
  const setStatusAvailable = useCallback(() => updateStatus('available'), [updateStatus]);
  const setStatusAway = useCallback(() => updateStatus('away'), [updateStatus]);
  const setStatusOffline = useCallback(() => updateStatus('offline'), [updateStatus]);

  useEffect(() => { fetchAgents(); }, [fetchAgents]);

  useEffect(() => {
    const channel = supabase
      .channel('agents-status')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'agents' }, (payload) => {
        log.debug('Realtime update received');
        const updatedAgent = payload.new as Agent;
        setAgents(prev => prev.map(agent => agent.id === updatedAgent.id ? updatedAgent : agent));
        if (currentAgentId === updatedAgent.id) setCurrentAgent(updatedAgent);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [currentAgentId]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (currentAgentId) {
        const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/agents?id=eq.${currentAgentId}`;
        const headers = {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          'Prefer': 'return=minimal',
        };
        fetch(url, { method: 'PATCH', headers, body: JSON.stringify({ status: 'offline' }), keepalive: true }).catch(() => {});
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => { window.removeEventListener('beforeunload', handleBeforeUnload); };
  }, [currentAgentId]);

  return {
    currentAgent, currentAgentId, agents, isLoading,
    setAgent, clearAgent, updateStatus,
    setStatusBusy, setStatusAvailable, setStatusAway, setStatusOffline,
    refetchAgents: fetchAgents,
  };
}
