-- Etapa 230 (achado A-097): registrar os erros do navegador em algum lugar.
--
-- O `.env.example` promete SENTRY_DSN / DD_API_KEY, mas nenhum codigo le essas
-- variaveis. `src/lib/error-tracking.ts` escuta window.onerror e
-- unhandledrejection e so escreve no console e num buffer de 20 itens na
-- memoria: depois de um F5 (ou do refresh que a propria tela faz) o rastro
-- some. Um erro de JS que quebra uma tela nao deixava nenhuma evidencia.
--
-- Esta tabela guarda o que o reporter (src/lib/errorReporter.ts) captura, e a
-- tela /admin/client-errors le, filtra por rota e marca como resolvido.
--
-- Escrita: so o proprio usuario autenticado (auth.uid() = user_id). Anon nao
-- recebe GRANT nem policy de INSERT de proposito: tabela aberta para anonimo e
-- vetor de spam, e erro antes do login ja aparece no console/Vercel.
-- Leitura e resolucao: admin ou supervisor, mesmo criterio de webhook_flush_metrics.

CREATE TABLE IF NOT EXISTS public.client_errors (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  route text NOT NULL,
  error_type text NOT NULL DEFAULT 'error',
  message text NOT NULL,
  stack text,
  user_agent text,
  correlation_id text,
  resolved_at timestamptz,
  resolved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT client_errors_route_len CHECK (char_length(route) <= 500),
  CONSTRAINT client_errors_message_len CHECK (char_length(message) BETWEEN 1 AND 1000),
  CONSTRAINT client_errors_stack_len CHECK (stack IS NULL OR char_length(stack) <= 4000),
  CONSTRAINT client_errors_user_agent_len CHECK (user_agent IS NULL OR char_length(user_agent) <= 500),
  CONSTRAINT client_errors_correlation_len CHECK (correlation_id IS NULL OR char_length(correlation_id) <= 100),
  CONSTRAINT client_errors_type_chk CHECK (error_type IN ('error', 'unhandled-rejection', 'react-component', 'network-error'))
);

COMMENT ON TABLE public.client_errors IS
  'Erros nao tratados do navegador (etapa 230 / A-097). Alimentada por src/lib/errorReporter.ts, lida em /admin/client-errors.';
COMMENT ON COLUMN public.client_errors.route IS 'pathname da tela onde o erro ocorreu';
COMMENT ON COLUMN public.client_errors.correlation_id IS 'trace id do client (src/lib/tracing.ts) para cruzar com logs de edge function';

CREATE INDEX IF NOT EXISTS idx_client_errors_occurred_at
  ON public.client_errors (occurred_at DESC);

-- Recorte padrao da tela: "so os nao resolvidos".
CREATE INDEX IF NOT EXISTS idx_client_errors_open
  ON public.client_errors (occurred_at DESC)
  WHERE resolved_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_client_errors_route
  ON public.client_errors (route, occurred_at DESC);

GRANT SELECT, UPDATE ON public.client_errors TO authenticated;
GRANT INSERT ON public.client_errors TO authenticated;
GRANT ALL ON public.client_errors TO service_role;

ALTER TABLE public.client_errors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins_supervisors_read_client_errors" ON public.client_errors;
CREATE POLICY "admins_supervisors_read_client_errors"
  ON public.client_errors
  FOR SELECT
  TO authenticated
  USING (public.is_admin_or_supervisor());

DROP POLICY IF EXISTS "authenticated_insert_own_client_errors" ON public.client_errors;
CREATE POLICY "authenticated_insert_own_client_errors"
  ON public.client_errors
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "admins_supervisors_resolve_client_errors" ON public.client_errors;
CREATE POLICY "admins_supervisors_resolve_client_errors"
  ON public.client_errors
  FOR UPDATE
  TO authenticated
  USING (public.is_admin_or_supervisor())
  WITH CHECK (public.is_admin_or_supervisor());