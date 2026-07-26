CREATE TABLE public.dialer_favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  phone TEXT NOT NULL,
  label TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT dialer_favorites_phone_len CHECK (char_length(phone) BETWEEN 3 AND 32),
  CONSTRAINT dialer_favorites_label_len CHECK (label IS NULL OR char_length(label) <= 120),
  CONSTRAINT dialer_favorites_unique_phone UNIQUE (user_id, phone)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.dialer_favorites TO authenticated;
GRANT ALL ON public.dialer_favorites TO service_role;

ALTER TABLE public.dialer_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own dialer favorites"
ON public.dialer_favorites FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_dialer_favorites_user ON public.dialer_favorites (user_id, position);

CREATE TRIGGER update_dialer_favorites_updated_at
BEFORE UPDATE ON public.dialer_favorites
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();