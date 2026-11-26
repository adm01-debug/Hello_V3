-- Etapa 122 — o feriado recorrente ja bloqueia todo ano. Esta migration nao muda
-- comportamento: registra o contrato na propria funcao.
--
-- A comparacao por mes/dia quando recurring = true entrou junto com a etapa 035
-- (20261125190000_calling_hours_fail_closed.sql), que recriou check_calling_hours por
-- outro motivo. O plano da 122 partiu da versao anterior do arquivo, que comparava so
-- a data exata e ignorava a coluna. Prova do comportamento: gate
-- supabase/tests/recurring_holidays_rls_test.sql.
--
-- O que sobra e a documentacao no lugar onde ela importa: quem ler a funcao ve o
-- contrato do feriado e a limitacao dos feriados moveis sem precisar cruzar arquivos.

comment on function public.check_calling_hours(text) is
  'Etapa 035 + 122. Decide se a discagem e permitida agora. Fail-closed: sem calling_hours_config ativa para a regiao (nem BR como fallback) devolve can_call = false. Feriado: compara a data exata OU, quando holidays.recurring, mes e dia em qualquer ano; respeita calling_hours_config.holidays_allowed. Limitacao conhecida: feriado movel (Carnaval, Pascoa, Corpus Christi) nao e calculado — precisa ser cadastrado em holidays por ano, com recurring = false.'

comment on column public.holidays.recurring is
  'Etapa 122: true faz check_calling_hours comparar mes e dia em qualquer ano (data exata tambem bate). Feriado movel (Carnaval, Pascoa) nao tem regra de calculo — cadastre a data do ano com recurring = false.'
