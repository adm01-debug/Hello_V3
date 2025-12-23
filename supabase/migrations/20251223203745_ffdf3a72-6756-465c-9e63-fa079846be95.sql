-- Create agents table for call transfers
CREATE TABLE public.agents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  extension text NOT NULL UNIQUE,
  email text,
  status text NOT NULL DEFAULT 'available',
  avatar_url text,
  department text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (no auth required for this demo)
CREATE POLICY "Allow public read on agents" 
ON public.agents 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert on agents" 
ON public.agents 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update on agents" 
ON public.agents 
FOR UPDATE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_agents_updated_at
BEFORE UPDATE ON public.agents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some initial agents
INSERT INTO public.agents (name, extension, email, status, department) VALUES
  ('Maria Santos', '101', 'maria.santos@empresa.com', 'available', 'Suporte'),
  ('Carlos Oliveira', '102', 'carlos.oliveira@empresa.com', 'available', 'Vendas'),
  ('Ana Costa', '103', 'ana.costa@empresa.com', 'busy', 'Suporte'),
  ('Pedro Lima', '104', 'pedro.lima@empresa.com', 'available', 'Atendimento'),
  ('Julia Mendes', '105', 'julia.mendes@empresa.com', 'available', 'Vendas');