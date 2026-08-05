 import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuthContext } from '@/contexts/AuthContext';
 import { toast } from 'sonner';
 import type { TablesUpdate } from '@/integrations/supabase/types';
 
 export interface Profile {
   id: string;
   email: string;
   full_name: string | null;
   role: string;
   agent_id: string | null;
 }
 
 export function useProfile() {
   const { user } = useAuthContext();
   const queryClient = useQueryClient();
 
   const { data: profile, isLoading } = useQuery({
     queryKey: ['profile', user?.id],
     queryFn: async () => {
       if (!user) return null;
       const { data, error } = await supabase
         .from('user_profiles')
         .select('*')
         .eq('id', user.id)
         .single();
 
       if (error) throw error;
       return data as unknown as Profile;
     },
     enabled: !!user,
   });
 
    const updateProfileMutation = useMutation({
      mutationFn: async (updates: Partial<Profile>) => {
        if (!user) throw new Error('Not authenticated');
        const { id, role, ...allowedUpdates } = updates;
        const { error } = await supabase
          .from('user_profiles')
          .update(allowedUpdates as TablesUpdate<'user_profiles'>)
          .eq('id', user.id);
  
        if (error) throw error;
      },
      onMutate: async (updates) => {
        await queryClient.cancelQueries({ queryKey: ['profile', user?.id] });
        const previousProfile = queryClient.getQueryData(['profile', user?.id]);
        queryClient.setQueryData(['profile', user?.id], (old: Profile | undefined) => ({ ...old, ...updates }));
        return { previousProfile };
      },
      onSuccess: () => {
        toast.success('Perfil atualizado com sucesso');
      },
      onError: (error: Error, _variables, context) => {
        if (context?.previousProfile) {
          queryClient.setQueryData(['profile', user?.id], context.previousProfile);
        }
        toast.error('Erro ao atualizar perfil', { description: error.message });
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      },
    });
 
   return {
     profile,
     isLoading,
     updateProfile: updateProfileMutation,
   };
 }