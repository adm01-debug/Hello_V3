 import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuthContext } from '@/contexts/AuthContext';
 import { toast } from 'sonner';
 
 export interface Profile {
   id: string;
   name: string | null;
   email: string | null;
   avatar_url: string | null;
   role: string | null;
   extension: string | null;
   department: string | null;
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
       return data as Profile;
     },
     enabled: !!user,
   });
 
   const updateProfile = useMutation({
     mutationFn: async (updates: Partial<Profile>) => {
       if (!user) throw new Error('Not authenticated');
       const { error } = await supabase
         .from('user_profiles')
         .update(updates)
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