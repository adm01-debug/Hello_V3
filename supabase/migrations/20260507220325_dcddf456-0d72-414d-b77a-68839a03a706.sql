-- Criar tabela de configurações se não existir
CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Inserir threshold padrão se não existir
INSERT INTO public.system_settings (key, value, description)
VALUES ('bot_handoff_threshold', '0.7', 'Nível de confiança mínimo para o bot responder sem transferir para humano')
ON CONFLICT (key) DO NOTHING;

-- Adicionar override de threshold por conversa se não existir
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='conversations' AND column_name='handoff_threshold') THEN
        ALTER TABLE public.conversations ADD COLUMN handoff_threshold FLOAT;
    END IF;
END $$;

-- Habilitar RLS para system_settings (leitura para autenticados)
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leitura de configurações para autenticados" ON public.system_settings FOR SELECT USING (auth.role() = 'authenticated');
