import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CoachingRecommendation {
  id: string;
  agent_id: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action_items: string[];
  metrics_snapshot: Record<string, any>;
  status: 'pending' | 'in_progress' | 'completed' | 'dismissed';
  created_at: string;
  reviewed_at: string | null;
  completed_at: string | null;
}

export function useCoaching(agentId?: string) {
  const [recommendations, setRecommendations] = useState<CoachingRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  

  const fetchRecommendations = useCallback(async () => {
    if (!agentId) return;

    setIsLoading(true);
    const { data, error } = await supabase
      .from('coaching_recommendations')
      .select('*')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching recommendations:', error);
    } else {
      setRecommendations(data as CoachingRecommendation[]);
    }
    setIsLoading(false);
  }, [agentId]);

  const generateRecommendations = async () => {
    if (!agentId) return;

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-coaching', {
        body: { agentId }
      });

      if (error) {
        throw error;
      }

      toast.success('🎯 Recomendações Geradas', { description: `${data.recommendations?.length || 0} novas recomendações de coaching foram criadas.` });

      await fetchRecommendations();
    } catch (error: any) {
      console.error('Error generating recommendations:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível gerar as recomendações.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const updateStatus = async (id: string, status: CoachingRecommendation['status']) => {
    const updates: any = { status };
    
    if (status === 'in_progress') {
      updates.reviewed_at = new Date().toISOString();
    } else if (status === 'completed') {
      updates.completed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('coaching_recommendations')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('Error updating recommendation:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o status.',
        variant: 'destructive',
      });
    } else {
      await fetchRecommendations();
      
      if (status === 'completed') {
        toast({
          title: '✅ Recomendação Concluída',
          description: 'A recomendação foi marcada como concluída.',
        });
      }
    }
  };

  const deleteRecommendation = async (id: string) => {
    const { error } = await supabase
      .from('coaching_recommendations')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting recommendation:', error);
    } else {
      await fetchRecommendations();
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  // Real-time subscription
  useEffect(() => {
    if (!agentId) return;

    const channel = supabase
      .channel('coaching-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'coaching_recommendations',
          filter: `agent_id=eq.${agentId}`,
        },
        () => {
          fetchRecommendations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [agentId, fetchRecommendations]);

  return {
    recommendations,
    isLoading,
    isGenerating,
    generateRecommendations,
    updateStatus,
    deleteRecommendation,
    refetch: fetchRecommendations,
  };
}
