
DROP POLICY IF EXISTS "Admin/supervisor manage battle cards" ON public.battle_cards;
CREATE POLICY "Admin/supervisor manage battle cards" ON public.battle_cards
  FOR ALL TO authenticated
  USING (public.is_admin_or_supervisor())
  WITH CHECK (public.is_admin_or_supervisor());

DROP POLICY IF EXISTS "Admin/supervisor manage triggers" ON public.battle_card_triggers;
CREATE POLICY "Admin/supervisor manage triggers" ON public.battle_card_triggers
  FOR ALL TO authenticated
  USING (public.is_admin_or_supervisor())
  WITH CHECK (public.is_admin_or_supervisor());
