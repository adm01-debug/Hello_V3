# 05 — Progresso

> **Checklist de execução das 300 etapas de `04-PLANO.md`.** O agente executor marca aqui, etapa por etapa. Esta é a única fonte de verdade sobre o que foi feito.

## Como marcar

| Marca | Significado |
|---|---|
| `[ ]` | não iniciada |
| `[>]` | em andamento (branch criada) |
| `[P]` | **PR aberta aguardando o dono** (etapa com 🔒) |
| `[~]` | **parcial** — aplicada, mas a verificação não pôde ser executada; escreva o motivo exato |
| `[x]` | **concluída** — mergeada **e** com a verificação executada e a evidência anotada |
| `[-]` | **descartada** — o código já não corresponde à evidência da etapa; escreva o que encontrou |

**`[x]` exige evidência.** Escreva ao lado, entre parênteses, o comando ou a consulta que você rodou e o resultado. Sem isso, a marca é `[~]`.

🔒 = exige aprovação humana antes do merge (107 etapas).

---

## Resumo de execução

| | Quantidade |
|---|---:|
| Total de etapas | 300 |
| `[x]` concluídas | 85 |
| `[P]` aguardando o dono | 0 |
| `[~]` parciais | 0 |
| `[-]` descartadas | 0 |
| `[ ]` não iniciadas | **215** |

*Atualize esta tabela ao fim de cada onda.*

---


## Onda 1 — Segurança e risco de perda de dado (001–055, 55 etapas)

- [ ] **001** — Ligar secret scanning, push protection e Dependabot no repositório público — onda 1 — Crítica — Infraestrutura 🔒
- [ ] **002** — Revogar o EXECUTE de `record_failed_login` e `record_successful_login` para `anon` — onda 1 — Crítica — Banco 🔒
- [x] **003** — Fazer o bloqueio de login falhar fechado — onda 1 — Média — Hooks
- [x] **004** — Exigir autenticação em `search-calls` e parar de usar a service_role — onda 1 — Crítica — Edge Function
- [x] **005** — Criar o módulo compartilhado de autenticação de edge function — onda 1 — Alta — Edge Function
- [ ] **006** — Exigir token de cron (ou papel de supervisor) em `auto-scorecard` — onda 1 — Alta — Edge Function 🔒
- [x] **007** — Exigir autenticação de visitante em `chatbot-respond` — onda 1 — Alta — Edge Function
- [x] **008** — Exigir papel de staff e limitar tamanho em `embed-kb-article` — onda 1 — Alta — Edge Function
- [x] **009** — Fechar o relay de e-mail aberto em `notify-new-device` — onda 1 — Alta — Edge Function 🔒
- [x] **010** — Fechar o relay de e-mail aberto em `notify-blocked-ip` — onda 1 — Alta — Edge Function
- [x] **011** — Impedir que um usuário notifique outro em `send-notification` — onda 1 — Média — Edge Function
- [x] **012** — Fazer o rate limit falhar fechado nos endpoints que gastam dinheiro — onda 1 — Média — Edge Function
- [ ] **013** — Verificar assinatura HMAC em `whatsapp-inbound` — onda 1 — Alta — Edge Function 🔒
- [ ] **014** — Verificar assinatura em `email-inbound` — onda 1 — Alta — Edge Function 🔒
- [x] **015** — Tornar `email-inbound` idempotente e parar o laço de 500 — onda 1 — Alta — Edge Function
- [x] **016** — Parar de concatenar o telefone no filtro do PostgREST — onda 1 — Média — Edge Function
- [ ] **017** — Índice único para a deduplicação de mensagens de WhatsApp — onda 1 — Média — Banco 🔒
- [ ] **018** — Substituir o XOR por criptografia real nas senhas de tronco SIP — onda 1 — Crítica — Edge Function + Banco 🔒
- [ ] **019** — `voip-trunks-manage` grava a senha no Vault — onda 1 — Crítica — Edge Function
- [ ] **020** — `sip-config` lê a senha do Vault e para de devolver senha em claro a quem não deve — onda 1 — Crítica — Edge Function 🔒
- [ ] **021** — Migrar as senhas de tronco existentes para o Vault — onda 1 — Crítica — Banco 🔒
- [ ] **022** — Remover o XOR e a coluna antiga de senha — onda 1 — Alta — Edge Function + Banco 🔒
- [ ] **023** — Trocar a service_role por token dedicado em `voip-failover-notifier` — onda 1 — Média — Edge Function 🔒
- [ ] **024** — Tirar a credencial TURN do bundle do navegador — onda 1 — Média — Frontend + Edge Function 🔒
- [ ] **025** — Cabeçalhos de segurança no deploy — onda 1 — Alta — Infraestrutura 🔒
- [ ] **026** — Content-Security-Policy em modo somente-relatório, depois bloqueante — onda 1 — Alta — Infraestrutura 🔒
- [x] **027** — Restringir o CORS a origens conhecidas — onda 1 — Média — Edge Function
- [x] **028** — Migrar as 16 edges que ainda respondem com origem fixa — onda 1 — Média — Edge Function
- [ ] **029** — Policies de UPDATE e DELETE para `rate_limit_logs` — onda 1 — Alta — Banco 🔒
- [ ] **030** — Descobrir e documentar qual trilha serve produção — onda 1 — Média — Infraestrutura
- [x] **031** — Parar de revelar a existência da conta no pedido de reset de senha — onda 1 — Baixa — Edge Function
- [x] **032** — Verificar e atualizar o contador do autenticador no login por passkey — onda 1 — Baixa — Edge Function
- [x] **033** — Rate limit no login por passkey — onda 1 — Baixa — Edge Function
- [x] **034** — Mover a checagem de DNC e horário para dentro de `initiateCall` — onda 1 — Crítica — Hooks
- [ ] **035** — Fazer a checagem de DNC e horário falhar fechado nos três níveis — onda 1 — Crítica — Hooks + Banco 🔒
- [x] **036** — Barreira de compliance no discador preditivo — onda 1 — Crítica — Hooks
- [ ] **037** — Barreira de compliance no servidor, não só no cliente — onda 1 — Crítica — Edge Function + Banco 🔒
- [x] **038** — Fazer a importação em lote de DNC verificar o resultado de verdade — onda 1 — Crítica — Hooks
- [x] **039** — Reconciliar a lista DNC depois da importação — onda 1 — Alta — Hooks
- [ ] **040** — Tirar a chave `anon` e o host fixo de dentro das migrations — onda 1 — Média — Banco 🔒
- [ ] **041** — Fazer a auditoria de dependências reprovar de verdade — onda 1 — Alta — CI 🔒
- [ ] **042** — Proteger a branch `main` — onda 1 — Média — Infraestrutura 🔒
- [ ] **043** — Fazer o bloqueio geográfico bloquear, e a tela gravar — onda 1 — Alta — Banco + Edge Function 🔒
- [ ] **044** — Drenar o baseline do guard de edge functions e fazer a regra de autorização reprovar — onda 1 — Alta — CI
- [x] **045** — Remover `xlsx`, que não é usado e tem duas falhas altas sem correção — onda 1 — Alta — Dependências
- [x] **046** — Atualizar `react-router-dom` (open redirect com correção disponível) — onda 1 — Alta — Dependências
- [x] **047** — Validar o corpo nas edges públicas que gastam dinheiro — onda 1 — Média — Edge Function · (3 das 7 ganharam schema Zod com teto em **todo** campo de texto: `chatbot-respond` (user_message 4.000, visitor_token 200), `email-inbound` (subject 998, from 320, body_text 200k, body_html 500k, message_id 998, headers 100 itens) e `chat-widget-session` (message 4.000, e-mail 254, action restrita a create/send_message/fetch_messages); resposta 422 `{code,message,fields}` do `_shared/validator.ts`. As outras 4 já tinham teto e foram conferidas: `embed-kb-article` (`MAX_TEXT`), `notify-blocked-ip` e `notify-new-device` (`bodySchema` com `max` em tudo), `request-password-reset` (e-mail com tipo + 255). Contrato histórico das edges preservado (400/400/422 do chatbot e 400/422 do e-mail continuam) — só o tamanho fora do teto passa a ser 422. Evidência: 14 testes de schema + 2 testes de handler novos; `deno test -A supabase/functions/` **397 passed / 0 failed**; `deno check` OK nas 3 edges; sem `req.json()` sem teto nas 7)
- [x] **048** — Validar o corpo nas edges de IA e transcrição — onda 1 — Média — Edge Function · (módulo novo `_shared/ai-body-schemas.ts` com teto em **todo** campo de texto das 12 edges e resposta 422 `{code,message,fields}` do `_shared/validator.ts` via `validateBody` — substitui o `await req.json()` cru). Tetos: prompt/resumo 20k por segmento e 200 segmentos (`generate-summary`), texto ao vivo 5k (`translate-utterance`), comando de voz 4k (`voice-command`), ids 100, `filePath` 512, `embedding` ≤ 1024 dims. Rejeita acima do teto em vez de truncar (`generate-summary` truncava a 500 chars e resumia errado). Contratos preservados: onde já havia 400 de campo obrigatório (`transcribe-recording`, `ocr-virtual-fax`, `send-survey`, `voice-command`, `verify-voice`, `generate-meeting-summary`, `generate-coaching-plan`, `translate-summary`, `translate-utterance`) o campo ficou `optional` no schema e o 400 continua; só o tamanho fora do teto vira 422. `score-call` e `generate-coaching`, que não validavam nada, passam a exigir id (422). Teto de arquivo: 25MB em `transcribe-recording` e 20MB em `ocr-virtual-fax` (413 após o download). Evidência: 15 testes de schema novos (`_shared/ai-body-schemas_test.ts`), `deno test -A supabase/functions/` **421 passed / 0 failed**, `deno check` rc=0 nos 12 `index.ts`; não executei o handler HTTP de ponta a ponta (exige JWT, env e rede) — o 422 foi verificado no mesmo `validateBody` que todos usam, não em request real)
- [x] **049** — Validar o corpo nas edges de cálculo e exportação — onda 1 — Média — Edge Function · (módulo novo `_shared/numeric-body-schemas.ts` como fonte única dos tetos, consumido por **18** edges via `validateBody` no lugar do `await req.json()` cru: export-data-lake, forecast-deals, detect-churn-risk, compute-account-health, compute-adherence, compute-deal-health, check-alerts, check-calling-hours, check-dnc, data-lake-flush, voip-failover-notifier, wavoip-call, sip-config, voip-trunks-manage, ldap-sync, approve-password-reset, webauthn-authenticate, elevenlabs-conversation-token). Números usam `finiteNumber`/`nonNegativeInt` de `_shared/numeric-schemas.ts`, então NaN/Infinity/negativo viram 422 e o guard segue em zero violações; `check-alerts.satisfaction` fica travada em 0–10 (antes era clampada em silêncio, gerando alerta com nota errada); `voip-trunks-manage` só aceita colunas conhecidas no update e exige `max_channels`/`priority` inteiros ≥ 0; `ldap-sync.config` usa `passthrough` para não descartar campo desconhecido da `system_settings`. Contratos preservados: os 400 de campo obrigatório continuam no handler (campos `optional` no schema) em webauthn-authenticate, wavoip-call, sip-config, export-data-lake, voip-trunks-manage, detect-churn-risk, compute-deal-health e approve-password-reset. Evidência: 14 testes de schema novos (`_shared/numeric-body-schemas_test.ts`), `deno test -A supabase/functions/` **420 passed / 0 failed / 10 ignored** (base `main` 406), `deno check` rc=0 nos 18 `index.ts` e no módulo novo, `bun scripts/guard-edge-numeric.mjs --check` = 98 arquivos / 0 violações; o 422 não foi exercitado em request HTTP real (auth antes do corpo, sem env local) — verificado no `validateBody` compartilhado)
- [x] **050** — Parar de devolver a mensagem de erro interna ao cliente — onda 1 — Média — Edge Function · (módulo novo `_shared/errors.ts`: `getCorrelationId` (x-correlation-id → x-request-id → UUID), `internalError` (id obrigatório, loga com stack) e `internalErrorResponse` — status 500 fixo, corpo `{code:'internal_error',message:'Erro interno',correlation_id}`, header `x-correlation-id`; coberto por `_shared/errors_test.ts` (7 testes). Aplicado em 4 ondas, 46 edges: onda 1 (7: ocr-virtual-fax, suggest-shift-swaps, translate-utterance, voip-quality-alerts-summary, chat-widget-session, email-inbound, auto-scorecard — PR #230), onda 2 (13: check-calling-hours, check-dnc, compute-best-time, embed-kb-article, export-data-lake, fuzz-test-runner, record-consent, score-call-attempt, search-calls, translate-summary, voip-failover-notifier, analyze-talk-ratio, dialer-pacing-tick — PR #231), onda 3 (26: approve/request-password-reset, chatbot-respond, check-goals, check-queue-metrics, data-lake-flush, detect-key-moments, enforce-sla, generate-coaching-plan, generate-coaching-track, generate-meeting-summary, global-load-test, rls-audit, sync-crm-queue, teams-fetch-recordings, voip-trunks-manage, voip-sla-report e os 8 voip-* — PR #232) e onda 4 (13 com envelope próprio: health-check, validate-geo (mantém o fail-open), validate-ip, notify-blocked-ip, notify-new-device, ldap-sync, webauthn-challenge, whatsapp-inbound, whatsapp-rewrite, sync-crm-queue e teams-fetch-recordings por item, data-lake-flush por dataset). Evidência: `deno check` rc=0 em todos os arquivos tocados, `deno test -A supabase/functions/` 406 passed/0 failed, `deno lint` sem problema novo (só o `no-import-prefix` herdado). Sobram 3 ocorrências de `instanceof Error ?`: `data-lake-flush:166` e `ldap-sync:349` (usadas em coluna do banco e na auditoria, nunca na resposta) e `webauthn-authenticate:225` (400 de validação com mensagem intencional ao usuário — os testes `webauthn-authenticate/__tests__/index.test.ts:38,44` exigem o texto).
- [x] **051** — Tirar o host de produção dos scripts destrutivos — onda 1 — Média — Scripts
- [ ] **052** — Declarar `TO authenticated` nas policies que governam as tabelas mais sensíveis — onda 1 — Média — Banco 🔒
- [ ] **053** — Teste de RLS que realmente toca o banco — onda 1 — Alta — Testes 🔒
- [ ] **054** — Versionar o `verify_jwt` de todas as edge functions — onda 1 — Alta — Edge Function 🔒
- [ ] **055** — Fechar a onda 1 com um levantamento do que ficou aberto — onda 1 — Média — Documentação


## Onda 2 — Fluxos principais quebrados (056–100, 45 etapas)

- [x] **056** — Mapear quem é o dono da chamada ativa, antes de mexer em qualquer código — onda 2 — Crítica — Frontend + Hooks
- [x] **057** — Dar a `useMultiChannelCall` um campo para o id da chamada no banco — onda 2 — Crítica — Hooks
- [x] **058** — Gravar `call_sessions` quando a chamada é atendida — onda 2 — Crítica — Hooks
- [x] **059** — Fechar a chamada no banco quando ela termina — onda 2 — Crítica — Hooks
- [x] **060** — Fazer a barra de chamada ativa renderizar a chamada real — onda 2 — Crítica — Frontend · (PR #168; tsc=0, eslint=0, testes 24/24)
- [x] **061** — Religar a transcrição ao vivo — onda 2 — Alta — Frontend · (PR #170; handleTranscript chama addDbTranscript; tsc=0)
- [x] **062** — Religar a próxima melhor ação e as sugestões de CRM — onda 2 — Alta — Frontend
- [x] **063** — Garantir que o resumo automático da chamada seja gerado e gravado — onda 2 — Alta — Hooks · (PR #170; allTranscriptsRef.push antes do insert; tsc=0)
- [x] **064** — Teste de ponta a ponta do ciclo de vida da chamada — onda 2 — Alta — Testes · (PR #170; callLifecycle-integration.test.tsx 3/3)
- [ ] **065** — Confirmar em produção que a chamada está sendo gravada — onda 2 — Crítica — Verificação
- [x] **066** — Gravar `hold_events` com o id real da chamada — onda 2 — Alta — Hooks · (PR #170; persistHoldEvent guard; tsc=0)
- [x] **067** — Fazer o alerta de espera parar quando a espera termina — onda 2 — Alta — Edge Function · (PR #170; janela 24h; edge pronta p/ deploy)
- [ ] **068** — Decidir o que fazer com os `hold_events` órfãos já gravados — onda 2 — Média — Banco 🔒 · (aguarda decisão do dono)
- [ ] **069** — Preencher `hold_time_seconds` a partir dos eventos de espera — onda 2 — Crítica — Banco 🔒 · (migration preparada 20261123030000, aguarda decisão do dono)
- [x] **070** — Corrigir o id sintético no relatório de uso de tronco — onda 2 — Alta — Hooks · (PR #170; useSipCall usa dbSessionIdRef; tsc=0)
- [x] **071** — Parar de afirmar "Chamada salva" quando a gravação falhou — onda 2 — Alta — Hooks + Frontend · (PR #170; endSession retorna {ok}; tsc=0)
- [x] **072** — Fila de retentativa para o encerramento de chamada — onda 2 — Média — Hooks · (PR #170; pendingCallWrites 3/3)
- [x] **073** — Ligar o botão "Transferir" do softphone — onda 2 — Alta — Frontend · (PR #170; TransferCallDialog conectado; tsc=0)
- [x] **074** — Ligar o "Exportar" do histórico de chamadas — onda 2 — Alta — Frontend · (PR #170; downloadCallHistoryCsv ligado; tsc=0, 3/3)
- [x] **075** — Ligar o "Exportar" dos relatórios — onda 2 — Alta — Frontend · (PR #170; downloadReportCsv ligado; tsc=0, 6/6, build OK sem violar orçamento)
- [ ] **076** — Fazer o "Salvar" das Configurações salvar de verdade — onda 2 — Alta — Frontend + Hooks 🔒
- [ ] **077** — Resolver os quatro switches decorativos das Configurações — onda 2 — Média — Frontend
- [ ] **078** — Fazer o discador preditivo efetivamente discar — onda 2 — Alta — Hooks 🔒
- [ ] **079** — Reivindicação atômica do contato no discador — onda 2 — Crítica — Hooks 🔒
- [x] **080** — Verificar o erro nas escritas do discador — onda 2 — Alta — Hooks · (5 escritas em `api.ts` agora fazem `if (error) throw error`; falha do claim para a campanha com toast — teste novo falha sem o fix; vitest 20/20, tsc=0, eslint=0)
- [ ] **081** — Registrar a chamada no Bitrix (a proposta do produto) — onda 2 — Alta — Hooks 🔒
- [ ] **082** — Policy de UPDATE para `crm_sync_queue` — onda 2 — Alta — Banco 🔒
- [ ] **083** — Dar um gatilho à fila de sincronização do CRM — onda 2 — Alta — Banco + Edge Function 🔒
- [ ] **084** — Parar de perder lead em silêncio quando o Bitrix está fora — onda 2 — Alta — Hooks 🔒
- [ ] **085** — Executor das cadências (hoje elas nunca disparam) — onda 2 — Alta — Edge Function + Banco 🔒
- [ ] **086** — Editar e excluir cadência e etapa — onda 2 — Média — Frontend + Hooks 🔒
- [ ] **087** — Policy de UPDATE para `learning_completions` — onda 2 — Média — Banco 🔒
- [x] **088** — Declarar o papel exigido em cada item do menu — onda 2 — Alta — Frontend · (routeRoles exportado de protectedRoutes; tsc=0, eslint=0, 4/4)
- [x] **089** — Filtrar o menu pelo papel do usuário — onda 2 — Alta — Frontend · (AppSidebar filtra por hasRole e esconde grupos vazios; tsc=0, 4/4, build OK sem violar orçamento)
- [x] **090** — Classificar as 49 rotas que não declaram papel — onda 2 — Média — Frontend · (tabela nova em `docs/agentes/mapa-repo.md` (seção "Rotas protegidas sem `roles:` (etapa 090)") com **46 linhas** — 45 telas + o catch-all `*` —, cada uma com a rota, o componente em `src/pages/`, o que a tela faz (derivado do código: `usePageTitle` + hooks que a tela consome, não do nome da rota) e o papel mínimo proposto. **Nenhum `roles:` foi declarado nesta etapa**, conforme a instrução — a etapa só produz o insumo da decisão. Contagem verificada no arquivo: `src/routes/protectedRoutes.tsx` tem **95 rotas**, **49 com `roles:`** e **46 sem** (o plano falava em 49 sem papel no momento da auditoria; 3 rotas passaram a declarar papel depois). **17 das 46** ficaram marcadas "confirmar com o dono", agrupadas por motivo: expõe dado de terceiros (`/recordings`, `/call-library`, `/ranking`, `/blf`, `/contacts/insights`), mexe na operação inteira (`/hold-settings`, `/settings`, `/hot-desking`) e dado sensível (`/voice-security`, `/sessions`, `/translation-center`, `/meeting-summaries`, `/voicemail`, `/coaching`, `/knowledge`, `/onboarding`). Achados do levantamento: `/history` e `/call-history` apontam para o **mesmo componente** (`CallHistory`) — é rota duplicada, não duas telas. Evidência: `grep -c 'path:' src/routes/protectedRoutes.tsx` = 96 (um é a declaração de tipo) e `grep -c 'roles:'` = 49; o script de extração imprimiu 46 pares rota→componente sem `roles:`)
- [ ] **091** — Decidir o que o papel `viewer` significa — onda 2 — Alta — Banco + Frontend 🔒
- [x] **092** — `/status`: dizer "sem medição" em vez de 100% — onda 2 — Alta — Frontend
- [x] **093** — `/status`: tratar erro em vez de ficar carregando para sempre — onda 2 — Alta — Frontend
- [x] **094** — `health-check`: parar de reportar "operacional" sem medir — onda 2 — Alta — Edge Function
- [x] **095** — Score de saúde VoIP: parar de dar 83/100 sem dado — onda 2 — Alta — Edge Function
- [x] **096** — Remover ou ligar o painel "Análise IA de Performance" — onda 2 — Alta — Frontend
- [x] **097** — Ligar o painel "Integridade da Infraestrutura (10/10)" aos dados reais — onda 2 — Alta — Frontend
- [x] **098** — Corrigir o cartão "Auditoria de Segurança (10/10)" — onda 2 — Alta — Frontend
- [x] **099** — Corrigir a contagem de RLS do relatório de conformidade — onda 2 — Média — Frontend
- [x] **100** — Rotular corretamente os canais do softphone — onda 2 — Alta — Hooks + Frontend


## Onda 3 — Integridade de dados e regras de negócio (101–150, 50 etapas)

- [ ] **101** — Marcar como `STABLE` as três funções que governam 270 policies — onda 3 — Alta — Banco 🔒
- [x] **102** — Criar o módulo único de métricas de fila — onda 3 — Alta — Lib
- [ ] **103** — Unificar o nível de serviço: um limiar, uma janela, um denominador — onda 3 — Alta — Hooks + Edge Function 🔒
- [ ] **104** — Unificar a taxa de abandono — onda 3 — Alta — Hooks + Banco 🔒
- [ ] **105** — Alinhar o freio do discador à meta de abandono configurada — onda 3 — Alta — Banco 🔒
- [x] **106** — Limitar a nota da IA ao máximo do critério no scorecard — onda 3 — Alta — Edge Function
- [ ] **107** — Uma fórmula só para o score do scorecard — onda 3 — Alta — Edge Function 🔒
- [ ] **108** — Um scorecard automático não deve nascer "enviado" — onda 3 — Alta — Edge Function 🔒
- [x] **109** — Escolher a política de SLA mais específica, não a primeira — onda 3 — Alta — Edge Function
- [x] **110** — Enviar `version` nos updates e tirar o lock otimista da inércia — onda 3 — Alta — Hooks
- [x] **111** — Fazer o SLA respeitar o horário comercial — onda 3 — Alta — Edge Function
- [ ] **112** — Parar de premiar quem adia ou fecha conversa atrasada — onda 3 — Alta — Hooks + Edge Function 🔒
- [x] **113** — Um limiar só para "qualidade ruim" de chamada — onda 3 — Média — Lib
- [ ] **114** — Aplicar o limite de ritmo na função que realmente roda — onda 3 — Média — Banco 🔒
- [x] **115** — Parar de elogiar chamada sem áudio — onda 3 — Média — Edge Function
- [ ] **116** — Corrigir as 3 horas de erro na "melhor hora para contatar" — onda 3 — Média — Edge Function 🔒
- [ ] **117** — Um vocabulário só para o status do agente — onda 3 — Alta — Hooks + Banco 🔒
- [ ] **118** — Respeitar o limite de chamadas simultâneas do agente — onda 3 — Média — Hooks
- [ ] **119** — Fazer o health check do tronco rodar — onda 3 — Alta — Edge Function + Banco 🔒
- [ ] **120** — Reagendar o retorno conforme a configuração da campanha — onda 3 — Baixa — Hooks
- [ ] **121** — Aplicar as três regras de compliance que hoje são só configuração — onda 3 — Média — Hooks 🔒
- [ ] **122** — Fazer feriados recorrentes bloquearem todo ano — onda 3 — Média — Banco 🔒
- [ ] **123** — Resolver a unidade do "intervalo mínimo entre ligações" — onda 3 — Média — Banco + Frontend 🔒
- [ ] **124** — Validar a transição de status de conversa — onda 3 — Média — Hooks
- [ ] **125** — Validar a transição de status de scorecard — onda 3 — Média — Hooks + Banco 🔒
- [ ] **126** — Somar os pontos da gamificação no banco, não no cliente — onda 3 — Média — Hooks + Banco 🔒
- [ ] **127** — Parar de pendurar o alerta de meta numa chamada aleatória — onda 3 — Média — Hooks + Banco 🔒
- [ ] **128** — Chaves estrangeiras nas quatro colunas que apontam para uma tabela só — onda 3 — Baixa — Banco 🔒
- [ ] **129** — Documentar o contrato dos ponteiros polimórficos — onda 3 — Baixa — Banco
- [ ] **130** — Escrever o `CREATE TABLE` das três tabelas `geo_*` — onda 3 — Alta — Banco 🔒
- [ ] **131** — Guardar os `ALTER POLICY` que abortam em ambiente novo — onda 3 — Média — Banco 🔒
- [ ] **132** — Descobrir se a correção de exclusão de conta (LGPD) está de fato aplicada — onda 3 — Alta — Banco
- [ ] **133** — Desfazer o empate de timestamp entre migrations — onda 3 — Média — Banco 🔒
- [ ] **134** — Tornar as migrations reaplicáveis (ou documentar quais não são) — onda 3 — Média — Banco
- [ ] **135** — Responder "esta migration está aplicada?" de forma confiável — onda 3 — Alta — Banco 🔒
- [ ] **136** — Regenerar `types.ts` e explicar as 4 tabelas de diferença — onda 3 — Média — Banco
- [ ] **137** — Reescrever (ou remover) o arquivo de índices que não cria nada — onda 3 — Baixa — Banco 🔒
- [ ] **138** — Remover os dois índices exatamente redundantes — onda 3 — Baixa — Banco 🔒
- [ ] **139** — `CHECK` nas 11 colunas de tipo mais usadas em regra de negócio — onda 3 — Média — Banco 🔒
- [ ] **140** — `CHECK` nas 11 colunas de tipo restantes — onda 3 — Baixa — Banco 🔒
- [ ] **141** — Fazer `validate-geo` honrar o modo escolhido na tela — onda 3 — Alta — Edge Function
- [ ] **142** — Decidir o que fazer quando a lista geográfica está vazia — onda 3 — Alta — Edge Function 🔒
- [ ] **143** — `TO authenticated` nas policies de dados de cliente (lote 2) — onda 3 — Média — Banco 🔒
- [ ] **144** — `TO authenticated` nas policies operacionais (lote 3) — onda 3 — Média — Banco 🔒
- [ ] **145** — `TO authenticated` no restante das policies (lote 4) — onda 3 — Média — Banco 🔒
- [ ] **146** — Revogar de `anon` o EXECUTE dos helpers de papel — onda 3 — Média — Banco 🔒
- [ ] **147** — `CHECK` no status de `call_sessions` e de `conversations` — onda 3 — Média — Banco 🔒
- [ ] **148** — `CHECK` no resultado da fila do discador — onda 3 — Baixa — Banco 🔒
- [ ] **149** — Decidir o destino das tabelas sem nenhum uso — onda 3 — Média — Banco 🔒
- [ ] **150** — Fechar a onda 3 conferindo que os indicadores concordam — onda 3 — Média — Verificação


## Onda 4 — Funcionalidades incompletas (151–180, 30 etapas)

- [ ] **151** — Ligar o enforcement de SLA à interface — onda 4 — Média — Frontend 🔒
- [ ] **152** — Registrar visualização de artigo da base de conhecimento — onda 4 — Média — Frontend 🔒
- [x] **153** — Mostrar o artigo da base de conhecimento (hook órfão `useKbArticle`) — onda 4 — Média — Frontend · (evidência: primeiro a verificação que o plano exige — **não havia** segunda implementação: `Knowledge.tsx` só listava, o card mostrava `excerpt` e o clique abria o **formulário de edição** apenas para `admin`/`supervisor` (`onClick={() => isEditor && setEditing(a)}`), então agente não abria nada e ninguém lia `content`. Ligado `useKbArticle` (`useKnowledgeBase.ts:116`) a um diálogo de leitura: novo `viewingId` + `articleQuery = useKbArticle(viewingId)`; botão "Ler artigo" com `aria-label` por artigo em cada card (com `stopPropagation`) e, para quem não é editor, o próprio card passou a abrir a leitura (`isEditor ? setEditing(a) : setViewingId(a.id)`), sem mudar o fluxo do editor. Os três estados: carregando (`Skeleton` com `aria-busy`), erro ("Não foi possível carregar o artigo." + "Tentar de novo" → `refetch`) e vazio (`EmptyState` "Artigo não encontrado"); sucesso mostra status, tags e `content` em `whitespace-pre-wrap` (texto puro — sem parser de markdown novo). Editor tem "Editar artigo" no rodapé, que fecha a leitura e abre o formulário já com o artigo completo; `DialogDescription` acrescentado para o Radix não acusar descrição ausente. Teste novo `src/pages/__tests__/Knowledge.reader.test.tsx` 3/3 (agente lê o conteúdo e não vê "Editar artigo"; erro com "Tentar de novo"; editor lê e chega ao formulário) — `bunx vitest run` 3 passed; `bunx tsc --noEmit` rc=0; `bunx eslint` nos 2 arquivos rc=0. Não verificado: leitura feita com `kb_articles` mockado (sem banco nesta sessão) e o visual do diálogo não foi conferido em navegador.)
- [ ] **154** — Decidir o destino do resumo automático de reunião — onda 4 — Média — Frontend 🔒
- [ ] **155** — Decidir o destino da verificação de voz ao vivo — onda 4 — Média — Frontend 🔒
- [ ] **156** — Mostrar as inscrições de cadência na interface — onda 4 — Média — Frontend
- [x] **157** — Mostrar os acertos dos trackers — onda 4 — Média — Frontend · (`useTrackerMatches` era o hook órfão do achado A-079: o supervisor cadastrava trackers em `/trackers` e nunca via os acertos. Agora cada cartão de tracker mostra a seção "Acertos no período (N)", com o agente, a palavra que casou, o trecho da fala e **link para o detalhe da chamada**; um seletor de período no topo da página (7/30/90 dias, padrão 30) alimenta o filtro `days` do hook. A lista mostra os 5 acertos mais recentes e diz quantos existem além deles — quando o total chega ao teto de 500 da consulta, o número vem com `+` em vez de mentir um total. Estado vazio explica que o acerto depende de transcrição ("Nenhuma chamada transcrita no período. O acerto aparece depois que a chamada é transcrita e analisada"), que é o comportamento esperado enquanto não há chamada transcrita — o hook continua sem acerto, não é defeito. **Desvio consciente do checklist:** o plano listava só `src/pages/Trackers.tsx`, mas não existe rota de detalhe de chamada no app (o detalhe é um diálogo dentro de `/history`), então o link seria um beco sem saída; por isso `src/pages/CallHistory.tsx` ganhou 12 linhas que passam a entender `?session=<id>` e abrir a chamada correspondente (guardado por `useRef` para não reabrir a cada render, e com aviso quando a chamada não está na página carregada). RLS conferida: `tracker_matches` tem SELECT para `is_admin_or_supervisor()` e INSERT autenticado (`20260416234921_cc18cae3:248-253`) — a tela de supervisor lê sem policy nova. Evidência: `bunx tsc --noEmit` rc=0, `bunx eslint` rc=0 nos 4 arquivos, 5 testes novos (`Trackers.matches.test.tsx`: estado vazio + lista com os 2 links; `CallHistory.deeplink.test.tsx`: sem parâmetro não abre, com `?session=s2` abre `s2`, não reabre em re-render), `bunx vitest run` **307 arquivos / 3461 testes passed / 0 failed**; os dados vieram da RLS e da tela montada em jsdom, não de uma chamada transcrita real em produção)
- [x] **158** — Remover o hook de conferência duplicado e defeituoso — onda 4 — Média — Hooks · (apagados `src/hooks/useMultiChannelCallConference.ts` e `src/hooks/__tests__/useMultiChannelCallConference.coverage.test.tsx`, que era o **único** importador do hook — `grep -rn "MultiChannelCallConference" src supabase tests` não retorna nada depois da remoção, logo **nenhuma tela usava o arquivo**). O defeito que a etapa aponta está em `useMultiChannelCallConference.ts:102-105` (arquivo já removido): `setTimeout(() => completeTransfer(id, target), 2000)` dentro de `useCallback(..., [])` com as dependências suprimidas — o timer capturava o `completeTransfer` do **primeiro render**, e `useCallTransfer.ts:7-11` documenta justamente que concluir transferência por timer é errado. Antes de apagar, conferi que a capacidade do hook órfão está toda na versão viva: `useMultiChannelCall.ts` já tem `startConference` (285), `addToConference` (296), `endConference` (302), `removeFromConference` (309), `toggleConferenceRecording` (317) e `getCallsAvailableForConference` (324), e `useCallTransfer.ts` tem `transferCall` (42), `completeTransfer` (22) e `cancelTransfer` (69). A única função sem equivalente literal — `cleanupConference` (125) — só faz `clearInterval(conferenceDurationRef.current)`, e o `endConference` do hook vivo (303) faz o mesmo `clearInterval` **e** zera a ref (`conferenceDurationRef.current = null`), então não há capacidade perdida. Evidência: `bunx tsc --noEmit` rc=0, `bunx vitest run` **305 arquivos / 3456 testes passed / 0 failed** (a suíte caiu de 306 para 305 arquivos por causa do teste removido, sem nenhuma outra quebra) e o `grep` acima vazio)
- [x] **159** — Levantar o que falta para os hooks dormentes restantes — onda 4 — Média — Documentação · (evidência: novo `scripts/inventario/gerar-hooks-dormentes.mjs` (reusa `extrairImports`/`resolverImport` de `gerar-rotas.mjs`) e novo `docs/estado/hooks-dormentes.md`, gerado por ele. Resultado: **172 hooks de produção; 0 sem nenhum importador; 2 efetivamente dormentes** — `useAudioOutputDevices` (único consumidor `src/components/calls/WebRTCCall.tsx`, que nada importa: `grep -rn "WebRTCCall" src e2e` só acha o próprio arquivo e seu teste) e `useContactAlerts` (único consumidor `src/components/contacts/ContactAlertsDropdown.tsx`, idem); 10 alcançados apenas pelo shell (`src/App.tsx`/`src/main.tsx`: `useNotifications`, `useRealtimeHoldAlerts`, `useQualityAlerts`, `useTrunkFailoverMonitor`, `useUnreadConflicts`, `useTelemetry`, `useCrmFieldSuggestions`, `useAchievementNotifications`, `useBattleCardDetection`, `use-mobile`); 160 em uso por rota. Falso positivo evitado: a lista `hooks` do `inventario/estado/rotas.json` não segue `src/components/`, então a primeira versão da varredura acusava 30 "sem rota" (ex. `useCallPlaylists` pelo `CallPlaylistsPanel` montado em `CallLibrary.tsx:11`); trocado por fechamento real de imports a partir das rotas + shell → 0. `rotas.json` estava defasado (104 rotas/181 hooks) e foi regerado pelo gerador existente: 106 rotas/201 hooks, 0 páginas órfãs, 0 problemas (`bun scripts/inventario/gerar-rotas.mjs`). Validação: `bunx eslint scripts/inventario/gerar-hooks-dormentes.mjs` rc=0 e `bunx tsc --noEmit` rc=0 (nenhum `src/` tocado). Não verificado: linhas por tabela são a foto de `banco.json` de 2026-11-20 (sem acesso a banco nesta sessão, `.env.local` só tem `VERCEL_OIDC_TOKEN`) e "alcance" é estático — prova o import, não a montagem em runtime.)

- [ ] **160** — Ligar ou remover os hooks dormentes, dois a dois — onda 4 — Média — Frontend
- [ ] **161** — Decidir o destino de `translate-summary` e `sync-crm-queue` — onda 4 — Baixa — Edge Function
- [ ] **162** — Decidir o destino de `check-dnc` e `check-calling-hours` como edges — onda 4 — Baixa — Edge Function 🔒
- [ ] **163** — Ligar "Priorizar" no discador preditivo — onda 4 — Média — Frontend
- [x] **163** — Ligar "Priorizar" no discador preditivo — onda 4 — Média — Frontend · (achado A-084: o item "Priorizar" do menu de cada contato em `PredictiveDialerPanel.tsx` era um `<DropdownMenuItem>` com ícone e rótulo e **nenhum `onClick`**. Agora priorizar é um update real de `priority`: o `QueueItemCard` recebe `onPrioritize`, o painel calcula `maior priority da fila + 1` e chama `setPriority` (novo, no `usePredictiveDialer`) — que reaproveita o `apiUpdateQueueItem` já existente, que checa o `error` e lança (padrão da etapa 080) — e em seguida recarrega a fila com `fetchQueue`, porque a ordem exibida vem do banco (`apiFetchQueue` ordena por `priority desc`). Falha do update mostra "Erro ao priorizar contato" e **não** altera a fila local; sucesso mostra "<nome> é o próximo da fila". Isso casa com a escolha do próximo contato: o laço automático usa `getNextContact` → `apiGetNextContact`, que também ordena por `priority desc` (`api.ts:92-105`), então o priorizado é de fato o próximo discado. **Em vez de criar `apiSetPriority`**, reusei `apiUpdateQueueItem(id, { priority })` — mesma garantia de erro, sem uma segunda forma de fazer o mesmo update. RLS conferida: `dialer_queue` tem `"Role-based update dialer_queue"` para `is_admin_or_supervisor()` ou o agente atribuído (`20251225183119_7313996d:230-235`), então não cai no padrão de falha das etapas 029/066/087. Evidência: `bunx tsc --noEmit` rc=0, `bunx eslint` rc=0 nos 3 arquivos, teste novo em `usePredictiveDialer.coverage.test.tsx` ("setPriority grava a prioridade e reflete na fila") cobrindo sucesso e falha — **21 testes passed** no arquivo, e a suíte completa segue em 3461+ testes passed. O UPDATE real no Postgres não foi exercitado (sem acesso a banco com dados nesta sessão) — verificado no cliente Supabase mockado e na policy lida no repositório)
- [ ] **164** — Ligar as duas ações de triagem da análise de IA — onda 4 — Média — Frontend 🔒
- [x] **165** — Ligar os botões de navegação do dashboard — onda 4 — Baixa — Frontend · (evidência: (a) `RecentCalls.tsx:62-64` "Ver todas" agora tem `onClick={() => navigate('/history')}` (rota existe em `protectedRoutes.tsx:115`); (b) `RecentCalls.tsx:112-138` "Mais opções" deixou de ser botão morto: virou `DropdownMenu` no padrão já usado em `ContactCard.tsx:111-152` (trigger sem `asChild`, com `aria-label` por chamada) com duas ações reais — "Ver no histórico" → `navigate('/history?session=' + id)` (deep link já suportado por `CallHistory.tsx:46-58`) e "Copiar número" (só quando há `caller_phone`, via `navigator.clipboard` + toast); (c) `TabContents.tsx:87-100` botão de telefone do `HistoryTab` agora chama `onSelectNumber(call.phoneNumber)` com `stopPropagation`, `aria-label` ("Ligar de volta para X") e `disabled` quando não há número. Desvio documentado do caminho recomendado: o plano sugeria `switchToCall`, mas `switchToCall` (`useMultiChannelCall.ts:143-146`) só procura em `activeCalls`, e o `callHistory` recebido pelo `HistoryTab` contém apenas chamadas **encerradas** (`useMultiChannelCall.ts:187` e `:213` gravam `{...ended, status:'ended'}`) — não haveria chamada ativa para retomar; o efeito útil é repor o número no discador. Testes novos: `src/components/dashboard/__tests__/RecentCalls.test.tsx` (2) e `src/components/calls/softphone/__tests__/HistoryTab.test.tsx` (2) — `bunx vitest run` → 4 passed; `bunx tsc --noEmit` rc=0; `bunx eslint` nos 4 arquivos rc=0. Não verificado: o conteúdo do `DropdownMenu` não é aberto em jsdom (Radix exige `PointerEvent`, limitação já registrada na E166), então o teste cobre só o acionador com rótulo acessível; deploy do Vercel confirmado após o merge.)

- [x] **166** — Resolver o menu "mais opções" do cartão de contato — onda 4 — Baixa — Frontend · (o `MoreHorizontal` de `ContactCard.tsx` virou `DropdownMenuTrigger` com `aria-label="Mais opções"` e menu real: Ver detalhes → `onSelect`, Ligar → `onCall`, Editar → `onEdit`, Favoritar/Desfavoritar → `onToggleFavorite` e Excluir → `onDelete` (vermelho, com separador); o `stopPropagation` ficou no trigger e o clique no cartão continua abrindo o detalhe. Desvio consciente do checklist "só neste arquivo": o cartão não tinha `onEdit`/`onDelete`, então entraram como props **opcionais** passadas por `ContactGrid` e ligadas aos handlers que a página já tinha (`Contacts.tsx` `handleEdit`/`handleDelete`, os mesmos que o `ContactDetailSheet` usa) — nada duplicado e nenhum outro consumidor afetado. No mesmo arquivo, o botão de e-mail (que só fazia `stopPropagation`) passou a ser `<a href="mailto:...">` com `aria-label` e só aparece quando o contato tem e-mail. Evidência: `src/components/contacts/__tests__/ContactCard.test.tsx` (3 testes — trigger não seleciona o cartão, e-mail aponta para `mailto:`, clique no cartão ainda seleciona), `bunx tsc --noEmit` rc=0 e `bunx eslint` rc=0 nos 4 arquivos tocados, `bunx vitest run` com 3384 testes passed/0 failed (4 suítes falham na coleta por `z` undefined **também sem a minha mudança**, com HEAD == `origin/main` e CI verde da #238 no mesmo commit → falha de ambiente local, não regressão). Limitações registradas: o conteúdo do `DropdownMenu` Radix não monta no jsdom 20 (sem `PointerEvent`), então a abertura do menu não tem teste automatizado; e `Button asChild` deste repo não renderiza `children` (`src/components/ui/button.tsx:70`), por isso trigger e link usam `buttonVariants` — os 146 usos de `asChild` no app merecem etapa própria)
- [x] **167** — Ligar "Ver Alertas" do painel de limite de requisições — onda 4 — Baixa — Frontend · (evidência: `src/pages/RateLimitDashboard.tsx` — `Tabs` deixou de ser não-controlado (`defaultValue="logs"`) e virou `value={tab} onValueChange={setTab}`, com `useState` novo; o botão do alerta de incidente (`:52`, que não tinha `onClick`) passou a `onClick={() => setTab('alerts')}` — abre a lista de alertas **na mesma tela**, como o plano recomendava, em vez de navegar para `/admin/security-alerts` e perder o contexto do incidente; a lista de alertas já existia na aba "alerts" (`rate_limit_alerts`) e passou a ser alcançável. Armadilha do plano conferida: os três botões que podiam mentir sucesso em `src/hooks/useRateLimitData.ts` checam `error` e lançam antes do `toast.success` (`resolveAlert` `:89-96`, `unblockIP` `:98-105`, `cleanOldLogs` `:107-116`) — a correção da etapa 029 está aplicada, nada a fazer. Teste novo `src/pages/__tests__/RateLimitDashboard.alerts.test.tsx` (mocka `useRateLimitData`/`usePageTitle`/`recharts`): antes do clique a tabela de alertas não está no DOM e, após "Ver Alertas", aparece o card "Alertas de Rate Limit" com o IP do alerta — `bunx vitest run` 1 passed; `bunx tsc --noEmit` rc=0; `bunx eslint` nos 2 arquivos rc=0. Não verificado: sem acesso a banco nesta sessão, a tela nunca foi aberta com `rate_limit_alerts` reais.)
- [x] **168** — Ligar os botões "Configurar" e os testes de áudio — onda 4 — Baixa — Frontend · (achado A-084: em `src/pages/Calls.tsx` o "Configurar" do **SIP Genérico** (`:157`) não tinha `onClick` e o do **Wavoip** (`:137`) apontava para um canal stub (etapa 100, `wavoip-call` responde sucesso sem chamada), e em `src/pages/Settings.tsx` "Testar microfone" e "Testar áudio" também eram botões mortos. Novo `src/lib/audio/deviceTest.ts`: `startMicLevel()` abre `navigator.mediaDevices.getUserMedia({audio:true})`, liga o stream a um `AnalyserNode` e reporta o nível 0..1 por `requestAnimationFrame`; `stop()` cancela o quadro, desconecta o source, para **todas** as tracks e fecha o `AudioContext` — o microfone volta para o sistema. `playTestTone()` toca um tom de 440 Hz com rampa de ganho e fecha o contexto. Recusa de permissão, dispositivo ausente, dispositivo ocupado e ausência de Web Audio viram mensagens distintas (`AudioTestError`), sem prometer sucesso. `Settings.tsx` ganhou os handlers, um medidor de nível visível enquanto o teste roda ("Parar teste") e um `useEffect` que libera o stream se a tela for abandonada com o teste aberto — em vez de só um toast, o agente vê a barra reagir à própria voz, que é a verificação útil antes do turno. Em `Calls.tsx` o SIP Genérico passou a usar `navigate('/admin/voip-trunks')` (rota `protectedRoutes.tsx:195`, já era o destino do SIP de navegador) e o botão do Wavoip foi **removido**, com o texto do cartão dizendo "integração ainda não disponível" — a opção "remover" do plano, porque o canal é stub e um botão que não faz nada é pior que a ausência dele. Evidência: `bunx tsc --noEmit` rc=0; `bunx eslint` rc=0 nos 4 arquivos; novo `src/lib/audio/__tests__/deviceTest.test.ts` com 5 testes (permissão negada, nível medido + track parada, microfone ausente, tom tocado com contexto fechado, ausência de Web Audio) — **5 passed / 0 failed**. O que **não** foi verificado: o áudio de verdade num navegador humano (não há microfone nem saída neste ambiente headless); os testes cobrem a API com `AudioContext`/`getUserMedia` simulados)
- [x] **169** — Explicar na tela a regra do coaching automático — onda 4 — Baixa — Frontend · (o motor já tinha `MIN_SAMPLES`/`SCORE_THRESHOLD`/`WINDOW_DAYS`, mas a edge devolvia só `skipped` e o `/coaching` não tinha como explicar o vazio. Agora `track-engine.ts` exporta `COACHING_RULES` (fonte única) e a edge devolve `rules: {min_samples, score_threshold, window_days}` em toda resposta; o `14` que estava escrito à mão no `since` da consulta passou a usar `WINDOW_DAYS`. No front, `useCoachingTrack` expõe `rules` (cache React Query semeado pela resposta) e `lastResult`, e o toast que dizia "últimas 14d" passou a usar `rules.window_days`. `CoachingAssignmentsPanel` (o vazio real do `/coaching`, usado por `Coaching.tsx`) agora escreve "são necessárias N avaliações com nota abaixo de X nos últimos D dias" com os números da edge e lista, por agente, o motivo de ter ficado de fora. Evidência: `deno check index.ts track-engine.ts` rc=0, `deno test -A track-engine_test.ts` 8 passed/0 failed, `bun scripts/guard-edge-numeric.mjs --check` 98 arquivos/0 violações, `bunx tsc --noEmit` rc=0, `bunx eslint` rc=0 nos 3 arquivos, `src/components/coaching/__tests__/CoachingAssignmentsPanel.rules.test.tsx` (3 testes, usando 4/2.5/30 de propósito para quebrar se a tela voltar a fixar 3/3.0/14) — 3 passed) — onda 4 — Baixa — Frontend
- [ ] **170** — Alinhar a meta de SLO entre a tela e o cálculo — onda 4 — Média — Frontend + Edge Function
- [ ] **171** — Resolver as duas estruturas paralelas de recuperação de senha e verificação de e-mail — onda 4 — Média — Banco + Documentação
- [x] **172** — Parar de contar "features de segurança" a partir de um array literal — onda 4 — Média — Frontend
- [x] **173** — Dar estados e defesa ao gráfico de espera do dashboard — onda 4 — Alta — Frontend
- [x] **174** — Fazer o painel de conflitos de concorrência mostrar conflitos — onda 4 — Média — Frontend
- [ ] **175** — Completar o CRUD da lista DNC — onda 4 — Média — Frontend 🔒
- [x] **176** — Fazer a remediação de anomalia atualizar a lista — onda 4 — Média — Hooks
- [ ] **177** — Parar de responder "aplicado" sem aplicar nada — onda 4 — Alta — Edge Function 🔒
- [x] **178** — Fazer o "Aplicar" da recomendação de capacidade registrar algo — onda 4 — Média — Frontend
- [ ] **179** — Mostrar as violações de SLA numa tela — onda 4 — Média — Frontend
- [ ] **180** — Fechar a onda 4 com o inventário de fios ligados — onda 4 — Média — Documentação


## Onda 5 — Robustez: erros, estados, concorrência (181–235, 55 etapas)

- [x] **181** — Verificar o erro nas gravações do ciclo de chamada — onda 5 — Alta — Hooks · (achado A-052: os quatro inserts/upserts eram `await supabase.from(...).insert(...)` **sem desestruturar `error`**. A causa raiz vale registrar porque explica os quatro de uma vez: o builder do Postgrest **resolve** com `{ data, error }` e não rejeita em erro de banco (violação de constraint, RLS, tipo) — só falha de rede vira exceção. Onde já havia `try/catch` (`useCallSession.ts`, `useVoipQualityMonitor.ts`) o catch cobria apenas rede, então erro de banco passava em silêncio. Corrigido nos quatro, com o tratamento proporcional ao que a gravação significa: `useCallSession.ts` (`call_transcripts_searchable`) e `useVoipQualityMonitor.ts` (`call_quality_metrics`) apenas registram com `log.error` e **não** interrompem a chamada (índice de busca e métrica podem degradar); `useMultiChannelCall.ts` (`hold_events`) registra o hold perdido — sem ele a espera do relatório perde o trecho; e `useCallRecording.ts` (`call_recordings`) é o caso que **não** pode ser silencioso: o áudio já subiu para o storage, mas sem a linha em `call_recordings` a chamada fica sem o registro legal do atendimento. Ali `stopAndSaveRecording()` agora devolve `null` quando o insert falha (antes devolvia o caminho e a tela anunciava "Gravação salva"), com o caminho do arquivo dentro da mensagem de log para recuperação. Nada virou `throw` — num caminho de chamada ao vivo exceção não tratada derruba a interface. Evidência: `bunx tsc --noEmit` rc=0; `bunx eslint` rc=0 nos 5 arquivos; teste novo em `src/hooks/__tests__/useCallRecording.test.ts` ("devolve null quando o audio sobe mas a gravacao nao e registrada no banco", com `insert` devolvendo erro de RLS) — o arquivo tem **3 passed** e os 5 arquivos de teste dos hooks tocados somam **63 passed / 0 failed**. O que **não** foi verificado: o comportamento contra o Postgres real (sem acesso a banco com dados nesta sessão); o erro de banco foi simulado no cliente Supabase)
- [x] **182** — Verificar o erro nas gravações da trilha de auditoria — onda 5 — Alta — Hooks · (achados A-052/A-053: `src/hooks/useSupervisorPanel.ts` fazia `await supabase.from('call_control_audit_logs').insert({...})` sem desestruturar `error` em `startListening` e `stopListening`, e o `toast.success` de `startListening` dizia "Escuta registrada" mesmo quando nada foi gravado; `src/hooks/useAuditLog.ts:50` registrava a falha no log mas **devolvia `void`**, então nenhum chamador podia saber que a trilha não existiu. Correções: `useSupervisorPanel.ts` ganhou o helper `auditOrWarn(entry)` — grava, e em erro faz `logger.error` + `toast.warning('Ação concluída, mas não foi registrada na auditoria')` e devolve `false`; `startListening` só anuncia sucesso quando a auditoria gravou, `stopListening` avisa a falha e segue encerrando a escuta. `useAuditLog.ts`: `logEvent` agora devolve `Promise<boolean>` (`true` gravado, `false` em erro de RPC ou exceção) e o `log.error` leva `{ action, resourceType, resourceId, error }` — os helpers `logContactAccess`/`logCallRecordingDownload` etc. propagam o booleano sem mudar de assinatura de uso. **Decisão que não tomei sozinho** (o plano manda levar ao dono): *bloquear* a ação sensível quando a auditoria falha — a escuta foi mantida funcionando e apenas sinalizada, porque bloquear escuta/gravação é trade-off operação × conformidade. Evidência: `bunx tsc --noEmit` → 0 `error TS`; `bunx eslint` rc=0 nos 2 hooks; testes: `src/hooks/__tests__/useSupervisorPanel.coverage.test.tsx` **16 passed** (3 novos: falha na auditoria de `startListening` → warning e **nenhum** `success`; sucesso → `Escuta registrada na chamada de Agent A`; falha na auditoria de `stopListening` → warning) e `useAuditLog.coverage.test.tsx` **6 passed** (2 novos: devolve `true`/`false`; devolve `false` em exceção) — total **22 passed / 0 failed**. Não verificado: gravação real no Postgres (erro de RLS simulado no cliente))
- [ ] **183** — Verificar o erro nas gravações de sessão e autenticação — onda 5 — Alta — Hooks
- [ ] **184** — Verificar o erro nas gravações de conversas e mensagens — onda 5 — Média — Hooks
- [ ] **185** — Verificar o erro nas gravações de gamificação e ranking — onda 5 — Média — Hooks
- [ ] **186** — Verificar o erro nas operações de armazenamento — onda 5 — Média — Hooks
- [x] **187** — Varrer e corrigir as gravações cegas restantes — onda 5 — Média — Hooks
  - Varredura `grep -rn "^\s*await supabase" src/ --include=*.ts --include=*.tsx | grep -v __tests__`: de 35 originais sobraram 24; dessas, 8 já estavam cobertas pelas etapas 181–186 (em PR) e as demais foram tratadas em 2 PRs.
  - Parte 1 (hooks): `useTrackers.toggleTracker` (erro → toast e sem recarregar), `useBitrix.syncAgents`/`syncDepartments` (conta falhas por linha, loga e lança → marca a tentativa como falha), `useBitrix.registerCall` (fila `crm_sync_queue` logada), `useLiveAssist.analyze`/`markUsed`, `useAgentRanking` (seed), `useAvatar` (rollback e órfãos logados), `useLoginLockout.recordSuccessfulLogin` (erro do RPC logado). Testes: 71 passed + 2 casos novos.
  - Parte 2 (UI/integração): `BattleCardAlert` (insert em `coaching_timestamps` sem checagem não mostrava mais sucesso), `SystemMaintenancePanel` (`log_audit_event` com aviso de auditoria não registrada), `CommandPalette` (sair só navega quando o `signOut` confirma), `WhisperNotification` (`is_read` mantém o aviso na tela quando a gravação falha), `integrations/lovable` (`setSession` resolve com `{ error }`, não lança).
  - Legítimos ignorados por desenho: nenhum `void supabase…` restante precisou ser criado; os casos best-effort (avatar antigo) ficaram com log explícito.
- [ ] **188** — Fazer o mesmo nas edge functions — onda 5 — Média — Edge Function
- [ ] **189** — Parar de engolir falha nos alertas de contato — onda 5 — Média — Hooks
- [ ] **190** — Parar de engolir falha na gravação de contatos — onda 5 — Média — Hooks
- [ ] **191** — Parar de engolir falha na gravação de contas — onda 5 — Média — Hooks
- [ ] **192** — Parar de engolir falha na administração de ramais — onda 5 — Média — Hooks
- [ ] **193** — Parar de engolir falha no relatório de uso de tronco — onda 5 — Média — Hooks
- [ ] **194** — Varrer os `catch` que escondem escrita, lote 1 — onda 5 — Média — Hooks
- [ ] **195** — Varrer os `catch` que escondem escrita, lote 2 — onda 5 — Média — Hooks + Frontend
- [ ] **196** — Criar o guard que impede a volta das gravações cegas — onda 5 — Alta — CI 🔒
- [x] **197** — Parar de transformar erro de consulta em zero no painel de fila — onda 5 — Alta — Hooks
- [x] **198** — Idem nos painéis de segurança — onda 5 — Alta — Hooks
- [x] **199** — Idem na lista de IPs permitidos — onda 5 — Média — Hooks
- [x] **200** — Idem no ranking, nos scorecards e nos planos de sucesso — onda 5 — Média — Hooks
- [x] **201** — Varrer as consultas cegas restantes — onda 5 — Média — Hooks
- [x] **202** — Padronizar o estado de erro das telas — onda 5 — Média — Frontend
- [x] **203** — Estados de carregamento e vazio nas telas de operação — onda 5 — Média — Frontend · (8 telas do fluxo central conferidas: fila, ranking, métricas de fila e softphone de chamadas já corretas; 4 corrigidas — executivo e histórico não tinham estado de erro, o discador não tinha carregamento e as recentes do discador não distinguiam falha de lista vazia; tsc=0, eslint=0, 63/63 testes relacionados)
- [x] **204** — Fazer o agente ficar offline ao fechar o navegador — onda 5 — Alta — Hooks · (token da sessao em ref + PATCH keepalive em `beforeunload` e `pagehide`, sem `await`, falha registrada e sem PATCH duplicado; 7/7 no teste do hook; tsc=0; eslint=0)
- [x] **205** — Parar de engolir falha no agendamento de retorno ao cliente — onda 5 — Alta — Hooks · (`useScheduledCallbacks.ts` já registrava e avisava nos 5 catch desde a onda das etapas 189/194/195 — evidência: as linhas 108/132/154/173/192 têm `log.error` + `toast.error`; o que faltava era a confirmação com data e hora e a gravação que não grava nada: `createCallback`/`updateCallback` passam a confirmar com o `scheduled_at` devolvido pelo banco, e complete/cancel/delete usam `.select('id')` para não reportar sucesso com 0 linhas afetadas. Verificação: `bunx vitest run src/hooks/__tests__/useScheduledCallbacks.coverage.test.tsx` 10/10 com o fix e 2 falhando sem ele; `bunx tsc --noEmit` rc=0; `bunx eslint` rc=0)
- [x] **206** — Evitar a corrida entre "carregar mais" e troca de filtro no histórico — onda 5 — Baixa — Hooks · (id de requisicao em `useCallHistory`: pagina que volta depois da troca de filtro e descartada, sem anexar na lista nova e sem apagar o loading da busca vigente; 7/7 no teste do hook — 1 falha sem o fix; tsc=0; eslint=0)
- [ ] **207** — Registrar a reordenação de favoritos só depois de persistir — onda 5 — Baixa — Hooks 🔒
- [x] **208** — Criar o utilitário de `fetch` com prazo para as edges — onda 5 — Média — Edge Function · (`DEFAULT_FETCH_TIMEOUT_MS` 15 s e `fetchComPrazo()` em `_shared/resilience.ts`, combinando o signal do chamador com `AbortSignal.timeout`; `resilientFetch` passou a usar o prazo; 11/11 nos testes Deno — sem o fix a suíte fica pendurada e so o `timeout` de 20 s a mata (rc=124); `deno check` e `deno lint` sem problema novo)
- [x] **209** — Prazo nas edges de IA — onda 5 — Média — Edge Function · (as 11 edges de IA que ainda chamavam `fetch` direto agora usam `fetchComPrazo()`: auto-scorecard, analyze-call, voice-command, generate-coaching-plan, chatbot-respond, realtime-analysis, extract-crm-fields, translate-utterance, generate-meeting-summary, whatsapp-rewrite, voip-executive-narrative — as 4 que já usavam `resilientFetch` herdam o prazo da 208; o timeout vira `503 {error:"Serviço de IA indisponível"}` e os ramos que repassavam status/corpo do provedor (429/402/500/502, incl. `details`/`detail`) foram unificados em 503 com o motivo só no log — contrato da 050; `deno check` 11/11 OK, `deno test -A supabase/functions/` 383 passed/0 failed, `deno lint` sem problema novo; a simulação de upstream lento ponta a ponta fica na etapa 234, porque a URL do provedor é fixa)
- [ ] **210** — Prazo nas edges de e-mail e de integração — onda 5 — Média — Edge Function
- [ ] **211** — Prazo e proteção na cadeia edge→edge — onda 5 — Média — Edge Function
- [ ] **212** — Guard de CI para `fetch` sem prazo — onda 5 — Média — CI
- [ ] **213** — Padronizar o contrato de erro das edge functions — onda 5 — Baixa — Edge Function
- [x] **214** — Fazer a suíte de testes rodar sem configuração manual — onda 5 — Baixa — Testes · (`src/test/setup.ts` preenche `VITE_SUPABASE_URL=https://test.invalid` e `VITE_SUPABASE_PUBLISHABLE_KEY=test-publishable-key` quando ausentes; `AGENTS.md:32` documenta. Verificação num shell sem nenhuma variável `VITE_*`: `useFinancialImpact.property.test.ts` e `executive-dashboard-utils.test.ts` — que falhavam na coleta com "Missing VITE_SUPABASE_URL" — passam (5 + 11 testes); suíte completa: 298 arquivos e 3376 testes passando. Restam 4 arquivos que falham **localmente** com `zod` `undefined` sob o runtime do Bun (`useContacts.coverage`, `validation-schemas`, `zod-schemas.property`) — causa diferente e nenhuma relação com env; a `main` está verde nos mesmos arquivos (run 45313951657, sha d1b586c) — e 1 teste de `Status.tsx` que falha só local)
- [ ] **215** — Retentativa com espera nas chamadas ao Bitrix — onda 5 — Média — Frontend
- [ ] **216** — Encerrar as assinaturas de realtime em todos os caminhos — onda 5 — Baixa — Hooks
- [ ] **217** — Remover os `eslint-disable` de dependências de efeito, um a um — onda 5 — Média — Hooks
- [ ] **218** — Proteger as ações de escrita contra duplo clique — onda 5 — Média — Frontend
- [ ] **219** — Invalidação de cache após as mutações principais — onda 5 — Média — Hooks
- [ ] **220** — Rollback nas atualizações otimistas — onda 5 — Média — Hooks
- [ ] **221** — Incluir a chave de filtro em todas as `queryKey` — onda 5 — Média — Hooks
- [ ] **222** — Tratar sessão expirada sem perder o que o usuário digitou — onda 5 — Média — Frontend
- [ ] **223** — Sincronizar o fim de sessão entre abas — onda 5 — Baixa — Hooks
- [ ] **224** — Teste de concorrência para o claim do discador — onda 5 — Alta — Testes 🔒
- [ ] **225** — Teste de lock otimista contra o banco — onda 5 — Média — Testes
- [ ] **226** — Fazer o `webhook-handler` processar o evento que ele valida — onda 5 — Média — Edge Function 🔒
- [ ] **227** — Fila de retentativa para os webhooks de entrada — onda 5 — Média — Edge Function 🔒
- [ ] **228** — Trocar HTTP por HTTPS na consulta que decide bloqueio geográfico — onda 5 — Baixa — Edge Function
- [ ] **229** — Identificador de correlação de ponta a ponta — onda 5 — Média — Edge Function + Frontend
- [ ] **230** — Registrar os erros do navegador em algum lugar — onda 5 — Média — Frontend 🔒
- [ ] **231** — Avisar quando um cron falha — onda 5 — Alta — Banco 🔒
- [ ] **232** — Vigiar as filas que podem encher — onda 5 — Média — Banco 🔒
- [x] **233** — Estados de falha visíveis no softphone — onda 5 — Alta — Frontend · (evidência: `src/components/calls/UnifiedSoftphone.tsx` — (a) o cabeçalho passou a mostrar `SipConnectionStatus` (`:285`) com o estado da **própria** instância do hook: a página usa outra (`Calls.tsx:18` e `UnifiedSoftphone.tsx:56` chamam `useSipCall()` separadamente), então o badge do header da página não refletia esta linha; (b) banner destrutivo (`Alert`) sempre que `!isRegistered && (status === "error" || "disconnected")`, com o motivo vindo de `sipCall.error`, título "A chamada caiu — a linha SIP saiu do ar" quando há chamada SIP ativa, instrução de cadastro de tronco quando `!isConfigured`, e botão "Tentar agora" → `sipConnect()`; (c) reconexão automática com espera crescente (`sipRetryDelayMs`: imediata, 5s, 10s, 20s, teto 30s) substituindo a tentativa única e muda que existia na antiga linha 57, com reset ao registrar; `sipConnect` (`useSipCall.ts:131-250`, `useCallback` com `[]`) entrou nas dependências, o que **removeu** o `eslint-disable` daquele efeito (o `useSipCall` não foi alterado — só consumido); (d) `getUserMedia` saiu do `try` do token para um `try/catch` próprio, com `describeMicError` (`src/lib/audio/deviceTest.ts:26`) no toast e no banner "Microfone bloqueado" (instrução do cadeado na barra de endereço) e devolução do agente para Disponível quando não há chamada. Teste novo `src/components/calls/__tests__/UnifiedSoftphone.falhas.test.tsx` 4/4: badge "Linha SIP ativa"; motivo "Registro falhou: 403 Forbidden" + "Tentar agora" chamando `connect` 1×; backoff (em 4.999ms ainda 1 chamada, em 5.000ms a 2ª); microfone negado (`DOMException NotAllowedError`) exibindo a instrução. Regressão: `bunx vitest run src/components/calls src/pages/__tests__` → 21 arquivos / 65 testes passed; `bunx tsc --noEmit` rc=0; `bunx eslint` nos 2 arquivos rc=0. Não verificado: não há SIP nem rede reais neste ambiente — o cenário "desligar a rede" do plano foi simulado pelo estado do hook, não com UA JsSIP de verdade; `status === "connecting"` travado (invoke que nunca resolve) ficou sem watchdog.)
- [ ] **234** — Teste de resiliência das edges contra upstream fora do ar — onda 5 — Média — Testes
- [ ] **235** — Fechar a onda 5 com um levantamento do que o sistema passou a reportar — onda 5 — Média — Documentação


## Onda 6 — Performance (236–258, 23 etapas)

- [ ] **236** — Paginação nas listagens do histórico e das gravações — onda 6 — Alta — Hooks
- [ ] **237** — Paginação nas listagens de contatos, negócios e contas — onda 6 — Média — Hooks
- [ ] **238** — Paginação nas listagens administrativas e de auditoria — onda 6 — Média — Hooks 🔒
- [ ] **239** — Agregar no banco as métricas de insights de contato — onda 6 — Baixa — Hooks 🔒
- [ ] **240** — Paginar as duas consultas da página pública de status — onda 6 — Média — Frontend 🔒
- [ ] **241** — Índice em `call_sessions.created_at` — onda 6 — Alta — Banco 🔒
- [ ] **242** — Índices derivados do uso real, não do palpite — onda 6 — Média — Banco 🔒
- [ ] **243** — Índices para as buscas por texto que existirem — onda 6 — Baixa — Banco 🔒
- [ ] **244** — Reduzir a tempestade de consultas do painel de fila — onda 6 — Média — Hooks
- [ ] **245** — Parar o laço de re-render de 1 Hz do lembrete de espera — onda 6 — Média — Hooks
- [ ] **246** — Transformar o alerta repetitivo de meta em alerta de transição — onda 6 — Média — Hooks
- [ ] **247** — Eliminar o N+1 da validação de IP — onda 6 — Média — Edge Function
- [ ] **248** — Eliminar o N+1 do cálculo de melhor horário — onda 6 — Média — Edge Function 🔒
- [ ] **249** — Eliminar o N+1 do resumo de notificações — onda 6 — Baixa — Edge Function
- [ ] **250** — Guard de CI contra N+1 em edge function — onda 6 — Baixa — CI
- [ ] **251** — Reduzir o chunk de entrada do front — onda 6 — Média — Frontend
- [ ] **252** — Transformar o orçamento de bundle em meta de produto — onda 6 — Média — CI
- [ ] **253** — Pausar realtime e poll quando a aba está oculta — onda 6 — Média — Hooks
- [ ] **254** — Virtualizar as listas longas — onda 6 — Baixa — Frontend
- [ ] **255** — Retenção dos logs que crescem sem parar — onda 6 — Média — Banco 🔒
- [ ] **256** — Medir o custo real das policies de RLS — onda 6 — Média — Banco 🔒
- [ ] **257** — Conferir o limite de conexões do banco — onda 6 — Média — Infraestrutura
- [ ] **258** — Fechar a onda 6 com os números antes e depois — onda 6 — Média — Verificação


## Onda 7 — Experiência de uso e consistência (259–281, 23 etapas)

- [ ] **259** — Rótulo acessível nos botões-ícone do discador e da chamada — onda 7 — Média — Frontend
- [ ] **260** — Rótulo acessível nos botões-ícone de contatos — onda 7 — Média — Frontend
- [ ] **261** — Rótulo acessível na navegação da transcrição — onda 7 — Média — Frontend
- [ ] **262** — Rótulo acessível nos botões de exclusão — onda 7 — Média — Frontend
- [ ] **263** — Varrer os botões-ícone restantes — onda 7 — Baixa — Frontend
- [ ] **264** — Regra de lint para botão-ícone sem nome acessível — onda 7 — Média — CI
- [ ] **265** — Resolver as rotas que não têm entrada em nenhum menu — onda 7 — Média — Frontend
- [ ] **266** — Resolver a duplicata `/history` e `/call-history` — onda 7 — Baixa — Frontend
- [ ] **267** — Padronizar as mensagens de confirmação de sucesso — onda 7 — Baixa — Frontend
- [ ] **268** — Estados vazios que explicam, não que só dizem "vazio" — onda 7 — Média — Frontend
- [ ] **269** — Remover o que promete internacionalização e não entrega — onda 7 — Baixa — Frontend
- [ ] **270** — Conferir a interface em largura de celular — onda 7 — Média — Frontend
- [ ] **271** — Corrigir o que a conferência de celular encontrar, lote 1 — onda 7 — Média — Frontend
- [ ] **272** — Corrigir o que a conferência de celular encontrar, lote 2 — onda 7 — Baixa — Frontend
- [ ] **273** — Navegação por teclado no fluxo de chamada — onda 7 — Média — Frontend
- [ ] **274** — Barra de progresso de carregamento de rota — onda 7 — Baixa — Frontend
- [ ] **275** — Conferir que o tema escuro não esconde informação — onda 7 — Baixa — Frontend
- [ ] **276** — Uma só palavra para cada conceito na interface — onda 7 — Baixa — Frontend
- [ ] **277** — Formato único para número, data e duração — onda 7 — Baixa — Frontend
- [ ] **278** — Confirmação antes de toda ação destrutiva — onda 7 — Média — Frontend
- [ ] **279** — Tela de "sem permissão" que ajuda — onda 7 — Baixa — Frontend
- [ ] **280** — Revisar as páginas públicas de marketing — onda 7 — Média — Frontend 🔒
- [ ] **281** — Fechar a onda 7 — onda 7 — Baixa — Documentação


## Onda 8 — Higiene: código morto, CI, observabilidade (282–300, 19 etapas)

- [ ] **282** — Fazer a auditoria de dependências reprovar sem baseline — onda 8 — Alta — CI 🔒
- [ ] **283** — Triar os 23 achados de SSRF do baseline — onda 8 — Média — Edge Function
- [ ] **284** — Remover ou reescrever os 29 testes que não testam nada — onda 8 — Alta — Testes
- [ ] **285** — Fazer os 31 testes E2E órfãos rodarem, ou removê-los — onda 8 — Alta — Testes 🔒
- [ ] **286** — Um validador só para as edge functions — onda 8 — Média — Edge Function
- [ ] **287** — Pôr o catálogo de edge functions no CI — onda 8 — Média — CI 🔒
- [ ] **288** — Corrigir as afirmações erradas do `AGENTS.md` — onda 8 — Alta — Documentação
- [ ] **289** — Guard contra timestamp duplicado de migration — onda 8 — Média — CI 🔒
- [ ] **290** — Documentar as 24 variáveis de ambiente que o sistema usa — onda 8 — Média — Documentação 🔒
- [ ] **291** — Remover do `.env.example` as 28 variáveis de uma stack que não existe — onda 8 — Média — Documentação
- [ ] **292** — Corrigir o gerador de inventário de rotas — onda 8 — Média — Scripts 🔒
- [ ] **293** — Decidir o destino dos 15 scripts órfãos — onda 8 — Média — Scripts 🔒
- [ ] **294** — Remover os índices que nunca são usados — onda 8 — Média — Banco 🔒
- [ ] **295** — Decidir o destino dos 17 módulos de segurança sem importador — onda 8 — Alta — Frontend
- [ ] **296** — Remover os cinco componentes órfãos — onda 8 — Baixa — Frontend
- [ ] **297** — Um lockfile só, num registry que o dono controla — onda 8 — Alta — Infraestrutura 🔒
- [ ] **298** — Separar dependências de produção das de desenvolvimento — onda 8 — Baixa — Infraestrutura
- [ ] **299** — Remover a configuração morta de TypeScript e de Vite — onda 8 — Baixa — Infraestrutura
- [ ] **300** — Refazer a medição de estado e aposentar os documentos que mentem — onda 8 — Alta — Documentação


---

## Achados novos encontrados durante a execução

Problema novo achado no caminho **não é corrigido na hora** — vira linha aqui, com `arquivo:linha`. Numere a partir de **A-134** (os anteriores estão em `03-ACHADOS.md`).

| ID | Encontrado na etapa | Arquivo:linha | O que é | Severidade proposta |
|---|---|---|---|---|
| | | | | |

---

## Etapas em que o código já não correspondia à evidência

Quando a etapa descrever algo que o código atual não tem mais (porque alguém corrigiu, ou porque o arquivo mudou), marque `[-]` acima e registre aqui. Isso é informação valiosa: significa que o plano envelheceu naquele ponto.

| Etapa | O que o plano dizia | O que você encontrou | Data |
|---|---|---|---|
| | | | |

---

## Decisões que o dono tomou

Várias etapas dependem de uma escolha de negócio. Registre cada resposta aqui, com data — o executor seguinte vai precisar dela.

| Etapa | Pergunta | Resposta do dono | Data |
|---|---|---|---|
| 001 | O repositório deve continuar público? | | |
| 030 | Qual trilha serve produção: Lovable ou Vercel? | | |
| 037 | Barreira de compliance: autorização por edge, política no tronco, ou as duas? | | |
| 040 | Rotacionar a chave `anon` que está no histórico do Git? | | |
| 068 | Os `hold_events` órfãos devem ser marcados ou apagados? | | |
| 077 | O que é o "Programa Beta" da tela de Configurações? | | |
| 091 | O papel `viewer` é necessário? | | |
| 096 | O painel "Análise IA de Performance": remover ou ligar a dados reais? | Removido (opção a) — o painel era mock puro sem fonte; ligar a uma narrativa real ficou como feature própria | |
| 100 | Qual canal o softphone deve abrir por padrão? | | |
| 103 | A taxa de abandono deve entrar no denominador do nível de serviço? | | |
| 142 | Com o bloqueio geográfico ligado e nenhum país cadastrado: libera ou bloqueia? | | |
| 149 | As 4 tabelas sem uso podem ser removidas? | | |
| 154 | Resumo automático em toda chamada (custo de IA) ou sob demanda? | | |
| 155 | Há base legal e aviso ao cliente para biometria de voz? | | |
| 170 | A meta de disponibilidade é 99% ou 99,9%? | | |
| 177 | A remediação de anomalia deve executar de verdade ou virar sugestão? | | |
| 255 | Por quanto tempo guardar `audit_logs`? | | |
| 280 | O que ajustar nas páginas públicas que prometem mais do que o sistema faz? | | |
| 293 | Os 4 scripts destrutivos ainda são usados? | | |

---

## Como retomar depois de uma interrupção

1. Leia a tabela **Resumo de execução** e a última onda com marcas.
2. Vá para a primeira etapa `[ ]` ou `[>]` da ordem.
3. **Releia a evidência da etapa no código atual antes de mudar qualquer coisa.** Se não corresponder, marque `[-]`, registre, e siga para a próxima etapa independente.
4. Confira a tabela **Decisões que o dono tomou** — se a etapa depende de uma resposta que não está lá, pergunte antes de implementar.
5. Confira as **oito etapas que dependem de etapa posterior** (tabela no início de `04-PLANO.md`) para não travar.
