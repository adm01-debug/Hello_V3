 import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuthContext } from '@/contexts/AuthContext';
 import { toast } from 'sonner';
 
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
       // Filter out id/role from updates to prevent RLS/Trigger issues if they match interface but shouldn't be changed by user
       const { id, role, ...allowedUpdates } = updates;
       const { error } = await supabase
         .from('user_profiles')
         .update(allowedUpdates as any)
         .eq('id', user.id);
 
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
       toast.success('Perfil atualizado com sucesso');
     },
     onError: (error: any) => {
       toast.error('Erro ao atualizar perfil', { description: error.message });
     },
   });
 
   return {
     profile,
     isLoading,
     updateProfile,
   };
 }