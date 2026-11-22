-- B6: dominio nas colunas `text` enumeraveis.
--
-- Escopo deliberadamente conservador. O doc de estado (linha 50) registra que uma
-- derivacao ampla por grep gera falso positivo e que um CHECK incompleto quebra
-- INSERT em producao. Entao cada CHECK abaixo so entra depois de conferir, nos
-- dois lados, o conjunto de valores:
--   - lado dos dados: valores distintos realmente gravados (medido no banco)
--   - lado do codigo: o que a UI/edge escreve
-- Ficaram de fora as colunas onde os dois lados divergem de forma irreconciliavel
-- (ver nota no fim).

-- 1) call_playlists.playlist_type
--    dados: auto | manual (2 linhas). codigo: 'auto' | 'manual'.
ALTER TABLE public.call_playlists
  DROP CONSTRAINT IF EXISTS call_playlists_playlist_type_check;
ALTER TABLE public.call_playlists
  ADD CONSTRAINT call_playlists_playlist_type_check
  CHECK (playlist_type IS NULL OR playlist_type IN ('auto', 'manual'));

-- 2) call_quality_metrics.quality_label
--    dados: fair | good | poor. O tipo QualityLabel do front
--    (useVoipQualityMonitor.ts:7) tambem preve 'excellent' e 'unknown'.
--    Normalizado em minuculas: a edge voip-load-test gravava 'Good'.
ALTER TABLE public.call_quality_metrics
  DROP CONSTRAINT IF EXISTS call_quality_metrics_quality_label_check;
ALTER TABLE public.call_quality_metrics
  ADD CONSTRAINT call_quality_metrics_quality_label_check
  CHECK (
    quality_label IS NULL
    OR lower(quality_label) IN ('excellent', 'good', 'fair', 'poor', 'unknown')
  );

-- 3) accounts.segment
--    dados: enterprise | midmarket | smb.
ALTER TABLE public.accounts
  DROP CONSTRAINT IF EXISTS accounts_segment_check;
ALTER TABLE public.accounts
  ADD CONSTRAINT accounts_segment_check
  CHECK (segment IS NULL OR segment IN ('enterprise', 'midmarket', 'smb'));

-- 4) accounts.current_stage
--    dados: at_risk | expansion | growth. O codigo tambem usa 'adoption'
--    (src/hooks/__tests__/useAccounts.test.ts:9), entao entra na lista.
ALTER TABLE public.accounts
  DROP CONSTRAINT IF EXISTS accounts_current_stage_check;
ALTER TABLE public.accounts
  ADD CONSTRAINT accounts_current_stage_check
  CHECK (
    current_stage IS NULL
    OR current_stage IN ('adoption', 'at_risk', 'expansion', 'growth')
  );

-- 5) agent_shifts.status
--    tabela vazia hoje; o codigo usa scheduled | active | completed.
ALTER TABLE public.agent_shifts
  DROP CONSTRAINT IF EXISTS agent_shifts_status_check;
ALTER TABLE public.agent_shifts
  ADD CONSTRAINT agent_shifts_status_check
  CHECK (
    status IS NULL
    OR status IN ('scheduled', 'active', 'completed', 'cancelled', 'no_show')
  );

-- 6) agent_devices.device_type
--    tabela vazia hoje; o mapa deviceTypeLabels/MultiDeviceRing.tsx:20
--    define desktop | mobile | sip_phone | softphone.
ALTER TABLE public.agent_devices
  DROP CONSTRAINT IF EXISTS agent_devices_device_type_check;
ALTER TABLE public.agent_devices
  ADD CONSTRAINT agent_devices_device_type_check
  CHECK (
    device_type IS NULL
    OR device_type IN ('desktop', 'mobile', 'sip_phone', 'softphone')
  );

-- 7) agent_ring_settings.ring_strategy
--    tabela vazia hoje; codigo usa sequential | simultaneous.
ALTER TABLE public.agent_ring_settings
  DROP CONSTRAINT IF EXISTS agent_ring_settings_ring_strategy_check;
ALTER TABLE public.agent_ring_settings
  ADD CONSTRAINT agent_ring_settings_ring_strategy_check
  CHECK (ring_strategy IS NULL OR ring_strategy IN ('sequential', 'simultaneous'));

-- 8) agent_ring_settings.fallback_action
--    tabela vazia hoje; fallbackLabels/MultiDeviceRing.tsx:21 define
--    voicemail | forward | queue.
ALTER TABLE public.agent_ring_settings
  DROP CONSTRAINT IF EXISTS agent_ring_settings_fallback_action_check;
ALTER TABLE public.agent_ring_settings
  ADD CONSTRAINT agent_ring_settings_fallback_action_check
  CHECK (fallback_action IS NULL OR fallback_action IN ('voicemail', 'forward', 'queue'));

-- FORA DE ESCOPO, de proposito:
--   call_quality_metrics.channel - tres grafias convivem e nao sao
--     reconciliaveis sem decisao de negocio: os dados tem 'SIP'/'WebRTC'
--     (maiusculo), o front grava 'sip'/'webrtc', e a edge voip-load-test grava
--     'SIP/test-trunk' (com sufixo). Um CHECK aqui rejeitaria pelo menos um dos
--     tres produtores. Precisa de normalizacao em codigo antes de ter dominio.
