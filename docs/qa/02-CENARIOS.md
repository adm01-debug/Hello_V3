# 02 — Matriz de cenários por jornada

> **Commit:** `b712310` · **Data:** 2026-11-22/23 · **Método:** cruzamento sistemático de 4 dimensões por jornada que grava dado — **ator** (admin / supervisor / agente / viewer / visitante / usuário de outra conta), **estado do dado** (vazio / 1 registro / muitos / limite / inválido / duplicado / já excluído), **entrada** (válida / vazia / enorme / malformada / caracteres especiais / borda) e **condição** (duplo clique / duas abas / dois usuários / rede caindo / sessão expirada / terceiro fora do ar / reenvio / passos fora de ordem).

## Como ler as marcas

| Marca | Significado |
|---|---|
| **EXECUTADO** | eu rodei um comando, teste ou consulta e vi o resultado |
| **RASTREADO** | eu segui o caminho pelo código, linha a linha, sem executar |

Nenhum cenário foi executado **em navegador** nem **contra o banco de produção** — ver §6 de `01-INVENTARIO.md` para o motivo exato. Todo cenário cujo "encontrado" difere do "esperado" virou achado em `03-ACHADOS.md` (coluna → ID).

---

## Cenários transversais executados antes da matriz

| # | Cenário | Esperado | Encontrado | Marca |
|---|---|---|---|---|
| T1 | Tipos do projeto compilam | 0 erros | **0 erros** (`npx tsc --noEmit`) | EXECUTADO |
| T2 | Lint reprova código sujo | 0 erros | **0 erros, 5 warnings** (todos `no-console` em `scripts/audit-edge-functions.ts`) | EXECUTADO |
| T3 | Suíte unitária verde | todos os arquivos passam | **3.289 testes passam, mas 2 arquivos falham na coleta** por `Missing VITE_SUPABASE_URL` | EXECUTADO → A-19 |
| T4 | Guards do repo bloqueiam violação | 3 guards verdes | 3 verdes (`check-claude-md-integrity`, `codemod-safe-number`, `guard-edge-numeric`) | EXECUTADO |
| T5 | Build de produção conclui | `dist/` gerado | 221 assets, `✓ built in 17.94s`, aviso de chunk > 900 kB | EXECUTADO |
| T6 | Orçamento de bundle reprova crescimento | falha acima da meta de produto | passa: limite é **+10% do tamanho atual** (`scripts/check-bundle-budget.mjs:58-66`); `index.js` = 319,6 kB gzip contra "meta <200 kB" documentada | EXECUTADO → A-20 |
| T7 | Auditoria de dependências reprova vuln alta | job falha | job **success** com vulnerabilidades altas: `bun audit \|\| true` (`ci.yml:124`). Minha medição: `npm audit` → **30 vulns, 16 altas**; o log do CI com `bun` reporta **121 (51 altas)** — os dois lockfiles produzem árvores diferentes | EXECUTADO → A-02, A-24 |
| T8 | Auditoria estática de edges reprova falha de auth | job falha | job **success**: 51 achados congelados em `scripts/audit-edge-baseline.json` (23 SSRF, **11 de autorização**), e a regra de auth é `warn` (`scripts/audit-edge-functions.ts:100`) | EXECUTADO → A-01 |
| T9 | Nenhum segredo real versionado | nenhum | **nenhum** `service_role`, senha ou chave de API real nos 1.697 arquivos rastreados; os 2 JWT presentes são chave `anon` (pública por design) em migrations | EXECUTADO |
| T10 | E2E cobre os fluxos críticos | login, SIP, lockout cobertos | **7 testes rodam** (`tests/e2e/`); os **31 testes de `e2e/`** — login, fluxo SIP, lockout, ramais, dashboard, observabilidade — **nunca executam** (`playwright.config.ts:4`) | EXECUTADO → A-21 |

---

## J1 — Entrar no sistema (`/login`)

| # | Ator | Estado | Entrada | Condição | Esperado | Encontrado | Marca | Achado |
|---|---|---|---|---|---|---|---|---|
| 1.1 | visitante | — | e-mail+senha válidos | normal | sessão criada, vai para `/` | `useAuth.signIn` → `supabase.auth.signInWithPassword`; `ProtectedRoute` libera | RASTREADO | — |
| 1.2 | visitante | — | senha errada | repetido | bloqueio após N tentativas | existe `login_attempts` e página `/blocked-access-logs`; **o teste E2E que cobria lockout (`e2e/security-lockout.spec.ts`) não roda** | RASTREADO | A-21 |
| 1.3 | visitante | — | e-mail malformado | normal | erro de validação | `src/lib/validation/schemas.ts` valida no cliente; a validação real é do Supabase Auth | RASTREADO | — |
| 1.4 | não autenticado | — | — | acessa `/dashboard` direto | redireciona para `/login` | `ProtectedRoute:30` → `<Navigate to="/login">` | RASTREADO | — |
| 1.5 | agente | — | — | sessão expirada no meio da navegação | volta ao login sem perder contexto | `ProtectedRoute` guarda `state.from`; não há renovação silenciosa visível no fluxo de rota | RASTREADO | — |
| 1.6 | **viewer** | — | login válido | acessa rota de ação (`/dialer` é supervisor+; `/contacts` não tem `roles:`) | papel "somente leitura" não deveria escrever | **`viewer` não restringe nada**: nenhuma policy nem função do banco o distingue de `agent` (única ocorrência: um CHECK de domínio em `20261122290000_...sql:87`), e 49 rotas não declaram `roles:` | RASTREADO | A-13 |
| 1.7 | agente | — | — | duas abas abertas, logout em uma | a outra aba perde a sessão | não há escuta de `onAuthStateChange` sincronizando abas no caminho de rota | RASTREADO | A-29 |
| 1.8 | autenticado por passkey | 1 passkey | assertion válida | autenticador clonado | contador monotônico detecta clone | `webauthn-authenticate/index.ts:44-48` lê `counter` e **nunca compara nem atualiza** | RASTREADO | A-11 |
| 1.9 | visitante | — | assertion forjada | repetido em volume | rate limit no login por passkey | `webauthn-challenge` tem `checkRateLimitDB`; `webauthn-authenticate` **não tem**, e ele emite magic link | RASTREADO | A-11 |

## J2 — Criar conta e verificar e-mail

| # | Ator | Estado | Entrada | Condição | Esperado | Encontrado | Marca | Achado |
|---|---|---|---|---|---|---|---|---|
| 2.1 | visitante | — | dados válidos | normal | conta criada + perfil + papel inicial | `useAuth.signUp`; `20261123001000_sync_role_creates_missing_profile.sql` cria perfil faltante | RASTREADO | — |
| 2.2 | visitante | e-mail já existe | mesmo e-mail | reenvio | erro claro de duplicidade | tratado pelo Supabase Auth | RASTREADO | — |
| 2.3 | visitante | — | — | clica em "verificar e-mail" | token consumido, conta ativada | a tabela `email_verification_tokens` está **órfã em produção: 0 linhas e nenhum `.from()` no código** (`inventario/estado/banco.json`) — o fluxo versionado não a usa | RASTREADO | A-14 |

## J3 — Recuperar senha (com aprovação de admin)

| # | Ator | Estado | Entrada | Condição | Esperado | Encontrado | Marca | Achado |
|---|---|---|---|---|---|---|---|---|
| 3.1 | visitante | conta existe | e-mail válido | normal | pedido registrado em `password_reset_requests` | `ForgotPassword.tsx:39` → edge `request-password-reset:88-90`; tem rate limit por IP (`:18`) | RASTREADO | — |
| 3.2 | visitante | conta **não** existe | e-mail inexistente | normal | resposta idêntica (não revelar se a conta existe) | a edge consulta antes de inserir (`:70`); **não verifiquei se a resposta é indistinguível** | RASTREADO | HIPÓTESE |
| 3.3 | visitante | — | mesmo e-mail | 50 pedidos em 1 min | limitado | `checkRateLimitDB` é **fail-open**: se o banco oscilar, `return { allowed: true }` (`_shared/rate-limit.ts:35,58`) | RASTREADO | A-26 |
| 3.4 | **agente comum** | pedido pendente | id do pedido | chama a edge direto | 403 | `approve-password-reset:28-40` faz `getUser()` **e** checa papel por `is_admin_user()` na fonte de verdade — correto | RASTREADO | — |
| 3.5 | admin | pedido já aprovado | mesmo id | duplo clique / reenvio | segunda aprovação é no-op | **não verificado** se há guarda de estado antes de reaprovar | RASTREADO | HIPÓTESE |
| 3.6 | visitante | — | — | fluxo inteiro | tabela `password_reset_tokens` usada | **órfã em produção: 0 linhas, nenhum `.from()`** — o fluxo real usa `password_reset_requests` | RASTREADO | A-14 |

## J4 — Ligar para um contato (`/`, `PhoneDialer`)

| # | Ator | Estado | Entrada | Condição | Esperado | Encontrado | Marca | Achado |
|---|---|---|---|---|---|---|---|---|
| 4.1 | agente | tronco ativo | número válido | normal | chamada SIP inicia, `call_sessions` grava | `useSipCall.ts` usa `jssip` de verdade (411 linhas) | RASTREADO | — |
| 4.2 | agente | **nenhum tronco real** | número válido | normal | erro claro "sem tronco configurado" | em produção o único tronco é `"Tronco Principal Teste"` / `sip.exemplo.com`, sem nenhum health check, e houve **0 chamadas em 7 dias** (`inventario/estado/banco.json`) | RASTREADO | A-15 |
| 4.3 | agente | — | número com caracteres especiais / vazio | normal | validação antes de discar | `DialpadTab` monta a string; a validação forte fica nas edges de compliance | RASTREADO | — |
| 4.4 | agente | número na lista DNC | número bloqueado | normal | discagem barrada | existe RPC `check_dnc`; as edges `check-dnc` e `check-calling-hours` **não têm chamador no repositório** (só testes) — o consumo real é via RPC em `score-call-attempt:33-37` | RASTREADO | A-23 |
| 4.5 | agente | fora do horário permitido | número válido | 23h / feriado | discagem barrada | `20261122320000_calling_hours_honor_recurring_holidays.sql` implementa; consumo idem 4.4 | RASTREADO | — |
| 4.6 | agente | — | mesmo número | **duplo clique em "Discar"** | uma só chamada | não há `disabled` durante a mutação no caminho verificado | RASTREADO | A-30 |
| 4.7 | agente | — | — | sem TURN configurado, atrás de NAT | áudio funciona via relay | `src/lib/webrtc-config.ts:11-17`: TURN só existe se 3 variáveis `VITE_TURN_*` estiverem definidas — **e nenhuma está no `.env.example`** | RASTREADO | A-16, A-18 |
| 4.8 | qualquer | — | — | credencial TURN no bundle | credencial efêmera por sessão | `VITE_TURN_CRED` é **variável de build**: a credencial vai no JavaScript público | RASTREADO | A-16 |

## J5 — Trabalhar a chamada ativa

| # | Ator | Estado | Entrada | Condição | Esperado | Encontrado | Marca | Achado |
|---|---|---|---|---|---|---|---|---|
| 5.1 | agente | 1 chamada ativa | — | normal | barra de chamada ativa aparece em qualquer tela | **nunca aparece**: `ActiveCallBar.tsx:63` inicia `call = null` e o único `setCall` do arquivo é `:213 setCall(null)` → `:124 return null`. Montado em todas as páginas (`AppLayout.tsx:85`) | RASTREADO | A-08 |
| 5.2 | agente | chamada ativa | — | normal | transcrição ao vivo, próxima melhor ação, sugestões de CRM | implementados e **inalcançáveis** pelo mesmo fio de 5.1 | RASTREADO | A-08 |
| 5.3 | agente | chamada ativa | — | clica "Transferir" no softphone | abre seleção de destino | **botão sem `onClick`** (`ActiveCallDisplay.tsx:234`), único dos 7 controles sem handler; `transferCall`/`completeTransfer` existem em `useMultiChannelCall.ts:241` | RASTREADO | A-09 |
| 5.4 | agente | chamada ativa | — | clica "Mudo"/"Espera"/"Gravar"/"Encerrar" | funcionam | têm handler (`:173`, `:187`, `:211`, `:240`) | RASTREADO | — |
| 5.5 | agente | chamada ativa | — | provedor de IA lento | resumo volta ou falha com aviso | 90 das 94 edges chamam `fetch` sem timeout; só `bitrix-api` e `voip-trunks-healthcheck` usam `AbortSignal` | RASTREADO | A-25 |

## J6 — Colocar em espera e transferir

| # | Ator | Estado | Entrada | Condição | Esperado | Encontrado | Marca | Achado |
|---|---|---|---|---|---|---|---|---|
| 6.1 | agente | chamada ativa | — | coloca em espera | linha em `hold_events` com `call_session_id` preenchido | grava `call_session_id: callSessionId \|\| null` (`useMultiChannelCall.ts:143`) e **`setCallDbSession`, que preencheria o campo, não tem nenhum chamador de produção** | RASTREADO | A-10 |
| 6.2 | agente | em espera | — | retoma a chamada | `ended_at` preenchido | o fechamento filtra por `.eq('call_session_id', callSessionId ?? '')` (`:145`) — **nunca casa com `null`** | RASTREADO | A-10 |
| 6.3 | supervisor | muitas esperas antigas | — | abre `/hold-metrics` | tempo médio real | a métrica zera por agente (`useHoldMetrics.ts`) e o contador de "em espera" cresce para sempre | RASTREADO | A-10 |
| 6.4 | sistema | espera sem `ended_at` | — | cron de alerta | alerta cessa quando a espera termina | `check-hold-alerts/index.ts:52` filtra `.is('ended_at', null)` → alerta permanente | RASTREADO | A-10 |
| 6.5 | supervisor | — | — | abre o gráfico de espera do dashboard | gráfico correto, com estado vazio | `HoldTrendChart.tsx:26-37` não trata `error`, nem `isLoading`, nem vazio, e calcula `inCall = activeCalls - activeHolds` (pode ir a negativo) | RASTREADO | A-10, A-27 |

## J7 — Histórico e gravações

| # | Ator | Estado | Entrada | Condição | Esperado | Encontrado | Marca | Achado |
|---|---|---|---|---|---|---|---|---|
| 7.1 | agente | muitas chamadas | — | abre `/history` | lista paginada | **66 dos 99 hooks que leem o banco não têm `.limit()` nem `.range()`** | EXECUTADO (contagem própria) | A-28 |
| 7.2 | agente | 0 chamadas | — | abre `/history` | estado vazio honesto | em produção há 0 chamadas em 7 d; não verifiquei a tela em navegador | RASTREADO | HIPÓTESE |
| 7.3 | agente | — | — | clica "Exportar" | arquivo baixa | **botão sem handler** (`CallHistory.tsx:62`); `exportTranscript` existe no hook e só está ligado ao painel de detalhe (`:198`) | RASTREADO | A-09 |
| 7.4 | agente de **outra conta** | chamadas de terceiro | id alheio | consulta direta | RLS nega | 448 policies e 0 tabelas sem RLS em produção; **a eficácia por papel é NÃO VERIFICADA** (sem acesso ao banco) e os 7 testes de `src/__tests__/rls/` **não tocam banco** | RASTREADO | A-22 |
| 7.5 | qualquer | gravação com > 180 d | — | cron de retenção | apagada do bucket e da tabela | `cleanup-recordings` + cron diário, validado em produção em 22/11 (`docs/audits/pendencias-2026-07.md`, C2) | RASTREADO | — |
| 7.6 | qualquer | transcrição de qualquer chamada | termo de busca | chama a edge `search-calls` | só vê o que a RLS permite | `search-calls/index.ts:29-33` cria o cliente com `SUPABASE_SERVICE_ROLE_KEY` e `Authorization: authHeader \|\| ''`, **sem nenhum `getUser()` nem 401** nas 122 linhas | RASTREADO | A-03 |

## J8 — Operar fila (supervisor)

| # | Ator | Estado | Entrada | Condição | Esperado | Encontrado | Marca | Achado |
|---|---|---|---|---|---|---|---|---|
| 8.1 | supervisor | fila com chamadas | — | abre `/queue-dashboard` | números reais | corrigido em 22/11 (contagem "em espera" usava status inexistente, PR #129) | RASTREADO | — |
| 8.2 | supervisor | fila vazia | — | abre o painel | estado vazio | `QueueTrendChart` hoje usa `useQueueMetrics` real com estado vazio | RASTREADO | — |
| 8.3 | **agente** | — | — | clica em "Filas" no menu | o item não deveria aparecer | aparece: o menu renderiza os grupos inteiros sem checar papel (`AppSidebar.tsx:320-321`); **49 dos 93 links levam a `/unauthorized`** | RASTREADO | A-12 |
| 8.4 | dois supervisores | mesma fila | configurações diferentes | simultâneos | o segundo recebe conflito | há locking otimista no repo (`optimistic_lock_conflicts`); não verifiquei que esta tela o usa | RASTREADO | HIPÓTESE |

## J9 — Discador preditivo

| # | Ator | Estado | Entrada | Condição | Esperado | Encontrado | Marca | Achado |
|---|---|---|---|---|---|---|---|---|
| 9.1 | supervisor | campanha ativa | — | cron de pacing a cada minuto | discagens disparadas no ritmo | cron `dialer-pacing-tick` com token dedicado comparado em tempo constante (`:54`) | RASTREADO | — |
| 9.2 | supervisor | — | — | clica "Priorizar" num contato | contato sobe na fila | **item de menu sem handler** (`PredictiveDialerPanel.tsx:80`) | RASTREADO | A-09 |
| 9.3 | qualquer | — | — | cron com token errado | 401 | comparação em tempo constante via `_shared/constant-time.ts` | RASTREADO | — |

## J10 — Avaliar agente (scorecard e coaching)

| # | Ator | Estado | Entrada | Condição | Esperado | Encontrado | Marca | Achado |
|---|---|---|---|---|---|---|---|---|
| 10.1 | sistema | resumo de chamada gravado | — | trigger do banco | scorecard gerado por IA | trigger chama a edge com a **chave `anon` embutida no SQL** (`20261114090557_...sql:16`) | RASTREADO | A-04 |
| 10.2 | **qualquer um na internet** | um `call_session_id` | payload mínimo | chama `auto-scorecard` direto | 401 | **nenhuma autenticação** na função; ela usa `service_role`, grava `call_scorecards`/`scorecard_responses` e **gasta crédito de IA** (`auto-scorecard/index.ts:20-31,128-151`) | RASTREADO | A-04 |
| 10.3 | sistema | mesma sessão | mesmo id | reenvio | idempotente | há guarda de idempotência (`:34-40`) — impede o segundo scorecard da mesma sessão | RASTREADO | — |
| 10.4 | supervisor | < 3 amostras | — | coaching automático | explica o mínimo | a edge devolve `skipped`; **a UI não informa o mínimo de 3 amostras ao supervisor** | RASTREADO | A-33 |
| 10.5 | sistema | 3+ amostras com score baixo | — | cron diário 03:15 | trilhas criadas | validado ponta a ponta em produção em 22/11 (`tracks_created: 2`) | RASTREADO | — |

## J11 — Painel executivo e relatórios

| # | Ator | Estado | Entrada | Condição | Esperado | Encontrado | Marca | Achado |
|---|---|---|---|---|---|---|---|---|
| 11.1 | supervisor | dados reais | — | abre `/dashboard` | só números medidos | **`PerformanceNarrative.tsx:27-45`** exibe "crescimento de 12%", "meta 94%", "Health Score 9.8" sob o selo "Análise IA de Performance" — **zero imports de dados**, logo acima dos KPIs reais | EXECUTADO (varredura de imports) | A-05 |
| 11.2 | admin | — | — | abre `/observability` | integridade medida | **`SystemIntegrityDashboard.tsx:6-11`**: `{ component: 'SIP Gateway', status: 'Online', latency: '45ms' }` e `{ 'RLS Policies', 'Seguro', '10/10' }` — array literal, título "(10/10)" | EXECUTADO | A-05 |
| 11.3 | admin | — | — | abre o card de auditoria | última validação real | **`SecurityAuditCard.tsx:44`** usa `new Date().toLocaleTimeString()` como "última validação automática" | RASTREADO | A-05 |
| 11.4 | admin | — | — | abre `/security-report` | contagem real de tabelas com RLS | **`src/lib/security-report-data.ts:20`**: texto fixo "22 tabelas com RLS habilitado"; em produção são **163 tabelas, 0 sem RLS** | EXECUTADO | A-06 |
| 11.5 | admin | — | — | exporta o `.txt` de auditoria | documento com dados medidos | o arquivo embute "< 50ms (Meta 10/10)" e "Gargalos: Nenhum", e sai com nome `auditoria-voip-10-10-<data>.txt` | RASTREADO | A-06 |
| 11.6 | supervisor | — | — | clica "Exportar" em `/reports` | arquivo baixa | **botão sem handler e nenhuma função de export no arquivo** (`Reports.tsx:93`) | RASTREADO | A-09 |
| 11.7 | gestor | anomalia de voz detectada | — | remediação automática | ação aplicada no tronco | **`voip-anomaly-remediation/index.ts:206-236`** grava `outcome: 'auto_applied'` e responde `applied: true` **sem nenhum `fetch` nem chamada ao tronco**; esses registros alimentam o KPI de efetividade | RASTREADO | A-07 |
| 11.8 | gestor | — | — | clica "Aplicar" numa recomendação de capacidade | recomendação registrada | **`QualityForecastCard.tsx:48-54`** só faz `log.info` + `toast.success('Recomendação registrada')` — nada é gravado | RASTREADO | A-07 |

## J12 — Administrar papéis e permissões

| # | Ator | Estado | Entrada | Condição | Esperado | Encontrado | Marca | Achado |
|---|---|---|---|---|---|---|---|---|
| 12.1 | admin | — | papel válido | normal | papel gravado e refletido | `user_roles` é a fonte de verdade; `20261122260000_...sql` alinhou `is_admin_user`/`get_role` | RASTREADO | — |
| 12.2 | admin | papel expirado | — | usuário tenta acessar | acesso negado | `20261122250000_role_checks_honor_active_and_expiry.sql` e `20261122280000_...` honram `is_active`/`expires_at` | RASTREADO | — |
| 12.3 | **agente** | — | próprio id | tenta se promover | negado | `user_roles` separada + policies; **eficácia NÃO VERIFICADA** (sem banco) | RASTREADO | A-22 |
| 12.4 | agente autenticado | — | `user_id` de outra pessoa | chama `send-notification` | 403 | `send-notification/index.ts:37-43,96-99` só confirma que **existe sessão** — não compara `user.id` com `payload.user_id` nem checa papel | RASTREADO | A-17 |
| 12.5 | admin | usuário com histórico | — | exclui a conta (LGPD) | exclusão conclui | 7 FKs trocadas para `ON DELETE SET NULL` em `20261123010000`; provado 500 → 200 (PR #146) | RASTREADO | — |

## J13 — Administrar troncos e ramais

| # | Ator | Estado | Entrada | Condição | Esperado | Encontrado | Marca | Achado |
|---|---|---|---|---|---|---|---|---|
| 13.1 | admin | — | senha SIP | salva tronco | senha guardada cifrada | **XOR de chave repetida usando `SUPABASE_SERVICE_ROLE_KEY` como chave** (`sip-config/index.ts:5-13`, `voip-trunks-manage/index.ts:7-22`, `ldap-sync/index.ts:48-60`) — não é cifra | RASTREADO | A-02 |
| 13.2 | admin | tronco salvo | — | service_role é rotacionada | senhas continuam legíveis | **todas ficam ilegíveis** — a chave de decifra é a credencial rotacionada | RASTREADO | A-02 |
| 13.3 | qualquer | dump da tabela | — | — | senha ininteligível | o prefixo do JWT é texto conhecido, então os primeiros bytes da chave saem de qualquer ciphertext | RASTREADO | A-02 |
| 13.4 | admin | ambiente sem a env | — | salva tronco | falha explícita | cifra com a constante literal `"fallback-key"` (`sip-config:5`) | RASTREADO | A-02 |
| 13.5 | sistema | tronco cai | — | notificação de failover | aviso chega ao agente | `voip-failover-notifier:16-21` compara `authHeader !== expected` (**não** em tempo constante) usando a própria service_role como senha; o emissor dispara `fetch` sem `await` | RASTREADO | A-02 |
| 13.6 | admin | — | — | abre `/admin/voip-trunks` | health check do tronco | em produção o único tronco está **sem nenhum health check** (`telefonia_tronco_sem_health_check`) | RASTREADO | A-15 |

## J14 — Segurança e auditoria (admin)

| # | Ator | Estado | Entrada | Condição | Esperado | Encontrado | Marca | Achado |
|---|---|---|---|---|---|---|---|---|
| 14.1 | admin | — | — | abre `/audit-logs` | eventos reais | lê `audit_logs` (334 linhas em produção) | RASTREADO | — |
| 14.2 | **qualquer um na internet** | — | e-mail + texto livres | chama `notify-new-device` | 401 | **sem autenticação, sem rate limit, sem validação**; `data.email` vira destinatário e `data.ip`/`deviceInfo` são interpolados no HTML (`notify-new-device/index.ts:23-31,59-78`), com o remetente verificado da empresa. Mesmo caso em `notify-blocked-ip:18-26,65-69` | RASTREADO | A-04 |
| 14.3 | qualquer | — | id de conversa | chama `chatbot-respond` | 401 | **sem autenticação**; lê o histórico e **insere mensagem como se fosse o bot** (`:70-75,166-175`); o `visitor_token` da interface **nunca é verificado** | RASTREADO | A-04 |
| 14.4 | qualquer | artigo da base | texto arbitrário | chama `embed-kb-article` | 401 | **sem autenticação, sem limite de tamanho**; sobrescreve `kb_articles.embedding` de qualquer artigo (`:19-23,52-57`) | RASTREADO | A-04 |
| 14.5 | admin | — | — | confia no selo "10/10" | selo refletindo medição | o selo é literal — ver 11.2 e 11.4 | RASTREADO | A-05, A-06 |
| 14.6 | agente | — | — | a camada de segurança do front protege | CSP/HSTS/rate-limit ativos | os 17 módulos de `src/lib/security/` **não têm nenhum importador de produção**; `vercel.json` tem só um rewrite, **zero cabeçalho de segurança** | EXECUTADO (grep) | A-31 |

## J15 — Exportar dados (Data Lake / LGPD)

| # | Ator | Estado | Entrada | Condição | Esperado | Encontrado | Marca | Achado |
|---|---|---|---|---|---|---|---|---|
| 15.1 | admin | dados novos | dataset válido | normal | NDJSON no bucket | validado ponta a ponta em 22/11: 50 linhas, objeto de 18.100 bytes | RASTREADO | — |
| 15.2 | admin | nenhum dado novo | — | reenvio | `rows: 0` legítimo | janela incremental documentada | RASTREADO | — |
| 15.3 | qualquer | — | — | chama `data-lake-flush` sem token | 401 | endurecido em 22/11: token dedicado do Vault em tempo constante (`:26`) | RASTREADO | — |
| 15.4 | sistema | — | — | cron diário 03:00 | exporta | **o snapshot de 2026-11-20 registra 100% de falha em 7 dias** (6/6, `schema "net" does not exist`); as pendências afirmam que `pg_net` foi instalado em 21/11 e o run passou — **NÃO VERIFICADO por mim** | RASTREADO | A-32 |

## J16 — Conformidade de discagem

| # | Ator | Estado | Entrada | Condição | Esperado | Encontrado | Marca | Achado |
|---|---|---|---|---|---|---|---|---|
| 16.1 | supervisor | lista DNC | número na lista | tenta discar | barrado | regra existe no banco (RPC) | RASTREADO | — |
| 16.2 | supervisor | — | — | exclui número da DNC | linha removida | `DNCTable.tsx:73` é botão-ícone de exclusão **sem rótulo acessível** | RASTREADO | A-34 |
| 16.3 | supervisor | feriado recorrente | — | discagem no feriado | barrada | `20261122320000_...sql` implementa | RASTREADO | — |

## J17 — Página pública de status (`/status`)

| # | Ator | Estado | Entrada | Condição | Esperado | Encontrado | Marca | Achado |
|---|---|---|---|---|---|---|---|---|
| 17.1 | visitante | **0 amostras** | — | abre `/status` | "sem medição" | **"Todos os sistemas operacionais" e 100% de uptime**: `computeUptime` faz `if (!total) return 100` (`Status.tsx:50`) e `overallOk = uptime >= 99` (`:131`). Em produção `webhook_flush_metrics` tem 0 linhas e `voip_trunk_health_checks` tem 1 | EXECUTADO (leitura + snapshot) | A-05 |
| 17.2 | visitante | RLS nega a leitura | — | abre `/status` | erro honesto | `data: null` → 0 amostras → **100%** (mesmo caminho) | RASTREADO | A-05 |
| 17.3 | visitante | — | — | a consulta falha | mensagem de erro | `load()` (`:66-127`) **não tem `try/catch`** e `setLoading(false)` só roda no caminho de sucesso → spinner eterno | RASTREADO | A-27 |
| 17.4 | visitante | 90 dias de amostras | — | abre `/status` | carga razoável | duas consultas com `.limit(20000)` cada, **em rota anônima** (`:80,:85`) | RASTREADO | A-28 |

## J18 — Recebimento de WhatsApp e e-mail (webhooks)

| # | Ator | Estado | Entrada | Condição | Esperado | Encontrado | Marca | Achado |
|---|---|---|---|---|---|---|---|---|
| 18.1 | provedor | mensagem nova | payload válido | normal | conversa e mensagem criadas | `whatsapp-inbound` com `service_role` e dedup própria (`idempotency.ts`) | RASTREADO | — |
| 18.2 | **terceiro qualquer** | — | payload forjado | chama o webhook | assinatura inválida → 401 | **nenhuma verificação de assinatura nem de autenticação** em `whatsapp-inbound` (179 linhas) e `email-inbound` (170 linhas) | EXECUTADO (grep por `hmac\|signature\|getUser\|401`: 0 ocorrências) | A-04 |
| 18.3 | provedor | mensagem já entregue | mesmo id | reenvio | idempotente | **WhatsApp:** dedup existe, mas é leitura-e-depois-escrita **sem índice único** → duas reentregas simultâneas duplicam. **E-mail:** sem dedup; a conversa é criada **antes** do ticket, o ticket colide com o `UNIQUE` de `message_id` (`20260417001411_...sql:99`), a função faz `throw` → 500 → o provedor reenvia em laço, deixando conversas duplicadas | RASTREADO | A-04 |
| 18.4 | terceiro | — | telefone com vírgula / `id.gt.0` | normal | filtro literal | `fromPhone` é concatenado na gramática do `.or()` do PostgREST (`whatsapp-inbound/index.ts:78-82`) e validado apenas como `z.string().min(1)` | RASTREADO | A-35 |
| 18.5 | provedor | — | corpo de e-mail enorme | normal | rejeitado por tamanho | `body_text`/`subject` **sem limite**; 37 das 94 edges usam `await req.json()` sem nenhuma validação | RASTREADO | A-25 |

---

## Resumo de cobertura da matriz

| | Quantidade |
|---|---:|
| Cenários na matriz | **105** (10 transversais + 95 de jornada) |
| **EXECUTADOS** (comando/teste/consulta rodados e observados) | **17** |
| **RASTREADOS** (seguidos pelo código) | **88** |
| Divergentes do esperado → viraram achado | 54 |
| Marcados como HIPÓTESE dentro da matriz (falta verificar) | 4 |

Contagem conferida mecanicamente: linhas de cenário com marca em `02-CENARIOS.md` → 105 / 17 / 88.

**Dimensões que não pude cruzar de verdade:** "usuário de outra conta" e "dois usuários ao mesmo tempo" dependem de executar contra o banco com duas sessões reais — impossível nesta sessão. Todo cenário dessas duas linhas está marcado como RASTREADO e os vereditos sobre RLS efetiva seguem **NÃO VERIFICADOS**.
