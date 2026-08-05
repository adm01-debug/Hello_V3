-- Fix webauthn_challenges RLS: restrict SELECT to own challenges only
DROP POLICY IF EXISTS "Authenticated users can read challenges" ON public.webauthn_challenges;

CREATE POLICY "Users can read own challenges"
ON public.webauthn_challenges
FOR SELECT
TO authenticated
USING (user_id = auth.uid());
