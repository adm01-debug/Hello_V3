# 03 — Achados, agrupados por causa raiz

> **Commit:** `b712310` · **Data:** 2026-11-22/23 · **Regra:** cada achado cita `arquivo:linha` + trecho, ou a saída do comando que rodei. Sem evidência, entra como **HIPÓTESE**. Um problema com N ocorrências é **um** achado com N locais.
>
> **Baseline:** `ESTADO_ATUAL.md` é de 2026-08-16. Todo achado dele foi reverificado; o que já foi corrigido está listado em §0 e **não** conta como achado.

## Legenda

- **Severidade** — Crítica: perda ou vazamento de dado, falha de segurança, fluxo principal quebrado · Alta: função importante falha ou dá resultado errado · Média: funciona com defeito ou fragilidade · Baixa: acabamento e higiene.
- **Confiança** — CONFIRMADO (li o código e é inequívoco) · HIPÓTESE (falta o que está dito).
- **Marca** — EXECUTADO (rodei e vi) · RASTREADO (segui pelo código).

---

## 0. O que já foi corrigido desde a auditoria de agosto (não entra como achado)

Medido por mim no commit atual. Registro porque três destes continuam escritos como pendência em `AGENTS.md` / `ESTADO_ATUAL.md`:

| Antes | Agora |
|---|---|
| Chave `service_role` de produção em 7 scripts | **Nenhum segredo real versionado.** `git grep -E 'eyJ[A-Za-z0-9_-]{10,}\.eyJ'` → 4 arquivos, dois são fixture de teste, um é cenário de detector, e os 2 JWT reais são chave `anon` (pública por design) em migrations. Os scripts hoje exigem `process.env` e lançam erro sem ela |
| CI vermelho em 30/30 execuções | **CI verde.** Run `45063328728` em `b712310` = `success` |
| `.env` versionado | fora do Git, em `.gitignore:16` |
| 466 arquivos de `coverage/` + `covout/` versionados | **0** (`git ls-files` → 1.697 arquivos no total) |
| 2 erros + 284 warnings de lint | **0 erros, 5 warnings** (todos `no-console` num script de CI) |
| 4 testes falhando em `useSessionManager.coverage.test.tsx` | passam |
| Playwright não executa (porta 5173 ≠ 8080) | **executa no CI** — `playwright.config.ts:21-25` sobe o próprio `vite preview --port 5173`; 7 testes passam |
| `supabase/config.toml` com uma linha | declara 5 `verify_jwt = false`, todos com token dedicado comparado em tempo constante |
| Guard `codemod-safe-number` derrubando o pipeline | passa; os 3 guards passam |
| `createTestData` exposto em `/ranking` sem guarda | gated por `import.meta.env.DEV` no hook (`useAgentRanking.ts:266`) **e** no botão (`AgentRanking.tsx:47`) |
| `QueueTrendChart` com `Math.random()` | usa `useQueueMetrics` real, com estado vazio |
| `Status.tsx` com texto fixo | lê `voip_trunk_health_checks` e `webhook_flush_metrics` reais (mas ver **A-011**) |

---

# CR-1 — A chamada nunca chega ao banco

**Esta é a causa raiz do sistema.** Um único fio solto desliga a espinha dorsal do produto, e os indicadores da §CR-2 impedem que isso apareça.

### A-001 — `ActiveCallBar` nunca renderiza, e com ele morre toda a gravação de chamada
**Severidade: Crítica · Confiança: CONFIRMADO · Marca: RASTREADO**

**Evidência.** `src/components/calls/ActiveCallBar.tsx:63` inicializa o estado e `:213` é a **única** atribuição do setter em todo o arquivo:
```ts
const [call, setCall] = useState<ActiveCall | null>(null);   // :63
setCall(null);                                               // :213 — único setCall
```
Logo `:124 return null` é sempre verdadeiro. O componente está montado em **todas** as páginas (`src/components/layout/AppLayout.tsx:85`).

**Cadeia de consequências, verificada ponta a ponta.** `useCallSession.startSession` é o único código do repositório que faz `INSERT` em `call_sessions` (`src/hooks/useCallSession.ts:47-48`), e tem **um único chamador**: `ActiveCallBar.tsx:81`. Portanto:
- `grep "from('call_sessions')" src/ supabase/functions/ | grep -E "insert|update"` devolve **uma linha**: `src/hooks/useAgentRanking.ts:278`, que está atrás de `import.meta.env.DEV`;
- a tela de discagem real, `/calls`, usa `UnifiedSoftphone.tsx:101 initiateCall('sip', phoneNumber)` → `useMultiChannelCall.ts:86-99`, que **só faz `setActiveCalls`** em memória. Nada é persistido;
- `agentName` em `:81` é o literal `'Agente Demo'`.

**Confirmação independente no runtime:** o snapshot do banco de produção de 2026-11-20 (`inventario/estado/banco.json`) registra `chamadas_7d: 0` e `gravacoes_7d: 0`.

**Causa raiz.** A chamada ativa vive em `useMultiChannelCall` / `useSipCall`, e `ActiveCallBar` guarda a própria cópia em `useState` local que nenhum produtor preenche. O componente foi escrito para um fluxo de demonstração e nunca ligado ao hook de verdade.

**Impacto no negócio.** Nenhuma ligação que o time faz é registrada. Histórico, relatórios, ranking de agentes, scorecards, painel executivo e métricas de fila ficam permanentemente em zero — e, por causa da CR-2, exibem isso como "tudo saudável". Junto com isso, ficam inalcançáveis a transcrição ao vivo, o painel de próxima melhor ação e as sugestões de CRM, que **estão implementados**.

### A-002 — `hold_time_seconds` não tem nenhum escritor: espera média sempre 0 e nível de serviço sempre ~100%
**Severidade: Crítica · Confiança: CONFIRMADO · Marca: EXECUTADO (grep)**

A coluna existe (`supabase/migrations/20251223211907_….sql:3`) e é **só lida**:
```ts
src/hooks/useQueueMetrics.ts:118   const answeredQuickly = completedCalls.filter(c => (c.hold_time_seconds || 0) < 20).length;
src/hooks/useSupervisorPanel.ts:123 const totalHoldTime = completed.reduce((s, c) => s + (c.hold_time_seconds || 0), 0);
```
`grep` por escrita em `src/`, `supabase/functions/` e nas 241 migrations → **nenhum writer**. O dado real de espera vive em `hold_events`, sem nenhuma agregação para `call_sessions`.

**Impacto.** O painel do supervisor afirma que ninguém esperou e que 100% das chamadas foram atendidas na hora.

### A-003 — `setCallDbSession` não tem chamador: toda espera e toda métrica de qualidade gravam com `call_session_id` nulo
**Severidade: Alta · Confiança: CONFIRMADO · Marca: RASTREADO**

`src/hooks/useMultiChannelCall.ts:169` define a função que preencheria o id; `:241` a exporta. `grep` em `src/` → só a definição, o export e **um teste** (`useMultiChannelCall.coverage.test.tsx:110`).

Consequências em cadeia:
- `:143` grava `hold_events` com `call_session_id: callSessionId || null`;
- `:145` fecha o evento com `.eq('call_session_id', callSessionId ?? '')` — **nunca casa com `null`**, então `ended_at` nunca é preenchido;
- `useHoldMetrics.ts:60` zera a métrica por agente; `supabase/functions/check-hold-alerts/index.ts:52` filtra `.is('ended_at', null)` e gera alerta que **nunca cessa**;
- `useVoipQualityMonitor.ts:165` grava `call_quality_metrics` com o mesmo campo nulo;
- `HoldAlertsTable.tsx:96` exibe `-`.

### A-004 — Uso de tronco gravado com id sintético por closure obsoleta
**Severidade: Alta · Confiança: CONFIRMADO · Marca: RASTREADO**

`src/hooks/useSipCall.ts:278` cria `callId: \`sip-${Date.now()}\`` — não é um UUID de `call_sessions`, e o destino é `p_call_session_id UUID` (`supabase/migrations/20260418144103_….sql:46`). Pior: `startCall` é memoizado em `:301` **sem `state.callId` nas deps** (com `exhaustive-deps` suprimido em `:300`), então o handler de `:284`/`:287` captura o estado anterior, quando `callId` é `null`. O erro é silenciado em `useTrunkUsageReporter.ts:52-54` (`log.warn`).

**Impacto.** O rateio de custo por tronco não pode ser cruzado com nenhuma chamada.

---

# CR-2 — Indicadores que tratam "sem dado" como "tudo bem"

Esta causa raiz é o que impede a CR-1 de ser percebida. `AGENTS.md` proíbe painel decorativo; estes são os que restaram.

### A-005 — Três painéis de saúde sem nenhuma fonte de dados
**Severidade: Alta · Confiança: CONFIRMADO · Marca: EXECUTADO (varredura de imports: zero `use*()`/`supabase` nos três)**

| Arquivo | Onde aparece | O que afirma |
|---|---|---|
| `src/components/dashboard/PerformanceNarrative.tsx:27-45` | `/dashboard` (`src/pages/Index.tsx:116`), **logo acima dos KPIs reais** | "crescimento de 12%", "acima da meta (94%)", "Eficiência +5.2%", "Health Score 9.8", sob o selo "Análise IA de Performance" e badge "Atualizado agora" |
| `src/components/dashboard/SystemIntegrityDashboard.tsx:6-11` | `/observability` (`ObservabilityDashboard.tsx:104`) | `{ component: 'SIP Gateway', status: 'Online', latency: '45ms' }`, `{ 'RLS Policies', 'Seguro', '10/10' }`; título "Integridade da Infraestrutura (10/10)" |
| `src/components/executive/SecurityAuditCard.tsx:6-11,:44` | `RealtimeQualityDashboard.tsx:124` → `/observability` | "Auditoria de Segurança (10/10)" e "Última validação automática: `new Date().toLocaleTimeString()`" — a hora do render passando por hora de validação |

### A-006 — Score de saúde VoIP devolve 83/100 "SAUDÁVEL" com zero medição
**Severidade: Alta · Confiança: CONFIRMADO · Marca: RASTREADO**

`supabase/functions/voip-executive-summary/index.ts`:
```ts
:53  0.4*sla + 0.3*mos + 0.2*alerts + 0.1*capacity
:58  if (mosAvg === null) return 75;     // "neutro" quando sem dados
:65  if (totalCalls === 0) return 100;
:183 sla_score: currentSla ?? 75,
```
Com base zerada: 0,4·75 + 0,3·75 + 0,2·100 + 0,1·100 = **82,5 → 83**, exibido em verde com rótulo `SAUDÁVEL` (`src/components/network/VoipHealthScoreCard.tsx:26-29`). Dado que a CR-1 garante base zerada, **é exatamente este o número que o dono vê hoje**.

### A-007 — Página pública `/status` anuncia "Todos os sistemas operacionais" e 100% com as consultas falhando
**Severidade: Alta · Confiança: CONFIRMADO · Marca: EXECUTADO — *verificado em navegador em 2026-11-23***

> **Esta é a única afirmação da auditoria provada com a tela aberta.** Servi o build de produção (`vite preview`) com credenciais inválidas, de modo que **as duas consultas ao banco falharam** (`ERR_TUNNEL_CONNECTION_FAILED` em `voip_trunk_health_checks` e `webhook_flush_metrics`, capturado no log de rede). A página renderizou:
> - selo verde **"Todos os sistemas operacionais"**;
> - **Trunks VoIP — 100.00%**, "sem incidentes";
> - **Webhooks & Integrações — 100.00%**, "sem incidentes";
> - e, ao pé: **"SLA contratual: 99,9% mensal. Métricas alimentadas diretamente pelos health checks internos — sem edição manual."**
>
> Essa última frase é uma afirmação **contratual** de que os números vêm de medição real — exibida exatamente quando não houve medição nenhuma. É o que separa este achado de um painel decorativo interno: está numa página pública, voltada a cliente, e afirma a própria procedência.
>
> **Correção à primeira redação deste achado:** eu havia escrito que o erro deixaria a página "em spinner eterno". **Está errado e a execução mostrou.** O cliente do Supabase não lança: as duas consultas voltam com `error` preenchido e `data: null`, o código segue pelo caminho normal e `setLoading(false)` (`:124`) **roda**. O spinner eterno exigiria uma exceção de verdade, não um erro de consulta — passa a ser HIPÓTESE. O que é fato, e pior, é que a falha total vira 100%.
>
> O horário exibido ("atualizado 01:20") é o `lastUpdate` do render, não a hora do dado — o mesmo padrão da A-005.

**Severidade original mantida (Alta) · Confiança: CONFIRMADO · Marca: EXECUTADO**

```ts
src/pages/Status.tsx:50   if (!total) return 100;                      // computeUptime
src/pages/Status.tsx:131  const overallOk = services.every(s => s.uptime >= 99);  // → "Todos os sistemas operacionais"
```
Em produção, `webhook_flush_metrics` tem **0 linhas** e `voip_trunk_health_checks` tem **1** (snapshot 2026-11-20). `load()` (`:66-127`) **não tem `try/catch`**: `trunkRes.error` é ignorado e `setLoading(false)` (`:124`) só roda no caminho de sucesso — uma recusa de RLS devolve `data: null`, que cai no mesmo `!total → 100`. É rota **pública** (`publicRoutes.tsx:24`), lida por clientes e prospects.

O mesmo padrão no backend: `supabase/functions/health-check/index.ts:35` (`trunkTotal ? … : 100`), `:57` (`>= 99 ? 'operational'`) e `:68` (`database: { status: 'operational' }` — fixo, nunca verificado).

### A-008 — `voip-anomaly-remediation` responde `applied: true` e grava `auto_applied` sem executar ação nenhuma
**Severidade: Alta · Confiança: CONFIRMADO · Marca: RASTREADO**

`supabase/functions/voip-anomaly-remediation/index.ts:206-236` insere em `voip_recommendation_actions` com `outcome: 'auto_applied'` e responde `applied: true`. **No arquivo inteiro não há `fetch` nem chamada a `voip-trunks-manage`/`voip_trunks`** — o único efeito é o INSERT. Esses registros alimentam "efetividade" em `voip-recommendation-insights/index.ts:64,104` e "ações aplicadas" em `voip-diagnostic-voice-qa/index.ts:111,171`.

Mesmo padrão, menor: `src/components/network/QualityForecastCard.tsx:48-54` — "Aplicar" só faz `log.info` + `toast.success('Recomendação registrada')`, sem gravar nada (o irmão `VoipRecommendationsPanel.tsx:120-126` chama `executeAction`/`recordAction`).

### A-009 — 32 hooks descartam o `error` da consulta: o painel mostra zero em vez de falhar
**Severidade: Alta · Confiança: CONFIRMADO · Marca: EXECUTADO (grep agregado)**

Padrão (`src/hooks/useQueueMetrics.ts:93-96`):
```ts
const { data: activeCalls } = await supabase.from('call_sessions').select('status').in('status', [...]);
```
Em falha de rede ou recusa de RLS o retorno é `data: null`, e o cálculo segue com `|| 0`. **32 locais**; os que viram número em tela: `useSecurityMonitoringData.ts:49,64`, `useSecurityDashboard.ts:51,54`, `useIPWhitelist.ts:48,51,54,61`, `useAgentRanking.ts:165,166`, `useScorecards.ts:61`, `useSuccessPlans.ts:50`.

**Impacto.** É o mesmo risco por outro mecanismo: o painel **não consegue** ficar vermelho — "0 chamadas ativas, 0 agentes, 0 eventos de segurança" parece dia calmo e é consulta falhando.

### A-010 — Relatório de conformidade com contagem fixa e errada por ordem de grandeza
**Severidade: Média · Confiança: CONFIRMADO · Marca: EXECUTADO**

`src/lib/security-report-data.ts:20`: `details: ['22 tabelas com RLS habilitado', …]`. Em produção são **163 tabelas e 0 sem RLS** (snapshot). A página `/security-report` mistura essa fonte estática com uma real (`rpc('check_all_tables_rls_status')`, `:52`) sem distinguir as duas; o KPI "Features de Segurança" (`:128`) conta um array onde 6 de 7 entradas já vêm marcadas `'implemented'`; e o `.txt` exportado (`:89-92`) embute "Resposta de Inserção: < 50ms (Meta 10/10)" e "Gargalos Identificados: Nenhum", com nome de arquivo `auditoria-voip-10-10-<data>.txt`.

### A-011 — Meta de SLO divergente entre a tela (99,9%) e o cálculo (99%)
**Severidade: Média · Confiança: CONFIRMADO · Marca: RASTREADO**

`src/pages/admin/SloDashboard.tsx:35` declara `trunk_uptime: 99.9` e `:94` exibe essa meta; `supabase/functions/health-check/index.ts:47` usa `targetPct: 99` e `:57` decide `operational` com `>= 99`. Com 99,4% a tela diz "meta 99,9%" e, ao lado, "Operacional / budget saudável".

---

# CR-3 — Endpoints de backend que agem sem verificar quem chamou

Todos usam `SUPABASE_SERVICE_ROLE_KEY` (que ignora RLS) e nenhum confere o chamador. A exposição efetiva de cada um depende do `verify_jwt` da plataforma, que **não está versionado** (ver A-040) — por isso a severidade é a do código, e a explorabilidade anônima fica como HIPÓTESE em cada item.

### A-012 — `search-calls`: busca em todas as transcrições, sem autenticação, com fallback para service_role
**Severidade: Crítica · Confiança: CONFIRMADO (ausência de auth) / HIPÓTESE (exploração anônima) · Marca: RASTREADO**

```ts
supabase/functions/search-calls/index.ts:29-33
const authHeader = req.headers.get('Authorization');
const supabase = createClient(supabaseUrl, serviceKey, {
  global: { headers: { Authorization: authHeader || '' } },
});
```
Nas 122 linhas **não existe** `auth.getUser()`, `getClaims()` nem retorno 401. Lê `call_transcripts_searchable` (texto integral das chamadas) e `call_key_moments`. Com `Authorization` vazio, o papel volta a ser resolvido pelo `apikey` = service_role. Desvia do padrão do próprio repositório (`verify-voice/index.ts:24-27` faz `getUser()` e devolve 401).

### A-013 — `auto-scorecard`: público, grava avaliação oficial e gasta crédito de IA
**Severidade: Alta · Confiança: CONFIRMADO · Marca: RASTREADO**

`supabase/functions/auto-scorecard/index.ts:20-31` cria o cliente com service_role; **sem `getUser`, sem token de cron, sem rate limit**. Grava `call_scorecards` e `scorecard_responses` (`:128-151`). O gatilho do banco a chama com a **chave `anon` embutida literalmente no SQL** (`supabase/migrations/20261114090557_….sql:16`, `"role":"anon"`) — e a chave `anon` está no bundle público do front. O único "controle" é conhecer um `call_session_id`.

### A-014 — `chatbot-respond`: injeta mensagem como se fosse o bot em qualquer conversa
**Severidade: Alta · Confiança: CONFIRMADO · Marca: RASTREADO**

`supabase/functions/chatbot-respond/index.ts:20-32` — nenhuma autenticação. `:70-75` lê o histórico de qualquer `conversation_id`; `:166-175` insere `conversation_messages` com `sender_type: 'bot'`; `:196` muda a prioridade do ticket. O campo `visitor_token` existe na interface (`:7`) e **nunca é verificado**.

### A-015 — `embed-kb-article`: sobrescreve o embedding de qualquer artigo da base de conhecimento
**Severidade: Alta · Confiança: CONFIRMADO · Marca: RASTREADO**

`supabase/functions/embed-kb-article/index.ts:19-23,52-57` — sem autenticação, sem rate limit, **sem limite de tamanho em `text`**; `update({ embedding }).eq('id', record.id)`. Envenenar o embedding faz o chatbot responder errado ao cliente, e cada chamada gasta crédito de IA.

### A-016 — `notify-new-device` e `notify-blocked-ip`: relay de e-mail aberto, com HTML injetável e remetente verificado da empresa
**Severidade: Alta · Confiança: CONFIRMADO (injeção) / HIPÓTESE (exposição) · Marca: RASTREADO**

`supabase/functions/notify-new-device/index.ts:23-31,59-60,70-78` — sem autenticação, sem rate limit, sem validação de formato; `to: [data.email]` e `${alertReasons.join(", ")}`, `<code>${data.ip}</code>`, `${deviceInfo}` interpolados direto no HTML, usando `RESEND_API_KEY`. Mesma causa em `notify-blocked-ip/index.ts:18-26,65-69`. **Resultado:** terceiro envia "alerta de segurança" com aparência oficial para qualquer endereço, com o texto que quiser.

### A-017 — `send-notification`: qualquer usuário logado notifica qualquer outro
**Severidade: Média · Confiança: CONFIRMADO · Marca: RASTREADO**

`supabase/functions/send-notification/index.ts:37-43` faz `getUser()` — mas só para confirmar que existe sessão. `:96-99` insere com `user_id: payload.user_id` **sem comparar com `user.id` e sem checar papel**. Vetor de phishing interno com cara de aviso do sistema.

### A-018 — Nenhum freio nos endpoints públicos que gastam dinheiro, e o rate limit existente falha aberto
**Severidade: Média · Confiança: CONFIRMADO · Marca: RASTREADO**

`checkRateLimit*` aparece em apenas 4 funções (`chat-widget-session:12`, `request-password-reset:18`, `validate-geo:15`, `webauthn-challenge:30`). **Sem nenhum freio:** `auto-scorecard`, `chatbot-respond`, `embed-kb-article` (OpenRouter), `notify-blocked-ip`, `notify-new-device` (Resend), `email-inbound`, `webhook-handler`. Agravante medido: `supabase/functions/_shared/rate-limit.ts:35` e `:58` são **fail-open** (`return { allowed: true }`) em erro de banco e em exceção.

---

# CR-4 — Poder concedido a quem não tem login

### A-019 — Qualquer visitante pode bloquear ou destravar a conta de qualquer operador
**Severidade: Crítica · Confiança: CONFIRMADO (arquivos) / NÃO VERIFICADO (grants vivos) · Marca: EXECUTADO (grep de GRANT/REVOKE nas 241 migrations)**

```sql
supabase/migrations/20260522144442_….sql:39-40
GRANT EXECUTE ON FUNCTION public.record_failed_login(text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_successful_login(text, text, text) TO anon, authenticated;
```
Os corpos (`20251231132751_….sql:90-146` e `:149-167`) são `SECURITY DEFINER`: o primeiro incrementa `account_lockouts.failed_attempts` e grava `locked_until` a partir de 5 tentativas; o segundo faz `DELETE FROM public.account_lockouts WHERE email = LOWER(p_email)`. **Nenhum `REVOKE` posterior as alcança** — `20261122183000_hardening_revoke_internal_functions.sql:12` e `20261123000000_fix_anon_rpc_exposure.sql:20` as citam explicitamente como preservadas para `anon`, enquanto revogam 11 outras.

**Impacto.** Sabendo só o e-mail, um estranho trava o acesso de qualquer operador (negação de serviço dirigida) **e** zera o contador para tentar senha sem limite. As duas coisas com a chave pública do site.

### A-020 — O bloqueio de login falha aberto no cliente
**Severidade: Média · Confiança: CONFIRMADO (código) / HIPÓTESE (exploração) · Marca: RASTREADO**

`src/hooks/useLoginLockout.ts:40-43` e `:56-59` devolvem `{ locked: false, attempts: 0 }` em qualquer erro das RPCs, e `src/pages/Login.tsx:76,82,96` segue adiante. Uma indisponibilidade da RPC desliga a proteção contra força bruta, sem sinal na tela nem no painel.

### A-021 — Enumeração de usuários no pedido de reset de senha
**Severidade: Baixa · Confiança: CONFIRMADO · Marca: RASTREADO**

`supabase/functions/request-password-reset/index.ts` responde corretamente de forma genérica para conta inexistente ("Se o email existir…"), mas `:77-82` devolve **"Já existe uma solicitação pendente. Aguarde a aprovação de um administrador."** — o que confirma que a conta existe.

### A-022 — `webauthn-authenticate`: contador do autenticador lido e descartado, e sem rate limit
**Severidade: Baixa · Confiança: CONFIRMADO · Marca: RASTREADO**

`supabase/functions/webauthn-authenticate/index.ts:44-48` seleciona `counter` e a coluna **não aparece em mais nenhuma linha** — não é comparada nem atualizada, então um autenticador clonado não é detectado. E não há `checkRateLimitDB` (o irmão `webauthn-challenge:30` tem), embora a função emita magic link (`:111-117`) e devolva `hashed_token` (`:139`). Atenuante: o desafio é de uso único (`:97`).

---

# CR-5 — Regras de compliance que falham liberando

### A-023 — A tela `/calls` disca sem checar lista "não perturbe" nem horário permitido
**Severidade: Crítica · Confiança: CONFIRMADO · Marca: RASTREADO**

O bloqueio existe em **uma** das duas telas de discagem:
```ts
src/pages/PhoneDialer.tsx:139              const { canDial, reasons } = await preDialCheck(number);
src/components/calls/UnifiedSoftphone.tsx:101  const call = initiateCall('sip', phoneNumber);   // nenhum preDialCheck
src/components/calls/UnifiedSoftphone.tsx:110  const success = await sipCall.startCall(phoneNumber);
```
`UnifiedSoftphone` é montado em `src/pages/Calls.tsx:43`; `grep preDialCheck` só retorna `PhoneDialer.tsx`. **Não há barreira no servidor** — o jssip fala direto com o tronco. O caminho do discador preditivo (`usePredictiveDialer.ts`) também não chama `preDialCheck`.

**Impacto.** Dá para ligar para número da lista "não perturbe" e fora do horário legal usando a tela `/calls` em vez de `/phone-dialer`. Risco de multa.

### A-024 — A checagem de DNC e de horário libera quando dá erro — em três camadas
**Severidade: Crítica · Confiança: CONFIRMADO · Marca: RASTREADO**

```ts
src/hooks/useDNCCompliance.ts:109-111  catch { log.error(…); return false; }                    // false = "não está na DNC"
src/hooks/useDNCCompliance.ts:123-125  catch { … return { can_call: true, reason: 'Error checking hours' }; }
supabase/migrations/20260103145030_….sql:244  RETURN jsonb_build_object('can_call', true, 'reason', 'No config found, allowing');
```
Qualquer instabilidade de rede — ou uma tabela de horários vazia — libera a discagem para números proibidos, sem aviso ao operador.

### A-025 — Importação em lote de DNC conta sucesso mesmo quando o banco rejeita
**Severidade: Crítica · Confiança: CONFIRMADO · Marca: EXECUTADO (li a fonte da dependência instalada)**

```ts
src/hooks/useDNCCompliance.ts:210-227
for (const phone of phones) {
  try { await supabase.rpc('add_to_dnc', {...}); results.success++; }
  catch (error: unknown) { … results.failed++; }
}
```
**O `catch` é inalcançável.** `node_modules/@supabase/postgrest-js/src/PostgrestBuilder.ts:26` define `shouldThrowOnError = false`; `:211-212` só lança com `.throwOnError()`; e `:227` converte até erro de rede em resultado resolvido. Logo `results.success++` roda para **todo** telefone, inclusive os recusados. O teste passa porque **mocka o comportamento errado** (`useDNCCompliance.coverage.test.tsx:120-121` usa `Promise.reject`). E o resultado nem é lido pelo consumidor (`DNCListManager.tsx:59`, `ImportDNCDialog.tsx:22-23`).

**Impacto.** Um lote de números que não podem ser ligados pode não entrar na lista, e ninguém é avisado.

### A-026 — Três das seis regras de compliance são configuráveis e nunca aplicadas; o intervalo mínimo tem duas unidades
**Severidade: Média · Confiança: CONFIRMADO · Marca: RASTREADO**

`src/hooks/useDNCCompliance.ts:245-273` (`preDialCheck`) verifica só `dnc_enabled` e `calling_hours_enabled`. `max_attempts_per_day`, `min_interval_between_calls` e `lgpd_consent_required` **não aparecem em nenhum caminho de execução**. Pior, a unidade diverge: `ComplianceSettings.tsx:167` rotula "Intervalo Mínimo (minutos)" com `min=15 max=480`; `20260103145030_….sql:104` semeia `'60'` descrito como minutos; `20261122310000_seed_compliance_baseline.sql:12` semeia `'3600'` descrito como **segundos**.
Relacionado: `20260103145030_….sql:252-256` compara a data exata do feriado e **ignora a coluna `recurring`** — feriados recorrentes semeados para 2026 deixam de bloquear em 2027.

### A-027 — A taxa de abandono do freio do discador usa definição diferente da dos painéis
**Severidade: Alta · Confiança: CONFIRMADO · Marca: RASTREADO**

```sql
supabase/migrations/20260722213602_….sql:52-58
COUNT(*) FILTER (WHERE status = 'abandoned') / NULLIF(COUNT(*),0)   -- 15 min, TODAS as chamadas no denominador
```
```ts
src/hooks/useQueueMetrics.ts:115-117
(status==='abandoned' || status==='missed') / (completed + abandoned)
```
O freio do discador exclui `missed` e inclui chamadas em curso no denominador → resulta sempre menor. **O discador continua acelerando enquanto o painel de compliance mostra abandono acima da meta.**

---

# CR-6 — A mesma regra de negócio com duas fórmulas

### A-028 — "Nível de serviço" tem dois limiares em produção: 20 s e 30 s, com duas janelas
**Severidade: Alta · Confiança: CONFIRMADO · Marca: RASTREADO**

```ts
src/hooks/useQueueMetrics.ts:118              (c.hold_time_seconds || 0) < 20     // última hora
supabase/functions/check-goals/index.ts:118   (c.hold_time_seconds || 0) < 20     // última hora
src/hooks/useSupervisorPanel.ts:127           (c.hold_time_seconds || 0) <= 30    // desde 00:00
supabase/functions/check-queue-metrics/index.ts:110 (call.hold_time_seconds || 0) <= 30
```
Nas quatro, o denominador exclui abandonadas (`completed.length`), o que infla o indicador — **abandono nunca penaliza o nível de serviço**. O painel do supervisor e o alerta automático discordam sobre o mesmo indicador no mesmo instante.

### A-029 — O score do scorecard é calculado de dois jeitos; um pode passar de 100%
**Severidade: Alta · Confiança: CONFIRMADO · Marca: RASTREADO**

```ts
supabase/functions/score-call/index.ts:83-89
const total = validResponses.reduce((s, r) => s + Number(r.score) * Number(crit.weight), 0);  // sem clamp
const max   = criteria.reduce((s, c) => s + c.max_score * Number(c.weight), 0);               // TODOS os critérios

supabase/functions/auto-scorecard/index.ts:116-119
const clamped = Math.max(0, Math.min(c.max_score, Number(s.score) || 0));
total += clamped * Number(c.weight);
maxTotal += c.max_score * Number(c.weight);      // só os critérios realmente pontuados
```
Exibição única em `src/pages/Scorecards.tsx:207`. Pela rota `score-call` a nota pode ficar acima de 100% (IA devolvendo score acima do máximo) ou injustamente baixa (critério em branco divide por máximo maior). Agrava: `auto-scorecard:134` grava `status: 'submitted'` e `score-call:99` grava `'draft'` — **a revisão humana é pulada dependendo da edge**.

### A-030 — Limiar de "qualidade ruim" é 3,5 em quatro lugares e 3,6 em dois
**Severidade: Média · Confiança: CONFIRMADO · Marca: RASTREADO**

`src/hooks/useVoipQualityMonitor.ts:55` (`>= 3.6`), `supabase/functions/voip-recommendation-simulate/index.ts:14` (`3.6`), `src/hooks/useQualityTrendAnalyzer.ts:60-62` (3,6 e 3,5), `src/components/network/AgentQualityRanking.tsx:154` (`< 3.5`), `src/components/network/QualityHeatmap.tsx:27,62-63` (`3.5`). Uma chamada com nota 3,55 aparece como degradada no mapa, aceitável no detector de tendência e "recuperada" na simulação.

### A-031 — A invariante de ritmo do discador é provada numa cópia que não roda
**Severidade: Média · Confiança: CONFIRMADO · Marca: RASTREADO**

`src/lib/dialer/predictive-pace.ts:4` declara "deve espelhar 1:1 a lógica em produção" e `:52` aplica o clamp final. A função SQL que **de fato roda** não aplica: `supabase/migrations/20260722213602_….sql:66,75` (`v_suggested := v_campaign.max_concurrent_calls;` sem clamp). `calculatePredictivePace` não é importado por nenhum código de produção — só pelo teste de propriedade `predictive-pace.property.test.ts:26`, que roda 1000 casos contra o porte.

### A-032 — `talkRatio` diverge no caso vazio e elogia chamada sem áudio
**Severidade: Média · Confiança: CONFIRMADO · Marca: RASTREADO**

`src/lib/talkRatio.ts:85-87` devolve `'agent_low'` com duração 0; `supabase/functions/analyze-talk-ratio/index.ts:100-102` faz `agentTime/totalDuration` → `NaN`, as duas comparações falham e o resultado vira `'optimal'`. A tela de detalhe usa a edge.

### A-033 — "Melhor hora para contatar" calculada em UTC e exibida como hora local
**Severidade: Média · Confiança: CONFIRMADO · Marca: RASTREADO**

`supabase/functions/compute-best-time/index.ts:58` usa `d.getHours()` (UTC no Deno) e `src/pages/OutboundCompliance.tsx:200` exibe `${p.best_hour}h` — 3 horas de erro no Brasil.

### A-034 — Vocabulário de status de agente incompatível entre front, SQL e CHECK
**Severidade: Alta · Confiança: HIPÓTESE (qual DDL vive em produção) / CONFIRMADO (divergência no código) · Marca: RASTREADO**

```ts
src/hooks/useAgentStatus.ts:8      'available' | 'busy' | 'away' | 'offline'
src/hooks/useQueueMetrics.ts:98-100  'available' | 'busy'||'on_call' | 'break'||'away'
```
```sql
20250102000000_hello_production.sql:57  CHECK (status IN ('online','offline','busy','away','break'))
20260722213602_….sql:34                 WHERE status = 'available';   -- usado pelo pacing
```
`'available'` e `'on_call'` **não constam** do único CHECK versionado; `'online'`/`'break'` nunca são escritos pelo app. Há **três** `CREATE TABLE public.agents` conflitantes no repo (`20250102000000:51`, `20251223203745:2`, `20260515170309:25`). Se o CHECK vigente for o versionado, ou a troca de status é rejeitada, ou "agentes disponíveis" fica fixo em zero — e o discador então **sempre freia**.

### A-035 — Limite de chamadas simultâneas existe só no navegador
**Severidade: Média · Confiança: CONFIRMADO · Marca: RASTREADO**

`src/hooks/useMultiChannelCall.ts:62` define `MAX_SIMULTANEOUS_CALLS = 3`; a coluna `agents.max_concurrent_calls` (default 1, `20250102000000:59`) **nunca é lida**.

### A-036 — `callback` reagenda em 1 h fixa, ignorando a configuração da campanha
**Severidade: Baixa · Confiança: CONFIRMADO · Marca: RASTREADO**

`src/hooks/usePredictiveDialer.ts:183` usa 1 h fixa; `campaign.retry_delay_minutes` (default 30, `CreateCampaignDialog.tsx:48`) é ignorado.

### A-037 — Política de SLA escolhida ao acaso, e o teste que cobriria isso não afirma nada
**Severidade: Alta · Confiança: CONFIRMADO · Marca: RASTREADO**

```ts
supabase/functions/enforce-sla/index.ts:17-20  .from("sla_policies").select("*").eq("is_active", true);   // sem ORDER BY
supabase/functions/enforce-sla/index.ts:51-55  const matched = policies.find(p => (p.channel === conv.channel || p.channel === "all") && …)
supabase/functions/enforce-sla/__tests__/index.test.ts:18-27  // "prioriza política de canal específico sobre 'all'"
                                                             assert(matched !== undefined);   // passa devolvendo a política 'all' de 1440 min
```
Um ticket de WhatsApp com SLA de 5 minutos pode ser cobrado como 24 horas, e o alerta nunca dispara.

### A-038 — `business_hours_only` do SLA é configurável e nunca usado
**Severidade: Alta · Confiança: CONFIRMADO · Marca: RASTREADO**

Coluna em `20260417001411_….sql:350`, tipo em `useSLA.ts:15`, cálculo em `enforce-sla/index.ts:62-70` usando tempo corrido. `grep business_hours_only supabase/functions/` → **zero**. Ticket aberto sexta 18h estoura o SLA durante o fim de semana.

### A-039 — A conformidade de SLA premia adiar e fechar conversa atrasada
**Severidade: Alta · Confiança: CONFIRMADO · Marca: RASTREADO**

`enforce-sla/index.ts:43` só avalia `status in ('open','pending')`; `src/hooks/useSLA.ts:51-53` divide por **todas** as conversas de 7 dias. Conversas `snoozed`/`closed` nunca passam pelo enforcement, ficam com `sla_breached = false` e entram no numerador como cumpridas.

---

# CR-7 — Os gates de qualidade estão desarmados por construção

O CI está verde. Esta seção mostra por quê isso significa menos do que parece.

### A-040 — O guard de edge functions tem 51 achados congelados e a regra de autorização é só aviso
**Severidade: Alta · Confiança: CONFIRMADO · Marca: EXECUTADO**

`scripts/audit-edge-baseline.json` (`generated_at: 2026-11-22T12:59:12Z`) tem **51 chaves**: `R7-ssrf` 23, **`R3-auth` 11**, `R5-numeric` 9, `R4-cors` 7, `R9-stub` 1. Entre os 11 de autorização estão exatamente `search-calls`, `auto-scorecard`, `chatbot-respond`, `email-inbound`, `embed-kb-article`, `webauthn-authenticate`, `voip-failover-notifier`. E:
```ts
scripts/audit-edge-functions.ts:100  report("warn", "R3-auth", rel, "service_role sem validar o chamador (`// edge-public-ok` silencia)");
scripts/audit-edge-functions.ts:177  if (freshErrors.length > 0 || (STRICT && fresh.length > 0) || errors.length > 0) process.exit(1);
```
`warn` nunca entra em `errors`, e o baseline remove tudo de `fresh`. **O gate passa verde sobre os furos que ele mesmo detectou.**

### A-041 — O job "Security audit" não reprova nada
**Severidade: Alta · Confiança: CONFIRMADO · Marca: EXECUTADO**

`.github/workflows/ci.yml:124`: `run: bun audit || true`. O log do job do run `45063328728` (commit `b712310`) reporta `121 vulnerabilities (51 high, 53 moderate, 17 low)` e o job conclui **success**. Minha medição independente com `npm audit` dá **30 vulnerabilidades, 16 altas** — números diferentes porque os dois lockfiles produzem árvores diferentes (ver A-057).

### A-042 — Repositório público com secret scanning, push protection e Dependabot desligados
**Severidade: Crítica · Confiança: CONFIRMADO · Marca: EXECUTADO (API do GitHub)**

`github_get_repo adm01-debug/Hello_V3` → `"visibility": "public"` e `security_and_analysis` com `secret_scanning: disabled`, `secret_scanning_push_protection: disabled`, `dependabot_security_updates: disabled`, `secret_scanning_validity_checks: disabled`. **`AGENTS.md` afirma que o repositório é privado.** Se um agente ou o dono colar uma chave real num commit, nada bloqueia nem avisa, e o vazamento é público imediatamente.

### A-043 — `main` não tem nenhuma regra de proteção
**Severidade: Média · Confiança: CONFIRMADO · Marca: EXECUTADO (API)**

`github_get_branch_rules(branch=main)` → `[]`. Também `delete_branch_on_merge: false` e `allow_auto_merge: false`. Qualquer push ou merge com CI vermelho entra em produção na hora — e a plataforma publica a partir da `main`.

### A-044 — O guard de integridade do `AGENTS.md` é inócuo justamente no push para `main`
**Severidade: Média · Confiança: HIPÓTESE · Marca: RASTREADO**

`.github/workflows/ci.yml:33-35` faz `git fetch --depth=1 origin main` e usa `AGENTS_MD_BASE=FETCH_HEAD`. No evento `push: branches: [main]` (`ci.yml:4-5`), `FETCH_HEAD` é o próprio commit — a base de comparação vira o HEAD. **Não executei** o script com essa variável apontando para o próprio HEAD para medir o veredito. Importa porque o app do Lovable commita direto na `main` como `gpt-engineer-app[bot]`, que é exatamente o caminho que o guard existe para fechar.

### A-045 — A cobertura de 75% mede 2 das 5 pastas de `src`
**Severidade: Média · Confiança: CONFIRMADO · Marca: EXECUTADO**

`vitest.config.ts:21`: `include: ['src/lib/**', 'src/hooks/**']`, com thresholds 75/75/70/75 (`:28-33`). Ficam fora do denominador `src/components/` (278 arquivos), `src/pages/` (127) e `src/routes/`. "3.289 testes passando e 75% de cobertura" não diz nada sobre as telas que o usuário opera.

### A-046 — O ESLint não olha as edge functions, os arquivos de config nem os scripts
**Severidade: Média · Confiança: CONFIRMADO · Marca: EXECUTADO**

`eslint.config.js:8`: `ignores: ["dist","build","coverage","node_modules","*.config.js","*.config.ts","supabase/**"]`; `:11` restringe a `**/*.{ts,tsx}`, o que exclui todo `.mjs` de `scripts/`. A regra que proíbe `parseInt` vale só em `src/`.

### A-047 — O orçamento de bundle é calibrado em +10% do tamanho atual, não na meta de produto
**Severidade: Média · Confiança: CONFIRMADO · Marca: EXECUTADO**

`scripts/check-bundle-budget.mjs:58-66`: o modo `--update` regrava cada limite como `Math.ceil(tamanhoAtual * 1.1)`. Hoje `scripts/bundle-budget.json` dá a `index.js` um teto de **346 kB gzip** e o build real tem **319,6 kB** (92% do limite) — contra a meta de "<200 kB gz por rota" que `docs/audits/pendencias-2026-07.md` (C7) declara cumprida.

### A-048 — 29 arquivos de teste não importam nada do projeto
**Severidade: Alta · Confiança: CONFIRMADO · Marca: EXECUTADO (varredura própria)**

29 de 277 arquivos (11%) não têm nenhum `from '@/…'`, `from '../…'` nem `await import('@/…')` — reimplementam a lógica e afirmam sobre a própria cópia. Os piores pela promessa que fazem:
- `src/hooks/__tests__/useSecurityHardening.test.ts` (**863 linhas**) — importa só `vitest`, e declara casos como `'should enforce agent-scoped access for call_transcriptions'`, `'should block inactive agents from accessing transcriptions'`;
- os **7** arquivos de `src/__tests__/rls/` (443 linhas) — o cabeçalho de `rls-policies.test.ts:1-8` admite: "usando mocks do PostgREST";
- `src/hooks/__tests__/useMFA.test.ts` — testa uma reimplementação com `Math.random()` enquanto o código real usa `crypto.getRandomValues`.

Casos relacionados, de outra natureza: `useDeals.conflict.test.ts:32-50` passa porque mocka um conflito que o código real nunca provoca (A-051); `useDNCCompliance.coverage.test.tsx:120-121` passa porque mocka `Promise.reject`, comportamento que o supabase-js não tem (A-025); `enforce-sla/__tests__/index.test.ts:18-27` afirma só `assert(matched !== undefined)` (A-037); `predictive-pace.property.test.ts` prova a cópia, não o original (A-031).

### A-049 — 31 testes E2E nunca executam
**Severidade: Alta · Confiança: CONFIRMADO · Marca: EXECUTADO**

`playwright.config.ts:4`: `testDir: './tests/e2e'`. Existem **7 specs em `e2e/`** na raiz (`calls`, `dashboard`, `extensions-management`, `login`, `observability`, `security-lockout`, `sip-flow`) com **31 `test(`** ao todo. O log do CI confirma: o passo de E2E reporta `7 passed`, que são os de `tests/e2e/`. Login, fluxo SIP, bloqueio de segurança e gestão de ramais **parecem** cobertos e não são.

### A-050 — Dois arquivos de teste falham na coleta por variável de ambiente ausente
**Severidade: Baixa · Confiança: CONFIRMADO · Marca: EXECUTADO**

`npx vitest run` → `Test Files 2 failed | 275 passed (277)`, `Tests 3289 passed`. Os dois são `src/hooks/__tests__/useFinancialImpact.property.test.ts` e `src/lib/__tests__/executive-dashboard-utils.test.ts`, com `Error: Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY`. No CI os secrets existem; localmente, depois que o `.env` saiu do versionamento, a suíte não roda limpa sem configuração — e nada documenta isso.

### A-051 — O auto-merge do inventário semanal é impossível e falha em silêncio
**Severidade: Média · Confiança: CONFIRMADO · Marca: EXECUTADO**

`.github/workflows/inventario-estado-semanal.yml:156-162` roda `gh pr merge --auto --squash` com `continue-on-error: true`, mas o repositório tem `allow_auto_merge: false`. O PR semanal é aberto e nunca mescla; a "documentação de estado automática" para de atualizar sem alerta.

---

# CR-8 — Escrita cujo erro ninguém vê

Mesma raiz da A-025: o cliente do Supabase **não lança** em erro; quem não desestrutura `error` nunca sabe que a gravação falhou.

### A-052 — 35 gravações no banco sem verificar o resultado
**Severidade: Alta · Confiança: CONFIRMADO · Marca: EXECUTADO (varredura própria)**

`await supabase…insert/update/upsert/delete/rpc` sem desestruturar `error` em **35 locais**. Os que mais importam:
`useCallSession.ts:133` (`call_transcripts_searchable`), `useMultiChannelCall.ts:143` (`hold_events`), `useSupervisorPanel.ts:206,225` (**`call_control_audit_logs` — trilha de auditoria**), `useCallRecording.ts:56` (`call_recordings`), `useVoipQualityMonitor.ts:179` (`call_quality_metrics`), `useConversations.ts:180`, `useGamification.ts:224,229`, `useAgentRanking.ts:110`, `useWebAuthn.ts:214` (`user_passkeys`), `useQueueAudioPrompts.ts:88` (remoção no storage), `useSessionManager.ts:133` (`active_sessions`).

### A-053 — 52 blocos `catch` escondem falha de escrita e seguem como se tivesse dado certo
**Severidade: Média · Confiança: CONFIRMADO (os locais) · Marca: EXECUTADO**

`catch` envolvendo escrita, sem `throw`, `toast.error`, `setError` nem `return false`. Os mais consequentes: `useScheduledCallbacks.ts:108,132,154,173,192` (agendamento de retorno ao cliente), `useContactAlerts.ts:68,85,107,123,140`, `useCallSession.ts:60,80,100,139,193`, `useContacts.ts:168,230,256,330`, `useAccounts.ts:62,76,90`, **`useAuditLog.ts:50`**, `useExtensionsAdmin.ts:83`, `useTrunkUsageReporter.ts:52`.

### A-054 — Fim de chamada: erro engolido e o agente vê "Chamada salva"
**Severidade: Alta · Confiança: CONFIRMADO · Marca: RASTREADO**

`src/hooks/useCallSession.ts:193-200` captura o erro, não relança nem devolve status, e o `finally` anula `currentSession`. O consumidor afirma sucesso nos **dois** caminhos:
```ts
src/components/calls/ActiveCallBar.tsx:204  toast.success('Chamada salva com resumo no histórico')
src/components/calls/ActiveCallBar.tsx:205-208
} catch (error) { logger.error('Error ending call:', error);
  await endSession(duration); toast.success('Chamada salva no histórico'); }
```
O segundo `endSession` é no-op porque `currentSession` já foi anulado.

### A-055 — Lead criado com o Bitrix fora do ar é perdido em silêncio: a RLS barra a fila de reenvio
**Severidade: Alta · Confiança: CONFIRMADO · Marca: RASTREADO**

```ts
src/hooks/useBitrix.ts:226-238
const { error: queueError } = await supabase.from('crm_sync_queue').insert({ action:'create_lead', … });
if (!queueError) { toast.info('Lead agendado para sincronização', …); return { queued: true }; }
return null;                                   // nenhum toast de erro
```
```sql
20260712220353_….sql:24-28
CREATE POLICY "Admin supervisor insert crm sync queue" ON public.crm_sync_queue FOR INSERT TO authenticated WITH CHECK (public.is_admin_or_supervisor());
```
O fallback grava como o usuário logado, mas só admin/supervisor pode inserir. **O agente cadastra um lead, não vê erro, e o lead não existe nem no Bitrix nem na fila.**

### A-056 — Alerta de meta atingida é pendurado numa chamada arbitrária, e o insert não é verificado
**Severidade: Média · Confiança: CONFIRMADO · Marca: RASTREADO**

`src/hooks/useAgentRanking.ts:106-117`: `.eq('agent_name', agent.name).limit(1).maybeSingle()` **sem `order`** só para satisfazer a FK, depois `insert` sem checar `error`; se não houver nenhuma chamada, o alerta é descartado em silêncio.

---

# CR-9 — Concorrência sem claim atômico nem lock efetivo

### A-057 — O discador reivindica o contato sem claim atômico: o mesmo cliente é discado duas vezes
**Severidade: Crítica · Confiança: CONFIRMADO · Marca: RASTREADO**

```ts
src/hooks/predictive-dialer/api.ts:88-102   apiGetNextContact → SELECT … .eq('status','pending') … .limit(1)
src/hooks/predictive-dialer/api.ts:104-112  apiMarkDialing →
  await supabase.from('dialer_queue')
    .update({ status: 'dialing', last_attempt_at: …, attempts: item.attempts + 1 })
    .eq('id', item.id);        // sem .eq('status','pending'), sem version, e sem checar error
```
Read-then-write puro: duas abas ou dois agentes na mesma campanha leem a mesma linha `pending` e ambos a marcam `dialing`. `attempts` vem do objeto em memória (lost update). E o `error` é descartado, então um claim que falhou deixa a linha `pending` para o próximo ciclo. O repositório **tem** o padrão certo (`enforce_optimistic_lock` em `deals`, `contacts`, `agents`, `cadences`, `playbooks`, `accounts`, `success_plans` — `20260418125824_….sql:2-20`) e `dialer_queue` ficou de fora. `api.ts:121-130` grava `completed_contacts` a partir do estado local pelo mesmo mecanismo.

### A-058 — O locking otimista está inerte: nenhum chamador envia `version`
**Severidade: Alta · Confiança: CONFIRMADO · Marca: RASTREADO**

```sql
supabase/migrations/20260418125824_….sql:10-11
IF NEW.version IS NOT NULL AND NEW.version <> OLD.version THEN RAISE EXCEPTION 'OPTIMISTIC_LOCK_CONFLICT'
```
Como `version` é `NOT NULL`, **omitir a coluna faz `NEW.version = OLD.version`** → nunca há conflito. Quem atualiza sem enviar: `src/hooks/useDeals.ts:74-85` (`updateDeal`) e `:87` (`updateStage`, o arrasta-e-solta do kanban), `src/hooks/useAccounts.ts:69-73`. `src/hooks/useContacts.ts:203` aceita `version` opcional, mas o único chamador (`CreateContactDialog.tsx:70-81`) não a envia. Nenhuma edge envia.

**Impacto.** Dois usuários editando a mesma oportunidade: o último salva por cima, sem aviso. E o painel `/concurrency-conflicts` fica **estruturalmente vazio**, parecendo que não há conflito nenhum. O ramo que trata `OPTIMISTIC_LOCK_CONFLICT` em `useDeals.ts:77-81` é inalcançável.

### A-059 — Gamificação: soma semanal calculada no cliente, com `UNIQUE` e erro descartado
**Severidade: Média · Confiança: CONFIRMADO · Marca: RASTREADO**

`src/hooks/useGamification.ts:208-240` lê, soma em JavaScript e grava, descartando `error` nas três operações. A tabela tem `UNIQUE(agent_id, week_start)` (`20251224023654_….sql:37`), então duas execuções concorrentes que caiam no ramo `insert` fazem a segunda falhar — e o erro é jogado fora.

### A-060 — `beforeunload` assíncrono: o agente nunca fica offline ao fechar a aba
**Severidade: Alta · Confiança: CONFIRMADO (código) · Marca: RASTREADO**

`src/hooks/useAgentStatus.ts:112-130`: o handler é `async` e faz `await supabase.auth.getSession()` **antes** do `fetch(..., { keepalive: true })`. `beforeunload` é síncrono — a continuação após o `await` normalmente não executa antes do descarregamento, e o `.catch(() => {})` apaga qualquer sinal. Quem fecha o navegador continua "disponível" no painel, e a fila manda chamada para um agente que não está lá.

### A-061 — Histórico de chamadas: corrida entre "carregar mais" e troca de filtro
**Severidade: Baixa · Confiança: CONFIRMADO · Marca: RASTREADO**

`src/hooks/useCallHistory.ts:111-118` anexa ou substitui conforme a página, sem flag de requisição vigente nem `AbortController`: a resposta que chegar por último vence. (A digitação está protegida por debounce em `CallHistory.tsx:39`.)

### A-062 — Transcrições só entram na análise pós-chamada se a gravação tiver dado certo
**Severidade: Baixa · Confiança: CONFIRMADO · Marca: RASTREADO**

`src/hooks/useCallSession.ts:78` só empilha em `allTranscriptsRef` **depois** do `if (error) throw error` de `:77`; no `catch` (`:80-83`) as transcrições voltam para a fila mas nunca entram no ref que `runPostCallIntelligence` (`:126-127`) lê.

### A-063 — Favoritos: o histórico registra a reordenação antes de ela ser persistida
**Severidade: Baixa · Confiança: CONFIRMADO · Marca: RASTREADO**

`src/hooks/useDialerFavorites.ts:202-215` grava o histórico antes de `reorderMutation.mutate`, ao contrário das irmãs que gravam em `onSuccess` (`:164-170`, `:118-124`). A mutação ainda é um `Promise.all` de N updates independentes (`:137-144`) — falha no meio deixa posições parcialmente aplicadas.

### A-064 — Remediação de anomalia não invalida a lista que ela altera
**Severidade: Média · Confiança: CONFIRMADO · Marca: RASTREADO**

`src/hooks/useAnomalyRemediation.ts:38-61` tem `onSuccess` só com `toast.success`; o arquivo não importa `useQueryClient`. A lista vem de `useVoipAnomalies.ts:51` com `refetchInterval: 120_000`, então a anomalia fica listada por até 2 minutos e o operador reaplica.

---

# CR-10 — A policy não cobre a operação que o código faz

RLS sem policy para a operação **não devolve erro**: devolve 0 linhas afetadas. Como o código só trata `error`, o caminho de sucesso é sempre o exibido. (Estado líquido das policies apurado por parser cronológico sobre as 241 migrations: **464 vivas de 729 criadas**; nenhuma policy permissiva de escrita sobreviveu.)

### A-065 — `rate_limit_logs` sem policy de UPDATE nem DELETE: dois botões de segurança mentem "sucesso"
**Severidade: Alta · Confiança: CONFIRMADO (arquivos) · Marca: EXECUTADO (cruzamento policies × `.update()/.delete()`)**

Estado líquido: **3 policies de INSERT e 1 de SELECT; nenhuma de UPDATE ou DELETE** (confirmei com `grep "ON public.rate_limit_logs" | grep -oE "FOR (SELECT|INSERT|UPDATE|DELETE|ALL)"`). O front usa o cliente do navegador, onde a RLS vale:
```ts
src/hooks/useRateLimitData.ts:100  await supabase.from('rate_limit_logs').update({ is_blocked: false }).eq('ip_address', ipAddress) …  toast.success(`IP ${ipAddress} desbloqueado`)
src/hooks/useRateLimitData.ts:111  await supabase.from('rate_limit_logs').delete().lt('created_at', oneWeekAgo) …  toast.success('Logs antigos removidos')
```
O admin clica "desbloquear IP", vê a confirmação, e o IP continua bloqueado.

### A-066 — `crm_sync_queue` sem policy de UPDATE, e a edge processadora nunca é invocada
**Severidade: Alta · Confiança: CONFIRMADO · Marca: EXECUTADO**

Estado líquido: `select` + `insert`, sem UPDATE. `src/lib/bitrix/sync-log.ts:29` insere com `status: 'in_progress'` pelo cliente do navegador, e `:50-53`/`:66-68` tentam `update({ status: 'success' })` / `'failed'` — barrados. O único outro escritor é `supabase/functions/sync-crm-queue/index.ts:37-42` (service_role), e `grep -rn "sync-crm-queue"` fora do próprio diretório **não retorna nada**: nenhum cron, nenhuma chamada. **Toda tentativa de sincronização com o Bitrix fica "em progresso" para sempre.**

### A-067 — `learning_completions` sem policy de UPDATE, mas o front faz `upsert`
**Severidade: Média · Confiança: CONFIRMADO · Marca: EXECUTADO**

Estado líquido: `select`, `insert`, `delete` (`20260417000338_….sql:175-177`). `src/hooks/useLearning.ts:54-58` faz `.upsert(…, { onConflict: 'agent_name,module_id' })` e `:63` exibe `toast.success('Módulo concluído!')`. Refazer um módulo com nota melhor não grava.

### A-068 — As escritas da tela de bloqueio geográfico não têm policy
**Severidade: Alta · Confiança: CONFIRMADO · Marca: EXECUTADO**

`geo_settings` e `geo_restrictions` só têm policy de `select`; `geo_access_logs` só `insert`/`delete`. O front escreve: `src/hooks/useGeoBlocking.ts:61` (insert em `geo_settings`), `:71` (update), `:82` (insert em `geo_restrictions`), `:91` (delete) — **nenhuma coberta**. Some-se a isso que `supabase/functions/validate-geo/index.ts:51-110` **nunca lê `settings.mode`** (trata tudo como allowlist) e `:103-107` devolve `allowed: true, reason: 'Allowlist not configured'` com a lista vazia: escolher "blocklist" na tela não muda nada, e sem países cadastrados o bloqueio libera todo mundo.

### A-069 — 263 das 464 policies vivas não declaram `TO`, e a segurança de 114 tabelas depende de um acoplamento frágil
**Severidade: Baixa (exposição) / Média (fragilidade) · Confiança: CONFIRMADO (ausência da cláusula) / HIPÓTESE (exposição a `anon`) · Marca: EXECUTADO (parser)**

Sem `TO`, o default do Postgres é `PUBLIC`, que inclui `anon` (ex.: `20260315200451_….sql:36`). Das 263, **174 não mencionam `auth.*`** — delegam a `is_admin_or_supervisor()`, `get_user_agent_name()` etc., que retornam falso/nulo para `anon`. É por isso que `20261122183000:11-13` **preservou** o EXECUTE desses helpers para `anon`: sem ele, a policy lançaria "permission denied for function" em vez de negar. Basta alguém revogar um helper "por hardening" — como já foi feito com `is_admin_user` e `has_role` em `20261123000100`/`000200` — para que essas tabelas passem a dar erro.

---

# CR-11 — Criptografia e comparação de segredo caseiras

### A-070 — Senhas SIP e de bind LDAP "cifradas" com XOR usando a `service_role` como chave
**Severidade: Alta · Confiança: CONFIRMADO · Marca: RASTREADO**

```ts
supabase/functions/sip-config/index.ts:5-13
const SECRET = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "fallback-key";
for (let i = 0; i < bytes.length; i++) out[i] = bytes[i] ^ key[i % key.length];
```
Mesma causa em `supabase/functions/voip-trunks-manage/index.ts:7-22` (cifra e decifra) e `supabase/functions/ldap-sync/index.ts:48-60`. Três problemas somados: (1) XOR de chave repetida não é cifra — o prefixo do JWT (`eyJhbGciOi…`) é texto conhecido, então os primeiros bytes da chave saem de qualquer ciphertext; (2) rotacionar a `service_role` torna **todas** as senhas ilegíveis e derruba a telefonia; (3) um ambiente sem a variável cifra com a constante literal `"fallback-key"`. Pior ainda, `sip-config:104-123` devolve `SIP_SERVER`/`USERNAME`/`PASSWORD` a **qualquer usuário autenticado** quando o agente não tem tronco atribuído, e `:144-146` devolve a senha em claro (no `catch`, devolve o próprio ciphertext como senha).

### A-071 — `voip-failover-notifier` usa a `service_role` como senha de endpoint, comparada byte a byte
**Severidade: Média · Confiança: CONFIRMADO · Marca: RASTREADO**

```ts
supabase/functions/voip-failover-notifier/index.ts:16-21
const expected = `Bearer ${supabaseKey}`;
if (authHeader !== expected) { return … 401 … }
```
`!==` sai no primeiro byte diferente, e o repositório tem `_shared/constant-time.ts` (`mesmaString`) exatamente para isso — usado pelas 5 edges de cron. O emissor (`voip-trunks-healthcheck/index.ts:125-129`) manda a chave mais poderosa do projeto no header, sem timeout e **sem `await`**, então o aviso de failover pode nem sair.

### A-072 — Credencial TURN embutida no bundle do navegador
**Severidade: Média · Confiança: CONFIRMADO · Marca: RASTREADO**

`src/lib/webrtc-config.ts:11-17` lê `VITE_TURN_URL`, `VITE_TURN_USER` e `VITE_TURN_CRED`. Variável `VITE_*` é substituída em tempo de build: a credencial vai no JavaScript público. O padrão correto para TURN é credencial efêmera por sessão.

---

# CR-12 — Webhooks de entrada sem assinatura nem idempotência

### A-073 — `whatsapp-inbound` e `email-inbound` não verificam assinatura nem autenticação
**Severidade: Alta · Confiança: CONFIRMADO (ausência) / HIPÓTESE (exposição) · Marca: EXECUTADO (grep por `hmac|signature|getUser|getClaims|401|verify` nos dois arquivos → 0 ocorrências)**

As duas funções (179 e 170 linhas) usam `SUPABASE_SERVICE_ROLE_KEY` e inserem em `conversations`, `conversation_messages`, `contacts` e `email_tickets`. `whatsapp-inbound/index.ts:1-2` declara que a autenticidade é garantida "pelo contrato de payload". Qualquer pessoa na internet injeta conversas e contatos em nome de qualquer cliente. Relacionado: `webhook-handler` **valida** HMAC e depois descarta o evento — `index.ts:71` só faz `console.log`.

### A-074 — `email-inbound`: a reentrega do provedor vira 500 em laço, deixando conversa duplicada
**Severidade: Alta · Confiança: CONFIRMADO · Marca: RASTREADO**

A conversa é criada **antes** do ticket (`:104-127`), e o ticket colide com `email_tickets.message_id TEXT UNIQUE` (`20260417001411_….sql:99`); `:131-135` faz `if (ticketErr) throw ticketErr` → 500. Como o provedor reentrega em 5xx, o ciclo se repete e cada volta deixa uma conversa duplicada na fila de atendimento. Sem `message_id`, o UNIQUE nem protege (vários NULL). O `insert` final em `conversation_messages` (`:148`) nem sequer é verificado.

### A-075 — `whatsapp-inbound`: dedup sem índice único e telefone concatenado no filtro do PostgREST
**Severidade: Média · Confiança: CONFIRMADO (concatenação e ausência de índice) / HIPÓTESE (payload exato) · Marca: RASTREADO**

```ts
supabase/functions/whatsapp-inbound/index.ts:78-82
.or(`phone.eq.${fromPhone},phone.eq.${normalizedPhone}`)
```
`fromPhone` é só `z.string().min(1)` (`schema.ts:5`) — sem formato nem tamanho; vírgula e `id.gt.0` alteram a expressão do filtro. E a dedup (`:42-52`) é leitura-e-depois-escrita **sem índice único** em `conversation_messages.metadata->>message_id`, então duas reentregas simultâneas duplicam a mensagem e inflam `unread_count`.

---

# CR-13 — Fios não ligados: construído, pago e inalcançável

### A-076 — O discador preditivo não disca
**Severidade: Alta · Confiança: CONFIRMADO · Marca: RASTREADO**

```ts
src/hooks/usePredictiveDialer.ts:145-151
await apiMarkDialing(queueItem);
setCurrentCall(queueItem);
toast.info(`Discando para ${queueItem.name || queueItem.phone}...`);
```
Nenhuma referência a SIP, `startCall` ou edge de telefonia em todo o hook; o loop automático (`:243-250`) só muda `status` e mostra um toast. A campanha "preditiva" marca contatos como discados sem ligar para ninguém — e as estatísticas de campanha contam essas "discagens".

### A-077 — A telefonia do Bitrix — o produto — nunca é chamada
**Severidade: Alta · Confiança: CONFIRMADO · Marca: RASTREADO**

`src/hooks/useBitrix.ts:252 registerCall` e `:271 finishCall` existem e mapeiam `telephony.externalcall.register/finish` em `supabase/functions/bitrix-api/index.ts:145-153`. `grep "registerCall\|finishCall"` fora de `useBitrix.ts` e dos testes → **zero**. Nenhuma chamada aparece no CRM do cliente: a proposta "Bitrix Call Connect" não acontece em nenhum caminho do app.

### A-078 — Cadências: cria, inscreve e nunca executa
**Severidade: Alta · Confiança: CONFIRMADO · Marca: RASTREADO**

`src/hooks/useCadences.ts:72-77` insere em `cadence_enrollments` com `next_action_at` = agora e `status: 'active'`; `src/pages/Cadences.tsx:60` anuncia "Sequências multi-touch automáticas". Nenhuma edge nem cron toca `cadence_enrollments` (grep em `supabase/functions/` e nas migrations: só índices e RLS). Sem atualização de `next_action_at`, sem edição e sem exclusão de cadência ou etapa.

### A-079 — Oito hooks completos, com backend pronto, sem nenhum consumidor
**Severidade: Média · Confiança: CONFIRMADO · Marca: EXECUTADO (varredura dos 202 hooks exportados, incluindo `await import()` e re-export)**

`useSLA.ts:94 useEnforceSla` (varredura de violações nunca disparada), `useKnowledgeBase.ts:116 useKbArticle` e `:165 useRecordKbView` (nada grava `kb_article_views`, então "este artigo ajudou?" e contagem de visualizações não existem), `useMeetingSummary.ts:228 useAutoMeetingSummary`, `useVoiceBiometrics.ts:185 useLiveVoiceVerification`, `useCadences.ts:87 useCadenceEnrollments`, `useTrackers.ts:58 useTrackerMatches`, e `useMultiChannelCallConference.ts:17` (arquivo inteiro órfão, duplicata com um bug que a versão viva evitou de propósito: `:103-105` agenda `setTimeout(() => completeTransfer(callId), 2000)` dentro de `useCallback(…, [])`).

### A-080 — Quatro edge functions sem nenhum chamador
**Severidade: Baixa · Confiança: CONFIRMADO no repositório / HIPÓTESE (chamador externo) · Marca: EXECUTADO**

`check-calling-hours` e `check-dnc` (referências só em testes; a lógica é consumida como RPC por `score-call-attempt:33-37`), `sync-crm-queue` e `translate-summary` (referências só nos arquivos de inventário). Quatro endpoints deployados e expostos que ninguém usa. Conferi o caminho inverso: o único `functions.invoke('charge')` do front está num comentário de exemplo (`src/lib/tracing.ts:9`) — não é função faltante.

### A-081 — "Salvar" da página de Configurações só emite um toast
**Severidade: Alta · Confiança: CONFIRMADO · Marca: RASTREADO**

```ts
src/pages/Settings.tsx:38-41
const handleSave = () => {
  toast.success('✓ Configurações salvas', { description: 'Suas preferências foram atualizadas' });
};
```
Ligado a dois botões (`:201`, `:288`). As 4 preferências de notificação vivem em `useState` local (`:32-37`) e nunca saem dali. Somam-se 4 switches sem `onCheckedChange`: `:96` ("Programa Beta") e `:257,:265,:273` (cancelamento de eco, supressão de ruído, ganho automático). Os irmãos `ProfileSettings`, `VoipSettings` e `BitrixIntegration` são reais.

### A-082 — Botão "Transferir" do softphone, na chamada ativa, sem handler
**Severidade: Alta · Confiança: CONFIRMADO · Marca: RASTREADO**

`src/components/calls/softphone/ActiveCallDisplay.tsx:234` — único dos 7 controles sem `onClick`; mudo (`:173`), espera (`:187`), volume (`:199`), gravar (`:211`), comando de voz (`:223`) e encerrar (`:240`) têm. `transferCall`/`completeTransfer` já existem em `useMultiChannelCall.ts:241`.

### A-083 — Botões "Exportar" mortos no histórico e nos relatórios
**Severidade: Alta · Confiança: CONFIRMADO · Marca: RASTREADO**

`src/pages/CallHistory.tsx:62` sem `onClick`, ao lado de um "Atualizar" que funciona (`:61`) — e `exportTranscript` já vem do hook (`:29`), ligado só ao painel de detalhe (`:198`). `src/pages/Reports.tsx:93` idem, e aqui **não há nenhuma função de export no arquivo**.

### A-084 — Nove botões e um item de menu sem nenhum handler
**Severidade: Média · Confiança: CONFIRMADO · Marca: EXECUTADO (varredura com filtro de `asChild`/form, seguida de leitura de cada trecho)**

| Local | Rótulo |
|---|---|
| `src/components/dialer/PredictiveDialerPanel.tsx:80` | "Priorizar" (discador preditivo) |
| `src/components/ai/AICallAnalysis.tsx:356` | "Marcar como resolvido" |
| `src/components/ai/AICallAnalysis.tsx:360` | "Requer follow-up" |
| `src/components/calls/softphone/TabContents.tsx:88` | botão de telefone na lista de chamadas ativas |
| `src/components/dashboard/RecentCalls.tsx:53` | "Ver todas" |
| `src/components/dashboard/RecentCalls.tsx:103` | "Mais opções" |
| `src/components/contacts/ContactCard.tsx:100` | "mais opções" — só faz `e.stopPropagation()` |
| `src/pages/RateLimitDashboard.tsx:52` | "Ver Alertas", dentro do alerta de incidente |
| `src/pages/Calls.tsx:137`, `:157` | "Configurar" (Wavoip e SIP Genérico) |
| `src/pages/Settings.tsx:278`, `:282` | "Testar microfone" / "Testar áudio" |

### A-085 — Wavoip é fabricado e o softphone abre no canal errado como "configurado"
**Severidade: Alta · Confiança: CONFIRMADO · Marca: RASTREADO**

```ts
supabase/functions/wavoip-call/index.ts:70  case 'connect': response = { success: true, connected: true, message: 'Conexão estabelecida' };
src/hooks/useWavoipCall.ts:122-129          setTimeout(… status: 'active') + cronômetro de duração
src/hooks/useMultiChannelCall.ts:64-67      { id:'webrtc', enabled:true, configured:true }   // ElevenLabs é stub e sempre falha
                                            { id:'wavoip', enabled:false, configured:false }  // a edge responde sucesso
```
`src/lib/elevenlabs-stub.ts:16-21` sempre devolve erro, e `webrtc` é o canal default (`useMultiChannelCall.ts:71`). O softphone abre num canal rotulado "configurado" que nunca funciona, e o canal WhatsApp mostra "ativa" com cronômetro rodando sem chamada existir. (A `wavoip-call` está declarada como stub com `// edge-stub-ok`; o problema é a interface afirmar o contrário.)

---

# CR-14 — Autorização só na rota, nem no menu nem no papel

### A-086 — O menu não filtra por papel: 49 dos 93 links levam a "sem permissão"
**Severidade: Alta · Confiança: CONFIRMADO · Marca: EXECUTADO (script comparando `AppSidebar.tsx` × `protectedRoutes.tsx`)**

`src/components/layout/AppSidebar.tsx:320-321` renderiza os grupos inteiros sem checar `profile?.role` (usado só como enfeite em `:337` e `:346`). Dos 93 links, **49** apontam para rotas com `roles:` declarado (`/audit-logs` → admin, `/roles` → admin, `/call-queues` → supervisor+admin, `/admin/slo` → admin…). Os itens de navegação não carregam o campo `roles`, então não há o que filtrar. Não é falha de segurança — a rota barra — é falha de produto: **ninguém consegue saber pelo menu o que de fato pode usar.**

### A-087 — O papel `viewer` existe no enum e não restringe nada
**Severidade: Alta · Confiança: CONFIRMADO · Marca: EXECUTADO (grep)**

O enum tem 4 papéis (`CREATE TYPE public.app_role AS ENUM ('admin','supervisor','agent','viewer')`), e `viewer` aparece em `src/contexts/AuthContext.tsx:6`, `ProtectedRoute.tsx:6`, `useAuthProfile.ts:6` (precedência), `Permissions.tsx:155`, `RoleStatsCards.tsx:13`. Mas `grep viewer supabase/migrations/*.sql` em contexto de policy/função retorna **uma única linha** — um CHECK de domínio (`20261122290000_….sql:87`). **Nenhuma policy e nenhuma função do banco distingue `viewer` de `agent`.** Um usuário cadastrado como "somente visualização" tem o mesmo poder de escrita que um agente.

### A-088 — Metade da superfície autenticada não declara papel na rota
**Severidade: Média · Confiança: CONFIRMADO · Marca: EXECUTADO (extração própria)**

Das 95 rotas protegidas, **49 não têm `roles:`** — a contenção depende inteiramente do que a RLS permitir, que não pode ser verificada daqui (A-089). Entre elas estão `/ranking`, `/alerts`, `/recordings`, `/hold-settings`, `/voice-security`, `/deals`, `/accounts`.

### A-089 — A eficácia da RLS por papel não é verificável, e os testes que a declaram não tocam o banco
**Severidade: Alta · Confiança: HIPÓTESE (por construção) · Marca: RASTREADO**

Em produção há 163 tabelas, 0 sem RLS e 448 policies (snapshot 2026-11-20) — bom indício. Mas: (a) não há MCP de SQL para `cfmlmcdyjuotqobjapng` nesta sessão e o host é bloqueado pela rede; (b) `supabase/migrations/20260711192700_….sql:49` reescreve policies **dinamicamente** lendo `pg_policies`, então o conjunto vivo não é derivável dos arquivos; (c) os 7 testes de `src/__tests__/rls/` mockam o PostgREST (A-048). **Nenhuma afirmação sobre isolamento entre contas tem lastro hoje.**

### A-090 — Três das funções que governam 270 policies são `VOLATILE`, o que anula a otimização aplicada na véspera
**Severidade: Alta · Confiança: CONFIRMADO (arquivos) / NÃO VERIFICADO (ganho real) · Marca: EXECUTADO (script de volatilidade + contagem no estado líquido)**

`is_admin_or_supervisor()` (`20261122250000_….sql:13`), `is_admin()` e `is_supervisor()` (`20261122280000_….sql:11,:29`) e `get_auth_agent_id()` (`20260515174404_….sql:2`) são declaradas **sem marcador de volatilidade** → default `VOLATILE`. As irmãs foram marcadas `STABLE` (`is_admin_user`, `get_user_role`, `has_role`). **270 das 464 policies vivas, em 130 tabelas, chamam uma dessas quatro** (313 ocorrências de `is_admin_or_supervisor`). Função `VOLATILE` num predicado de RLS é reexecutada **linha a linha** e não pode virar InitPlan — então o embrulho `(SELECT …)` que `20261122200000_rls_initplan_remaining.sql` aplicou não ajuda, e não vai ajudar enquanto o marcador faltar. O linter `auth_rls_initplan` do Supabase não pega isso porque só olha `auth.*`.

---

# CR-15 — Ambiente não reconstruível e drift entre repositório e banco

### A-091 — Três tabelas em uso sem `CREATE TABLE` em nenhuma das 241 migrations
**Severidade: Alta · Confiança: CONFIRMADO · Marca: EXECUTADO (`comm` entre as 159 tabelas de `types.ts` e as 164 criadas por migration)**

`geo_access_logs`, `geo_restrictions`, `geo_settings` existem no schema real (`types.ts:3666,3711,3744`) e são usadas em produção (`useGeoBlocking.ts:35,44,53,…`, `validate-geo/index.ts:53,97,112,134`). Nenhuma migration as cria. Pior, **18 statements de DDL as tratam como existentes sem guarda**: `20260404151943_….sql:87-90` usa `ALTER POLICY … ON public.geo_access_logs` — e `ALTER POLICY` **não aceita `IF EXISTS`** no Postgres (as 3 policies alteradas também nunca são criadas); `20260315143859:7` e `20260404152930:76` usam `DROP POLICY IF EXISTS`, cujo `IF EXISTS` cobre a policy, **não a tabela**; `20260711194619:10` cria um índice BRIN.

### A-092 — Drift inverso: 6 tabelas criadas por migration não existem no schema real, e a correção de LGPD depende de uma delas
**Severidade: Alta · Confiança: CONFIRMADO (contradição entre arquivos) / HIPÓTESE (qual lado está errado) · Marca: EXECUTADO**

`call_records`, `entity_versions`, `migration_rollbacks`, `queue_items`, `saved_filters`, `schema_migrations` são criadas por migration e **não estão em `types.ts`** — que foi regenerado em 2026-11-22 e contém tabelas de julho, logo não é um arquivo velho. Nenhum `DROP TABLE` para qualquer uma delas nas 241 migrations.

O problema concreto: `supabase/migrations/20261123010000_fix_user_delete_cascade.sql` abre com `BEGIN;` e contém `ALTER TABLE public.entity_versions DROP CONSTRAINT IF EXISTS entity_versions_changed_by_fkey, ADD CONSTRAINT …` — **sem `IF EXISTS` no `ALTER TABLE`**. Se a tabela não existir, a migration aborta e **as outras 6 correções de FK do mesmo arquivo voltam atrás**. E `docs/audits/pendencias-2026-07.md:40` declara o item F1 como concluído citando `entity_versions.changed_by` entre as FKs corrigidas, com "Provado: DELETE 500 → 200". **Os dois não podem estar certos ao mesmo tempo.** Fecha com: `select to_regclass('public.entity_versions')`.

### A-093 — O ledger de migrations registra 84 versões; o repositório tem 241 arquivos
**Severidade: Alta · Confiança: CONFIRMADO (snapshot) / HIPÓTESE (quais estão aplicadas) · Marca: RASTREADO**

`inventario/estado/banco.json` (2026-11-20) traz `ledger_registros: 84` e `ledger_versao_max: "20261030120000"`, enquanto `ls supabase/migrations/*.sql | wc -l` → **241**, das quais **34 são posteriores** a essa versão máxima. Ao mesmo tempo, `docs/audits/pendencias-2026-07.md` (C3) afirma que "todas já estão registradas em `supabase_migrations.schema_migrations`" e (B6) que os 8 CHECKs de uma migration de 23/11 foram verificados existindo em produção.

**Leitura honesta:** o ledger **não é fonte confiável** de o que foi aplicado — provavelmente porque DDL foi aplicada fora do CLI (pelo Lovable ou à mão). Consequência prática: **não existe hoje uma forma de responder "esta migration está aplicada?"** sem consultar objeto por objeto.

### A-094 — Dois pares de migrations com o mesmo timestamp
**Severidade: Média · Confiança: CONFIRMADO · Marca: EXECUTADO**

```
20250102000000_hello_production.sql        ×  20250102000000_performance_indexes.sql
20261122230000_reconcile_admin_role_sources.sql  ×  20261122230000_recordings_retention_cron.sql
```
O timestamp é a chave de versão no ledger: dois arquivos com a mesma versão não podem ser registrados separadamente, e a ordem passa a depender do nome. No par de novembro isso significa perder **ou** a reconciliação de papéis de admin **ou** a retenção de gravações.

### A-095 — Migrations não reaplicáveis: não há como levantar uma cópia do banco para testar
**Severidade: Média · Confiança: CONFIRMADO · Marca: EXECUTADO (contadores)**

```
DROP POLICY sem IF EXISTS:        5
CREATE INDEX sem IF NOT EXISTS: 175
CREATE TABLE sem IF NOT EXISTS: 136
```
Somadas às 729 `CREATE POLICY` (que no Postgres não têm forma `IF NOT EXISTS`) e ao drift das A-091/A-092, isso significa que **toda alteração de schema é testada em cima do cliente**.

### A-096 — `config.toml` versiona 5 `verify_jwt`; dez funções dependem de configuração que não está no repositório
**Severidade: Alta · Confiança: CONFIRMADO (divergência) / HIPÓTESE (estado em produção) · Marca: RASTREADO**

`supabase/config.toml:10-23` declara `verify_jwt = false` para 5 crons. Mas `supabase/functions/webauthn-challenge/index.ts:2-3` afirma o contrário sobre si mesma: *"A edge e publica (verify_jwt=false) e usa a service role…"*. Mesmo caso em `whatsapp-inbound` (`// edge-public-ok`), `email-inbound`, `webhook-handler`, `chat-widget-session`, `webauthn-authenticate`, `notify-blocked-ip`, `notify-new-device`, `auto-scorecard`, `request-password-reset`. **Ou essas dez estão em 401 agora** (login por passkey, webhook de WhatsApp e reset de senha quebrados) **ou um `supabase functions deploy` sem `--no-verify-jwt` quebra todas de uma vez** — e nada no repositório diz qual é o caso. O comentário de `config.toml:1-8` registra que esse mesmo problema já custou anos de 401 silencioso na purga de locks.

### A-097 — 24 variáveis de ambiente usadas e não documentadas; 28 documentadas que não existem
**Severidade: Média · Confiança: CONFIRMADO · Marca: EXECUTADO (cruzamento `import.meta.env` + `Deno.env.get` × `.env.example`)**

**Faltando** (10 são segredos): `ELEVENLABS_API_KEY`, `RESEND_API_KEY`, `SIP_PASSWORD`, `SIP_SERVER`, `SIP_USERNAME`, `MS_CLIENT_SECRET`, `MS_CLIENT_ID`, `MS_TENANT_ID`, `WAVOIP_TOKEN`, `CLEANUP_CRON_TOKEN`, `COACHING_CRON_TOKEN`, `DATA_LAKE_CRON_TOKEN`, `DIALER_CRON_TOKEN`, `RECORDINGS_CRON_TOKEN`, `BITRIX_WEBHOOK_URL`, `CORS_EXTRA_ORIGINS`, `WEBAUTHN_ALLOWED_ORIGINS`, `LDAP_ALLOW_SELF_SIGNED`, `ADMIN_EMAIL`, `FROM_EMAIL`, `ELEVENLABS_AGENT_ID`, `VITE_TURN_URL`, `VITE_TURN_USER`, `VITE_TURN_CRED`.
**Sobrando** (stack que o projeto não é): `NEXT_PUBLIC_*` (`:3-4`, o projeto é Vite), `REDIS_*` (`:35-38`), `JWT_SECRET`/`JOB_ENCRYPTION_KEY` (`:40-42`), `CALLS_SERVICE_URL`/`CONTACTS_SERVICE_URL` (`:48-49`), `STORAGE_*` (`:52-55`), `SENTRY_DSN`/`DD_API_KEY` (`:57-60`), `FEATURE_*` (`:67-69`) — 14 verificadas com `git grep`: **0 ocorrências cada**.

### A-098 — Projeto Supabase e chave embutidos em 7 definições de cron/trigger
**Severidade: Média · Confiança: CONFIRMADO · Marca: EXECUTADO**

`grep "supabase.co/functions/v1" supabase/migrations/` → 7 arquivos com host literal, sendo que `20260723114001_….sql:13,50` ainda aponta para `dyibdjwuoibwwpidgsxu` (**projeto morto**, DNS que não resolve). Além do host, `20261114090557_….sql:16,47` embute o **JWT `anon` de produção literal** dentro de `trigger_auto_scorecard()` e de um `cron.schedule`. Só um dos crons foi corrigido para ler do Vault (`20261122180000`); os outros 5, criados em novembro **depois** do incidente de migração de projeto, repetem o host fixo.

### A-099 — Nenhum cabeçalho de segurança no deploy, e 17 módulos de segurança sem importador
**Severidade: Alta · Confiança: CONFIRMADO (repo) / HIPÓTESE (runtime) · Marca: EXECUTADO (grep)**

`vercel.json` tem 3 linhas, só um `rewrite`; nenhum bloco `headers`. `index.html` não tem meta de CSP. E `git grep "getSecurityHeaders|buildCSPHeader|DEFAULT_SECURITY_HEADERS" -- src/` fora de testes retorna **apenas as próprias definições** (`src/lib/security/helmet-config.ts:16,27`) e o re-export (`src/lib/security/index.ts:10`): os 17 arquivos de `src/lib/security/` (CSP, HSTS, `https-enforcer`, `rate-limiter`, `input-sanitizer`, `xss-prevention`, `csrf-token`, `sql-sanitizer`, `jwt-handler`) **não têm nenhum importador de produção**, enquanto 4 arquivos de teste verdes dão a impressão de que os headers estão aplicados. Foram escritos como se houvesse um servidor Node com helmet; numa SPA estática os headers só podem vir da plataforma. **Não li os cabeçalhos realmente servidos**, e agora sei exatamente por quê: `curl` em `https://hello-v3.vercel.app/` **e** na URL de preview da PR devolve `403 (agent proxy: no rule or network setting allows this host)`, e o MCP da Vercel devolve `404` no lookup porque a conta conectada não tem acesso ao projeto (A-138). **Enquanto nenhum dos dois caminhos abrir, ninguém nesta configuração consegue confirmar que os cabeçalhos das etapas 025–026 chegaram ao navegador do usuário** — a etapa só pode ser fechada pelo dono ou com a conta Vercel certa conectada.

### A-100 — CORS aceita qualquer `*.lovable.app`, e 16 edges respondem com origem fixa
**Severidade: Média · Confiança: CONFIRMADO · Marca: EXECUTADO**

```ts
supabase/functions/_shared/cors.ts:29  if (/^https:\/\/[a-z0-9-]+\.lovable\.app$/.test(origin)) return origin;
```
Qualquer pessoa com um projeto na Lovable tem esse subdomínio. Atenua: `Access-Control-Allow-Credentials` não é emitido. Agrava: `corsHeaders` (deprecated, construído **sem** `req`) é usado por **16 funções** — `analyze-talk-ratio`, `auto-scorecard`, `compute-adherence`, `compute-deal-health`, `data-lake-flush`, `detect-key-moments`, `dialer-pacing-tick`, `forecast-call-volume`, `forecast-deals`, `generate-coaching-plan`, `generate-meeting-summary`, `global-load-test`, `score-call`, `search-calls`, `teams-fetch-recordings`, `voip-load-test` —, que então devolvem sempre `hello-v3.vercel.app`. **Se a trilha que serve produção for a do Lovable, essas 16 funcionalidades quebram no navegador por CORS.**

### A-101 — A trilha Vercel está ativa, mas qual domínio serve produção continua desconhecido
**Severidade: Média · Confiança: CONFIRMADO (a trilha existe) / HIPÓTESE (qual serve produção) · Marca: EXECUTADO (evento do GitHub + duas tentativas de acesso)**

O repositório declara `homepage: https://hello-v3.vercel.app` e tem `vercel.json`; `AGENTS.md` diz que o Lovable commita direto na `main` e que há **duas** trilhas de publicação.

**Medido em 2026-11-23, pelo evento que a própria Vercel postou na PR #166:** a trilha Vercel **está ativa e publica cada PR deste repositório** — projeto `hello-v3`, team `juca1`, e o deploy do commit `b9c9d9f` ficou `Ready` com URL de preview por branch. Isso não prova que a Vercel serve o domínio de produção, mas **tira a trilha do campo da especulação**: ela constrói e publica, hoje, a cada push.

**O que continua sem resposta, e por quê:** tentei ler os cabeçalhos servidos por dois caminhos e os dois falharam — `curl` na URL de preview e na de produção devolve `403 (agent proxy: no rule or network setting allows this host)`, e o MCP da Vercel devolve `404 lookup_deployment` porque a conta conectada não alcança esse projeto (ver A-138). Falta o dono dizer **qual URL ele e os usuários abrem**.

---

# CR-16 — Performance: consulta sem limite, sem índice, sem prazo

### A-102 — 66 dos 99 hooks que leem o banco não têm limite nem paginação
**Severidade: Alta · Confiança: CONFIRMADO · Marca: EXECUTADO (contagem própria)**

Nenhum `.limit()` nem `.range()`. Exemplos de carga total de tabela: `useActiveCallsRealtime.ts:35,40` (`select('*')` em `call_sessions` e `hold_events`), `useContactInsights.ts:59-64` (`contact_interactions` inteira, com todas as métricas calculadas no cliente), `useAlerts.ts:92`, `useAgentStatus.ts:39`. No outro extremo, limites altos em rota pública: `src/pages/Status.tsx:80,85` usa `.limit(20000)` **duas vezes**, para visitante anônimo.

### A-103 — `call_sessions.created_at` sem índice — é o filtro de data de 6 telas e 3 crons
**Severidade: Alta · Confiança: CONFIRMADO (arquivos) · Marca: EXECUTADO (440 índices extraídos × uso por coluna)**

Todos os índices de `call_sessions` nas migrations cobrem `caller_name`/`caller_phone`/`agent_name` (trigram), `contact_id`, `deal_id`, `status` (parcial), `(agent_name, started_at DESC)` e `started_at DESC`. **Nenhum com `created_at` como primeira coluna.** Mas os consumidores filtram por `created_at`, não por `started_at` (15 ocorrências): `useQueueMetrics.ts:96`, `useSupervisorPanel.ts:118,119`, `useExecutiveDashboard.ts:115`, `useAgentRanking.ts:219`, `useHoldMetrics.ts:42-43`, `check-queue-metrics/index.ts:84,96`, `check-goals/index.ts:83,95`.

### A-104 — `fetch` para terceiros sem prazo em 90 das 94 edges
**Severidade: Média · Confiança: CONFIRMADO · Marca: EXECUTADO**

Só `bitrix-api` e `voip-trunks-healthcheck:21` usam `AbortSignal`/`AbortController`. Sem prazo: `auto-scorecard:81` (OpenRouter), `chatbot-respond:99`, `embed-kb-article:30`, `notify-*:48,52` (Resend), `voip-executive-narrative:127`, `voip-diagnostic-voice-qa:142`, `voip-capacity-recommendations:156` (que ainda encadeia edge→edge, somando dois tempos). `_shared/resilience.ts:199` chama `fetch(input, init)` **sem `signal` padrão**, então o retry e o circuit breaker não protegem contra pendurar. Das 22 edges que chamam IA, **15 não têm prazo, retry nem circuit breaker**, e `analyze-call` não trata 429.

### A-105 — Tempestade de consultas: poll de 5 s somado a realtime `event: '*'` sem debounce
**Severidade: Média · Confiança: CONFIRMADO (código) / NÃO VERIFICADO (volume) · Marca: RASTREADO**

```ts
src/hooks/useQueueMetrics.ts:148-157
const interval = setInterval(fetchMetrics, 5000);
supabase.channel('queue-metrics')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'call_sessions' }, () => fetchMetrics())
  .on('postgres_changes', { event: '*', schema: 'public', table: 'agents' }, () => fetchMetrics())
```
Cada evento dispara 3 consultas. Mesmo padrão em `usePredictiveDialer.ts:262-281`. Com dezenas de chamadas simultâneas, o dashboard gera centenas de consultas por minuto — exatamente na hora de pico.

### A-106 — `useHoldReminder`: laço de re-render a 1 Hz, permanente e sem nenhuma chamada em espera
**Severidade: Média · Confiança: CONFIRMADO · Marca: RASTREADO**

`src/hooks/useHoldReminder.ts:95` cria um objeto novo a cada tick e `:117` grava em `alertedCalls` **incondicionalmente**, antes de qualquer verificação de quantidade. Esse estado está nas deps do callback (`:118`), que está nas deps do efeito (`:133-136`), que recria o `setInterval` de 1 s. Ambos os toggles nascem ligados (`src/lib/holdReminderSounds.ts:102,121`) e o indicador é montado sem condição (`UnifiedSoftphone.tsx:203`).

### A-107 — Alerta de meta crítica repetido a cada 5 segundos
**Severidade: Média · Confiança: CONFIRMADO · Marca: RASTREADO**

`src/hooks/useQueueMetrics.ts:79-89` dispara `toast.error` por status atual, sem memória do que já foi avisado, chamado em `:129` a cada `fetchMetrics` (poll de 5 s + realtime). Toast de 10 s a cada 5 s: na prática o supervisor aprende a ignorar.

### A-108 — N+1 em três edges, uma delas no caminho de validação de acesso
**Severidade: Média · Confiança: CONFIRMADO · Marca: EXECUTADO (detector + triagem manual; 4 falsos positivos descartados)**

`supabase/functions/validate-ip/index.ts:68-82` e `:93-104` — um `await supabase.rpc('check_ip_in_cidr', …)` **por faixa de IP cadastrada**, antes de liberar o acesso. `compute-best-time/index.ts:31,39-45` — `.limit(200)` contatos e, para cada um, um `select` de até 500 linhas (até 200 consultas por execução). `process-digest/index.ts:46-57` — um `select` por usuário.

### A-109 — 15 dos 26 blocos do arquivo de índices de performance são código morto
**Severidade: Baixa · Confiança: CONFIRMADO · Marca: EXECUTADO**

`20250102000000_performance_indexes.sql` (322 linhas) usa blocos `DO $$ IF to_regclass('X') IS NOT NULL THEN …`; as tabelas-alvo `calls` (7 blocos), `users` (4) e `transcriptions` (4) **não existem** no schema real — os nomes atuais são `call_sessions`, `user_profiles`, `call_transcriptions`. Não dá erro: simplesmente não cria nada. Quem abrir o arquivo para investigar lentidão vai concluir que os índices existem.

### A-110 — Dois índices exatamente redundantes
**Severidade: Baixa · Confiança: CONFIRMADO · Marca: EXECUTADO**

`audit_logs(user_id, created_at DESC)` criado duas vezes com nomes diferentes (`idx_audit_user_timestamp` em `20250102000000_performance_indexes.sql:190` e `idx_audit_logs_user_date` em `20260326203635_….sql:3`); e `meeting_summaries(call_session_id)` tem um `UNIQUE` (`20260417002302_….sql:29`) mais um btree simples na mesma coluna (`20260713124157_….sql:64`). Nenhum dos quatro aparece nos 44 `DROP INDEX` do repositório. (Em produção o linter já mediu **250 `unused_index`** — `docs/audits/pendencias-2026-07.md:58` —, então a conta real é bem maior.)

### A-111 — `index.js` com 319,6 kB gzip na primeira carga
**Severidade: Média · Confiança: CONFIRMADO · Marca: EXECUTADO (build próprio)**

O build emite aviso de chunk acima de 900 kB, e o chunk de entrada tem 319,6 kB gzip — 92% de um teto que foi calibrado a partir dele mesmo (A-047). `jspdf` (123,3 kB gzip) e `html2canvas` (46,3 kB) estão em chunks próprios, o que é correto; o problema é o shell.

---

# CR-17 — Documentos e inventários que afirmam o que não verificaram

### A-112 — Os documentos que declaram conclusão continuam sendo os menos precisos
**Severidade: Média · Confiança: CONFIRMADO · Marca: EXECUTADO**

| Documento | Afirma | Medição |
|---|---|---|
| `SYSTEM_FEATURES.md` | **185 itens, todos `[x]`, zero pendentes**, datado de **2026-03-15** | `grep -c "^\- \[ \]"` → **0**; as migrations vão até 2026-11-23 |
| `docs/adr/` (53 arquivos) | nenhum com status "Proposto"/"Superado" | só 5 arquivos têm sequer seção `## Status` |
| `AGENTS.md` | repositório **privado**; `bunx playwright test` **não sobe**; `config.toml` versiona **um só** `verify_jwt`; `coverage/`+`covout/` são 466 arquivos versionados; 7 scripts com `service_role` versionado | repositório é **público**; Playwright **roda no CI** (7 testes); são **5** `verify_jwt`; `coverage/`+`covout/` são **0** arquivos; **nenhum** segredo real versionado |
| `docs/audits/pendencias-2026-07.md` | item C3: "as 241 migrations já estão registradas no ledger"; item F1 concluído citando `entity_versions` | ledger tem **84** registros (A-093); `entity_versions` não está em `types.ts` (A-092) |
| `docs/edge-functions/README.md` | catálogo "do estado real" | `:69` classifica `fuzz-test-runner` como **público com 80 linhas**; o arquivo tem 142 linhas e exige admin (`index.ts:44-62`). `:54` diz `data-lake-flush` "público / 135 linhas"; são 177, com `getClaims` + token de cron. O `--check` do gerador **não roda no CI** |

**Causa raiz.** Todo documento de conclusão é escrito uma vez e nunca reconciliado; só `pendencias-2026-07.md` é mantido — e mesmo ele tem dois itens contraditados acima.

### A-113 — O inventário automático que os agentes devem ler antes do `grep` tem falso positivo
**Severidade: Média · Confiança: CONFIRMADO · Marca: EXECUTADO**

`inventario/estado/rotas.json` declara `src/pages/admin/SecurityAuditDashboard.tsx` como "página órfã que nenhuma rota alcança". **É falso:** `src/routes/protectedRoutes.tsx:85` a importa (`lazy(() => import("@/pages/admin/SecurityAuditDashboard"))`) e `:197` a roteia em `/admin/security-audit`. Como `AGENTS.md` manda usar esse inventário como índice antes de `grep`, o erro se propaga para quem confiar nele. (O gerador também não reconhece que `/call-history` duplica `/history`.)

---

# CR-18 — Código morto, dependências e configuração inerte

### A-114 — Cinco componentes órfãos, 1.094 linhas
**Severidade: Baixa · Confiança: CONFIRMADO · Marca: EXECUTADO (varredura com `lazy()`, import multilinha e `await import()`)**

`src/components/alerts/AlertsDropdown.tsx` (285), `src/components/contacts/ContactAlertsDropdown.tsx` (250), `src/components/notifications/NotificationBell.tsx` (170), `src/components/lazy/LazyComponent.tsx` (18) — zero referências; os três primeiros foram substituídos por `UnifiedNotificationDropdown`, o único montado (`AppLayout.tsx:80`). E `src/components/calls/WebRTCCall.tsx` (371) tem **só o próprio teste** como consumidor: a suíte reporta cobertura de código que não roda.

### A-115 — 15 scripts órfãos, quatro deles destrutivos com o host de produção como padrão
**Severidade: Média (Alta se executado) · Confiança: CONFIRMADO · Marca: EXECUTADO**

Nenhuma referência em `package.json`, em `.github/` nem em outro script para: `apply-call-volume-fix.mjs`, `check-cfmlmc-db.mjs`, `check-data.mjs`, `check-rls.mjs`, `clean-hold-events.mjs`, `cleanup-and-count.mjs`, `fix-user-profile.mjs`, `full-audit.sh`, `inspect-schema.mjs`, `inventario/gerar-catalogo-edges.mjs`, `test-api-direct.mjs`, `test-auth-flow.mjs`, `test-authenticated-queries.mjs`, `test-call-volume-rpc.mjs`, `test-dashboard-rpcs.mjs`, `test-rls-access.mjs`, `test-validate-ip.mjs`.

Os destrutivos têm **produção como fallback do host** (verifiquei `cleanup-and-count.mjs:1-12`: exige `DB_PASSWORD`, mas `host: process.env.DB_HOST ?? 'db.cfmlmcdyjuotqobjapng.supabase.co'`):
- `scripts/cleanup-and-count.mjs:60` → `DELETE FROM auth.users WHERE email LIKE 'test%@gmail.com'` e `:68` → `DELETE FROM auth.identities …`
- `scripts/clean-hold-events.mjs:60` → `DELETE FROM hold_events`
- `scripts/fix-user-profile.mjs:49,63` → `INSERT INTO public.user_profiles` / `public.user_roles`
- `scripts/apply-call-volume-fix.mjs:11`

### A-116 — `xlsx` 0.18.5: duas vulnerabilidades altas sem correção, e o pacote não é usado
**Severidade: Alta · Confiança: CONFIRMADO · Marca: EXECUTADO (`npm audit` → `xlsx high range=* fix=false`)**

`package.json:105`. GHSA-4r6h-8v6p-xvw6 (prototype pollution) e GHSA-5pgg-2g8v-p4x9 (ReDoS), **sem versão corrigida**. `git grep "xlsx" -- src/ e2e/ tests/` → **0 ocorrências**: foi adicionado para um export para Excel que nunca foi implementado, e está no bundle de produção. Remover resolve sem perda.

### A-117 — `react-router-dom` 7.13.1: open redirect com correção disponível
**Severidade: Alta · Confiança: CONFIRMADO · Marca: EXECUTADO**

`package.json:94`, instalado 7.13.1. `npm audit` → `high`, faixa `7.0.0-pre.0 – 7.14.1`, `fix=true`, incluindo GHSA-wrjc-x8rr-h8h6 (open redirect por contrabarra em `<Link>`/`useNavigate`) e GHSA-2j2x-hqr9-3h42 (`//`). É **a única vulnerabilidade alta que roda no navegador do operador logado**.

### A-118 — Três lockfiles divergentes; o que o CI usa está preso a um registry privado de terceiro
**Severidade: Alta · Confiança: CONFIRMADO · Marca: EXECUTADO**

`bun.lock` (221 KB, usado pelo CI em `ci.yml:30`), `bun.lockb` (199 KB, formato binário antigo), `package-lock.json` (408 KB, 793 pacotes em `registry.npmjs.org`). `grep -c 'europe-west1-npm.pkg.dev' bun.lock` → **138** (+5 em `europe-west4`), em `lovable-core-prod/sandbox-npm-cache`. Se a Lovable desligar ou rotacionar esse cache, o build para e ninguém sabe por quê. E `npm install` local instala árvore diferente do `bun install` do CI — **um bug que aparece no CI pode não reproduzir na máquina de quem investiga** (foi o que produziu os dois números divergentes de `audit`, A-041).

### A-119 — Ferramental de desenvolvimento declarado como dependência de produção
**Severidade: Baixa · Confiança: CONFIRMADO · Marca: EXECUTADO**

Em `"dependencies"`: `typescript` (`:100`), `vite` (`:102`), `vitest` (`:103`), `jsdom` (`:78`), `@vitest/coverage-v8` (`:67`), `@testing-library/*` (`:60-62`), `fast-check` (`:74`), `lovable-tagger` (`:82`), `@types/*` (`:63-65`), `postcss`/`autoprefixer`/`tailwindcss`. Também `isomorphic-dompurify` (`:77`) e `react-is` (`:88`) sem nenhum import em `src/`.

### A-120 — `tsconfig.app.json` e `tsconfig.node.json` são configuração morta e divergente
**Severidade: Baixa · Confiança: CONFIRMADO · Marca: RASTREADO**

`tsconfig.json` não tem `references` nem `files` (só `include: ["src"]`, `:26-27`), então `tsc --noEmit` nunca lê os outros dois. `tsconfig.app.json:27` declara `"types": ["vitest/globals"]` contra `"types": ["vite/client","node"]` do principal. Quem editar `tsconfig.app.json` achando que muda o type-check não muda nada.

### A-121 — `preview.historyApiFallback` não é opção do Vite
**Severidade: Baixa · Confiança: CONFIRMADO · Marca: RASTREADO**

`vite.config.ts:16-18`. A chave é do webpack-dev-server; o Vite faz fallback de SPA por padrão via `appType`. Sem efeito hoje, mas sugere que o roteamento do preview está configurado quando não está — se o `appType` mudar, o E2E quebra sem pista.

### A-122 — O CI baixa e executa script remoto não fixado, duas vezes por run
**Severidade: Média · Confiança: CONFIRMADO · Marca: RASTREADO**

`.github/workflows/ci.yml:75` e `:85`: `curl -fsSL https://deno.land/install.sh | sh`, dentro do job que carrega os secrets do ambiente `e2e`. As actions também são referenciadas por tag móvel (`ci.yml:22,25,108,119-120`), enquanto `inventario-estado-semanal.yml:46,90,115` fixa por SHA — o endurecimento foi aplicado aos outros workflows e não a este.

---

# CR-19 — Acabamento, acessibilidade e tabelas sem uso

### A-123 — 71 botões só-ícone sem nome acessível
**Severidade: Média · Confiança: CONFIRMADO · Marca: EXECUTADO**

`<Button size="icon">` sem `aria-label`, `title`, `sr-only`, texto visível nem `Tooltip` por perto: **71 ocorrências**. As piores por estarem no fluxo de chamada e contato: `softphone/DialpadTab.tsx:44` (apagar dígito), `calls/ConferenceSection.tsx:62`, `calls/ActiveCallsIndicator.tsx:101`, `contacts/ContactCard.tsx:71` (favoritar) e `:100`, `contacts/ContactDetailSheet.tsx:95-96`, `recordings/TranscriptionDialog.tsx:119,:122` (navegar na transcrição), `callbacks/ScheduledCallbacksList.tsx:326`, `compliance/dnc/DNCTable.tsx:73` (**excluir**), `ranking/AgentGoalsGrid.tsx:54`. O padrão correto existe no repo (`RecentCalls.tsx:106`), mas não é cobrado por lint nem teste.

### A-124 — Quatro tabelas reais sem nenhum leitor nem escritor, duas delas são o miolo de reset de senha e verificação de e-mail
**Severidade: Média · Confiança: HIPÓTESE (acesso por RPC ou nome dinâmico não é detectável estaticamente) · Marca: EXECUTADO**

`password_reset_tokens`, `email_verification_tokens`, `account_journey_history`, `queue_skill_requirements` — zero referências em `src/`, `supabase/functions/` e `scripts/`, e zero `INSERT`/`UPDATE` nas migrations (só policies). O snapshot do banco confirma 0 linhas em todas, mais `customer_journey_stages` e `entity_versions`. Existem **duas estruturas paralelas** para o mesmo fluxo: `password_reset_requests` é a usada; a de "tokens" é a abandonada. Fecha com: `select relname, n_tup_ins, seq_scan from pg_stat_user_tables where relname in (…)`.

### A-125 — 22 colunas de status/tipo em `text NOT NULL` sem `CHECK`
**Severidade: Média · Confiança: CONFIRMADO · Marca: EXECUTADO (cruzamento de 104 colunas enum-like × todo `CHECK` das 241 migrations)**

28 sem CHECK, 22 delas `NOT NULL`: `compliance_rules.rule_type`, `dialer_campaigns.mode`, `geo_restrictions.restriction_type`, `geo_settings.mode`, `goal_violations.metric_type`, `goal_violations.threshold_type`, `redaction_log.pattern_type`, `voip_recommendation_actions.action_type`, `audit_logs.resource_type`, `badges.requirement_type`, `cadence_steps.step_type`, `call_control_audit_logs.event_type`, `churn_risk_signals.signal_type`, `contact_interactions.interaction_type`, `cultural_hints.context_type`, `dashboard_goals.metric_type`, `fraud_signals.signal_type`, `kb_article_history.change_type`, `objection_library.objection_type`, `renewals.renewal_type`, `surveys.survey_type`, `time_off_requests.request_type`. O contrato vive no TypeScript, que não chega ao banco: um valor errado passa e só aparece como regra que não dispara. (O caso concreto de `geo_settings.mode` está na A-068.)

### A-126 — Transições de status sem nenhuma guarda
**Severidade: Média · Confiança: CONFIRMADO · Marca: RASTREADO**

`src/hooks/useConversations.ts:193` aceita qualquer `Partial<Conversation>` — resolvida volta a aberta, pulando etapas. `src/hooks/useScorecards.ts:76` aceita qualquer status. Não há `CHECK` de status em `call_scorecards` nem em `call_sessions`.

### A-127 — Ponteiros polimórficos e hierarquia sem integridade referencial
**Severidade: Baixa · Confiança: CONFIRMADO (ausência de FK) · Marca: EXECUTADO (parser de `Relationships` em `types.ts`)**

Das 44 colunas `*_id` sem FK, descontando as que apontam para `auth.users` e os ids externos legítimos, sobram como realmente frouxas: `bitrix_departments.parent_id` (hierarquia sem auto-referência, `20260515171135_….sql:27-32`), `audit_logs.resource_id`, `notifications.source_id`, `optimistic_lock_conflicts.record_id`, `call_recordings.conference_id`, `call_translations.segment_id`, `coaching_assignments.scorecard_id`, `call_scorecards.reviewer_id`, `voip_recommendation_actions.recommendation_id`, `kb_article_views.viewer_id`, `index_drop_audit.admin_id`, `security_alerts.source_user_id`. As três primeiras são polimórficas por desenho — e seus `*_type` são exatamente as colunas sem `CHECK` da A-125.

### A-128 — Mensagem de erro interna devolvida ao cliente em 28 funções
**Severidade: Média · Confiança: CONFIRMADO · Marca: EXECUTADO**

Padrão `error: err instanceof Error ? err.message : …` em 28 `index.ts` (`ocr-virtual-fax:89`, `suggest-shift-swaps:105`, `translate-utterance:98`, `voip-quality-alerts-summary:64`, `chat-widget-session:179`, `email-inbound:166`). Pior caso em `auto-scorecard:97-100`, que repassa o corpo **e o status** do provedor de IA: o front recebe um 402 "do Hello" que na verdade é falta de crédito no fornecedor. Os erros do supabase-js trazem nome de tabela, coluna e detalhe de policy.

### A-129 — 37 das 94 edges usam o corpo do request sem nenhuma validação
**Severidade: Média · Confiança: CONFIRMADO · Marca: EXECUTADO (grep por arquivo)**

`await req.json()` sem `validate()`/`validateBody`/Zod em: `approve-password-reset:50`, `chat-widget-session:24`, `chatbot-respond:20`, `email-inbound:29`, `embed-kb-article:19`, `notify-blocked-ip:18`, `notify-new-device:23`, `voip-trunks-manage`, `sip-config:53`, `ocr-virtual-fax`, `transcribe-recording`, `wavoip-call:56`, `webauthn-authenticate:24`, `request-password-reset:26`, `ldap-sync`, `voice-command`, `verify-voice`, `send-survey`, `score-call`, `generate-summary`, `generate-coaching`, `generate-meeting-summary`, `translate-summary`, `translate-utterance`, `export-data-lake`, `forecast-deals`, `detect-churn-risk`, `compute-account-health`, `compute-adherence`, `compute-deal-health`, `check-alerts`, `check-calling-hours`, `check-dnc`, `data-lake-flush`, `elevenlabs-conversation-token`, `generate-coaching-plan`, `voip-failover-notifier:25`. Existem **três** validadores no repositório (`_shared/validate.ts`, `_shared/validator.ts` com Zod, `_shared/numeric-schemas.ts`) e nenhum guard exige uso. Campos de texto sem teto viram custo de IA e de armazenamento.

### A-130 — Contrato de erro inconsistente entre as funções
**Severidade: Baixa · Confiança: CONFIRMADO · Marca: EXECUTADO**

79 arquivos devolvem `{ error }`; 6 devolvem `{ success: false, error }`; apenas **2** usam o envelope padronizado `{ code, message, fields }` de `_shared/validator.ts:17-31` (`analyze-call` e `whatsapp-inbound`). O status de validação varia entre 400 (`search-calls:22`) e 422 (`validator.ts:92`).

### A-131 — A interface de coaching não informa a regra que o motor aplica
**Severidade: Baixa · Confiança: CONFIRMADO · Marca: RASTREADO**

`generate-coaching-track/track-engine.ts` exige mínimo de 3 amostras, threshold 3.0 numa escala 0–5 e janela de 14 dias, e devolve `skipped` quando não atende. Nada na tela de `/coaching` explica isso ao supervisor, que vê "nenhuma trilha" sem saber por quê.

### A-132 — O tronco de produção é um placeholder sem health check
**Severidade: Alta · Confiança: CONFIRMADO (snapshot) · Marca: RASTREADO**

`inventario/estado/banco.json` (2026-11-20): único tronco cadastrado = `"Tronco Principal Teste"`, `servidor_sip: "sip.exemplo.com"`, `health_status: null`, `ultimo_health_check: null`, `failovers: 0`, e o próprio snapshot emite o alerta `telefonia_tronco_sem_health_check`. Com `chamadas_7d: 0`. **Não existe telefonia operando** — o que confirma, pelo lado do runtime, a CR-1.

### A-133 — O cron do Data Lake falhou 6 de 6 vezes no último snapshot
**Severidade: Média · Confiança: CONFIRMADO (snapshot) / HIPÓTESE (estado atual) · Marca: RASTREADO**

`inventario/estado/banco.json` (2026-11-20) registra `data-lake-flush-daily` com `taxa_falha_7d_pct: 100` (6 execuções, 6 falhas, de 15/11 a 20/11) e emite `cron_falhando` + `cron_parado`. `docs/audits/pendencias-2026-07.md` (C6) afirma que a causa era `schema "net" does not exist`, resolvida com a instalação do `pg_net`, e que o run de 21/11 passou. **Não pude verificar** — é o mesmo snapshot que registra `cron_jobs: 1` quando as pendências descrevem 5 jobs ativos, então o snapshot pode estar defasado ou os jobs podem não existir. Fecha com: `select jobname, status, start_time from cron.job_run_details order by start_time desc limit 20`.

---

---

# CR-20 — Achados da verificação em navegador (2026-11-23)

**Como foram obtidos.** Depois de fechar a primeira versão desta auditoria, descobri que este ambiente tem **Chromium e Playwright instalados** — ou seja, a camada que eu havia declarado como não coberta era, em parte, alcançável. Servi o build de produção com `vite preview` e capturei **10 rotas públicas em 3 larguras (390 / 768 / 1280) = 30 telas**, com log de console e de rede. Tudo o que segue é **EXECUTADO**.

Isto não substitui as etapas 270–275 do plano: elas cobrem as **telas autenticadas**, que continuam sem verificação (exigiriam credenciais reais e tráfego contra produção).

### A-134 — Toda página pública consulta `call_quality_metrics` e abre um canal de realtime, duas vezes
**Severidade: Média · Confiança: CONFIRMADO · Marca: EXECUTADO (log de rede das 30 capturas)**

Em **todas as 10 rotas**, inclusive `/landing`, `/pricing`, `/vs/3cplus`, `/marketplace` e `/unauthorized`, o navegador de um visitante **anônimo** dispara:
```
GET  /rest/v1/call_quality_metrics?select=*&order=created_at.desc&limit=50      (duas vezes por carga)
WSS  /realtime/v1/websocket?apikey=…&vsn=2.0.0                                  (duas vezes por carga)
```
Um hook de monitoramento de qualidade VoIP está montado **acima** do roteador, então ele roda em página de marketing. Três problemas somados: (1) `select=*` numa tabela operacional, para visitante que não logou — se a policy de leitura permitir, é exposição de métrica interna (as policies dessa tabela estão entre as 263 sem cláusula `TO`, A-069); (2) a chamada é **duplicada** a cada carga, o que sugere montagem dupla do hook (`StrictMode` ou dois consumidores); (3) um canal WebSocket por visitante de página de marketing é custo de conexão sem contrapartida — e o banco tem `max_connections: 60` (A-105, etapa 257).

**Impacto.** Quem visita a página de preços abre conexão e consulta no banco de produção sem nunca ter entrado no sistema.

### A-135 — A tela de login chama um terceiro de geolocalização direto do navegador
**Severidade: Média · Confiança: CONFIRMADO · Marca: EXECUTADO (log de rede)**

`/login` e `/dashboard` disparam `GET https://ipapi.co/json/` do navegador do usuário. Três consequências: (1) o **IP de cada pessoa que abre a tela de login** é enviado a um terceiro que não é fornecedor declarado do produto; (2) é um ponto de falha externo no caminho de entrada — se o provedor cair ou limitar, o login pode degradar (não verifiquei o tratamento de falha); (3) **é um segundo provedor de geolocalização**: a edge `validate-geo/index.ts:73` usa `ip-api.com`, em HTTP puro (A-104, etapa 228). Dois provedores diferentes, um no cliente e outro no servidor, para a mesma pergunta.

**Impacto.** Dado pessoal (IP) de todo visitante da tela de login sai para um terceiro não declarado — com implicação de LGPD — e a entrada no sistema depende de um serviço de fora.

### A-136 — Os dois botões de "mostrar senha" do cadastro não têm nome acessível, e a tela ao lado tem
**Severidade: Média · Confiança: CONFIRMADO · Marca: EXECUTADO (árvore de acessibilidade das 30 capturas)**

Em `/register`, os **dois** botões de revelar senha (campos "Senha" e "Confirmar Senha") não têm texto, `aria-label`, `title` nem `sr-only` — são `<button>` com um `<svg>` dentro. Em `/login`, o botão equivalente **tem** `aria-label="Mostrar senha"`. O padrão correto existe na tela irmã e não foi aplicado.

É a confirmação executada da A-123 (71 botões-ícone sem rótulo), agora com o agravante de estar na **rota pública de criação de conta**: quem usa leitor de tela não consegue conferir a senha que digitou ao se cadastrar.

### A-137 — Resultado positivo: nenhuma das 10 rotas públicas quebra em largura de celular
**Severidade: — (não é defeito) · Confiança: CONFIRMADO · Marca: EXECUTADO**

Medido em 390 px nas 10 rotas: **zero overflow horizontal** (`scrollWidth > clientWidth` falso em todas), nenhuma imagem sem `alt`, nenhum campo de formulário sem rótulo associado, e todas as páginas renderizaram conteúdo (nenhuma tela branca). A inspeção visual das capturas de `/status`, `/login` e `/register` em 390 px mostra layout correto e legível.

**Por que registro um resultado positivo:** a etapa 271 do plano ("corrigir o que a conferência de celular encontrar") pode ser desnecessária para as rotas públicas. Quem executar o plano deve começar pelas telas **autenticadas**, que continuam sem verificação — não repetir o que já está medido aqui.

### A-138 — Nenhum agente nesta configuração consegue verificar deploy, cabeçalhos ou logs de runtime
**Severidade: Média · Confiança: CONFIRMADO · Marca: EXECUTADO**

Duas medições de 2026-11-23, com os identificadores que a própria Vercel publicou na PR (`projectId: prj_i2sRUa…`, `teamId: team_QyN41X…`):
```
list_project_domains  → 404 not_found "Project not found."
list_deployments      → 403 forbidden "You don't have permission to list the deployment."
curl <preview>, curl <produção> → 403 (agent proxy: no rule or network setting allows this host)
```
A conta Vercel conectada a esta sessão **não é a conta que hospeda o produto**, e a rede do ambiente bloqueia `*.vercel.app`. Some-se a isso que o host do Supabase oficial também é bloqueado e que não há MCP de SQL para `cfmlmcdyjuotqobjapng`.

**Causa raiz.** As credenciais e a política de rede do ambiente de agente não cobrem os dois serviços onde o produto roda.

**Impacto no negócio.** A regra do próprio repositório diz que "pronto" exige **deploy confirmado + comportamento verificado**. Com esta configuração, nenhum agente pode cumprir essa regra — o melhor que consegue é dizer "mergeado". Isso explica, em parte, como o sistema chegou a ter documentos declarando conclusão sem verificação: a verificação era literalmente inalcançável. **Das 300 etapas do plano, as que exigem confirmar deploy, consulta ao banco ou cabeçalho servido vão terminar como `[~] parcial`** até que o dono conecte a conta Vercel do projeto, libere o host do Supabase na política de rede do ambiente, ou rode as verificações ele mesmo.


### A-139 — "Enviar pesquisa" manda um id fixo ("nps") em vez da pesquisa cadastrada
**Severidade: Alta · Confiança: CONFIRMADO · Marca: LIDO (código) + EXECUTADO (teste)**

`src/components/call-library/SurveysPanel.tsx` chamava `sendSurvey({ survey_id: 'nps' })` — uma string fixa, mas `surveys.id` é `UUID PRIMARY KEY` (`supabase/migrations/20260416235642_…sql:217`) e a edge `send-survey/index.ts:36` faz `.from("surveys").select(...).eq("id", survey_id)`. O PostgREST responde erro de sintaxe de UUID e a edge devolve **404 "survey not found or inactive"**: o botão "Enviar" **nunca** funcionou, e a tabela `surveys` não tinha nenhuma tela — ou seja, nenhuma pesquisa chegava a existir para ser enviada. As respostas exibidas ao lado vêm de `survey_responses`, que só é alimentada por `send-survey`, então o painel inteiro era decorativo.

**Impacto.** A aba **Pesquisas** de `/call-library` (NPS/CSAT pós-chamada) não enviava nada e não tinha como cadastrar uma pesquisa; o NPS mostrado na tela ficava permanentemente vazio ou alimentado por linhas inseridas à mão.

**Correção.** `useSurveyDefinitions` (lista as ativas de `surveys`, cria e desativa, respeitando a RLS "Admin/supervisor manage surveys") e o painel passa a enviar o **id selecionado**, com estado vazio explícito e o botão de envio bloqueado sem pesquisa. Prova negativa: restaurado o `survey_id: 'nps'`, `SurveysPanel.test.tsx` falha 1/5; com o fix, 5/5 verdes.

### A-140 — O segredo HMAC do webhook de entrada só existia no banco: nenhuma tela cadastrava, e a edge recusa tudo com 401 sem ele
**Severidade: Alta · Confiança: CONFIRMADO · Marca: LIDO (código) + EXECUTADO (teste)**

`supabase/functions/_shared/hmac.ts:24-34` lê `public.webhook_secrets` por `provider` e devolve `false` quando não há linha; `webhook-handler/index.ts:15` (provider `generic-provider`, header `x-webhook-signature`) e `analyze-call/index.ts:33` (provider `analyze-call-webhook`, header `x-signature`) usam esse retorno como porta de entrada. A tabela tem RLS com policy de admin (`supabase/migrations/20261122240000_policies_read_user_roles.sql:20-22`), mas **nenhum arquivo de `src/` citava `webhook_secrets`** (`grep -rn webhook_secrets src` → só `src/integrations/supabase/types.ts`): não havia como cadastrar, rotacionar ou remover o segredo pela interface. Sem linha, toda chamada assinada é recusada com 401 — o webhook de entrada era inoperável fora do SQL manual.

**Impacto.** Nenhuma integração de entrada (webhook genérico, gatilho de análise de chamada) podia ser ligada sem acesso direto ao banco de produção, e o painel `/admin/webhook-health` mostrava as tentativas falhando sem oferecer a correção da causa.

**Correção.** `useWebhookSecrets` (lista, upsert por `provider` e exclusão, com invalidação de cache) + `WebhookSecretsCard` na página `/admin/webhook-health` (rota com `roles: ["admin"]`, RLS já existente): mascara por padrão, revela e copia sob demanda, gera 32 bytes hex por `crypto.getRandomValues`, mostra qual edge e qual header consomem o provedor e exige confirmação para excluir. Gate de produção `supabase/tests/webhook_secrets_rls_test.sql` (RLS habilitada, todas as policies condicionadas a `is_admin_or_supervisor()`, `anon`/`authenticated` sem leitura nem escrita, `service_role` lendo). Prova negativa: removendo a invalidação de cache o teste de upsert falha; devolvendo o segredo completo em `maskSecret`, o teste de mascaramento falha. **Executado em produção** por `migrations.yml` (`modo=verificar`, run 45803806223, sucesso) — a primeira tentativa (run 45803251673) ficou vermelha e revelou erro de sintaxe no próprio gate (`foreach_role:` em vez de `<<foreach_role>>`), corrigido em `98a582c3`.

### A-141 — O log de auditoria da redação de dados sensíveis era escrito pela edge e não tinha nenhum leitor
**Severidade: Alta · Confiança: CONFIRMADO · Marca: LIDO (código) + EXECUTADO (teste)**

A aba **Redação PCI** de `/voice-security` dispara `redact-sensitive-audio` e a própria tela anuncia que gera "um log de auditoria com os timestamps dos segmentos sensíveis" (`src/pages/VoiceSecurity.tsx:184-186`). A edge grava esse log em `supabase/functions/redact-sensitive-audio/index.ts:104-110` (`call_session_id`, `pattern_type`, `match_count`, `segments`, `status`) e `public.redaction_log` tem RLS com policy de leitura só para admin (`supabase/migrations/20260417113024_b37afec8-ce2c-47c3-9009-50ef0e86b65c.sql:92-96`, via `is_admin_user()`). Mas **nenhum arquivo de `src/` citava `redaction_log`** (`grep -rn redaction_log src` → só `src/integrations/supabase/types.ts`): não havia histórico em lugar nenhum.

**Impacto.** Auditoria de LGPD/PCI impossível pela interface: não dava para responder quais gravações tiveram CPF/cartão mascarados, quantas ocorrências cada uma teve, quando isso aconteceu, nem quais execuções terminaram sem correspondência (`status='no_matches'`). Os `segments`, com os timestamps dos trechos sensíveis, eram gravados e nunca lidos.

**Correção.** `useRedactionLog` (últimas 50 execuções de `redaction_log`, `created_at desc`) + o card "Histórico de redações" dentro da própria aba **Redação PCI**: quando, sessão, padrões detectados (`cpf,card` vira badges, `none` vira "nenhum padrão"), número de ocorrências, status colorido (`completed` verde, `no_matches` neutro, desconhecido em vermelho sem esconder a linha), total de ocorrências no cabeçalho, detalhe dos segmentos sob demanda e nova tentativa em erro de leitura. Integração fechada nos dois sentidos: `useRedactCall` invalida `REDACTION_LOG_QUERY_KEY` no `onSuccess` (`src/hooks/useVoiceBiometrics.ts`), então a execução recém-disparada aparece no histórico sem recarregar a página. Gate de produção `supabase/tests/redaction_log_rls_test.sql` (RLS habilitada, toda policy de leitura passando por `is_admin_user()`, **nenhuma** policy de escrita — um log de auditoria não pode ser editável pelo cliente —, `anon`/`authenticated` sem leitura, `service_role` lendo porque é quem grava, admin real lendo). Prova negativa: removendo a invalidação de cache em `useRedactCall`, o teste que exige o histórico atualizado após a redação falha.

### A-142 — O histórico de versões dos artigos da base de conhecimento era gravado pelo banco e não tinha nenhuma tela
**Severidade: Alta · Confiança: CONFIRMADO · Marca: LIDO (código) + EXECUTADO (gate + testes)**

O trigger `kb_article_history_trigger` (`supabase/migrations/20260507221454_8ee1f1c8-e52c-42d1-93f5-136662aa8772.sql:64`, `AFTER INSERT OR UPDATE ON public.kb_articles`) chama `handle_kb_article_history()`, que grava em `public.kb_article_history` o título e o conteúdo anteriores e novos, o autor (`auth.uid()`) e o tipo da mudança (`create`, `update`, `status_change`). A tabela tem RLS de leitura para admin/supervisor (`:18`, via `is_admin_or_supervisor()`). Mesmo assim, `grep -rn kb_article_history src` só encontrava `src/integrations/supabase/types.ts`: cada criação ou edição de artigo gerava uma versão que ninguém conseguia abrir.

**Impacto.** A base de conhecimento é o material de consulta do atendimento. Quando um artigo publicado mudava, não havia como saber quem alterou, quando, o que dizia antes nem o que passou a dizer — a trilha de auditoria existia só dentro do banco.

**Correção.** `useKbArticleHistory` (20 versões mais recentes do artigo aberto, `created_at desc`) + o card "Histórico de versões" dentro do diálogo de leitura do artigo em `/knowledge`: tipo em badge colorido (`Criação`, `Edição`, `Mudança de status`, `Publicação`), data, autor (uuid curto ou "por sistema"), troca de título (`“antigo” → “novo”`) e antes/depois do conteúdo sob demanda, com estados de carregando/vazio/erro e nova tentativa. Integração fechada nos dois sentidos: `useUpsertArticle` invalida `KB_ARTICLE_HISTORY_QUERY_KEY` no `onSuccess` (`src/hooks/useKnowledgeBase.ts`), então a versão recém-gravada aparece sem recarregar. Gate de produção `supabase/tests/kb_article_history_rls_test.sql` (8 passos: RLS ligada; **nenhuma** policy de escrita — histórico é imutável pelo cliente; toda policy de leitura passa por `is_admin_or_supervisor()`; trigger ativo `AFTER INSERT/UPDATE` apontando para a função certa; função `SECURITY DEFINER` com `search_path` fixo, que é o que permite o `INSERT` do trigger atravessar a RLS sem policy de escrita; a condição da policy é verdadeira para admin ativo e falsa para quem não tem papel; `anon` não lê; e o **passo funcional** cria um artigo, altera conteúdo e status e exige as 2 versões `create` e `status_change` gravadas, provando o caminho real do upsert da tela — o banco estava com 0 versões antes disso) — rodado contra o banco real (run 45809304068, 8/8 OK), transação revertida.

**Varredura de 2026-11-26 (tabelas sem nenhuma referência em `src/`).** Das 166 tabelas de `src/integrations/supabase/types.ts`, 17 não apareciam em `src/`. Classificação: `webhook_secrets` (A-140) e `redaction_log` (A-141) e `kb_article_history` (A-142) eram lacunas de tela e foram implementadas. `schema_migrations` e `migration_rollbacks` são infraestrutura do pipeline de migrations (`.github/workflows/migrations.yml`); `customer_journey_stages` só recebe seed de estágios (`20260416235642...:175`), `account_journey_history`, `password_reset_tokens`, `email_verification_tokens`, `entity_versions`, `saved_filters`, `queue_items`, `queue_skill_requirements` e `call_records` não têm escritor vivo nem leitor (estruturas abandonadas, já registradas em `docs/qa/04-PLANO.md:3053`); `deal_revenue_snapshots` só é escrito por `snapshot_deals_daily()`, que **nenhum cron, edge ou tela chama**. As três tabelas restantes que apareciam em edges (`chat_sessions`, `bot_conversations` e `email_tickets`) não são lacuna de tela: `chatbot-respond` e `email-inbound` gravam `conversation_messages` e `conversations` junto com elas (`grep -oE "from\('[a-z_]+'\)"` nos dois arquivos), e é a conversa que o `/inbox` exibe — as três são estado interno/registro bruto do mesmo evento, sem conteúdo que a tela já não mostre.

### A-143 — O retrato diário do pipeline aberto nunca era gravado: a função escrevia em colunas que não existem e escondia a falha
**Severidade: Alta · Confiança: CONFIRMADO · Marca: LIDO (código) + EXECUTADO (migration + gate + testes)**

`snapshot_deals_daily()` (`supabase/migrations/20260722213827_7ee185db-587f-4046-8507-474be04327a8.sql:88-115`) tentava gravar `snapshot_date`, `open_count`, `total_value_cents` e `weighted_value_cents` em `public.deal_revenue_snapshots`, mas a tabela foi criada com colunas por negócio: `deal_id`, `revenue_cents`, `currency`, `occurred_at` (`20260711153050_e3d3822b-d711-42cf-8514-1f348c336641.sql:5-11`). O `INSERT` caía no `EXCEPTION WHEN undefined_column ... RETURN '{"skipped": true}'` (`:112-113`), então quem chamasse recebia sucesso aparente e **nada** era gravado. Agravante: nenhum cron, edge function ou tela chamava a função — o histórico do pipeline era perdido a cada dia, e a tabela `deal_revenue_snapshots` também ficou sem escritor (o funil de receita realizado já é lido direto de `deals` pela view `financial_impact_daily`, usada em `src/hooks/useFinancialImpact.ts:78,83`).

**Impacto.** Sem série histórica não existe como responder "o pipeline cresceu ou encolheu?" nem detectar mês a mês a queda de oportunidades abertas. A informação que sustenta a decisão comercial era descartada diariamente, com o banco reportando sucesso.

**Correção.** Migration `20261126120000_deal_pipeline_snapshots.sql`: tabela própria `deal_pipeline_snapshots` (uma linha por dia, `snapshot_date` como PK), RLS ligada com leitura só para admin/supervisor via `is_admin_or_supervisor()` e **nenhuma** policy de escrita (só a função `SECURITY DEFINER` grava); `snapshot_deals_daily()` reescrita para essa tabela com `ON CONFLICT (snapshot_date) DO UPDATE` e **sem** o handler que mascarava a falha; job `deal-pipeline-snapshot-daily` agendado às 03:05 UTC (00:05 em São Paulo); primeiro retrato gravado na própria migration para a série não nascer vazia. Tela: card "Pipeline ao longo do tempo" (`src/components/executive/DealPipelineTrendCard.tsx`) no `/executive-dashboard`, logo abaixo da previsão de receita — valor aberto hoje, variação % do período, oportunidades abertas, previsão ponderada e barra por dia com 7/30/90 dias, estados de carregando/vazio/erro e recarga manual, aviso de que a série é restrita a admin/supervisor. Gate `supabase/tests/deal_pipeline_snapshots_rls_test.sql` (8 passos) rodado contra o banco real (run **45812916478, success**): `1/8 ok: RLS ligada`, `2/8 ok: nenhuma policy de escrita`, `3/8 ok: 1 policy(s) de leitura restritas a admin/supervisor`, `4/8 ok: job diario agendado e ativo`, `5/8 ok: SECURITY DEFINER com search_path fixo`, `6/8 ok: 2 execucoes no mesmo dia = 1 linha (upsert)`, `7/8 ok: admin ve, usuario comum nao ve (sob RLS)`, `8/8 ok: anon nao ve linhas`. Migration aplicada em produção pelo `migrations.yml` (run 45812713748) depois de dry-run limpo (run 45812602493).
## Contagem

| Severidade | Quantidade |
|---|---:|
| **Crítica** | **9** (A-001, A-002, A-012, A-019, A-023, A-024, A-025, A-042, A-057) |
| **Alta** | **60** |
| **Média** | **55** (54 + A-115, "Média (Alta se executado)") |
| **Baixa** | **18** (17 + A-069, "Baixa (exposição) / Média (fragilidade)") |
| **Total** | **143 IDs** = 142 defeitos + 1 resultado positivo (A-137) |

A-134 a A-137 vieram da verificação em navegador feita depois do fechamento da primeira versão (**CR-20**); A-138 veio da tentativa de ler os cabeçalhos reais pela Vercel, no mesmo dia; A-139 veio da recuperação do trabalho de outro agente na aba **Pesquisas** de `/call-library`; A-140, A-141 e A-142 vieram da varredura de tabelas sem nenhuma tela — respectivamente `webhook_secrets` (segredos HMAC de entrada), `redaction_log` (auditoria de redação) e `kb_article_history` (histórico de versões da base de conhecimento); A-143 fechou o último item dessa varredura, `deal_revenue_snapshots`/`snapshot_deals_daily()`, com uma série diária própria e tela.

Contagem conferida mecanicamente em 2026-11-26: `grep -c "^### A-" 03-ACHADOS.md` → **143**; `grep -oE "\*\*Severidade: [^·*]+" | sort | uniq -c` → **9 Crítica / 60 Alta / 54 Média / 17 Baixa**, mais 1 linha "— (não é defeito)" (A-137) e 2 linhas com severidade dupla (A-069 e A-115, nomeadas na tabela). IDs de A-001 a A-143 sem lacuna. O bloco anterior (merge da #347) declarava 140 IDs quando o arquivo já tinha 141 cabeçalhos; o número foi reconferido por comando e corrigido aqui.

Por confiança: **115 CONFIRMADOS**, **18 com HIPÓTESE** declarada (em 11 deles a hipótese é só sobre o runtime do banco ou sobre a configuração de plataforma, não sobre o código).
