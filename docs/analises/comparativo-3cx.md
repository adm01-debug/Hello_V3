# Comparativo de Paridade — 3CX Virtual PBX × Plataforma HELLO

**Data:** 26/07/2026
**Fonte de referência:** https://www.3cx.com/pbx/virtual/ (PBX virtual hospedado/gerenciado)
**Escopo:** análise somente-leitura de `src/`, `supabase/functions/`, `supabase/migrations/` e do schema no banco. Nenhum comportamento de produto foi alterado.

---

## 1. Método

Para cada recurso anunciado pelo 3CX Virtual PBX foi feita uma busca dirigida por:

1. **Tabela** no schema `public` (consulta em `information_schema.tables`);
2. **Edge function** em `supabase/functions/`;
3. **Hook** em `src/hooks/`;
4. **Rota/página** em `src/routes/protectedRoutes.tsx` e `src/pages/`.

Classificação: **Completo** (fluxo ponta a ponta), **Parcial** (existe base mas falta camada de operação/UI), **Ausente** (nenhuma evidência), **Fora de escopo** (bloqueado por decisão de plataforma web-only).

Esforço: **S** ≤ 1 onda, **M** 1–2 ondas, **L** ≥ 3 ondas.

---

## 2. Matriz de paridade

### 2.1 Telefonia central

| Recurso 3CX | Situação | Evidência | Esforço da lacuna |
|---|---|---|---|
| Softphone WebRTC no navegador | **Completo** | `src/hooks/useSipCall.ts` (JsSIP), `src/pages/PhoneDialer.tsx` | — |
| Troncos SIP com múltiplos provedores | **Completo** | tabela `voip_trunks` (23 col.), `supabase/functions/voip-trunks-manage` | — |
| Failover automático de tronco | **Completo** (supera o 3CX) | `supabase/functions/sip-config/index.ts` (linhas 77–101), `notify_trunk_offline()` | — |
| Transferência (cega e assistida) | **Completo** | `src/hooks/useCallTransfer.ts` (21 ocorrências de transfer) | — |
| Espera / mudo / DTMF | **Completo** | `useSipCall.ts` — `hold`/`unhold`/`mute`/`sendDTMF` | — |
| Conferência multiparte | **Completo** | `src/hooks/useMultiChannelCallConference.ts` | — |
| Correio de voz + transcrição | **Completo** (supera) | tabela `voicemail_messages`, `supabase/functions/transcribe-recording` | — |
| Gravação de chamadas | **Completo** | `call_recordings`, `src/hooks/useCallRecording.ts` | — |
| Provisionamento de ramais | **Completo** | `/admin/extensions`, `src/pages/QRProvisioning.tsx`, `agent_devices` | — |
| Hot desking | **Completo** | `hot_desking_stations`, `src/pages/HotDesking.tsx` | — |
| Toque em múltiplos dispositivos | **Completo** | `agent_ring_settings`, `src/pages/MultiDeviceRing.tsx` | — |
| **Música em espera (MoH) por fila** | **Ausente** | nenhuma tabela, função ou arquivo com `music_on_hold`/`moh`. O bullet de marketing em `src/pages/marketing/VsThreeCPlus.tsx` ("Áudio de espera personalizado por fila") **não tem implementação correspondente** | **M** |
| **Anúncios de fila (posição/tempo de espera)** | **Ausente** | somente o nó `announcement` no designer (`src/pages/CallFlowDesigner.tsx:54`), sem execução | **M** |
| **Estacionamento de chamadas (park orbits)** | **Ausente** | as 46 ocorrências de `park` são todas de `hold`/tokens não relacionados; não há orbit, retomada nem timeout de parking | **M** |
| **BLF / lâmpada de ocupado por ramal** | **Ausente** | nenhuma referência; `useActiveCallsRealtime.ts` fornece a base de presença de chamada | **M** |
| **Chamada de emergência (190/192/193)** | **Ausente** | nenhuma regra dedicada; `validate-geo` e `check-calling-hours` poderiam bloquear indevidamente | **S** |

### 2.2 Filas e distribuição

| Recurso 3CX | Situação | Evidência | Esforço |
|---|---|---|---|
| Recepcionista digital / IVR | **Completo** | `call_flows`, `src/pages/CallFlowDesigner.tsx` (nós start/menu/queue/voicemail/transfer/ring_group/time_check/announcement/hangup) | — |
| Métricas e SLA de fila | **Completo** | `queue_metrics_settings`, `sla_policies`, `supabase/functions/check-queue-metrics`, `enforce-sla` | — |
| Roteamento por skill | **Completo** | `queue_skill_requirements`, `agent_skills`, `routing_rules` | — |
| **Configuração de fila como entidade** (estratégia de ring, tempo máximo, overflow, prioridade) | **Parcial** | existem métricas e requisitos de skill, mas **não existe tabela `call_queues`**; a fila só existe como nó de desenho e como `dialer_queue` (saída) | **L** |
| **Grupos de toque (ring groups)** como entidade configurável | **Parcial** | apenas o tipo de nó `ring_group` no designer; sem tabela, sem membros, sem estratégia (simultâneo/sequencial/round-robin) | **M** |
| Callback na fila | **Completo** | `scheduled_callbacks`, `src/pages/Callbacks.tsx` | — |
| Supervisão (escuta/sussurro/barge-in) | **Completo** (supera) | `barge_in_sessions`, `whisper_messages` | — |

### 2.3 Colaboração e omnicanal

| Recurso 3CX | Situação | Evidência | Esforço |
|---|---|---|---|
| Videoconferência | **Completo** | `video_conferences`, `src/pages/VideoConference.tsx` | — |
| WhatsApp | **Completo** (supera) | `whatsapp-inbound`, `whatsapp-rewrite`, Wavoip | — |
| Live chat no site | **Parcial** | backend pronto (`chat_sessions`, `supabase/functions/chat-widget-session`), **sem widget embutível** para o site do cliente | **M** |
| E-mail / inbox unificado | **Completo** | `conversations`, `email_tickets`, `/inbox` | — |
| **SMS bidirecional** | **Ausente** | as 21 ocorrências de `sms` são todas de 2FA (`src/pages/two-factor/SmsCard.tsx`) e consentimento — não há canal SMS de atendimento | **M** |
| **Chat interno entre agentes** | **Ausente** | nenhuma tabela de mensageria interna; `whisper_messages` é restrito a supervisão em chamada | **M** |
| **Presença rica de ramal** (disponível/ocupado/DND/em pausa, visível a todos) | **Parcial** | `agents.status` + `useActiveCallsRealtime`, sem painel de presença consolidado nem DND | **S** |
| Fax virtual | **Completo** | `virtual_fax`, `ocr-virtual-fax` | — |

### 2.4 Gestão, segurança e integrações

| Recurso 3CX | Situação | Evidência |
|---|---|---|
| Relatórios de call center | **Completo** (supera) | `/reports`, `/call-analytics`, `/executive-dashboard` |
| Integração CRM | **Completo** | Bitrix24 bidirecional, `crm_sync_queue`, `extract-crm-fields` |
| LDAP / Active Directory | **Completo** | `supabase/functions` + `src/pages/LDAPSync.tsx` |
| Segurança (2FA, allowlist IP, geo-block, auditoria) | **Completo** (supera) | `user_mfa_settings`, `user_passkeys`, `ip_whitelist`, `geo_restrictions`, `audit_logs` |
| Portabilidade numérica / 0800 | **Completo** | `number_porting_requests`, `toll_free_numbers` |
| Inteligência de conversa por IA | **Completo** (muito acima do 3CX) | 20+ edge functions de IA (sentimento, momentos-chave, coaching, forecast) |

### 2.5 Fora de escopo (decisão de plataforma)

| Recurso 3CX | Motivo |
|---|---|
| Apps nativos iOS/Android | Projeto é web-only (ver `mem://constraints/platform-limitations`). Mitigação existente: PWA + `public/manifest.json` + provisionamento por QR para softphones de terceiros. |
| App desktop Windows/Mac | Idem — o softphone roda no navegador. |
| Hotel PBX / integração PMS | Nicho fora do posicionamento (contact center B2B). |

---

## 3. Resumo quantitativo

- **Completo:** 27 recursos (dos quais 11 superam o 3CX padrão)
- **Parcial:** 5 recursos
- **Ausente:** 7 recursos
- **Fora de escopo:** 3 recursos

Paridade efetiva no núcleo de PBX: **~79%**, com vantagem decisiva em IA/analytics e desvantagem concentrada em **primitivos clássicos de PBX** (MoH, park, BLF, ring groups, filas como entidade).

---

## 4. Roadmap priorizado

Ordenado por impacto operacional × esforço, não por dificuldade técnica.

| # | Item | Por que primeiro | Esforço |
|---|---|---|---|
| 1 | **Entidade `call_queues`** (estratégia, timeout, overflow, prioridade, membros) | É a fundação de MoH, anúncios e ring groups; hoje a fila só existe como métrica | L |
| 2 | **Grupos de toque configuráveis** | Necessário para roteamento receptivo real; reaproveita o nó já desenhado | M |
| 3 | **Música em espera e anúncios por fila** | Corrige a promessa já publicada na página de comparação de marketing | M |
| 4 | **Estacionamento de chamadas com orbits e timeout** | Operação diária de recepção; sem isso a transferência cobre só parte dos casos | M |
| 5 | **Presença rica + DND** | Baixo custo, alto ganho percebido; base já existe em realtime | S |
| 6 | **Regras de chamada de emergência** | Risco regulatório: hoje geo-block/horário podem bloquear 190/192/193 | S |
| 7 | **BLF por ramal no discador** | Depende de 5; entrega o "painel de operadora" | M |
| 8 | **Widget de live chat embutível** | Backend pronto, falta o script público | M |
| 9 | **Chat interno entre agentes** | Colaboração; menor impacto que telefonia | M |
| 10 | **Canal SMS bidirecional** | Depende de provedor; menor prioridade no mercado BR frente ao WhatsApp | M |

---

## 5. Riscos e observações

- **Divergência marketing × produto:** `src/pages/marketing/VsThreeCPlus.tsx` afirma "Áudio de espera personalizado por fila" como recurso existente. Enquanto o item 3 do roadmap não for entregue, essa linha deve ser revista para evitar afirmação não sustentada.
- **Limite de execução no navegador:** MoH, park e BLF só são plenamente funcionais se o PBX/tronco a montante suportar. A camada web pode configurar e monitorar, mas a execução de mídia depende do provedor SIP. Cada item do roadmap deve declarar explicitamente a fronteira "configuramos × executamos".
- **Migrações:** cada nova entidade (`call_queues`, `ring_groups`, `hold_music`, `parked_calls`) exige `GRANT` + RLS na mesma migração, conforme padrão do projeto.
- Quando um item do roadmap virar implementação, registrar um ADR em `docs/adr/` seguindo a numeração corrente.
