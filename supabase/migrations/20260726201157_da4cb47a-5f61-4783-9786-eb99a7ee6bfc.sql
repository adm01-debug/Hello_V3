CREATE TABLE public.queue_audio_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  kind text NOT NULL DEFAULT 'moh',
  storage_path text NOT NULL,
  mime_type text NOT NULL DEFAULT 'audio/mpeg',
  file_size_bytes bigint NOT NULL DEFAULT 0,
  duration_seconds integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT queue_audio_prompts_name_not_blank CHECK (length(btrim(name)) > 0 AND length(name) <= 120),
  CONSTRAINT queue_audio_prompts_kind_check CHECK (kind = ANY (ARRAY['moh','greeting','position','hold_time','overflow','off_hours'])),
  CONSTRAINT queue_audio_prompts_path_check CHECK (length(btrim(storage_path)) > 0 AND length(storage_path) <= 1024),
  CONSTRAINT queue_audio_prompts_mime_check CHECK (mime_type LIKE 'audio/%' AND length(mime_type) <= 100),
  CONSTRAINT queue_audio_prompts_size_check CHECK (file_size_bytes >= 0 AND file_size_bytes <= 20971520),
  CONSTRAINT queue_audio_prompts_duration_check CHECK (duration_seconds >= 0 AND duration_seconds <= 3600),
  CONSTRAINT queue_audio_prompts_unique_name UNIQUE (name)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.queue_audio_prompts TO authenticated;
GRANT ALL ON public.queue_audio_prompts TO service_role;

ALTER TABLE public.queue_audio_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "queue_audio_prompts_select_authenticated"
  ON public.queue_audio_prompts FOR SELECT TO authenticated USING (true);

CREATE POLICY "queue_audio_prompts_write_staff"
  ON public.queue_audio_prompts FOR ALL TO authenticated
  USING (public.is_admin_or_supervisor())
  WITH CHECK (public.is_admin_or_supervisor());

CREATE INDEX idx_queue_audio_prompts_kind_active ON public.queue_audio_prompts (kind, is_active);

CREATE TRIGGER trg_queue_audio_prompts_updated_at
  BEFORE UPDATE ON public.queue_audio_prompts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.call_queues
  ADD COLUMN moh_prompt_id uuid REFERENCES public.queue_audio_prompts(id) ON DELETE SET NULL,
  ADD COLUMN greeting_prompt_id uuid REFERENCES public.queue_audio_prompts(id) ON DELETE SET NULL,
  ADD COLUMN periodic_prompt_id uuid REFERENCES public.queue_audio_prompts(id) ON DELETE SET NULL,
  ADD COLUMN overflow_prompt_id uuid REFERENCES public.queue_audio_prompts(id) ON DELETE SET NULL,
  ADD COLUMN greeting_enabled boolean NOT NULL DEFAULT false;

CREATE INDEX idx_call_queues_moh_prompt ON public.call_queues (moh_prompt_id) WHERE moh_prompt_id IS NOT NULL;
CREATE INDEX idx_call_queues_greeting_prompt ON public.call_queues (greeting_prompt_id) WHERE greeting_prompt_id IS NOT NULL;
CREATE INDEX idx_call_queues_periodic_prompt ON public.call_queues (periodic_prompt_id) WHERE periodic_prompt_id IS NOT NULL;
CREATE INDEX idx_call_queues_overflow_prompt ON public.call_queues (overflow_prompt_id) WHERE overflow_prompt_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.validate_queue_audio_slots()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_kind text;
  v_active boolean;
BEGIN
  IF NEW.moh_prompt_id IS NOT NULL THEN
    SELECT kind, is_active INTO v_kind, v_active FROM public.queue_audio_prompts WHERE id = NEW.moh_prompt_id;
    IF v_kind IS DISTINCT FROM 'moh' THEN
      RAISE EXCEPTION 'O audio selecionado para musica de espera nao e do tipo musica de espera';
    END IF;
    IF NOT v_active THEN
      RAISE EXCEPTION 'O audio de musica de espera selecionado esta desativado';
    END IF;
  END IF;

  IF NEW.greeting_prompt_id IS NOT NULL THEN
    SELECT kind, is_active INTO v_kind, v_active FROM public.queue_audio_prompts WHERE id = NEW.greeting_prompt_id;
    IF v_kind IS DISTINCT FROM 'greeting' THEN
      RAISE EXCEPTION 'O audio selecionado para saudacao nao e do tipo saudacao';
    END IF;
    IF NOT v_active THEN
      RAISE EXCEPTION 'O audio de saudacao selecionado esta desativado';
    END IF;
  END IF;

  IF NEW.periodic_prompt_id IS NOT NULL THEN
    SELECT kind, is_active INTO v_kind, v_active FROM public.queue_audio_prompts WHERE id = NEW.periodic_prompt_id;
    IF v_kind NOT IN ('position','hold_time','off_hours') THEN
      RAISE EXCEPTION 'O audio periodico deve ser de posicao, tempo de espera ou fora de horario';
    END IF;
    IF NOT v_active THEN
      RAISE EXCEPTION 'O audio periodico selecionado esta desativado';
    END IF;
  END IF;

  IF NEW.overflow_prompt_id IS NOT NULL THEN
    SELECT kind, is_active INTO v_kind, v_active FROM public.queue_audio_prompts WHERE id = NEW.overflow_prompt_id;
    IF v_kind IS DISTINCT FROM 'overflow' THEN
      RAISE EXCEPTION 'O audio selecionado para transbordo nao e do tipo transbordo';
    END IF;
    IF NOT v_active THEN
      RAISE EXCEPTION 'O audio de transbordo selecionado esta desativado';
    END IF;
  END IF;

  IF NEW.greeting_enabled AND NEW.greeting_prompt_id IS NULL THEN
    RAISE EXCEPTION 'Ative a saudacao apenas apos selecionar um audio de saudacao';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_queue_audio_slots
  BEFORE INSERT OR UPDATE ON public.call_queues
  FOR EACH ROW EXECUTE FUNCTION public.validate_queue_audio_slots();

CREATE POLICY "queue_audio_read_authenticated"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'queue-audio');

CREATE POLICY "queue_audio_insert_staff"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'queue-audio' AND public.is_admin_or_supervisor());

CREATE POLICY "queue_audio_update_staff"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'queue-audio' AND public.is_admin_or_supervisor())
  WITH CHECK (bucket_id = 'queue-audio' AND public.is_admin_or_supervisor());

CREATE POLICY "queue_audio_delete_staff"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'queue-audio' AND public.is_admin_or_supervisor());