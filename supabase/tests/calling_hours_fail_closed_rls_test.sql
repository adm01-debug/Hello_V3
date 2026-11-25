-- Gate da etapa 035 (achado A-024): check_calling_hours nao pode liberar a
-- discagem quando nao existe configuracao de horario.
--
-- Roda dentro de transacao revertida no fim (nada fica gravado no banco):
--   1. com o seed aplicado, a funcao usa a janela real da regiao
--   2. com todas as configuracoes desativadas, a funcao BLOQUEIA (fail-closed)
--
-- Qualquer passo fora do esperado levanta excecao: com ON_ERROR_STOP o job fica
-- vermelho. Rodar com: psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f <este arquivo>

\set ON_ERROR_STOP on
begin;

-- 1. Config real: a resposta tem de vir da janela configurada, nunca do ramo de falha.
do $$
declare
  v jsonb;
  v_reason text;
begin
  v := public.check_calling_hours('BR');
  v_reason := coalesce(v ->> 'reason', '');

  if v ->> 'can_call' is null then
    raise exception 'FALHA 1: check_calling_hours nao devolveu can_call';
  end if;
  if v_reason like 'Sem configura%' then
    raise exception 'FALHA 1: funcao caiu no ramo de falta de config com config ativa presente';
  end if;
  raise notice 'OK 1: funcao usou a janela configurada (%)', v_reason;
end $$;

-- 2. Sem nenhuma configuracao ativa: a discagem tem de ser recusada.
update public.calling_hours_config set is_active = false;

do $$
declare
  v jsonb;
begin
  v := public.check_calling_hours('BR');
  if (v ->> 'can_call')::boolean is distinct from false then
    raise exception 'FALHA 2: sem configuracao ativa a funcao liberou a discagem (fail-open)';
  end if;
  if coalesce(v ->> 'reason', '') not like 'Sem configura%' then
    raise exception 'FALHA 2: motivo inesperado ao bloquear: %', v ->> 'reason';
  end if;
  raise notice 'OK 2: sem configuracao ativa a discagem e bloqueada';
end $$;

\echo '=== fim: nada foi gravado (rollback) ==='
rollback;