import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

// Load saved agent ID from localStorage
const loadSavedAgentId = (): string | null => {
  try {
    return localStorage.getItem(STORAGE_KEY_AGENT_ID);
  } catch (e) {
    console.log('Failed to load agent ID from localStorage');
    return null;
  }
};

export function useAgentStatus() {
  const [currentAgentId, setCurrentAgentId] = useState<string | null>(loadSavedAgentId);
  const [currentAgent, setCurrentAgent] = useState<Agent | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch all agents
  const fetchAgents = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .order('name');

      if (error) throw error;
      setAgents(data || []);

      // Update current agent if set
      if (currentAgentId && data) {
        const agent = data.find(a => a.id === currentAgentId);
        setCurrentAgent(agent || null);
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentAgentId]);

  // Set current agent (login as agent)
  const setAgent = useCallback((agentId: string) => {
    setCurrentAgentId(agentId);
    try {
      localStorage.setItem(STORAGE_KEY_AGENT_ID, agentId);
    } catch (e) {
      console.log('Failed to save agent ID to localStorage');
    }
    
    const agent = agents.find(a => a.id === agentId);
    setCurrentAgent(agent || null);
    
    if (agent) {
      toast.success(`Logado como ${agent.name}`);
    }
  }, [agents]);

  // Clear current agent (logout)
  const clearAgent = useCallback(() => {
    setCurrentAgentId(null);
    setCurrentAgent(null);
    try {
      localStorage.removeItem(STORAGE_KEY_AGENT_ID);
    } catch (e) {
      console.log('Failed to remove agent ID from localStorage');
    }
  }, []);

  // Update agent status in database
  const updateStatus = useCallback(async (status: AgentStatus) => {
    if (!currentAgentId) {
      console.log('[AgentStatus] No agent selected');
      return false;
    }

    try {
      const { error } = await supabase
        .from('agents')
        .update({ status })
        .eq('id', currentAgentId);

      if (error) throw error;

      console.log(`[AgentStatus] Updated to: ${status}`);
      return true;
    } catch (error) {
      console.error('[AgentStatus] Update failed:', error);
      toast.error('Erro ao atualizar status');
      return false;
    }
  }, [currentAgentId]);

  // Set status to busy when starting a call
  const setStatusBusy = useCallback(() => {
    return updateStatus('busy');
  }, [updateStatus]);

  // Set status to available when ending a call
  const setStatusAvailable = useCallback(() => {
    return updateStatus('available');
  }, [updateStatus]);

  // Set status to away
  const setStatusAway = useCallback(() => {
    return updateStatus('away');
  }, [updateStatus]);

  // Set status to offline
  const setStatusOffline = useCallback(() => {
    return updateStatus('offline');
  }, [updateStatus]);

  // Initial fetch
  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('agents-status')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'agents'
        },
        (payload) => {
          console.log('[AgentStatus] Realtime update:', payload);
          const updatedAgent = payload.new as Agent;
          
          // Update agents list
          setAgents(prev => prev.map(agent => 
            agent.id === updatedAgent.id ? updatedAgent : agent
          ));
          
          // Update current agent if it's the one that changed
          if (currentAgentId === updatedAgent.id) {
            setCurrentAgent(updatedAgent);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentAgentId]);

  // Set offline status when leaving/closing page
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (currentAgentId) {
        // Use sendBeacon with proper auth headers for reliability during page unload
        const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/agents?id=eq.${currentAgentId}`;
        const headers = {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          'Prefer': 'return=minimal',
        };
        const body = JSON.stringify({ status: 'offline' });
        
        // sendBeacon doesn't support custom headers, use fetch with keepalive instead
        fetch(url, {
          method: 'PATCH',
          headers,
          body,
          keepalive: true,
        }).catch(() => {});
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [currentAgentId]);

  return {
    currentAgent,
    currentAgentId,
    agents,
    isLoading,
    setAgent,
    clearAgent,
    updateStatus,
    setStatusBusy,
    setStatusAvailable,
    setStatusAway,
    setStatusOffline,
    refetchAgents: fetchAgents
  };
}