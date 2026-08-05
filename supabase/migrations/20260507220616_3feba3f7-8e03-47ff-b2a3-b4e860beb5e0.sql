-- Tabela de fila de sincronização CRM
CREATE TABLE IF NOT EXISTS public.crm_sync_queue (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    action TEXT NOT NULL,
    payload JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
    attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 5,
    last_error TEXT,
    next_retry_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_crm_sync_queue_status_retry ON public.crm_sync_queue (status, next_retry_at) WHERE status IN ('pending', 'failed');

-- RLS
ALTER TABLE public.crm_sync_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Apenas admin pode ler fila de sincronização" ON public.crm_sync_queue FOR SELECT USING (auth.role() = 'authenticated');

-- Função para atualizar timestamp
CREATE TRIGGER update_crm_sync_queue_updated_at
BEFORE UPDATE ON public.crm_sync_queue
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
