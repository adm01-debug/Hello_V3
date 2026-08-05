-- Drop all permissive demo policies that allow unauthenticated access
-- These were created for demo purposes but override the authenticated policies

-- Drop permissive policies on call_sessions
DROP POLICY IF EXISTS "Allow all access to call_sessions" ON public.call_sessions;

-- Drop permissive policies on call_transcriptions
DROP POLICY IF EXISTS "Allow all access to call_transcriptions" ON public.call_transcriptions;

-- Drop permissive policies on call_analyses
DROP POLICY IF EXISTS "Allow all access to call_analyses" ON public.call_analyses;

-- Drop permissive policies on call_summaries
DROP POLICY IF EXISTS "Allow all access to call_summaries" ON public.call_summaries;

-- Drop permissive policies on coaching_recommendations (4 public policies)
DROP POLICY IF EXISTS "Allow public read on coaching_recommendations" ON public.coaching_recommendations;
DROP POLICY IF EXISTS "Allow public insert on coaching_recommendations" ON public.coaching_recommendations;
DROP POLICY IF EXISTS "Allow public update on coaching_recommendations" ON public.coaching_recommendations;
DROP POLICY IF EXISTS "Allow public delete on coaching_recommendations" ON public.coaching_recommendations;