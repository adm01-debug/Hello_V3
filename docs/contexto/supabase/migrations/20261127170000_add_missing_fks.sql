-- Etapa 128 (achado A-127) -- chaves estrangeiras nas colunas que apontam para UMA tabela so.
--
-- O plano listava quatro colunas. Medido em producao (probe `fk_probe_128`):
--   bitrix_departments.parent_id      text  -- 0 linhas, 0 orfaos -> FK auto-referente OK
--   coaching_assignments.scorecard_id uuid  -- 4 linhas, 0 nao nulos -> FK para call_scorecards OK
--   call_scorecards.reviewer_id       uuid  -- 0 linhas -> FK para auth.users (o revisor e o
--                                              usuario logado; a coluna vizinha e reviewer_email) OK
--   voip_recommendation_actions.recommendation_id text -- **nao tem destino**: os ids sao
--     codigos gerados no proprio cliente pelo motor de recomendacao (`src/components/network/
--     VoipRecommendationsPanel.tsx:83` grava `rec.id`, e o fixture do teste usa 'cap-1'), nao
--     sao chave de nenhuma tabela. FK nessa coluna e impossivel; o que falta aqui e o CHECK do
--     `action_type`, que e a etapa 139.
--
-- Ordem: limpar orfaos ANTES do ADD CONSTRAINT (senao a migration inteira aborta por causa do
-- `--single-transaction` do workflow -- A-092). ON DELETE SET NULL, nunca CASCADE: apagar um
-- scorecard nao deve apagar a atribuicao de coaching.
--
-- Reversao: drop constraint bitrix_departments_parent_id_fkey / coaching_assignments_scorecard_id_fkey
-- / call_scorecards_reviewer_id_fkey (o dado nulado nao volta).

-- 1. Orfaos (hoje: 0 linhas em cada uma das tres colunas).
update public.bitrix_departments t
   set parent_id = null
 where t.parent_id is not null
   and not exists (select 1 from public.bitrix_departments d where d.id = t.parent_id)

update public.coaching_assignments t
   set scorecard_id = null
 where t.scorecard_id is not null
   and not exists (select 1 from public.call_scorecards c where c.id = t.scorecard_id)

update public.call_scorecards t
   set reviewer_id = null
 where t.reviewer_id is not null
   and not exists (select 1 from auth.users u where u.id = t.reviewer_id)

-- 2. As tres constraints (idempotente).
do $$
begin
  if not exists (select 1 from pg_constraint
                  where conrelid = 'public.bitrix_departments'::regclass
                    and conname = 'bitrix_departments_parent_id_fkey') then
    alter table public.bitrix_departments
      add constraint bitrix_departments_parent_id_fkey
      foreign key (parent_id) references public.bitrix_departments(id) on delete set null;
    raise notice 'criada: bitrix_departments_parent_id_fkey';
  end if;

  if not exists (select 1 from pg_constraint
                  where conrelid = 'public.coaching_assignments'::regclass
                    and conname = 'coaching_assignments_scorecard_id_fkey') then
    alter table public.coaching_assignments
      add constraint coaching_assignments_scorecard_id_fkey
      foreign key (scorecard_id) references public.call_scorecards(id) on delete set null;
    raise notice 'criada: coaching_assignments_scorecard_id_fkey';
  end if;

  if not exists (select 1 from pg_constraint
                  where conrelid = 'public.call_scorecards'::regclass
                    and conname = 'call_scorecards_reviewer_id_fkey') then
    alter table public.call_scorecards
      add constraint call_scorecards_reviewer_id_fkey
      foreign key (reviewer_id) references auth.users(id) on delete set null;
    raise notice 'criada: call_scorecards_reviewer_id_fkey';
  end if;
end $$
