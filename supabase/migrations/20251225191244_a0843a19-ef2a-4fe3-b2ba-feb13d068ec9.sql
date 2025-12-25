-- CORREÇÃO: Prevenir escalação de privilégios no user_profiles
-- Usuários NÃO podem alterar seu próprio role

DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio perfil" ON public.user_profiles;

CREATE POLICY "Users can update own profile except role" ON public.user_profiles
FOR UPDATE USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id 
  -- Previne alteração de role por usuários não-admin
  AND (
    role = (SELECT role FROM public.user_profiles WHERE id = auth.uid())
    OR is_admin_or_supervisor()
  )
);