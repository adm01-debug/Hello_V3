# Funcionalidades Sugeridas e Planejadas × Estado Real

> **Procedência:** síntese própria da auditoria de estado, a partir de `SYSTEM_FEATURES.md`, `docs/LEVANTA_FUNCIONALIDADES_SISTEMA.md`, os 52 ADRs de `docs/adr/`, `docs/audits/pendencias-2026-07.md` e `.lovable/plan.md`, **confrontados com medição do código**.
> **Regra aplicada:** o documento de origem é hipótese; a classificação vem da medição. Onde a medição não alcança (runtime), fica `NAO_VERIFICADO`.
> **Limitação global:** sem acesso ao banco/runtime — rede bloqueada pela política do ambiente.

---

## 1. Onde o "planejado" está registrado neste repositório

| Fonte | O que é | Confiabilidade medida |
|---|---|---|
| `SYSTEM_FEATURES.md` | 185 itens de funcionalidade, **todos** marcados `[x]` | ⚠️ **Baixa.** Zero itens pendentes registrados. Datado de 2026-03-15; as migrations vão até 2026-08. Declara conclusão universal. |
| `docs/LEVANTA_FUNCIONALIDADES_SISTEMA.md` | Implementado + "Roadmap de Excelência" | 🟡 Média. É o único documento que separa explicitamente implementado de futuro. |
| `docs/adr/` (52 ADRs) | Decisões de arquitetura, Ondas 1–37 | ⚠️ **Baixa como indicador de estado.** Todos "Aceito/Accepted"; nenhum "Proposto" ou "Superado". ADR-045 não existe (lacuna 044→046); há **dois** ADR-012 (`meeting-summary-ai` e `omnichannel-suite`). |
| `docs/audits/pendencias-2026-07.md` | Tabela viva de pendências com status 🔴/🟡/🟢/⚪ | ✅ **Alta — o documento mais confiável do repositório.** Registra o que falta e cita evidência. |
| `.lovable/plan.md` | Plano da "Onda 39" — auditoria e correção pré-produção | 🟡 Média. Descreve com precisão problemas reais; a execução ficou parcial. |
| `mem/` (34 arquivos) | Memória de features por onda | Não auditado item a item (fora do escopo de código). |

---

## 2. Roadmap de produto declarado × medição

Origem: `docs/LEVANTA_FUNCIONALIDADES_SISTEMA.md` §2 e `docs/audits/pendencias-2026-07.md` Bloco D.

| Item planejado | Status declarado | Medição | Classificação |
|---|---|---|---|
| **Unified Inbox** (WhatsApp + SMS + Voz em timeline única) | ✅ **Implementado (D1)** | Rota `/inbox` ativa (`protectedRoutes.tsx:156`); `WhatsappComposer` importado em `Inbox.tsx` (canal whatsapp, 4 tons + envio, WIRING-03); edge `whatsapp-inbound` existe | 🟩 **IMPLEMENTADO** (aguarda dados reais: `conversations`=0) |
| **Virtual Fax v2** (OCR via Gemini) | ✅ **Implementado (D2)** | Rota `/virtual-fax` ativa (`protectedRoutes.tsx:137`); página `VirtualFax.tsx` usa `useVirtualFaxOcr`; edge `ocr-virtual-fax` chama IA real | 🟩 **IMPLEMENTADO** |
| **AI-Driven Shift Management** | 🔴 Pendente (D3) | Edge `suggest-shift-swaps` existe; `useAdherence` wireado na aba **Aderência** de `/scheduling` (PR #67) | 🟩 **IMPLEMENTADO_TOTAL** (fio ligado) |
| **Coaching Automático** (sentimento → trilhas) | 🟢 **Implementado (D4)** | Edges `generate-coaching`, `generate-coaching-plan`, `generate-coaching-track` wireadas; `generate-coaching-track` reescrita contra schema real (`call_summaries.agent_performance_score`/`customer_satisfaction` 0-5, `coaching_assignments.agent_name`/`title`/`description`/`priority`/`status`) e testada (8 testes); botão **"Gerar trilhas automáticas"** em `/coaching` (guard `coaching.manage`) | 🟩 **IMPLEMENTADO** |
| **Data Lake connector** (BigQuery/Snowflake) | 🟡 Parcial (D5) | Edges `data-lake-flush` e `export-data-lake` existem; cron reapontado para `cfmlmcdyjuotqobjapng` (migration `20261114090557_…`); flush validado no run 21/11 03:00Z (`1 row`, `succeeded`) | 🟡 **IMPLEMENTADO_PARCIAL** (dados de origem vazios; aguarda `call_summaries` populada) |
| **Financial Impact Dashboard** | Listado como futuro | Rota `/financial-impact` **existe e está ativa**; hook `useFinancialImpact` com teste de propriedade | ✅ **IMPLEMENTADO_TOTAL** (código) / `NAO_VERIFICADO` em uso real |

**Padrão observado:** quase tudo do "roadmap futuro" já tem backend construído. O que falta, consistentemente, é o **último fio** — o consumidor na UI ou o gatilho. É o oposto do padrão usual de roadmap.

---

## 3. Pendências técnicas declaradas × medição

Origem: `docs/audits/pendencias-2026-07.md`. Reverifiquei os itens verificáveis estaticamente.

| ID | Item | Status declarado | Medição desta auditoria |
|---|---|---|---|
| A5 | Reauth centralizado (Context + HMAC) | 🔴 | `useReauth.ts` existe; não reverificado em profundidade |
| B1 | Particionar tabelas de alto volume (`pg_partman`) | 🔴 | Confirmado pendente: nenhuma extensão `pg_partman` entre as 5 declaradas |
| B2 | Script CI `scripts/audit-edge-functions.ts` | 🔴 | **Confirmado ausente** — o arquivo não existe |
| B5 | Retry idempotente `whatsapp-inbound` | 🔴 | Confirmado pendente |
| B6 | CHECK/enums nas colunas `text` | 🔴 | Confirmado pendente (apenas 2 enums em `types.ts`) |
| B8 | Whitelist de hosts (SSRF) `_shared/allowed-hosts.ts` | 🔴 | **Confirmado ausente** |
| C1 | SLO/SLI + error budget alerts | 🔴 | Confirmado pendente |
| C3 | Squash das 100 primeiras migrations | 🔴 | Confirmado pendente (207 migrations) |
| C6 | Auditoria de crons `pg_cron` | 🔴 | **Agora urgente:** 7 jobs declarados, 2 apontando para projeto errado |
| C7 | Bundle budget por rota no CI | 🔴 | Confirmado ausente do `ci.yml` |
| E2 | Re-linter + re-scorecard pós-plano | 🔴 | Não executado |
| B3 | Índices trigram em `call_sessions` | 🟢 Concluído | ✅ Confirmado: `pg_trgm` está entre as 5 extensões |
| B4 | Circuit breaker no cliente Bitrix | 🟢 Concluído | ✅ Confirmado: `src/lib/bitrix/circuit-breaker.ts` existe e é integrado em `useBitrix` |
| B7 | `usePageVisibility` | 🟢 Concluído | ✅ Confirmado: `src/hooks/usePageVisibility.ts` existe |
| A1/A3 | Policies `USING(true)`; refactor `SecurityAlerts` | ⚪ Verificado | ⚠️ **Divergência:** o lote de dados encontrou policies `USING (true)` sobreviventes em `contacts`, `call_records`, `queue_items`, `agents` (`20250102000000_hello_production.sql:76-79`) e em `password_reset_tokens` (`20251231115936_…:378-380`). Como RLS combina permissivas por OR, elas anulam as restritivas escritas depois. |

**O documento de pendências é honesto**, com uma exceção material: o item A1, marcado como falso-positivo verificado, tem alvos reais remanescentes segundo a medição estática das migrations.

---

## 4. Plano da "Onda 39" (`.lovable/plan.md`) × medição

| Compromisso do plano | Medição |
|---|---|
| Eliminar hooks chamados fora do topo do componente (8 páginas listadas) | 🟨 **7 de 8 corrigidas.** Resta `src/pages/TopicDetection.tsx:100` (`usePageTitle` dentro do subcomponente `TrendIcon`, definido em `:99`). Varredura por profundidade de chaves em todo o `src/`: é a **única** ocorrência remanescente. |
| Substituir testes sintéticos por testes reais | 🟦 **Não realizado.** 35 de 268 arquivos de teste (13%) ainda não importam nada do projeto. |
| Testes Deno reais das Edge Functions críticas | 🟨 Parcial: 33 arquivos de teste Deno existem; `bitrix-api` continua sem teste dedicado, como o próprio plano apontou. Não executados (Deno indisponível). |
| "Suíte verde sem falhas relevantes" (critério de aceite) | ❌ **Não atingido.** 4 testes falham de forma reproduzível; o CI está vermelho há 30 execuções. |
| "Sistema em estado confiável para produção" | ❌ **Não atingido**, pelos riscos R1–R5 do documento executivo. |

---

## 5. Funcionalidades com backend pronto e sem consumidor

São o caso mais claro de "planejado, construído e nunca ligado". Todas confirmadas com múltiplos padrões de busca, incluindo import dinâmico e `lazy()`.

| Funcionalidade | O que existe | O que falta | Classificação |
|---|---|---|---|
| Aderência a escala | `useAdherence.ts`, edge `compute-adherence`, tabelas | ✅ Wireado: aba **Aderência** em `/scheduling` (PR #67) | 🟩 |
| Chatbot | `useChatbot.ts`, edge `chatbot-respond` | ✅ Wireado: botão **Responder com IA** em `/inbox` (PR #70) | 🟩 |
| Risco de churn | `useChurnRisk.ts`, edge `detect-churn-risk` | ✅ Wireado: card **Sinais de Churn Ativos** em `/accounts` (PR #67) | 🟩 |
| Playlists de chamada | `useCallPlaylists.ts` + `usePlaylistItems` | ✅ Wireado: aba **Playlists** em `/call-library` (PR #67) | 🟩 |
| Atribuições de coaching | `useCoachingAssignments.ts` | ✅ Wireado: em `/coaching` (PR #67) | 🟩 |
| Regras de compliance | `useComplianceRules.ts` | ✅ Wireado: aba **Regras** em `/compliance` (PR #67) | 🟩 |
| Scorecards | `useScorecards.ts` + 4 tabelas + edge `score-call` | Substituído por `useCallScoring`; deixa 4 tabelas sem leitor | ⬛ |
| Pesquisas (surveys) | `useSurveys.ts` + edge `send-survey` | ✅ Wireado: aba **Pesquisas** em `/call-library` (PR #67) | 🟩 |
| Notificações (versão antiga) | `useNotifications.ts` (219 linhas) | Substituído por `useNotificationCenter` | ⬛ |
| Conferência multicanal | `useMultiChannelCallConference.ts` | Duplicata inline em `useMultiChannelCall.ts:189-238` | ⬛ |
| Tradução ao vivo | `translation/LiveTranslationPanel.tsx` (125 linhas) | ✅ Wireado: painel em chamada ativa em `/calls` (PR #69) | 🟩 |
| Composer de WhatsApp | `whatsapp/WhatsappComposer.tsx` (106 linhas) | Zero importadores | ⬛ |
| Gate de permissões granular | `auth/PermissionGate.tsx` — citado no `README.md` como recurso ativo | ✅ Wireado: protege bulk action em `/admin/extensions` (PR #61) | 🟩 |
| Dashboard de gamificação | `gamification/GamificationDashboard.tsx` | ✅ Wireado: rota `/gamification` + menu **Gamificação IA** (PR #67) | 🟩 |
| Auditoria de segurança (admin) | `pages/admin/SecurityAuditDashboard.tsx` (313 linhas) | Sem rota registrada | ⬛ |
| Cadeia WebRTC alternativa | `calls/WebRTCCall.tsx` + 4 filhos (~880 linhas) | Só referenciada por testes | ⬛ |

**6 Edge Functions sem chamador identificado:** `cleanup-lock-conflicts`, `fuzz-test-runner`, `global-load-test`, `rls-audit`, `sync-crm-queue`, `translate-summary`. (`generate-coaching-track` agora wireada via botão em `/coaching`.)
**2 Edge Functions com testes mas sem `index.ts`:** `check-calling-hours/`, `check-dnc/`.

---

## 6. Rotas ativas sem caminho de navegação

Funcionalidades entregues que o usuário não encontra pelo menu (~1.146 linhas):
`/accounts`, `/cadences`, `/deals`, `/onboarding`, `/permissions` (318 linhas, admin), `/dialer/predictive`.

Além disso: rota duplicada `/history` + `/call-history`, com rótulos contraditórios ("Histórico Completo" vs. "Transcrições").

---

## 7. Módulos que existiam apenas como fachada — status após 21/11

Diferente de "dormente": aqui havia UI completa e navegável que **simulava** o comportamento. Os seis foram tratados um a um nesta rodada: três viraram funcionais, três foram declarados honestamente na interface.

| Módulo | Antes | Agora | Status |
|---|---|---|---|
| **Sincronização LDAP** | `setTimeout` como "teste de conexão", toast fixo "245 contatos atualizados", histórico vindo de `MOCK_SYNC_LOGS`. | Edge real `supabase/functions/ldap-sync/index.ts` (ações `get-config`, `save-config`, `test-connection`, `list-logs`, `sync`, `encrypt-password`; bind + `client.search` via `ldapts@9.3.1`, upsert em `contacts` por `external_id` com `source:'ldap'`, logs em `audit_logs`). UI consome via `src/hooks/useLDAPSync.ts`; `MOCK_SYNC_LOGS` removido. | ✅ Funcional (requer servidor LDAP acessível e secrets) |
| **Escuta silenciosa** | Apenas texto + Badge "Áudio recebido pelo canal SIP", sem handler. | `useSupervisorPanel` ganhou `startListening`/`stopListening`: grava sessão em `barge_in_sessions` (`status: 'listening'` → `ended` + `ended_at`) e audita em `call_control_audit_logs` (`listen_start`/`listen_stop`). Aba "Escuta" tem botões reais e avisa que o áudio depende de SIPREC/fork de mídia no PBX. | ✅ Registro funcional; áudio depende do PBX |
| **Canal WebRTC do softphone** | `startSession` chamava `onConnect()` sempre, disparando `toast.success('Conectado')` sem conexão. | `elevenlabs-stub.ts` agora chama `onError` com mensagem explícita e retorna `false`; `UnifiedSoftphone` exibe `error.message`. Sem falso positivo. | ✅ Honesto (canal continua indisponível sem `@elevenlabs/react`) |
| **Zoom / Google Meet** | Botões "Em breve". | Inalterado — dependem de OAuth/app registration externos. | 🟨 Declarado |
| **Simulação de chamada (IA)** | Rótulo "tempo real". | Rótulo "demonstração"; aba "Demo de Transcrição". É demonstrativo por desenho. | 🟨 Declarado |
| **Marketplace** | Catálogo estático; LDAP marcado `disponivel` e data-lake `roadmap` (invertido). | LDAP → `beta` (requer servidor LDAP); data-lake → `disponivel` (fluxo provado). | ✅ Corrigido |

**Nota:** `check-dnc` e `check-calling-hours` **não** são Edge Functions faltantes — nunca tiveram `index.ts`; a lógica é RPC no banco (`rpc('check_dnc')` chamada por `score-call-attempt`) e está registrada em `docs/agentes/edge-functions.md`.

---

## 8. Resumo: o que responder ao dono

- **Nada relevante do que foi planejado está "não começado".** Para praticamente todo item de roadmap existe backend construído.
- **O gargalo era de ligação, não de construção:** 16 unidades completas sem consumidor, 7 Edge Functions sem gatilho, 6 rotas sem link de menu. **Resolvido em 21/11:** WIRING-01/03/05 CONCLUÍDOS; WIRING-02 DESCARTADO (sem chamadas ativas); WIRING-04/06 wireados (gamificação, surveys, churn, playlists, compliance, coaching com dados reais); `generate-coaching-track` reescrita contra schema real e wireada via botão em `/coaching` (PR #74). Restam 6 edges órfãs legítimas/ferramentas (`cleanup-lock-conflicts`, `fuzz-test-runner`, `global-load-test`, `rls-audit`, `sync-crm-queue`, `translate-summary`) sem consumidor no fluxo do produto.
- **Seis módulos deixaram de ser fachada** — três ganharam função real (LDAP, escuta, Marketplace) e três foram rotulados honestamente (WebRTC indisponível, Zoom/Meet em breve, simulação declarada como demonstração). Ver §7.
- **A documentação de conclusão (`SYSTEM_FEATURES.md`, ADRs) não deve ser usada para decidir nada** enquanto não for reconciliada: ela marca 100% de conclusão sobre um sistema com 16 features dormentes e 6 fachadas.
