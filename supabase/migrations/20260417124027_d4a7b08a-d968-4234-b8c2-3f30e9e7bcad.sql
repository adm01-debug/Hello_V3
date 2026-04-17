-- Tornar policies SELECT explícitas para 'authenticated' (remove warnings "always true")

DROP POLICY IF EXISTS "Authenticated view agent skills" ON public.agent_skills;
CREATE POLICY "Authenticated view agent skills"
ON public.agent_skills FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "All authenticated can view journey stages" ON public.customer_journey_stages;
CREATE POLICY "All authenticated can view journey stages"
ON public.customer_journey_stages FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can read geo restrictions" ON public.geo_restrictions;
CREATE POLICY "Authenticated users can read geo restrictions"
ON public.geo_restrictions FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated view queue requirements" ON public.queue_skill_requirements;
CREATE POLICY "Authenticated view queue requirements"
ON public.queue_skill_requirements FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated can view shift templates" ON public.shift_templates;
CREATE POLICY "Authenticated can view shift templates"
ON public.shift_templates FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated view skills" ON public.skills;
CREATE POLICY "Authenticated view skills"
ON public.skills FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);