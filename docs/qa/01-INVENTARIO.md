# 01 — Inventário do sistema e registro de cobertura

> **Auditoria:** QA completa, somente leitura
> **Data:** 2026-11-22 (23:56 UTC)
> **Commit auditado:** `b712310` (`main`), branch de trabalho `claude_04/affectionate-bell-0mcb71`
> **Escopo:** repositório `adm01-debug/Hello_V3` inteiro + estado de CI/GitHub + snapshots de runtime versionados
> **Baseline anterior:** `ESTADO_ATUAL.md` é de **2026-08-16** (commit `9160623`), **50 commits atrás**. Foi usado como pista, nunca como fato; todo achado foi reverificado no código atual.

---

## 0. Suposições declaradas (o campo `<contexto>` do pedido veio vazio)

Deduzido do código, não informado pelo dono:

| Suposição | Base |
|---|---|
| O sistema é uma plataforma de call center / VoIP ("Bitrix Call Connect") que o próprio dono opera e vende | `README.md`, `src/pages/Landing.tsx`, `src/pages/Pricing.tsx`, `src/pages/VsThreeCPlus.tsx` (página comparativa com o concorrente 3C Plus) |
| Atores reais: agente de atendimento, supervisor de fila, administrador | `src/routes/protectedRoutes.tsx` (`roles: ["admin"]`, `["supervisor","admin"]`), `src/hooks/useUserRole*` |
| Integração-alvo de CRM é o Bitrix24 | `src/lib/bitrix/`, `supabase/functions/bitrix-*` |
| **O sistema ainda não tem operação telefônica real** | `inventario/estado/banco.json` (snapshot do banco de produção, 2026-11-20): `chamadas_7d: 0`, `gravacoes_7d: 0`, e o único tronco cadastrado é `"Tronco Principal Teste"` com servidor `sip.exemplo.com` |
| Logo: a prioridade do dono é **estar correto quando o primeiro cliente real ligar**, não escala | consequência da linha acima |

Se qualquer uma dessas suposições estiver errada, a ordem das ondas do plano (`04-PLANO.md`) muda — a estrutura, não os achados.

---

## 1. Stack, entrada, build e deploy

| Dimensão | Fato | Evidência |
|---|---|---|
| Front | Vite 5 + React 18 + TypeScript, Tailwind + shadcn/ui, React Router, `@tanstack/react-query` v5 | `package.json:21-80`, `vite.config.ts` |
| Entrada | `index.html` → `src/main.tsx` → `src/App.tsx` | `src/main.tsx` |
| Backend | Supabase Edge Functions (Deno) | `supabase/functions/` (100 diretórios, **98 com `index.ts`**) |
| Banco | Postgres 17.6 no Supabase Cloud, projeto **`cfmlmcdyjuotqobjapng`** | `supabase/config.toml:1`; `inventario/estado/banco.json` → `"postgres": "17.6"` |
| Testes unitários | Vitest + jsdom — **277 arquivos / 3.289 testes** | execução própria (§5) |
| E2E | Playwright, `testDir: './tests/e2e'` | `playwright.config.ts:4` |
| Testes de edge | `deno test -A supabase/functions/` | `.github/workflows/ci.yml:71-76` |
| Build | `vite build` → `dist/`, **221 assets** | execução própria: `✓ built in 17.94s` |
| Navegador | Chromium + Playwright **disponíveis neste ambiente** (`/opt/pw-browsers/chromium`) | usado em 2026-11-23 para capturar as 10 rotas públicas |
| Deploy | **duas trilhas**: Lovable (commita direto em `main` como `gpt-engineer-app[bot]`) e Vercel (`homepage: https://hello-v3.vercel.app` na API do GitHub); `vercel.json` tem **só** um rewrite de SPA | `vercel.json` (3 linhas), `AGENTS.md`, metadados do repo |
| Ambientes | `main` → produção. **Não há ambiente de staging versionado.** O CI usa o GitHub Environment `e2e` apenas para injetar secrets | `.github/workflows/ci.yml:16` (`environment: e2e`) |
| Gerenciador de pacotes | **três lockfiles coexistem**: `bun.lock` (usado pelo CI), `bun.lockb`, `package-lock.json` | raiz do repo; `ci.yml:25` (`bun install`) |

### Visibilidade do repositório — divergência material

`AGENTS.md` afirma que o repositório é **privado**. A API do GitHub responde `"private": false`, `"visibility": "public"` para `adm01-debug/Hello_V3`. **Tudo** que está versionado é legível por qualquer pessoa na internet. Isso muda a severidade de qualquer segredo versionado e está registrado como achado em `03-ACHADOS.md`.

---

## 2. Inventário quantitativo (contagem mecânica própria, 2026-11-22)

| Item | Quantidade | Comando / fonte |
|---|---:|---|
| Páginas (`src/pages/**/*.tsx`) | 127 | `find src/pages -name '*.tsx' \| wc -l` |
| Componentes de produção (fora de `ui/`) | 278 | `find src/components -name '*.tsx' -not -path '*/ui/*'` |
| Componentes shadcn/ui vendorizados | 56 | `find src/components/ui -name '*.tsx'` |
| Hooks (raiz de `src/hooks`) | 167 | `find src/hooks -maxdepth 1 -name '*.ts*'` |
| Contexts | 3 | `find src/contexts -name '*.tsx'` |
| Módulos `src/lib` (sem testes) | 81 | `find src/lib -name '*.ts' -not -name '*.test.ts'` |
| Rotas protegidas | **95** | `src/routes/protectedRoutes.tsx` (extração por regex de `path:`) |
| Rotas públicas | **11** | `src/routes/publicRoutes.tsx:18-28` |
| Edge Functions com `index.ts` | **98** | laço sobre `supabase/functions/*/` |
| Migrations versionadas | **241** | `ls supabase/migrations/*.sql \| wc -l` |
| Arquivos de teste (todos) | 331 | `find src tests e2e supabase -name '*.test.ts*' -o -name '*_test.ts'` |
| Workflows de CI | 3 | `.github/workflows/` |

### Estado real do banco de produção (snapshot versionado, **2026-11-20T18:21Z**)

Fonte: `inventario/estado/banco.json`, gerado por `scripts/inventario/gerar-banco.mjs` contra o projeto oficial. **Não é medição minha** — o host do banco é bloqueado pela rede deste ambiente (ver §6). É o dado de runtime mais recente que existe versionado.

| Métrica | Valor |
|---|---:|
Tabelas em `public` | 163
Tabelas **sem RLS** | **0**
Policies | **448**
Funções em `public` | 232
Triggers | 106
Views | 2
Jobs `pg_cron` ativos | **1**
Registros no ledger de migrations | **84** (versão máxima `20261030120000`)
Tamanho do banco | 26,1 MB
`max_connections` | 60
Chamadas nos últimos 7 dias | **0**
Gravações nos últimos 7 dias | **0**

Alertas que o próprio snapshot emitiu: `rls_sem_policy` (`migration_rollbacks`, `schema_migrations`), `cron_falhando` (`data-lake-flush-daily`, **100% de falha em 7 d**), `cron_parado` (6 dias seguidos), `telefonia_tronco_sem_health_check`.

### Edge Functions sem chamador no repositório

Fonte: `inventario/estado/edges.json` (gerado 2026-11-20T18:04Z), confirmado por grep próprio:
`email-inbound`, `fuzz-test-runner`, `generate-coaching-track`, `global-load-test`, `rls-audit`, `sync-crm-queue`, `translate-summary`, `whatsapp-inbound`.
Três desses têm gatilho fora do código (cron ou webhook de terceiro) e não são código morto — ver `03-ACHADOS.md`.

### Tabelas órfãs em produção

Fonte: `inventario/estado/banco.json` → `tabelas_orfas` (critério: 0 linhas + não citada em função/view do banco + nenhum `.from()` no código):
`account_journey_history`, `customer_journey_stages`, `email_verification_tokens`, `password_reset_tokens`, `entity_versions`, `queue_skill_requirements`.

---

## 3. Atores, papéis e jornadas

### Papéis

Três papéis, declarados de forma declarativa na tabela de rotas (padrão correto: tabela de papéis separada, não coluna em `profiles`):

| Papel | Rotas exclusivas | Evidência |
|---|---:|---|
| `admin` | 22 rotas `roles: ["admin"]` | `src/routes/protectedRoutes.tsx` |
| `supervisor` | 27 rotas `roles: ["supervisor","admin"]` | idem |
| agente autenticado (sem papel declarado) | **49 rotas sem `roles:`** — acessíveis a qualquer usuário logado | idem |
| visitante | 11 rotas públicas | `src/routes/publicRoutes.tsx` |

**Leitura:** 49 das 95 rotas protegidas não declaram papel. Isso não é necessariamente erro (muitas são de uso do agente), mas significa que **metade da superfície autenticada não tem autorização por papel declarada na rota** — ela depende do que a RLS do banco permitir. Achado em `03-ACHADOS.md`.

### Rotas públicas (superfície anônima)

`/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email`, `/unauthorized`, `/landing`, `/pricing`, `/vs/3cplus`, `/status`, `/marketplace`.

### Jornadas principais mapeadas (detalhe em `02-CENARIOS.md`)

| # | Jornada | Ator | Caminho |
|---|---|---|---|
| J1 | Entrar no sistema | visitante → agente | `/login` → `useAuth` → sessão Supabase → `/` |
| J2 | Criar conta e verificar e-mail | visitante | `/register` → `/verify-email` |
| J3 | Recuperar senha | visitante | `/forgot-password` → `/reset-password` (+ aprovação admin em `/password-reset-approval`) |
| J4 | Ligar para um contato | agente | `/` (`PhoneDialer`) → `useSipCall` (jssip) → `call_sessions` |
| J5 | Atender e trabalhar a chamada ativa | agente | `ActiveCallBar` → transcrição ao vivo → sugestões de CRM → resumo |
| J6 | Colocar em espera / transferir | agente | `useMultiChannelCall` → `hold_events` / transferência |
| J7 | Ver histórico e gravações | agente | `/history`, `/recordings` |
| J8 | Operar fila | supervisor | `/queue-dashboard`, `/call-queues`, `/ring-groups` |
| J9 | Discador preditivo | supervisor | `/dialer`, `/dialer/predictive` → cron `dialer-pacing-tick` |
| J10 | Avaliar agente (scorecard / coaching) | supervisor | `/scorecards`, `/coaching` → edges de IA |
| J11 | Painel executivo e relatórios | supervisor | `/executive`, `/reports`, `/analytics`, `/financial-impact` |
| J12 | Administrar papéis e permissões | admin | `/roles`, `/permissions` |
| J13 | Administrar troncos e ramais | admin | `/admin/voip-trunks`, `/admin/extensions` |
| J14 | Segurança e auditoria | admin | `/audit-logs`, `/security-monitoring`, `/admin/security-alerts` |
| J15 | Exportar dados (Data Lake / LGPD) | admin | `/admin/data-export` → edge `export-data-lake` |
| J16 | Conformidade de discagem (DNC, horários) | supervisor | `/outbound-compliance`, `/compliance` |
| J17 | Página pública de status | visitante | `/status` |
| J18 | Excluir conta de usuário (LGPD) | admin | `/roles` → DELETE em `auth.users` |

---

## 4. Regras de negócio localizadas

Extraídas de validações, CHECK constraints, nomes de status e cálculos. Onde a regra está e onde deveria estar e não está — detalhe e divergências em `03-ACHADOS.md`.

| Regra | Implementada em | Deveria estar também em |
|---|---|---|
| Papel vale só se ativo e não expirado | `supabase/migrations/20261122250000_role_checks_honor_active_and_expiry.sql` | — (fechado) |
| Retenção de gravações: 180 dias | edge `cleanup-recordings` + cron `cleanup-recordings-daily` | — (fechado, validado em prod em 22/11) |
| Retenção de conflitos de lock: 90 dias | edge `cleanup-lock-conflicts` + cron semanal | — |
| Coaching automático: mínimo 3 amostras, threshold 3.0 (escala 0–5), janela 14 d | `supabase/functions/generate-coaching-track/track-engine.ts` | UI não informa o mínimo ao supervisor |
| Horário permitido de discagem + feriados | `20261122320000_calling_hours_honor_recurring_holidays.sql` | — |
| Domínio de valores em 8 colunas `text` | `20261123002000_b6_text_domain_checks.sql` (8 CHECKs) | demais colunas de status/tipo continuam texto livre |
| Taxa de abandono / nível de serviço | edges de métricas + hooks do dashboard | **divergência medida — ver achados** |
| Orçamento de bundle | `scripts/bundle-budget.json` | limite é +10% do tamanho atual, não a meta de produto |

---

## 5. O que foi EXECUTADO nesta auditoria

Comandos rodados por mim neste ambiente, com a saída observada:

| Verificação | Comando | Resultado |
|---|---|---|
| Dependências | `npm ci` | exit 0 (o caminho oficial `bun install` depende de registry privado bloqueado aqui) |
| Tipos | `npx tsc --noEmit` | **exit 0 — 0 erros** |
| Lint | `npx eslint .` | **exit 0 — 0 erros, 5 warnings** |
| Guard 1 | `node scripts/ci/check-claude-md-integrity.mjs` | exit 0 — 8 seções presentes |
| Guard 2 | `node scripts/codemod-safe-number.mjs --check` | exit 0 — nenhum `parseInt`/`parseFloat` nativo |
| Guard 3 | `node scripts/guard-edge-numeric.mjs --check` | exit 0 — 98 arquivos, 0 violações |
| Testes unitários | `npx vitest run` | **3.289 testes passam; 2 arquivos de teste FALHAM na coleta** (`useFinancialImpact.property.test.ts`, `executive-dashboard-utils.test.ts`) por `Missing VITE_SUPABASE_URL` |
| Build | `npx vite build` | exit 0, 221 assets, `✓ built in 17.94s`, aviso de chunk > 900 kB |
| Orçamento de bundle | `node scripts/check-bundle-budget.mjs` | exit 0 — "nenhum asset acima do orçamento" (`index.js` = 319,6 kB gzip, 92% de um limite de 346 kB) |
| **Rotas públicas em navegador** | `vite preview` + Playwright, 10 rotas × 3 larguras | **30 capturas**, todas HTTP 200, zero overflow horizontal a 390 px; log de console e de rede coletado |
| CI real | API do GitHub, workflow runs de `main` | run **45063328728** em `b712310` = **success**. O CI está **verde**, não mais vermelho |
| PRs abertas | API do GitHub | **1 aberta**: PR #160 (`feat: 'Alterar foto' do perfil`), toca `ProfileSettings.tsx`, `useAvatar.ts` e uma migration — **sem conflito** com esta auditoria (só escrevo em `docs/qa/`) |

---

## 6. Registro de cobertura — o que ficou de fora e por quê

| Camada / item | Status | Motivo |
|---|---|---|
| Interface (127 páginas, 278 componentes, 95+11 rotas) | **revisado** | varredura por camada + leitura dirigida aos fluxos centrais |
| Hooks e estado (167 hooks, 3 contexts) | **revisado** | idem |
| Edge Functions (98 com `index.ts`) | **revisado** | leitura + cruzamento com `config.toml` e `functions.invoke` |
| Banco — **arquivos** (241 migrations, `types.ts`) | **revisado** | grep agregado + comparação com `types.ts` |
| Banco — **runtime** (dados, RLS efetiva, migrations aplicadas) | **NÃO REVISADO** | **Erro exato:** não há MCP de SQL para `cfmlmcdyjuotqobjapng` nesta sessão; os 5 MCPs Supabase carregados apontam para outros produtos (Gestão de Clientes, Gestão de Produtos, Zapp Web, Promo Champions, Promo Finance) e usá-los seria escrever/ler banco alheio. O host do projeto oficial é bloqueado pela política de rede. Substituto parcial: snapshot versionado de 2026-11-20 (§2) |
| Regras de negócio e integrações | **revisado** | comparação de fórmulas front × edge × SQL |
| Infra, CI, deploy, segredos, dependências | **revisado** | leitura dos 3 workflows + `npm audit` + `git ls-files` |
| Testes de Edge Function (Deno) | **NÃO EXECUTADO** | `deno` não está instalado neste ambiente (`which deno` → vazio). Os arquivos foram lidos, nunca rodados |
| Testes E2E (Playwright) | **NÃO EXECUTADO** | exigem credenciais `E2E_ADMIN_EMAIL`/`E2E_ADMIN_PASSWORD` (secrets do GitHub Environment `e2e`), indisponíveis aqui |
| Comportamento visual / UX em navegador | **NÃO REVISADO** | nenhuma tela foi aberta; o app em `bun run dev` aponta para produção e abri-lo geraria tráfego real |
| Mobile / responsividade medida | **NÃO REVISADO** | consequência da linha acima; achados de layout são por leitura de classes Tailwind, marcados como HIPÓTESE |
| `coverage/` e `covout/` | **NÃO REVISADO** | saída de build versionada; contados, não auditados |
| `mem/` (44 arquivos) e `.lovable/` | **NÃO REVISADO** | memória de feature por onda — histórico, não estado |
| Billing / quotas do GitHub Actions e do Supabase | **NÃO REVISADO** | sem acesso à página de faturamento |
| Configuração de plataforma fora do repo (secrets de edge, dashboard do Supabase, settings da Vercel) | **NÃO REVISADO** | não está versionada |

### Ferramentas de inventário do próprio repositório: um falso positivo medido

`inventario/estado/rotas.json` declara `src/pages/admin/SecurityAuditDashboard.tsx` como "página órfã que nenhuma rota alcança". **É falso:** `src/routes/protectedRoutes.tsx:85` a importa (`lazy(() => import("@/pages/admin/SecurityAuditDashboard"))`) e `:197` a roteia em `/admin/security-audit`. Como `AGENTS.md` manda ler esse inventário antes de usar `grep`, o erro se propaga para quem confiar nele. Registrado como achado.

---

## 7. Como ler os outros arquivos

| Arquivo | Para quê |
|---|---|
| `00-RESUMO.md` | uma página para o dono, sem jargão |
| `02-CENARIOS.md` | matriz de 105 cenários por jornada, com EXECUTADO/RASTREADO |
| `03-ACHADOS.md` | todos os achados, agrupados por causa raiz |
| `04-PLANO.md` | instruções para o agente executor + as etapas numeradas |
| `05-PROGRESSO.md` | checklist que o executor vai marcando |
