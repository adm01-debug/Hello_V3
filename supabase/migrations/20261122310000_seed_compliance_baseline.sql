-- Compliance estava inoperante por falta de dados: calling_hours_config,
-- compliance_settings e holidays zerados faziam check_calling_hours cair no
-- caminho "No config found, allowing" e nunca bloquear nada.
-- Defaults abaixo seguem a pratica de mercado para discagem ativa no Brasil
-- e nos EUA (dias uteis em horario comercial, sabado parcial, domingo off).

INSERT INTO public.compliance_settings (setting_key, setting_value, description) VALUES
  ('dnc_enabled', 'true'::jsonb, 'Bloqueia discagem para numeros na lista DNC'),
  ('calling_hours_enabled', 'true'::jsonb, 'Bloqueia discagem fora da janela de horario permitida'),
  ('lgpd_consent_required', 'true'::jsonb, 'Exige consentimento LGPD antes de contatar'),
  ('max_attempts_per_day', '3'::jsonb, 'Tentativas maximas por dia por contato'),
  ('min_interval_between_calls', '3600'::jsonb, 'Intervalo minimo entre tentativas (segundos)'),
  ('auto_add_complaint_to_dnc', 'true'::jsonb, 'Adiciona automaticamente a DNC em caso de reclamacao')
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO public.calling_hours_config
  (region_code, region_name, timezone, weekday_start, weekday_end,
   saturday_start, saturday_end, sunday_allowed, holidays_allowed, is_active)
VALUES
  ('BR', 'Brasil', 'America/Sao_Paulo', '09:00', '18:00', '09:00', '13:00', false, false, true),
  ('US', 'Estados Unidos', 'America/New_York', '08:00', '21:00', '09:00', '20:00', true, false, true)
ON CONFLICT (region_code) DO UPDATE SET
  weekday_start = EXCLUDED.weekday_start,
  weekday_end = EXCLUDED.weekday_end,
  saturday_start = EXCLUDED.saturday_start,
  saturday_end = EXCLUDED.saturday_end,
  sunday_allowed = EXCLUDED.sunday_allowed,
  holidays_allowed = EXCLUDED.holidays_allowed,
  is_active = TRUE,
  updated_at = now();

INSERT INTO public.holidays (name, date, region_code, is_national, recurring) VALUES
  ('Confraternizacao Universal', '2026-01-01', 'BR', true, true),
  ('Carnaval', '2026-02-17', 'BR', true, false),
  ('Sexta-feira Santa', '2026-04-03', 'BR', true, false),
  ('Tiradentes', '2026-04-21', 'BR', true, true),
  ('Dia do Trabalho', '2026-05-01', 'BR', true, true),
  ('Corpus Christi', '2026-06-04', 'BR', true, false),
  ('Independencia', '2026-09-07', 'BR', true, true),
  ('Nossa Senhora Aparecida', '2026-10-12', 'BR', true, true),
  ('Finados', '2026-11-02', 'BR', true, true),
  ('Proclamacao da Republica', '2026-11-15', 'BR', true, true),
  ('Natal', '2026-12-25', 'BR', true, true),
  ('Independence Day', '2026-07-04', 'US', true, true),
  ('Thanksgiving', '2026-11-26', 'US', true, false),
  ('Christmas', '2026-12-25', 'US', true, true)
ON CONFLICT DO NOTHING;
