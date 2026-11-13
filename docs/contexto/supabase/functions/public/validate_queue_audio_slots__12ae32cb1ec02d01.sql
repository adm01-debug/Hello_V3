CREATE OR REPLACE FUNCTION public.validate_queue_audio_slots()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
