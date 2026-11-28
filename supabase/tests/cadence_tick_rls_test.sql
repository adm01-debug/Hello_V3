-- Gate da etapa 085: o motor de cadencias existe e se comporta como contrato?
--
-- Ate aqui `cadence_enrollments` nao era tocada por nada: a inscricao ficava em
-- "etapa 1" para sempre. Este arquivo prova, contra producao e em transacao
-- revertida (nada fica gravado), que public.cadence_tick(integer):
--   S1 executa a etapa vencida, notifica o responsavel e avanca para a proxima
--   S2 rodar de novo no mesmo instante NAO duplica a notificacao (S1 repetido)
--   S3 conclui a inscricao quando a sequencia acaba
--   S4 pausa com motivo quando o agente da inscricao nao tem usuario vinculado
--   S5 pausa com motivo quando o step_type e desconhecido (coluna e text, sem CHECK)
--   S6 conclui cadencia sem nenhuma etapa (nao fica presa)
--   S7 nao toca inscricao com next_action_at no futuro
--   S8 nao toca inscricao cancelada nem pausada
--
-- As fixtures usam next_action_at no passado remoto de proposito: elas precisam
-- ser as primeiras da fila para o LIMIT do motor nao esconder a asserção.
--
-- Rodar com: psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f <este arquivo>

begin;

\pset footer off

\echo '=== 0. Motor instalado? ==='
select to_regprocedure('public.cadence_tick(integer)') is not null as motor_existe,
       to_regclass('public.cadence_step_runs')            is not null as auditoria_existe;

do $gate$
declare
  v_user     uuid;
  v_agent    uuid;
  v_contato  uuid;
  v_cad      uuid;
  v_cad_zero uuid;
  v_cad_tipo uuid;
  v_e        uuid;
  v_e_zero   uuid;
  v_e_tipo   uuid;
  v_e_futuro uuid;
  v_e_canc   uuid;
  v_e_sem_agente uuid;
  v_res      jsonb;
  v_row      record;
  v_notif    int;
  v_runs     int;
begin
  select id into v_user from public.user_profiles order by id limit 1;
  if v_user is null then
    raise exception 'gate 085: nao existe user_profiles para montar a fixture';
  end if;

  insert into public.agents (name, extension)
  values ('Gate 085 Agente', 'gate085-' || replace(gen_random_uuid()::text, '-', ''))
  returning id into v_agent;

  -- Vinculo agente -> usuario (revertido no rollback).
  update public.user_profiles set agent_id = v_agent where id = v_user;

  insert into public.contacts (name) values ('Gate 085 Contato') returning id into v_contato;

  -- S1/S2/S3: cadencia de duas etapas.
  insert into public.cadences (name) values ('Gate 085 Duas Etapas') returning id into v_cad;
  insert into public.cadence_steps (cadence_id, step_order, step_type, delay_days, delay_hours, subject)
  values (v_cad, 1, 'task', 0, 0, 'Passo 1 do gate');
  insert into public.cadence_steps (cadence_id, step_order, step_type, delay_days, delay_hours, subject)
  values (v_cad, 2, 'call', 0, 1, 'Passo 2 do gate');

  insert into public.cadence_enrollments (cadence_id, contact_id, agent_name, status, next_action_at)
  values (v_cad, v_contato, 'Gate 085 Agente', 'active', now() - interval '10 years')
  returning id into v_e;

  -- S4: agente que nao existe em public.agents.
  insert into public.cadence_enrollments (cadence_id, contact_id, agent_name, status, next_action_at)
  values (v_cad, v_contato, 'Gate 085 Agente Inexistente', 'active', now() - interval '9 years')
  returning id into v_e_sem_agente;

  -- S5: tipo de etapa desconhecido.
  insert into public.cadences (name) values ('Gate 085 Tipo Desconhecido') returning id into v_cad_tipo;
  insert into public.cadence_steps (cadence_id, step_order, step_type, delay_days, delay_hours)
  values (v_cad_tipo, 1, 'xpto_gate', 0, 0);
  insert into public.cadence_enrollments (cadence_id, contact_id, agent_name, status, next_action_at)
  values (v_cad_tipo, v_contato, 'Gate 085 Agente', 'active', now() - interval '8 years')
  returning id into v_e_tipo;

  -- S6: cadencia sem etapa.
  insert into public.cadences (name) values ('Gate 085 Sem Etapa') returning id into v_cad_zero;
  insert into public.cadence_enrollments (cadence_id, contact_id, agent_name, status, next_action_at)
  values (v_cad_zero, v_contato, 'Gate 085 Agente', 'active', now() - interval '7 years')
  returning id into v_e_zero;

  -- S7: vencimento no futuro nao pode ser tocado.
  insert into public.cadence_enrollments (cadence_id, contact_id, agent_name, status, next_action_at)
  values (v_cad, v_contato, 'Gate 085 Agente', 'active', now() + interval '1 day')
  returning id into v_e_futuro;

  -- S8: cancelada nao pode ser tocada.
  insert into public.cadence_enrollments (cadence_id, contact_id, agent_name, status, next_action_at)
  values (v_cad, v_contato, 'Gate 085 Agente', 'cancelled', now() - interval '10 years')
  returning id into v_e_canc;

  -- ===== 1a execucao =====
  v_res := public.cadence_tick(500);
  raise notice 'tick #1 = %', v_res;

  select current_step, status, next_action_at into v_row
    from public.cadence_enrollments where id = v_e;
  if v_row.current_step <> 1 then
    raise exception 'S1: current_step=% (esperado 1)', v_row.current_step;
  end if;
  if v_row.status <> 'active' then
    raise exception 'S1: status=% (esperado active)', v_row.status;
  end if;
  if v_row.next_action_at is null or v_row.next_action_at < now() + interval '55 minutes' then
    raise exception 'S1: intervalo do passo 2 nao aplicado (next_action_at=%)', v_row.next_action_at;
  end if;

  select count(*) into v_notif from public.notifications
   where source_type = 'cadence' and source_id = v_e::text;
  if v_notif <> 1 then
    raise exception 'S1: notificacoes=% (esperado 1)', v_notif;
  end if;

  -- ===== 2a execucao no mesmo instante: nao pode duplicar =====
  v_res := public.cadence_tick(500);
  select count(*) into v_notif from public.notifications
   where source_type = 'cadence' and source_id = v_e::text;
  if v_notif <> 1 then
    raise exception 'S2: tick repetido duplicou a notificacao (% linhas)', v_notif;
  end if;

  -- ===== 3a execucao, forçando o vencimento: conclui =====
  update public.cadence_enrollments set next_action_at = now() - interval '10 years' where id = v_e;
  v_res := public.cadence_tick(500);
  raise notice 'tick #3 = %', v_res;

  select current_step, status, completed_at into v_row
    from public.cadence_enrollments where id = v_e;
  if v_row.current_step <> 2 or v_row.status <> 'completed' or v_row.completed_at is null then
    raise exception 'S3: passo=%, status=%, completed_at=% (esperado 2/completed/nao nulo)',
      v_row.current_step, v_row.status, v_row.completed_at;
  end if;

  select count(*) into v_notif from public.notifications
   where source_type = 'cadence' and source_id = v_e::text;
  if v_notif <> 2 then
    raise exception 'S3: notificacoes=% (esperado 2)', v_notif;
  end if;

  select count(*) into v_runs from public.cadence_step_runs
   where enrollment_id = v_e and status = 'done';
  if v_runs <> 2 then
    raise exception 'S3: execucoes done=% (esperado 2)', v_runs;
  end if;

  -- ===== S4: agente sem usuario vinculado -> pausa com motivo =====
  select status, paused_reason into v_row
    from public.cadence_enrollments where id = v_e_sem_agente;
  if v_row.status <> 'paused' or v_row.paused_reason is null then
    raise exception 'S4: status=%, motivo=% (esperado paused com motivo)', v_row.status, v_row.paused_reason;
  end if;

  -- ===== S5: tipo desconhecido -> pausa com motivo, sem notificacao =====
  select status, paused_reason into v_row from public.cadence_enrollments where id = v_e_tipo;
  if v_row.status <> 'paused' or v_row.paused_reason is null then
    raise exception 'S5: status=%, motivo=% (esperado paused com motivo)', v_row.status, v_row.paused_reason;
  end if;
  select count(*) into v_notif from public.notifications
   where source_type = 'cadence' and source_id = v_e_tipo::text;
  if v_notif <> 0 then
    raise exception 'S5: tipo desconhecido gerou notificacao (% linhas)', v_notif;
  end if;

  -- ===== S6: cadencia sem etapa conclui, nao fica presa =====
  select status into v_row from public.cadence_enrollments where id = v_e_zero;
  if v_row.status <> 'completed' then
    raise exception 'S6: status=% (esperado completed)', v_row.status;
  end if;

  -- ===== S7: futuro intocado =====
  select current_step, status into v_row from public.cadence_enrollments where id = v_e_futuro;
  if v_row.current_step <> 0 or v_row.status <> 'active' then
    raise exception 'S7: passo=%, status=% (esperado 0/active)', v_row.current_step, v_row.status;
  end if;
  select count(*) into v_notif from public.notifications
   where source_type = 'cadence' and source_id = v_e_futuro::text;
  if v_notif <> 0 then
    raise exception 'S7: inscricao futura foi processada';
  end if;

  -- ===== S8: cancelada intocada =====
  select current_step, status into v_row from public.cadence_enrollments where id = v_e_canc;
  if v_row.current_step <> 0 or v_row.status <> 'cancelled' then
    raise exception 'S8: passo=%, status=% (esperado 0/cancelled)', v_row.current_step, v_row.status;
  end if;

  raise notice 'gate 085 OK: S1..S8 passaram';
end
$gate$;

\echo '=== 9. Estado deixado pelas fixtures (revertido no rollback) ==='
select e.id is not null as inscricao_existe, e.status, e.current_step
  from public.cadence_enrollments e
  join public.cadences c on c.id = e.cadence_id
 where c.name like 'Gate 085%'
 order by c.name;

rollback;