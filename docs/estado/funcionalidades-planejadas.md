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
| **Unified Inbox** (WhatsApp + SMS + Voz em timeline única) | 🔴 Pendente (D1) | Peças existem e estão **desconectadas**: `src/components/whatsapp/WhatsappComposer.tsx` (106 linhas) tem **zero importadores**; edge `whatsapp-inbound` existe; não há rota `/inbox` | 🟦 **SUGERIDO_OU_INICIADO** |
| **Virtual Fax v2** (OCR via Gemini) | 🔴 Pendente (D2) | Edge function `ocr-virtual-fax/index.ts` **existe e chama a IA de verdade** (`:59`); falta a interface de gestão descrita | 🟨 **IMPLEMENTADO_PARCIAL** |
| **AI-Driven Shift Management** | 🔴 Pendente (D3) | Edge `suggest-shift-swaps` existe; `useAdherence` existe mas é **órfão** (zero consumidores) | 🟨 **IMPLEMENTADO_PARCIAL** |
| **Coaching Automático** (sentimento → trilhas) | 🔴 Pendente (D4) | Edges `generate-coaching`, `generate-coaching-plan`, `generate-coaching-track` existem; `generate-coaching-track` **sem chamador**; `useCoachingAssignments` **órfão** | 🟨 **IMPLEMENTADO_PARCIAL** |
| **Data Lake connector** (BigQuery/Snowflake) | 🔴 Pendente (D5) | Edges `data-lake-flush` e `export-data-lake` existem; o cron de `data-lake-flush` aponta para **outro projeto Supabase** (`dyibdjwuoibwwpidgsxu`, migration `20260723114001_…:50`) | 🟨 **IMPLEMENTADO_PARCIAL** (fio quebrado) |
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
| Aderência a escala | `useAdherence.ts`, edge `compute-adherence`, tabelas | Consumidor na UI | 🟦 |
| Chatbot | `useChatbot.ts`, edge `chatbot-respond` | Consumidor na UI | 🟦 |
| Risco de churn | `useChurnRisk.ts`, edge `detect-churn-risk` | Consumidor na UI | 🟦 |
| Playlists de chamada | `useCallPlaylists.ts` + `usePlaylistItems` | Consumidor na UI | 🟦 |
| Atribuições de coaching | `useCoachingAssignments.ts` | Consumidor na UI | 🟦 |
| Regras de compliance | `useComplianceRules.ts` | Consumidor na UI | 🟦 |
| Scorecards | `useScorecards.ts` + 4 tabelas + edge `score-call` | Substituído por `useCallScoring`; deixa 4 tabelas sem leitor | ⬛ |
| Pesquisas (surveys) | `useSurveys.ts` + edge `send-survey` | Nenhuma UI | ⬛ |
| Notificações (versão antiga) | `useNotifications.ts` (219 linhas) | Substituído por `useNotificationCenter` | ⬛ |
| Conferência multicanal | `useMultiChannelCallConference.ts` | Duplicata inline em `useMultiChannelCall.ts:189-238` | ⬛ |
| Tradução ao vivo | `translation/LiveTranslationPanel.tsx` (125 linhas) | Zero importadores | ⬛ |
| Composer de WhatsApp | `whatsapp/WhatsappComposer.tsx` (106 linhas) | Zero importadores | ⬛ |
| Gate de permissões granular | `auth/PermissionGate.tsx` — citado no `README.md` como recurso ativo | Zero importadores | ⬛ |
| Dashboard de gamificação | `gamification/GamificationDashboard.tsx` | Zero importadores | ⬛ |
| Auditoria de segurança (admin) | `pages/admin/SecurityAuditDashboard.tsx` (313 linhas) | Sem rota registrada | ⬛ |
| Cadeia WebRTC alternativa | `calls/WebRTCCall.tsx` + 4 filhos (~880 linhas) | Só referenciada por testes | ⬛ |

**7 Edge Functions sem chamador identificado:** `cleanup-lock-conflicts`, `fuzz-test-runner`, `generate-coaching-track`, `global-load-test`, `rls-audit`, `sync-crm-queue`, `translate-summary`.
**2 Edge Functions com testes mas sem `index.ts`:** `check-calling-hours/`, `check-dnc/`.

---

## 6. Rotas ativas sem caminho de navegação

Funcionalidades entregues que o usuário não encontra pelo menu (~1.146 linhas):
`/accounts`, `/cadences`, `/deals`, `/onboarding`, `/permissions` (318 linhas, admin), `/dialer/predictive`.

Além disso: rota duplicada `/history` + `/call-history`, com rótulos contraditórios ("Histórico Completo" vs. "Transcrições").

---

## 7. Módulos que existem apenas como fachada

Diferente de "dormente": aqui há UI completa e navegável que **simula** o comportamento.

| Módulo | Evidência | Classificação |
|---|---|---|
| **Sincronização LDAP** | `src/pages/LDAPSync.tsx:31-35` — "teste de conexão" é `setTimeout`; `:42-50` — toast literal "245 contatos atualizados"; histórico vem de `MOCK_SYNC_LOGS` em `admin/ldap/types.ts:49-82`. Zero Supabase. Está no menu, sob papel `admin`. | 🟦 |
| **Escuta silenciosa** | `panel/CallActionTabs.tsx:34-46` — apenas texto e um Badge afirmando "Áudio recebido pelo canal SIP"; sem botão, handler ou API. As abas Whisper e Barge-in ao lado **persistem de verdade**. | 🟦 |
| **Canal WebRTC do softphone** | `src/lib/elevenlabs-stub.ts:13-18` — `startSession` emite um `logger.warn` e chama `onConnect()` imediatamente, disparando `updateCallStatus('active')` e `toast.success('Conectado')` em `UnifiedSoftphone.tsx:57`. | 🟨 |
| **Zoom / Google Meet** | Botões rotulados "Em breve" (a integração Teams ao lado é real) | 🟦 |
| **Simulação de chamada (IA)** | Aba padrão de `/ai` usa diálogo hardcoded (`CallSimulation.tsx:25-38`) | 🟦 |
| **Marketplace** | Catálogo estático (`:29`) | 🟦 |

---

## 8. Resumo: o que responder ao dono

- **Nada relevante do que foi planejado está "não começado".** Para praticamente todo item de roadmap existe backend construído.
- **O gargalo é de ligação, não de construção:** 16 unidades completas sem consumidor, 7 Edge Functions sem gatilho, 6 rotas sem link de menu.
- **Seis módulos são fachada declarável** — existem, navegam, e não fazem o que a tela diz.
- **A documentação de conclusão (`SYSTEM_FEATURES.md`, ADRs) não deve ser usada para decidir nada** enquanto não for reconciliada: ela marca 100% de conclusão sobre um sistema com 16 features dormentes e 6 fachadas.
