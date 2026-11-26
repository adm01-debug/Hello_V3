CREATE OR REPLACE FUNCTION public.cadence_tick(p_limit integer DEFAULT 50)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  r             record;
  s             record;
  v_prox        record;
  v_destino     uuid;
  v_contato     text;
  v_titulo      text;
  v_mensagem    text;
  v_processadas integer := 0;
  v_concluidas  integer := 0;
  v_puladas     integer := 0;
  v_falhas      integer := 0;
  v_por_tipo    jsonb := '{}'::jsonb;
begin
  if p_limit is null or p_limit < 1 then
    p_limit := 50;
  elsif p_limit > 500 then
    p_limit := 500;
  end if;

  -- FOR UPDATE SKIP LOCKED: duas execucoes sobrepostas (cron + manual) nunca
  -- reivindicam a mesma inscricao, entao ninguem recebe o follow-up duas vezes.
  for r in
    select e.id, e.cadence_id, e.contact_id, e.deal_id, e.agent_name, e.current_step,
           c.name as cadence_name
      from public.cadence_enrollments e
      join public.cadences c on c.id = e.cadence_id
     where e.status = 'active'
       and e.next_action_at is not null
       and e.next_action_at <= now()
     order by e.next_action_at, e.id
     limit p_limit
       for update of e skip locked
  loop
    -- proxima etapa nao executada da sequencia
    select st.id, st.step_order, st.step_type, st.subject, st.body
      into s
      from public.cadence_steps st
     where st.cadence_id = r.cadence_id
       and st.step_order > r.current_step
     order by st.step_order
     limit 1;

    -- Sem etapa seguinte: a sequencia acabou (inclui cadencia sem nenhuma etapa).
    if s.id is null then
      update public.cadence_enrollments
         set status = 'completed', completed_at = now(), next_action_at = null
       where id = r.id;

      insert into public.cadence_step_runs
        (enrollment_id, cadence_id, step_order, step_type, status, detail)
      values
        (r.id, r.cadence_id, r.current_step, 'nenhuma', 'skipped',
         'cadencia sem etapa seguinte: inscricao concluida');

      v_concluidas := v_concluidas + 1;
      continue;
    end if;

    v_processadas := v_processadas + 1;

    select coalesce(ct.name, 'contato sem nome')
      into v_contato
      from public.contacts ct
     where ct.id = r.contact_id;

    -- Destinatario: o agente responsavel pela inscricao.
    select up.id
      into v_destino
      from public.user_profiles up
      join public.agents a on a.id = up.agent_id
     where a.name = r.agent_name
     limit 1;

    -- Sem destinatario nao existe entrega. Pausa com o motivo escrito em vez de
    -- avancar calado e perder o follow-up.
    if v_destino is null then
      update public.cadence_enrollments
         set status = 'paused',
             paused_reason = format(
               'Etapa %s nao entregue: agente %s sem usuario vinculado',
               s.step_order, coalesce(nullif(btrim(r.agent_name), ''), '(vazio)')
             )
       where id = r.id;

      insert into public.cadence_step_runs
        (enrollment_id, cadence_id, step_id, step_order, step_type, status, detail)
      values
        (r.id, r.cadence_id, s.id, s.step_order, s.step_type, 'failed',
         'agente sem usuario vinculado nao recebe notificacao');

      v_falhas := v_falhas + 1;
      continue;
    end if;

    begin
      v_titulo   := nullif(btrim(coalesce(s.subject, '')), '');
      v_mensagem := nullif(btrim(coalesce(s.body, '')), '');

      if s.step_type = 'task' then
        v_titulo   := coalesce(v_titulo, format('Tarefa — cadencia "%s" (passo %s)', r.cadence_name, s.step_order));
        v_mensagem := coalesce(v_mensagem, format('Tarefa agendada para %s.', v_contato));
      elsif s.step_type = 'call' then
        v_titulo   := coalesce(v_titulo, format('Ligar — cadencia "%s" (passo %s)', r.cadence_name, s.step_order));
        v_mensagem := coalesce(v_mensagem, format('Ligar para %s.', v_contato));
      elsif s.step_type = 'whatsapp' then
        v_titulo   := coalesce(v_titulo, format('WhatsApp — cadencia "%s" (passo %s)', r.cadence_name, s.step_order));
        v_mensagem := coalesce(v_mensagem, format('Enviar WhatsApp para %s.', v_contato));
      elsif s.step_type = 'email' then
        v_titulo   := coalesce(v_titulo, format('E-mail — cadencia "%s" (passo %s)', r.cadence_name, s.step_order));
        v_mensagem := coalesce(v_mensagem, format('Enviar e-mail para %s.', v_contato));
      else
        -- step_type e text sem CHECK (A-125). Tipo desconhecido nao executa e nao
        -- some: pausa a inscricao com o tipo no motivo, para alguem corrigir.
        update public.cadence_enrollments
           set status = 'paused',
               paused_reason = format(
                 'Etapa %s tem tipo desconhecido: %s', s.step_order, coalesce(nullif(s.step_type, ''), '(vazio)')
               )
         where id = r.id;

        insert into public.cadence_step_runs
          (enrollment_id, cadence_id, step_id, step_order, step_type, status, detail)
        values
          (r.id, r.cadence_id, s.id, s.step_order, coalesce(s.step_type, ''),
           'skipped', 'tipo de etapa desconhecido: nao executado');

        v_puladas := v_puladas + 1;
        continue;
      end if;

      insert into public.notifications
        (user_id, title, message, type, category, severity,
         action_url, action_label, source_type, source_id, metadata)
      values
        (v_destino, v_titulo, v_mensagem, 'info', 'cadence', 'info',
         '/cadences', 'Ver cadencias', 'cadence', r.id::text,
         jsonb_build_object(
           'enrollment_id', r.id,
           'cadence_id',    r.cadence_id,
           'cadence_name',  r.cadence_name,
           'step_id',       s.id,
           'step_order',    s.step_order,
           'step_type',     s.step_type,
           'contact_id',    r.contact_id,
           'deal_id',       r.deal_id
         ));

      -- Intervalo da proxima etapa, contado a partir de agora (execucao real).
      select st.delay_days, st.delay_hours
        into v_prox
        from public.cadence_steps st
       where st.cadence_id = r.cadence_id
         and st.step_order > s.step_order
       order by st.step_order
       limit 1;

      -- delay_days/delay_hours sao NOT NULL: null aqui significa "nao ha proxima".
      if v_prox.delay_days is null then
        update public.cadence_enrollments
           set current_step = s.step_order,
               status = 'completed',
               completed_at = now(),
               next_action_at = null
         where id = r.id;
        v_concluidas := v_concluidas + 1;
      else
        update public.cadence_enrollments
           set current_step = s.step_order,
               next_action_at = now() + make_interval(days => v_prox.delay_days, hours => v_prox.delay_hours)
         where id = r.id;
      end if;

      insert into public.cadence_step_runs
        (enrollment_id, cadence_id, step_id, step_order, step_type, status, detail)
      values
        (r.id, r.cadence_id, s.id, s.step_order, s.step_type, 'done',
         format('notificado usuario %s', v_destino));

      v_por_tipo := jsonb_set(
        v_por_tipo,
        array[coalesce(nullif(s.step_type, ''), 'vazio')],
        to_jsonb(coalesce((v_por_tipo ->> coalesce(nullif(s.step_type, ''), 'vazio'))::int, 0) + 1)
      );
    exception when others then
      -- Erro nao pode travar a fila nem repetir a notificacao a cada tick:
      -- pausa a inscricao com o erro escrito.
      update public.cadence_enrollments
         set status = 'paused',
             paused_reason = format('Etapa %s falhou: %s', s.step_order, left(SQLERRM, 300))
       where id = r.id;

      insert into public.cadence_step_runs
        (enrollment_id, cadence_id, step_id, step_order, step_type, status, detail)
      values
        (r.id, r.cadence_id, s.id, s.step_order, s.step_type, 'failed', left(SQLERRM, 500));

      v_falhas := v_falhas + 1;
    end;
  end loop;

  return jsonb_build_object(
    'processadas', v_processadas,
    'concluidas',  v_concluidas,
    'puladas',     v_puladas,
    'falhas',      v_falhas,
    'por_tipo',    v_por_tipo,
    'limite',      p_limit
  );
end;
$function$
