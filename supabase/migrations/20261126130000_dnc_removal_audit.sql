-- Etapa 175 (A-123, A-025): rastreabilidade da remocao e edicao de entradas da lista DNC.
-- A lista tem efeito regulatorio: remover um numero por engano precisa deixar autor e data.
-- O cliente continua apenas fazendo o soft delete (is_active = false); quem carimba e o gatilho.

alter table public.dnc_list add column if not exists removed_by text;
alter table public.dnc_list add column if not exists removed_at timestamp with time zone;
alter table public.dnc_list add column if not exists removal_reason text;

comment on column public.dnc_list.removed_by is
  'E-mail de quem desativou a entrada. Gravado pelo gatilho trg_dnc_track_removal, nunca pelo cliente.';
comment on column public.dnc_list.removed_at is
  'Momento da desativacao (soft delete). Gravado pelo gatilho; volta a NULL se a entrada for reativada.';
comment on column public.dnc_list.removal_reason is
  'Motivo textual da desativacao, quando informado na tela. Gatilho preenche um padrao se vier vazio.';

create or replace function public.dnc_track_removal()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_email text;
begin
  if old.is_active is distinct from new.is_active then
    if new.is_active is false then
      select email into v_email from public.user_profiles where id = auth.uid();
      new.removed_at := now();
      new.removed_by := coalesce(
        nullif(btrim(coalesce(new.removed_by, '')), ''),
        v_email,
        nullif(btrim(coalesce(current_setting('request.jwt.claims', true)::jsonb ->> 'email', '')), ''),
        'desconhecido'
      );
      new.removal_reason := coalesce(nullif(btrim(coalesce(new.removal_reason, '')), ''), 'removido na interface');
    else
      new.removed_at := null;
      new.removed_by := null;
      new.removal_reason := null;
    end if;
  end if;
  return new;
end;
$$;

revoke execute on function public.dnc_track_removal() from public, anon, authenticated;

drop trigger if exists trg_dnc_track_removal on public.dnc_list;
create trigger trg_dnc_track_removal
  before update on public.dnc_list
  for each row
  execute function public.dnc_track_removal();