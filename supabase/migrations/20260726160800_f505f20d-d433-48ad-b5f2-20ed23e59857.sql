ALTER TABLE public.dialer_favorites
  ADD COLUMN IF NOT EXISTS tag text;

ALTER TABLE public.dialer_favorites
  DROP CONSTRAINT IF EXISTS dialer_favorites_tag_length;

ALTER TABLE public.dialer_favorites
  ADD CONSTRAINT dialer_favorites_tag_length
  CHECK (tag IS NULL OR (char_length(btrim(tag)) BETWEEN 1 AND 24 AND tag = btrim(tag)));

CREATE INDEX IF NOT EXISTS idx_dialer_favorites_user_tag_position
  ON public.dialer_favorites (user_id, tag, position);