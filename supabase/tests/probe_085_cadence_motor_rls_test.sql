-- Sonda da etapa 085 (achado A-078): o motor de cadencias existe no banco?
--
-- Ate agora `cadence_enrollments` so tem leitura e RLS: nenhuma edge, nenhum cron
-- e nenhuma funcao avanca `current_step`. O time monta a sequencia na tela
-- /cadences, inscreve o contato (next_action_at = now()) e nada acontece: a
-- inscricao fica em "etapa 1" para sempre.
--
-- Este arquivo e SOMENTE LEITURA. Ele responde, contra producao:
--   (a) o motor existe? (b) existe dado real de cadencia para o motor ter efeito?
--   (c) quais valores de step_type estao em uso (a coluna e text, sem CHECK - A-125)?
--   (d) ha inscricao vencida esperando processamento? (e) ha job de cron agendado?
--
-- Rodar com: psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f <este arquivo>

\pset footer off

\echo '=== 1. Motor de cadencias instalado? ==='
select to_regprocedure('public.cadence_tick(integer)') is not null as motor_existe,
       to_regclass('public.cadence_step_runs')  is not null as auditoria_existe;

\echo '=== 2. Volume das tabelas de cadencia ==='
select 'cadences' as tabela, count(*) as linhas from public.cadences
union all
select 'cadence_steps', count(*) from public.cadence_steps
union all
select 'cadence_enrollments', count(*) from public.cadence_enrollments
order by 1;

\echo '=== 3. Tipos de etapa realmente em uso (step_type e text sem CHECK) ==='
select coalesce(step_type, '<null>') as step_type,
       count(*) as etapas,
       count(distinct cadence_id) as cadencias
  from public.cadence_steps
 group by 1
 order by 2 desc;

\echo '=== 4. Inscricoes por status e quantas estao vencidas ==='
select coalesce(status, '<null>') as status,
       count(*) as inscricoes,
       count(*) filter (where next_action_at is not null and next_action_at <= now()) as vencidas
  from public.cadence_enrollments
 group by 1
 order by 1;

\echo '=== 5. Cadencias sem etapa (inscricao que o motor nao teria como processar) ==='
select count(*) as cadencias_sem_etapa
  from public.cadences c
 where not exists (select 1 from public.cadence_steps s where s.cadence_id = c.id);

\echo '=== 6. Job de cron ligado ao motor ==='
select jobname, schedule, active
  from cron.job
 where jobname ilike '%cadence%' or command ilike '%cadence%';

\echo '=== 7. Notificacoes ja emitidas por cadencia ==='
select count(*) as notificacoes_de_cadencia
  from public.notifications
 where source_type = 'cadence' or category = 'cadence';