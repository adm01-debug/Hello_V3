# 04 — Plano de correção em 300 etapas

> **Base:** `03-ACHADOS.md` (133 achados) · **Commit de referência:** `b712310` · **Data:** 2026-11-23
> **Para quem:** um agente de IA que não participou desta auditoria e não tem acesso a ela. Tudo o que ele precisa está neste arquivo.

---

## Instruções para o agente executor

**Leia esta seção inteira antes da etapa 001. Ela vale para todas as 300 etapas.**

### Regras de execução

1. **Uma etapa por vez, na ordem**, respeitando o campo `Depende de`. Cada etapa em sua **própria branch** e sua **própria PR**. Nome da branch: `claude/<fix|feat|chore|docs|ci|infra>-<slug>-<AAMMDD-HHMM>`, criada a partir de `main` atualizado. Nunca commite em `main`. Só escreva em branch que **você** criou nesta sessão.
2. **Antes de mudar qualquer coisa, releia a evidência da etapa no código atual.** Este plano foi escrito em 2026-11-23 sobre o commit `b712310`. Se o código já não corresponde ao descrito — porque alguém corrigiu, ou porque o arquivo mudou de nome —, **pare, registre no `05-PROGRESSO.md` o que encontrou, e siga para a próxima etapa independente**. Não adapte a etapa por conta própria.
3. **Corrija a causa raiz com a menor mudança possível.** Não refatore, não renomeie, não "melhore" e não comente o que a etapa não pede. Não reescreva um arquivo inteiro para mudar 3 linhas.
4. **Problema novo encontrado no caminho não é corrigido na hora** — vira anotação no `05-PROGRESSO.md`, na seção "Achados novos".
5. **Etapa marcada com `Precisa de aprovação humana: sim` fica com a PR aberta, aguardando o dono.** Não mergeie. Isso cobre: migration ou DDL em produção, `.github/workflows/`, segredos, infraestrutura, deleção de dado, mudança de arquitetura ou de custo. As demais você mergeia com squash e apaga a branch (o repositório tem `delete_branch_on_merge: false`, então apague à mão).
6. **Uma etapa só é concluída com a verificação executada e a evidência anotada.** "Deveria funcionar" não conclui etapa. Se a verificação não puder ser executada no seu ambiente, registre exatamente por quê e marque a etapa como `[~] parcial`.
7. **Não afirme "testado" ou "validado" sobre o que você só leu.** Use `EXECUTADO` apenas quando rodou e viu o resultado.

### Comandos do repositório

```bash
npx tsc --noEmit                              # type-check (cobre só src/)
npx eslint <arquivos>                         # lint (ignora supabase/** e *.config.*)
npx vitest run <caminho>                      # testes do que você tocou
node scripts/ci/check-claude-md-integrity.mjs # guard 1
node scripts/codemod-safe-number.mjs --check  # guard 2
node scripts/guard-edge-numeric.mjs --check   # guard 3
bun scripts/audit-edge-functions.ts           # guard 4 (edge functions)
npx vite build && node scripts/check-bundle-budget.mjs   # build + orçamento
```

**Instale as dependências com `npm ci`, não com `bun install`.** O `bun.lock` aponta para um registry privado da Lovable que pode não estar acessível (A-118); o `package-lock.json` aponta para o npmjs.org. Isso produz uma árvore ligeiramente diferente da do CI — se um teste falhar só no CI, essa é a primeira hipótese.

**Dois arquivos de teste falham na coleta sem variáveis de ambiente** (A-050): `useFinancialImpact.property.test.ts` e `executive-dashboard-utils.test.ts`. Exporte `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` com qualquer valor para rodar a suíte inteira localmente. Isso não é falha sua.

### Padrões do repositório que você deve seguir

| Precisa de | Use o padrão de | Nunca faça |
|---|---|---|
| Verificar erro de escrita no banco | `const { error } = await supabase…; if (error) throw error;` | `await supabase…` solto — **o cliente não lança**, você nunca saberá que falhou |
| Autenticação em edge function | `supabase/functions/verify-voice/index.ts:24-27` (`auth.getUser()` + 401) | criar o cliente com `SUPABASE_SERVICE_ROLE_KEY` e repassar o `Authorization` do request |
| Comparar segredo | `supabase/functions/_shared/constant-time.ts` (`mesmaString`) | `===` / `!==` em token |
| CORS em edge function | `buildCorsHeaders(req)` de `_shared/cors.ts` | `corsHeaders` (deprecated, origem fixa) |
| Validar corpo de request | `_shared/validator.ts` (Zod, envelope `{ code, message, fields }`) | `await req.json()` direto |
| Limitar egress | `_shared/allowed-hosts.ts` | `fetch` com URL vinda do corpo |
| Número vindo de texto | `@/lib/safe-number` (`safeParseInt`/`safeParseFloat`) | `parseInt`/`parseFloat` — é `error` no ESLint e o primeiro guard do CI |
| Lock otimista | enviar `version` no update (gatilho `enforce_optimistic_lock`) | atualizar sem `version` — o gatilho não detecta nada |
| Estado vazio num indicador | estado honesto ("sem dados") | tratar ausência de amostra como 100% ou "saudável" |

### Três armadilhas que já custaram caro neste repositório

1. **Detector de import ingênuo.** Antes de declarar algo "órfão" ou "código morto", procure por `lazy(() => import(...))`, `await import('@/...')`, import multilinha e re-export por barrel. Uma auditoria anterior classificou 104 páginas roteadas como mortas por causa disso.
2. **O inventário gerado tem falso positivo.** `inventario/estado/rotas.json` declara `src/pages/admin/SecurityAuditDashboard.tsx` como página órfã, e ela está roteada em `protectedRoutes.tsx:85,197` (A-113). Confirme no código antes de agir sobre qualquer inventário.
3. **Teste verde não prova nada aqui.** 29 arquivos de teste não importam uma linha de produção (A-048), e pelo menos quatro passam porque mockam um comportamento que o código real não tem. Se uma etapa diz que um teste está errado, ele está.

### O que não está verificável nesta sessão (e provavelmente nem na sua)

Não há MCP de SQL para o projeto oficial `cfmlmcdyjuotqobjapng` e o host é bloqueado pela rede do ambiente de nuvem. **Nenhum veredito sobre o banco vivo** — dados, RLS efetiva, grants de função, `pg_cron`, quais das 241 migrations estão aplicadas — foi verificado. Toda etapa que depende disso traz, no campo `Como verificar`, a consulta SQL exata para o dono (ou você, se tiver acesso) rodar. Se você também não tiver acesso, **entregue a etapa com a consulta anotada e marque como `[~] parcial`** — não invente o estado do banco.

### Formato de cada etapa

Todos os campos vêm preenchidos. O campo **Caminho recomendado** é o mais importante: ele diz por onde começar, qual arquivo do próprio repositório serve de referência, e qual atalho tentador evitar.

---

## Mapa das ondas

| Onda | Tema | Etapas | Por quê nesta posição |
|---|---|---|---|
| **1** | Segurança e risco de perda de dado | 001–055 | furo aberto não espera; e o CI precisa parar de aprovar furo |
| **2** | Fluxos principais quebrados | 056–100 | a chamada não é gravada: sem isso, nada mais mede nada |
| **3** | Integridade de dados e regras de negócio | 101–150 | com o dado entrando, as regras precisam estar certas |
| **4** | Funcionalidades incompletas | 151–180 | backend pronto sem consumidor — ligar o fio é o trabalho todo |
| **5** | Robustez: erros, estados, concorrência | 181–235 | o sistema para de mentir sobre o que deu errado |
| **6** | Performance | 236–258 | otimizar antes de corrigir é otimizar o errado |
| **7** | Experiência de uso e consistência | 259–281 | acabamento, mais a única camada que esta auditoria não cobriu (navegador) |
| **8** | Higiene: código morto, CI, observabilidade | 282–300 | deixa o próximo trabalho mais barato |

**Cobertura:** as 300 etapas resolvem **os 133 achados** de `03-ACHADOS.md` — os 9 Críticos, os 55 Altos, os 51 Médios e os 18 Baixos, cada um referenciado por ao menos uma etapa. O que sobra está listado em **Backlog**, no fim deste arquivo, com a razão de ter ficado fora.

**Etapas que exigem aprovação humana antes do merge:** **107 das 300** (migration ou DDL em produção, `.github/workflows/`, segredos, infraestrutura, deleção de dado, mudança de arquitetura ou de custo). Elas ficam com a PR aberta.

**Oito etapas dependem de uma etapa de número maior** — conferido por análise do grafo (não há nenhum ciclo). Quando chegar numa delas, **faça o par na mesma PR** ou **pule e volte depois**; não trave a execução:

| Etapa | Depende de | Por quê a ordem é essa |
|---|---|---|
| 006 | 040 | trocar a autorização de `auto-scorecard` sem trocar a chave do trigger na mesma PR para o scorecard automático |
| 025 | 030 | configurar cabeçalho no `vercel.json` só tem efeito se a Vercel for a trilha que serve produção |
| 043 | 130 | criar policy nas tabelas `geo_*` exige que o `CREATE TABLE` delas exista (ou guarda de `to_regclass`) |
| 053 | 130–134 | o teste de RLS roda num banco recriado do zero, o que exige as migrations reaplicáveis |
| 081 | 083 | registrar a chamada no Bitrix precisa da fila de reenvio funcionando, senão a falha é silenciosa |
| 086 | 110 | editar cadência precisa enviar `version`, que é o que a 110 estabelece |
| 164 | 205 | ligar "requer follow-up" a `useScheduledCallbacks` antes de a 205 consertar o erro engolido perderia o follow-up |
| 282 | 297 | o gate de dependências só é confiável depois de haver **um** lockfile |

---

# ONDA 1 — Segurança e risco de perda de dado (001–055)

## Etapa 001 — Ligar secret scanning, push protection e Dependabot no repositório público
**Onda / Severidade / Camada:** 1 / Crítica / Infraestrutura
**Achados resolvidos:** A-042
**Problema hoje:** o repositório `adm01-debug/Hello_V3` é **público** (`github_get_repo` → `"visibility": "public"`) com `secret_scanning: disabled`, `secret_scanning_push_protection: disabled`, `dependabot_security_updates: disabled`. `AGENTS.md` afirma que é privado. Se uma chave real for colada num commit, nada bloqueia nem avisa, e o vazamento é imediato e público.
**Causa raiz:** recursos gratuitos para repositório público nunca foram habilitados; o repositório virou público sem revisão de postura.
**Caminho recomendado:** isto é configuração de repositório, não código. Ligue pela API do GitHub (MCP `github_update_repo` com `security_and_analysis`) os quatro: `secret_scanning`, `secret_scanning_push_protection`, `secret_scanning_validity_checks`, `dependabot_security_updates`. **Não** tente resolver isso com um workflow de scanning próprio: o push protection do GitHub bloqueia **antes** do commit entrar, o que um workflow não faz. Depois, pergunte ao dono se o repositório deveria ser público — se a resposta for não, torná-lo privado é mais barato que tudo nesta onda. Registre a resposta no progresso.
**Arquivos e objetos a tocar:** nenhum arquivo; configuração do repositório no GitHub.
**Não tocar / armadilhas:** não altere `AGENTS.md` nesta etapa (é a etapa 288). Ligar push protection pode bloquear pushes legítimos que contenham a chave `anon` em migrations (A-098) — se isso acontecer, **não desligue a proteção**: vá para a etapa 040.
**Depende de:** — · **Libera:** 002, 040, 288
**Risco e como reverter:** risco baixo; reverter é desligar as mesmas flags.
**Precisa de aprovação humana antes do merge:** **sim** (infraestrutura e decisão de visibilidade).
**Como verificar:** `github_get_repo adm01-debug/Hello_V3` → `security_and_analysis.secret_scanning.status == "enabled"` nos quatro campos.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 002 — Revogar o EXECUTE de `record_failed_login` e `record_successful_login` para `anon`
**Onda / Severidade / Camada:** 1 / Crítica / Banco
**Achados resolvidos:** A-019
**Problema hoje:** `supabase/migrations/20260522144442_….sql:39-40` concede `EXECUTE … TO anon` às duas funções. Os corpos (`20251231132751_….sql:90-146` e `:149-167`) são `SECURITY DEFINER`: a primeira incrementa `account_lockouts.failed_attempts` e grava `locked_until` a partir de 5 tentativas; a segunda faz `DELETE FROM public.account_lockouts WHERE email = LOWER(p_email)`. Nenhum `REVOKE` as alcança — `20261122183000_….sql:12` e `20261123000000_….sql:20` as citam explicitamente como preservadas. Sabendo só o e-mail, um estranho trava o acesso de qualquer operador **e** zera o contador para tentar senha sem limite.
**Causa raiz:** o fluxo de login chama as RPCs **antes** de autenticar, então o grant a `anon` foi tratado como requisito. Falta qualquer amarra entre a RPC e uma tentativa de login real.
**Caminho recomendado:** não basta revogar — o login precisa continuar funcionando. Mova a responsabilidade para uma edge function: crie `supabase/functions/login-attempt/index.ts` que (a) recebe `{ email, action: 'check'|'fail'|'success' }`, (b) aplica `checkRateLimitDB` por IP **antes** de qualquer coisa (padrão: `request-password-reset/index.ts:18`), (c) chama as RPCs com `SUPABASE_SERVICE_ROLE_KEY`, (d) devolve só `{ locked, attempts }`. Declare `verify_jwt = false` para ela em `supabase/config.toml` (é pré-login, como as 5 de cron já declaradas em `:10-23`). Só então escreva a migration com `REVOKE EXECUTE … FROM anon`. **Atalho a evitar:** adicionar rate limit dentro da própria função SQL — ela não vê o IP do chamador de forma confiável, e você acabaria limitando por e-mail, que é exatamente o que o atacante controla.
**Arquivos e objetos a tocar:** nova `supabase/functions/login-attempt/index.ts`; `supabase/config.toml`; nova migration `supabase/migrations/<ts>_revoke_anon_login_rpcs.sql`; `src/hooks/useLoginLockout.ts` (passa a invocar a edge).
**Não tocar / armadilhas:** **não** revogue `check_login_lockout` sem substituí-la pelo mesmo caminho — o login para de funcionar. Não mexa nos corpos das duas funções SQL nesta etapa. `20261122183000_….sql:11-13` preservou de propósito o EXECUTE de helpers de papel para `anon` por causa da A-069 — não confunda os dois casos.
**Depende de:** 001 · **Libera:** 003, 205
**Risco e como reverter:** se a edge não estiver no ar quando o REVOKE for aplicado, o login para de registrar tentativa (mas continua funcionando — `useLoginLockout` falha aberto, A-020). Reverter: `GRANT EXECUTE … TO anon` de novo.
**Precisa de aprovação humana antes do merge:** **sim** (DDL em produção).
**Como verificar:** depois do deploy, `POST /functions/v1/login-attempt` com `{email, action:'fail'}` 6 vezes → a 6ª devolve `locked: true`; e no banco: `SELECT has_function_privilege('anon', 'public.record_failed_login(text,text,text)', 'EXECUTE')` → `false`.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 003 — Fazer o bloqueio de login falhar fechado
**Onda / Severidade / Camada:** 1 / Média / Hooks
**Achados resolvidos:** A-020
**Problema hoje:** `src/hooks/useLoginLockout.ts:40-43` e `:56-59` devolvem `{ locked: false, attempts: 0 }` em **qualquer** erro, e `src/pages/Login.tsx:76,82,96` segue adiante. Uma indisponibilidade da RPC desliga a proteção contra força bruta, sem sinal na tela nem no painel.
**Causa raiz:** `catch` que devolve o valor permissivo como se fosse resposta legítima, sem distinguir "não está bloqueado" de "não sei".
**Caminho recomendado:** mude o tipo de retorno para incluir o terceiro estado: `{ locked: boolean; attempts: number; unknown?: true }`. No `catch`, devolva `{ locked: false, attempts: 0, unknown: true }`. Em `Login.tsx`, quando `unknown` for verdadeiro, **bloqueie a tentativa** com mensagem "não foi possível verificar a segurança da conta, tente novamente" e registre no logger. **Atalho a evitar:** trocar `locked: false` por `locked: true` no catch — isso trava todo mundo na primeira oscilação de rede, e o dono vai mandar reverter.
**Arquivos e objetos a tocar:** `src/hooks/useLoginLockout.ts`, `src/pages/Login.tsx`.
**Não tocar / armadilhas:** não mexa no fluxo de `signIn` em si. Há teste de cobertura para este hook — ajuste-o junto, não o delete.
**Depende de:** 002 · **Libera:** —
**Risco e como reverter:** risco baixo e reversível por `git revert`.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** `npx vitest run src/hooks/__tests__/useLoginLockout*` e um teste novo que mocka erro da RPC e afirma `unknown: true` + tentativa bloqueada.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 004 — Exigir autenticação em `search-calls` e parar de usar a service_role
**Onda / Severidade / Camada:** 1 / Crítica / Edge Function
**Achados resolvidos:** A-012
**Problema hoje:** `supabase/functions/search-calls/index.ts:29-33` cria o cliente com `SUPABASE_SERVICE_ROLE_KEY` e injeta `Authorization: authHeader || ''`. Nas 122 linhas não existe `auth.getUser()`, `getClaims()` nem retorno 401. A função lê `call_transcripts_searchable` (texto integral das chamadas) e `call_key_moments`. Com `Authorization` vazio, o papel volta a ser resolvido pelo `apikey` = service_role, o que ignora toda a RLS.
**Causa raiz:** cliente criado com a chave de serviço por conveniência (para não lidar com RLS), com o header do usuário repassado como se isso restaurasse o escopo — e um fallback para string vazia que remove até essa aparência.
**Caminho recomendado:** siga `supabase/functions/verify-voice/index.ts:24-27`. Primeiro: se não houver `Authorization`, devolva **401 imediatamente**, antes de qualquer consulta. Depois crie **dois** clientes: um com `SUPABASE_ANON_KEY` + o `Authorization` do usuário (é com ele que você consulta — a RLS passa a valer) e, se precisar, um com service_role **só** para operação que o usuário legitimamente não pode fazer (neste caso, nenhuma). Troque `corsHeaders` por `buildCorsHeaders(req)` na mesma passada (A-100 lista esta função). **Atalho a evitar:** manter o service_role e adicionar `getUser()` só para checar que existe sessão — isso continua devolvendo dado de outros agentes para qualquer agente logado, que é metade do problema.
**Arquivos e objetos a tocar:** `supabase/functions/search-calls/index.ts`.
**Não tocar / armadilhas:** não altere a validação de entrada de `:10-19` (está correta, usa `_shared/validate.ts`). Não mexa na construção do `tsQuery` (`:39-44`). Depois desta etapa a busca passa a respeitar a RLS: se um agente deixar de ver transcrições que via antes, **isso é a correção funcionando** — não "conserte" relaxando a policy.
**Depende de:** — · **Libera:** 005, 048
**Risco e como reverter:** se a RLS de `call_transcripts_searchable` for mais restritiva do que se espera, a busca pode voltar vazia para todos. Verifique com a consulta abaixo antes de mergear. Reverter por `git revert`.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** `POST /functions/v1/search-calls` sem header `Authorization` → **401**. Com o JWT de um agente → 200 e apenas as chamadas que a RLS daquele agente permite. Consulta de apoio: `SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'call_transcripts_searchable'`.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 005 — Criar o módulo compartilhado de autenticação de edge function
**Onda / Severidade / Camada:** 1 / Alta / Edge Function
**Achados resolvidos:** A-012, A-013, A-014, A-015, A-016, A-017
**Problema hoje:** cada função que verifica o chamador reimplementa a checagem, e seis não verificam nada (A-013 a A-017). Não existe `_shared/auth.ts` — o repositório tem `_shared/cors.ts`, `_shared/validate.ts`, `_shared/validator.ts`, `_shared/constant-time.ts`, `_shared/rate-limit.ts`, `_shared/allowed-hosts.ts`, mas nenhum módulo de autenticação.
**Causa raiz:** ausência de um ponto único, o que fez cada função decidir sozinha — e seis decidirem não decidir.
**Caminho recomendado:** crie `supabase/functions/_shared/auth.ts` exportando três funções, todas devolvendo `Response` de erro pronta ou o contexto:
- `requireUser(req): Promise<{ user, supabase } | Response>` — cria cliente com `SUPABASE_ANON_KEY` + `Authorization` do request, chama `auth.getUser()`, devolve 401 com o envelope de `_shared/validator.ts:17-31` se falhar;
- `requireRole(req, roles: string[])` — chama `requireUser` e depois a RPC `is_admin_user()` / `get_user_role()` (**use as RPCs, não leia `user_roles` direto**: elas já honram `is_active` e `expires_at` desde `20261122250000_….sql`), devolve 403 se não bater;
- `requireCronToken(req, envName)` — lê o bearer e compara com `Deno.env.get(envName)` usando `mesmaString` de `_shared/constant-time.ts`, devolve 401. Copie a forma de `supabase/functions/cleanup-lock-conflicts/index.ts:31`.
Escreva os testes Deno em `supabase/functions/_shared/__tests__/auth_test.ts`, no mesmo estilo dos testes existentes de `_shared`. **Atalho a evitar:** fazer o módulo decodificar o JWT por conta própria para ler o papel do claim — o papel vive em `user_roles` com validade, e o claim pode estar velho.
**Arquivos e objetos a tocar:** novo `supabase/functions/_shared/auth.ts`; novo `supabase/functions/_shared/__tests__/auth_test.ts`.
**Não tocar / armadilhas:** não altere nenhuma função consumidora nesta etapa — as migrações para o módulo são as etapas 006 a 011. Não mexa em `_shared/rate-limit.ts` (é a etapa 012).
**Depende de:** 004 · **Libera:** 006, 007, 008, 009, 010, 011, 044
**Risco e como reverter:** nenhum — arquivo novo sem consumidor até a próxima etapa.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** `deno test -A supabase/functions/_shared/__tests__/auth_test.ts` → todos passam; e `deno check supabase/functions/_shared/auth.ts` → sem erro.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 006 — Exigir token de cron (ou papel de supervisor) em `auto-scorecard`
**Onda / Severidade / Camada:** 1 / Alta / Edge Function
**Achados resolvidos:** A-013
**Problema hoje:** `supabase/functions/auto-scorecard/index.ts:20-31` cria o cliente com service_role e não tem `getUser`, token de cron nem rate limit. Grava `call_scorecards` e `scorecard_responses` (`:128-151`) e gasta crédito de IA (`:81`). O gatilho do banco a chama com a chave `anon` embutida no SQL (`supabase/migrations/20261114090557_….sql:16`) — e a chave `anon` está no bundle público.
**Causa raiz:** a função foi escrita para ser chamada por um trigger do banco, e o trigger não tinha como se autenticar, então ela ficou aberta.
**Caminho recomendado:** dois chamadores legítimos, dois caminhos. (a) Trigger do banco: aceite `requireCronToken(req, 'SCORECARD_CRON_TOKEN')`. (b) Chamada manual de um supervisor: aceite `requireRole(req, ['supervisor','admin'])`. Estrutura: se houver bearer que case com o token, siga; senão, tente o papel; senão, 401. É exatamente o padrão de `data-lake-flush/index.ts:26`. A troca do lado do trigger é a etapa 040 — **esta etapa deve ir junto com ela na mesma PR**, senão o scorecard automático para. Declare `verify_jwt = false` em `supabase/config.toml` (o bearer do Vault não é JWT, e `config.toml:1-8` explica por quê isso é obrigatório).
**Arquivos e objetos a tocar:** `supabase/functions/auto-scorecard/index.ts`; `supabase/config.toml`; (junto com a etapa 040) nova migration que troca a chave embutida por leitura do Vault.
**Não tocar / armadilhas:** não remova a guarda de idempotência de `:34-40` — ela é o que impede o segundo scorecard da mesma sessão. Não mexa no cálculo de score aqui: a divergência de fórmula é a etapa 110.
**Depende de:** 005, 040 · **Libera:** 110
**Risco e como reverter:** se o token não estiver no Vault quando isso for aplicado, o scorecard automático silencia. A verificação abaixo pega isso.
**Precisa de aprovação humana antes do merge:** **sim** (vai junto com migration e segredo).
**Como verificar:** `POST /functions/v1/auto-scorecard` sem bearer → 401; com bearer errado → 401; com o token do Vault → 200. Depois: `SELECT count(*) FROM call_scorecards WHERE created_at > now() - interval '1 day'` cresce após um resumo novo.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 007 — Exigir autenticação de visitante em `chatbot-respond`
**Onda / Severidade / Camada:** 1 / Alta / Edge Function
**Achados resolvidos:** A-014
**Problema hoje:** `supabase/functions/chatbot-respond/index.ts:20-32` não tem nenhuma autenticação. `:70-75` lê o histórico de qualquer `conversation_id`; `:166-175` insere `conversation_messages` com `sender_type: 'bot'`; `:196` muda a prioridade do ticket. O campo `visitor_token` existe na interface (`:7`) e **nunca é verificado**.
**Causa raiz:** o token de visitante foi previsto no contrato e a verificação nunca foi escrita.
**Caminho recomendado:** o chatbot atende visitante anônimo, então `requireUser` não serve. Use o token que já existe: `supabase/functions/chat-widget-session/index.ts` é quem emite a sessão do widget — leia essa função primeiro e verifique **como** o token é gerado e onde é guardado. Em `chatbot-respond`, exija `visitor_token` no corpo, valide-o contra a tabela de sessões do widget **e confirme que a sessão pertence ao `conversation_id` recebido** (é essa amarra que impede ler conversa alheia). Compare com `mesmaString`. Mantenha o `checkRateLimit` que `chat-widget-session:12` já usa. **Atalho a evitar:** validar só que o token existe, sem amarrá-lo à conversa — um visitante legítimo continuaria podendo ler o atendimento de outro.
**Arquivos e objetos a tocar:** `supabase/functions/chatbot-respond/index.ts`.
**Não tocar / armadilhas:** não altere `chat-widget-session` nesta etapa. Se descobrir que o token emitido não é persistido em nenhuma tabela, **pare e registre no progresso** — a etapa passa a depender de uma mudança de arquitetura que precisa do dono.
**Depende de:** 005 · **Libera:** —
**Risco e como reverter:** se o widget em produção não enviar `visitor_token`, o chat para. Verifique no código do widget antes de mergear.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** `POST /functions/v1/chatbot-respond` sem `visitor_token` → 401; com token válido mas `conversation_id` de outra sessão → 403; com os dois casando → 200.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 008 — Exigir papel de staff e limitar tamanho em `embed-kb-article`
**Onda / Severidade / Camada:** 1 / Alta / Edge Function
**Achados resolvidos:** A-015
**Problema hoje:** `supabase/functions/embed-kb-article/index.ts:19-23,52-57` — sem autenticação, sem rate limit, sem limite de tamanho em `text`; faz `update({ embedding }).eq('id', record.id)` em qualquer artigo. Envenenar o embedding faz o chatbot responder errado ao cliente, e cada chamada gasta crédito de IA.
**Causa raiz:** função escrita para ser chamada por um webhook interno do banco e deixada aberta.
**Caminho recomendado:** `requireRole(req, ['supervisor','admin'])` — quem edita a base de conhecimento é staff. Valide o corpo com `_shared/validator.ts`: `record.id` como UUID e `text` com `max` explícito (use 20.000 caracteres; o modelo de embedding tem teto bem menor que isso e o custo é proporcional). Adicione `checkRateLimitDB` por usuário. Se houver um gatilho de banco chamando esta função, ele precisa de token de cron — procure por `embed-kb-article` nas migrations antes de decidir; se não houver, siga só com o papel.
**Arquivos e objetos a tocar:** `supabase/functions/embed-kb-article/index.ts`.
**Não tocar / armadilhas:** não mexa na chamada ao provedor de embedding (`:30`) — o timeout dela é a etapa 247.
**Depende de:** 005 · **Libera:** 247
**Risco e como reverter:** se um gatilho de banco a chamar, os embeddings param de ser atualizados. A busca por `embed-kb-article` nas migrations resolve isso antes.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** sem bearer → 401; com JWT de agente comum → 403; com admin e `text` de 30.000 caracteres → 422 com `fields`; com admin e corpo válido → 200 e `kb_articles.embedding` atualizado.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 009 — Fechar o relay de e-mail aberto em `notify-new-device`
**Onda / Severidade / Camada:** 1 / Alta / Edge Function
**Achados resolvidos:** A-016
**Problema hoje:** `supabase/functions/notify-new-device/index.ts:23-31,59-60,70-78` — sem autenticação, sem rate limit, sem validação de formato; `to: [data.email]` e `${alertReasons.join(", ")}`, `<code>${data.ip}</code>`, `${deviceInfo}` interpolados direto no HTML, usando o remetente verificado da empresa (`RESEND_API_KEY`). Um terceiro envia "alerta de segurança" com aparência oficial para qualquer endereço, com o texto que quiser.
**Causa raiz:** função de notificação interna exposta como endpoint livre, somada a template HTML por concatenação.
**Caminho recomendado:** duas correções na mesma PR, porque uma sem a outra não resolve. (1) **Quem chama:** esta função é disparada por detecção de dispositivo novo, que acontece no servidor — então ela só deve aceitar `requireCronToken(req, 'NOTIFY_INTERNAL_TOKEN')` ou `requireRole(req, ['admin'])`. Encontre o chamador atual (`grep -rn "notify-new-device" src/ supabase/`) e ajuste-o. (2) **O destinatário não vem do corpo:** receba `user_id` e **busque o e-mail no banco** com service_role. Isso elimina a classe inteira do problema — um atacante não escolhe mais o destinatário. (3) Escape o HTML: crie uma função `escapeHtml` local e aplique a todo valor interpolado. **Atalho a evitar:** só adicionar rate limit. Limita o volume, não impede o phishing.
**Arquivos e objetos a tocar:** `supabase/functions/notify-new-device/index.ts`; o chamador que o grep apontar.
**Não tocar / armadilhas:** não mude o template visual do e-mail além do escape. Se o chamador for um trigger de banco, a troca de chamada precisa ir junto com migration → aprovação humana.
**Depende de:** 005 · **Libera:** 010
**Risco e como reverter:** se o chamador não for ajustado na mesma PR, o aviso de dispositivo novo para de ser enviado.
**Precisa de aprovação humana antes do merge:** **sim** se o chamador for um trigger (migration); não, se for só código de edge.
**Como verificar:** sem bearer → 401; com bearer válido e `user_id` existente → 200 e o e-mail chega no endereço **do banco**, não no do corpo; com `ip: "<script>alert(1)</script>"` → o e-mail mostra o texto literal, não executa.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 010 — Fechar o relay de e-mail aberto em `notify-blocked-ip`
**Onda / Severidade / Camada:** 1 / Alta / Edge Function
**Achados resolvidos:** A-016
**Problema hoje:** `supabase/functions/notify-blocked-ip/index.ts:18-26,65-69` — mesma causa da etapa 009: sem autenticação, sem rate limit, e `email`, `ip`, `userAgent` interpolados no HTML.
**Causa raiz:** idem.
**Caminho recomendado:** aplique **exatamente** a mesma solução da etapa 009, reusando o `escapeHtml` que você criou lá (mova-o para `_shared/html.ts` nesta etapa, já que agora há dois consumidores). Aqui o destinatário natural é o administrador: leia `ADMIN_EMAIL` do ambiente em vez de aceitar do corpo. **Atalho a evitar:** duplicar o `escapeHtml` — dois consumidores já justificam o módulo compartilhado, e o repositório tem o hábito (bom) de centralizar em `_shared/`.
**Arquivos e objetos a tocar:** `supabase/functions/notify-blocked-ip/index.ts`; novo `supabase/functions/_shared/html.ts`; `supabase/functions/notify-new-device/index.ts` (passa a importar do módulo).
**Não tocar / armadilhas:** `ADMIN_EMAIL` não está no `.env.example` (A-097) — a etapa 290 documenta; aqui, só confirme que a variável existe no ambiente da edge antes de mergear.
**Depende de:** 009 · **Libera:** 290
**Risco e como reverter:** se `ADMIN_EMAIL` não estiver configurada, o aviso para. Trate ausência com log de erro explícito, não com silêncio.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** sem bearer → 401; com bearer e `userAgent: "<img onerror=...>"` → e-mail mostra texto literal; destinatário é o de `ADMIN_EMAIL`.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 011 — Impedir que um usuário notifique outro em `send-notification`
**Onda / Severidade / Camada:** 1 / Média / Edge Function
**Achados resolvidos:** A-017
**Problema hoje:** `supabase/functions/send-notification/index.ts:37-43` faz `getUser()` só para confirmar que existe sessão; `:96-99` insere com `user_id: payload.user_id` **sem comparar com `user.id` e sem checar papel**. Um agente comum manda notificação com texto e link próprios para qualquer pessoa da empresa, parecendo aviso do sistema.
**Causa raiz:** confundir autenticação (quem é) com autorização (pode fazer isso com este alvo).
**Caminho recomendado:** regra em duas linhas: se `payload.user_id !== user.id`, exija `requireRole(req, ['supervisor','admin'])`; caso contrário, siga. Isso preserva o caso legítimo (um supervisor avisando a equipe) e fecha o de agente para agente. Valide o corpo com `_shared/validator.ts` incluindo `max` em `title` e `message`, e **não aceite HTML** no corpo da notificação.
**Arquivos e objetos a tocar:** `supabase/functions/send-notification/index.ts`.
**Não tocar / armadilhas:** o sino do header passou a ler `notifications` recentemente (commit #157) — não mexa no formato das linhas gravadas, senão a leitura quebra.
**Depende de:** 005 · **Libera:** —
**Risco e como reverter:** baixo.
**Como verificar:** JWT de agente A com `user_id` de B → 403; agente A com o próprio `user_id` → 200; supervisor com `user_id` de B → 200.
**Precisa de aprovação humana antes do merge:** não.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 012 — Fazer o rate limit falhar fechado nos endpoints que gastam dinheiro
**Onda / Severidade / Camada:** 1 / Média / Edge Function
**Achados resolvidos:** A-018
**Problema hoje:** `supabase/functions/_shared/rate-limit.ts:35` e `:58` devolvem `{ allowed: true }` em erro de banco e em exceção — fail-open por decisão explícita, comentada no código. Para endpoints que consomem crédito de IA ou cota de e-mail, isso significa que uma oscilação do banco remove o único freio.
**Causa raiz:** uma política única (fail-open) aplicada a dois tipos muito diferentes de endpoint.
**Caminho recomendado:** não mude o comportamento global — mude-o por chamada. Adicione um parâmetro `{ onError: 'allow' | 'deny' }` com default `'allow'` (preserva todo o comportamento atual) e passe `'deny'` apenas nos endpoints que gastam dinheiro: `auto-scorecard`, `chatbot-respond`, `embed-kb-article`, `notify-blocked-ip`, `notify-new-device`. Mantenha o log de erro em ambos os casos. **Atalho a evitar:** inverter o default para `'deny'` — isso muda o comportamento de ~20 funções de uma vez, incluindo o login, e você não tem como testar todas.
**Arquivos e objetos a tocar:** `supabase/functions/_shared/rate-limit.ts` e as 5 funções listadas.
**Não tocar / armadilhas:** não altere o esquema de `rate_limit_logs` aqui — as policies ausentes são a etapa 029. Não mexa em `validate-geo`, `webauthn-challenge`, `request-password-reset` nem `chat-widget-session`: todas são pré-login, e negar por erro de banco tranca o acesso.
**Depende de:** 006, 007, 008, 009, 010 · **Libera:** —
**Risco e como reverter:** se o banco oscilar, esses 5 endpoints passam a devolver 429 em vez de atender. É o comportamento desejado, mas avise o dono no corpo da PR.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** teste Deno que mocka erro da RPC e afirma `allowed: false` com `onError: 'deny'` e `allowed: true` sem o parâmetro.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 013 — Verificar assinatura HMAC em `whatsapp-inbound`
**Onda / Severidade / Camada:** 1 / Alta / Edge Function
**Achados resolvidos:** A-073
**Problema hoje:** `grep -nE "hmac|signature|getUser|401|verify"` em `supabase/functions/whatsapp-inbound/index.ts` (179 linhas) → **zero ocorrências**. A função usa `SUPABASE_SERVICE_ROLE_KEY` e insere em `conversations`, `conversation_messages` e `contacts`. O comentário de `:1-2` declara que a autenticidade é garantida "pelo contrato de payload". Qualquer pessoa na internet injeta conversas e contatos em nome de qualquer cliente.
**Causa raiz:** webhook de terceiro aceito sem o único mecanismo que prova origem.
**Caminho recomendado:** o repositório **já tem** o padrão certo: leia `supabase/functions/webhook-handler/index.ts`, que valida HMAC. Extraia essa validação para `_shared/webhook-signature.ts` (`verifyHmac(req, rawBody, secretEnvName)`), usando `mesmaString` de `_shared/constant-time.ts` na comparação, e aplique aqui. **Atenção técnica:** você precisa do corpo **cru** para calcular o HMAC — leia `await req.text()` uma vez e faça o `JSON.parse` depois, nunca `await req.json()` antes de validar. O segredo entra como `WAVOIP_WEBHOOK_SECRET` (nome novo; documente na etapa 290). Confirme no painel do provedor qual header e qual algoritmo ele assina antes de escrever — se não conseguir, **pare e pergunte ao dono**, não invente o header.
**Arquivos e objetos a tocar:** novo `supabase/functions/_shared/webhook-signature.ts`; `supabase/functions/whatsapp-inbound/index.ts`.
**Não tocar / armadilhas:** não remova a dedup de `idempotency.ts` — ela continua necessária (etapa 015). Não troque `// edge-public-ok` por outra coisa sem entender que esse comentário é o que silencia a regra R3 do guard de CI (`scripts/audit-edge-functions.ts:98`); depois desta etapa, **remova o comentário** para que o guard volte a cobrar.
**Depende de:** 005 · **Libera:** 014, 015, 044
**Risco e como reverter:** se o segredo estiver errado, **todas** as mensagens de WhatsApp param de entrar. Faça a primeira versão logando "assinatura inválida" e **aceitando** por 24 h (modo observação), confirme nos logs que as assinaturas batem, e só então passe a rejeitar — em duas PRs.
**Precisa de aprovação humana antes do merge:** **sim** (segredo novo).
**Como verificar:** `POST` com corpo válido e assinatura errada → 401 com `{ code: 'invalid_signature' }`; com assinatura correta → 200 e linha em `conversation_messages`.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 014 — Verificar assinatura em `email-inbound`
**Onda / Severidade / Camada:** 1 / Alta / Edge Function
**Achados resolvidos:** A-073
**Problema hoje:** mesma medição da etapa 013 em `supabase/functions/email-inbound/index.ts` (170 linhas): zero verificação. Insere em `conversations`, `email_tickets`, `contacts` e `conversation_messages` com service_role.
**Causa raiz:** idem.
**Caminho recomendado:** reuse `_shared/webhook-signature.ts` da etapa 013, com `EMAIL_WEBHOOK_SECRET`. O mesmo cuidado com o corpo cru vale aqui. Aplique também o rollout em duas fases (observar, depois rejeitar).
**Arquivos e objetos a tocar:** `supabase/functions/email-inbound/index.ts`.
**Não tocar / armadilhas:** não toque na ordem dos inserts nesta etapa — a inversão (conversa antes do ticket) é a etapa 015, e misturar as duas torna impossível saber qual quebrou o quê.
**Depende de:** 013 · **Libera:** 015
**Risco e como reverter:** idem 013 — e-mails param de entrar se o segredo estiver errado.
**Precisa de aprovação humana antes do merge:** **sim** (segredo novo).
**Como verificar:** assinatura errada → 401; correta → 200 e linha em `email_tickets`.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 015 — Tornar `email-inbound` idempotente e parar o laço de 500
**Onda / Severidade / Camada:** 1 / Alta / Edge Function
**Achados resolvidos:** A-074
**Problema hoje:** a conversa é criada em `:104-127`, **antes** do ticket; o ticket colide com `email_tickets.message_id TEXT UNIQUE` (`supabase/migrations/20260417001411_….sql:99`) e `:131-135` faz `if (ticketErr) throw ticketErr` → 500. Como o provedor reentrega em 5xx, o ciclo se repete e cada volta deixa uma conversa duplicada. Sem `message_id`, o UNIQUE nem protege (vários NULL). O `insert` final em `conversation_messages` (`:148`) nem é verificado.
**Causa raiz:** ordem de escrita invertida mais ausência de checagem de reentrega — o UNIQUE do banco virou o detector, e a função trata detecção como erro fatal.
**Caminho recomendado:** inverta a lógica, no mesmo espírito do `detectReplay` que `whatsapp-inbound/idempotency.ts` já implementa: (1) exija `message_id` no corpo (422 se faltar — sem ele não há idempotência possível); (2) **antes de qualquer escrita**, consulte `email_tickets` por `message_id`; se existir, devolva **200** com `{ success: true, idempotent_replay: true, conversation_id }` — o provedor para de reentregar; (3) só então crie conversa e ticket; (4) verifique o `error` do insert em `conversation_messages`. **Atalho a evitar:** trocar o `insert` por `upsert` com `onConflict` — isso silencia a reentrega mas continua criando a conversa duplicada antes, que é o dano real.
**Arquivos e objetos a tocar:** `supabase/functions/email-inbound/index.ts`.
**Não tocar / armadilhas:** não remova o `UNIQUE` do banco — ele é a última linha de defesa. Não mexa no threading por `in_reply_to` (`:46-55`).
**Depende de:** 014 · **Libera:** —
**Risco e como reverter:** baixo; a mudança só adiciona uma consulta antes das escritas.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** enviar o mesmo payload duas vezes → primeira 200 criando ticket, segunda **200** com `idempotent_replay: true` e `SELECT count(*) FROM conversations WHERE external_id = '<message_id>'` = 1.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 016 — Parar de concatenar o telefone no filtro do PostgREST
**Onda / Severidade / Camada:** 1 / Média / Edge Function
**Achados resolvidos:** A-075
**Problema hoje:** `supabase/functions/whatsapp-inbound/index.ts:78-82` monta `.or(\`phone.eq.${fromPhone},phone.eq.${normalizedPhone}\`)` com `fromPhone` validado apenas como `z.string().min(1)` (`schema.ts:5`). Vírgula e expressões como `id.gt.0` alteram a gramática do filtro, e a mensagem de um desconhecido pode ser anexada ao cadastro de outro cliente.
**Causa raiz:** valor externo interpolado numa gramática de consulta, com validação que não restringe o alfabeto.
**Caminho recomendado:** duas camadas. (1) Aperte o schema: `fromPhone: z.string().regex(/^\+?[0-9]{8,15}$/)`. (2) Troque o `.or()` por `.in('phone', [fromPhone, normalizedPhone])` — `in` recebe um array e o cliente faz o escaping, então a gramática deixa de ser montada por concatenação. **Atalho a evitar:** só escapar a vírgula; o conjunto de metacaracteres do PostgREST é maior que isso e muda entre versões.
**Arquivos e objetos a tocar:** `supabase/functions/whatsapp-inbound/index.ts`, `supabase/functions/whatsapp-inbound/schema.ts`.
**Não tocar / armadilhas:** `normalizePhone` (em `idempotency.ts`) continua necessária — não a remova. Procure o mesmo padrão `.or(\`...${...}\`)` em outras edges antes de fechar a etapa e anote os casos no progresso (não corrija aqui).
**Depende de:** 013 · **Libera:** —
**Risco e como reverter:** se algum provedor mandar telefone com formato diferente do regex, a mensagem passa a ser rejeitada. Logue o valor recusado (sem o conteúdo da mensagem) por 48 h antes de considerar fechado.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** teste Deno com `fromPhone: "5511999999999,id.gt.0"` → 422; com `"+5511999999999"` → 200.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 017 — Índice único para a deduplicação de mensagens de WhatsApp
**Onda / Severidade / Camada:** 1 / Média / Banco
**Achados resolvidos:** A-075
**Problema hoje:** a dedup de `whatsapp-inbound/index.ts:42-52` é leitura-e-depois-escrita sobre `conversation_messages.metadata->>'message_id'`, **sem índice único**. Duas reentregas simultâneas passam as duas pela leitura e duplicam a mensagem, inflando `unread_count`.
**Causa raiz:** idempotência implementada em código sem a restrição de banco que a torna atômica.
**Caminho recomendado:** migration com `CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_conversation_messages_msgid ON public.conversation_messages ((metadata->>'message_id')) WHERE metadata->>'message_id' IS NOT NULL;`. O índice **parcial** é essencial: sem o `WHERE`, mensagens sem `message_id` (as de saída, por exemplo) colidiriam entre si no NULL. Depois, em `whatsapp-inbound`, trate violação de unicidade como reentrega (devolva 200 com `idempotent_replay`), não como erro. **Atenção:** `CREATE INDEX CONCURRENTLY` **não roda dentro de transação** — e o CLI do Supabase envolve cada migration numa. Se o apply falhar por isso, crie o índice sem `CONCURRENTLY` (a tabela é pequena hoje) e registre a decisão no corpo da PR.
**Arquivos e objetos a tocar:** nova migration `supabase/migrations/<ts>_unique_conversation_message_id.sql`; `supabase/functions/whatsapp-inbound/index.ts`.
**Não tocar / armadilhas:** antes de criar o índice, **verifique se já existem duplicatas** — se existirem, o `CREATE UNIQUE INDEX` falha. A consulta está em "Como verificar".
**Depende de:** 013 · **Libera:** —
**Risco e como reverter:** se houver duplicatas, a migration aborta (sem dano). Reverter: `DROP INDEX`.
**Precisa de aprovação humana antes do merge:** **sim** (DDL em produção).
**Como verificar:** antes — `SELECT metadata->>'message_id' AS mid, count(*) FROM conversation_messages WHERE metadata->>'message_id' IS NOT NULL GROUP BY 1 HAVING count(*) > 1` → deve vir vazio. Depois — `SELECT indexname FROM pg_indexes WHERE tablename='conversation_messages' AND indexname='idx_conversation_messages_msgid'` → 1 linha.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 018 — Substituir o XOR por criptografia real nas senhas de tronco SIP
**Onda / Severidade / Camada:** 1 / Crítica / Edge Function + Banco
**Achados resolvidos:** A-070
**Problema hoje:** `supabase/functions/sip-config/index.ts:5-13` usa `SUPABASE_SERVICE_ROLE_KEY` como chave de um XOR byte a byte, com fallback para a constante literal `"fallback-key"`. Mesma causa em `voip-trunks-manage/index.ts:7-22` e `ldap-sync/index.ts:48-60`. Três consequências: (a) XOR de chave repetida não é cifra — o prefixo do JWT (`eyJhbGciOi…`) é texto conhecido, então os primeiros bytes da chave saem de qualquer ciphertext; (b) rotacionar a service_role torna **todas** as senhas ilegíveis e derruba a telefonia; (c) sem a variável, cifra com uma constante pública.
**Causa raiz:** criptografia escrita à mão por falta de um lugar para guardar chave — e a credencial mais poderosa do projeto usada como chave.
**Caminho recomendado:** **não escreva outra cifra.** O Supabase já tem o cofre: use `vault.create_secret()` / `vault.decrypted_secrets` para guardar a senha de cada tronco, e troque a coluna `sip_password` por uma referência ao id do segredo. Ordem: (1) migration que adiciona `sip_password_secret_id UUID` (mantendo a coluna antiga por enquanto); (2) `voip-trunks-manage` passa a gravar no Vault e a preencher o novo campo; (3) `sip-config` passa a ler do Vault; (4) uma migration de backfill que move as senhas existentes (só o dono pode rodar, pois exige decifrar com a chave atual); (5) só depois, uma migration que apaga a coluna antiga. **São 5 PRs, nesta ordem** — etapas 018 a 022. Esta etapa é a (1). **Atalho a evitar:** trocar XOR por AES-GCM com a chave numa variável de ambiente nova. Funciona, mas continua com o problema (b) de outra forma, e o Vault já está disponível e é auditável.
**Arquivos e objetos a tocar:** nova migration `supabase/migrations/<ts>_trunk_password_vault_column.sql`.
**Não tocar / armadilhas:** **não** apague `sip_password` nesta etapa — as senhas atuais só existem lá. Não altere nenhuma edge nesta PR.
**Depende de:** — · **Libera:** 019, 020, 021, 022
**Risco e como reverter:** nenhum — adiciona coluna nullable. Reverter: `DROP COLUMN`.
**Precisa de aprovação humana antes do merge:** **sim** (DDL em produção).
**Como verificar:** `SELECT column_name FROM information_schema.columns WHERE table_name='voip_trunks' AND column_name='sip_password_secret_id'` → 1 linha.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 019 — `voip-trunks-manage` grava a senha no Vault
**Onda / Severidade / Camada:** 1 / Crítica / Edge Function
**Achados resolvidos:** A-070
**Problema hoje:** `supabase/functions/voip-trunks-manage/index.ts:7-22` cifra com XOR na escrita.
**Causa raiz:** ver etapa 018.
**Caminho recomendado:** ao criar ou atualizar um tronco com senha, chame `vault.create_secret(<senha>, 'trunk_<id>_sip_password')` via RPC e grave o id retornado em `sip_password_secret_id`. Continue gravando a coluna antiga **em paralelo** nesta etapa (escrita dupla), para que `sip-config` siga funcionando até a etapa 020. Valide o corpo com `_shared/validator.ts` na mesma passada (a função está na lista da A-129).
**Arquivos e objetos a tocar:** `supabase/functions/voip-trunks-manage/index.ts`.
**Não tocar / armadilhas:** não remova a função `encrypt` ainda — ela alimenta a escrita dupla. A remoção é a etapa 022.
**Depende de:** 018 · **Libera:** 020
**Risco e como reverter:** se a RPC do Vault não estiver acessível à edge, a criação de tronco falha. Teste com um tronco descartável antes.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** criar um tronco de teste → `SELECT sip_password_secret_id FROM voip_trunks WHERE name='<teste>'` não é nulo, e `SELECT name FROM vault.secrets WHERE name = 'trunk_<id>_sip_password'` → 1 linha.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 020 — `sip-config` lê a senha do Vault e para de devolver senha em claro a quem não deve
**Onda / Severidade / Camada:** 1 / Crítica / Edge Function
**Achados resolvidos:** A-070
**Problema hoje:** além do XOR (`:5-13`), `supabase/functions/sip-config/index.ts:104-123` devolve `SIP_SERVER`/`SIP_USERNAME`/`SIP_PASSWORD` do ambiente a **qualquer usuário autenticado** quando o agente não tem tronco atribuído, e `:144-146` devolve a senha em claro (no `catch`, devolve o próprio ciphertext como se fosse senha).
**Causa raiz:** fallback de conveniência que entrega a credencial compartilhada para quem não tem tronco, somado à decifra caseira.
**Caminho recomendado:** (1) leia `sip_password_secret_id` e busque em `vault.decrypted_secrets`; (2) **remova o fallback de `:104-123`** — se o agente não tem tronco atribuído, devolva `404` com "nenhum tronco atribuído a este ramal", não a credencial mestre; (3) no `catch`, devolva 500 sem corpo sensível, nunca o ciphertext. Confirme com o dono se algum agente em produção depende do fallback (consulta em "Como verificar") **antes** de removê-lo.
**Arquivos e objetos a tocar:** `supabase/functions/sip-config/index.ts`.
**Não tocar / armadilhas:** esta é a etapa que pode derrubar o softphone de quem hoje usa o fallback. Rode a consulta de verificação primeiro.
**Depende de:** 019 · **Libera:** 021
**Risco e como reverter:** alto se houver agentes sem tronco atribuído usando o fallback. Reverter por `git revert` restaura o comportamento antigo imediatamente.
**Precisa de aprovação humana antes do merge:** **sim** (pode interromper telefonia).
**Como verificar:** antes — `SELECT count(*) FROM agents a LEFT JOIN voip_trunks t ON … WHERE t.id IS NULL` (quantos agentes ficariam sem credencial). Depois — agente **com** tronco recebe a senha correta do Vault; agente **sem** tronco recebe 404.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 021 — Migrar as senhas de tronco existentes para o Vault
**Onda / Severidade / Camada:** 1 / Crítica / Banco
**Achados resolvidos:** A-070
**Problema hoje:** as senhas dos troncos já cadastrados existem **só** na coluna `sip_password`, cifradas com XOR pela service_role atual. Se a chave for rotacionada antes desta etapa, elas se perdem.
**Causa raiz:** ver etapa 018.
**Caminho recomendado:** esta é a única etapa do bloco que o agente **não deve executar sozinho**: ela exige decifrar com a chave viva. Entregue à PR um script idempotente em `scripts/migracao-vault-trunks/` com README, que (a) lista os troncos com `sip_password_secret_id IS NULL`, (b) decifra com a função XOR atual, (c) grava no Vault, (d) preenche o id, (e) **não** apaga nada, e (f) imprime um relatório por tronco. O dono roda. **Atalho a evitar:** fazer isso dentro de uma migration SQL — a função de decifra está em TypeScript, e reimplementá-la em plpgsql multiplica a chance de corromper a senha.
**Arquivos e objetos a tocar:** novo `scripts/migracao-vault-trunks/migrar.mjs` + `README.md`.
**Não tocar / armadilhas:** o script **não** deve ter host de produção como fallback — exija `SUPABASE_DB_URL` e falhe sem ela (é exatamente o erro da A-115). Nunca imprima a senha.
**Depende de:** 020 · **Libera:** 022
**Risco e como reverter:** se a decifra produzir lixo, o tronco para de registrar. O script deve validar que o resultado é ASCII imprimível antes de gravar, e pular (com aviso) o que não for.
**Precisa de aprovação humana antes do merge:** **sim** (toca credencial de produção).
**Como verificar:** depois de o dono rodar: `SELECT count(*) FROM voip_trunks WHERE sip_password IS NOT NULL AND sip_password_secret_id IS NULL` → 0. E um registro SIP real de teste funciona.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 022 — Remover o XOR e a coluna antiga de senha
**Onda / Severidade / Camada:** 1 / Alta / Edge Function + Banco
**Achados resolvidos:** A-070
**Problema hoje:** depois de 018–021, o XOR e a coluna `sip_password` continuam no código e no schema, prontos para serem reusados por engano.
**Causa raiz:** ver etapa 018.
**Caminho recomendado:** apague as funções `encrypt`/`decrypt` de `sip-config` e `voip-trunks-manage`, remova a escrita dupla da etapa 019, e só então a migration `ALTER TABLE public.voip_trunks DROP COLUMN sip_password`. Faça o mesmo com `ldap-sync/index.ts:48-60` (`xorCipher`/`xorDecipher`) — a senha de bind LDAP segue o mesmo caminho de Vault.
**Arquivos e objetos a tocar:** `supabase/functions/sip-config/index.ts`, `supabase/functions/voip-trunks-manage/index.ts`, `supabase/functions/ldap-sync/index.ts`, nova migration.
**Não tocar / armadilhas:** **só execute depois de confirmar a verificação da etapa 021 com 0 pendentes.** Dropar a coluna é irreversível sem backup.
**Depende de:** 021 · **Libera:** —
**Risco e como reverter:** irreversível (perda da senha cifrada antiga). Peça ao dono um dump da coluna antes.
**Precisa de aprovação humana antes do merge:** **sim** (deleção de dado).
**Como verificar:** `grep -rn "xor\|fallback-key" supabase/functions/` → vazio; `SELECT column_name FROM information_schema.columns WHERE table_name='voip_trunks' AND column_name='sip_password'` → 0 linhas; softphone registra normalmente.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 023 — Trocar a service_role por token dedicado em `voip-failover-notifier`
**Onda / Severidade / Camada:** 1 / Média / Edge Function
**Achados resolvidos:** A-071
**Problema hoje:** `supabase/functions/voip-failover-notifier/index.ts:16-21` monta `expected = \`Bearer ${supabaseKey}\`` e compara com `!==` — comparação que sai no primeiro byte diferente, permitindo medir o tempo. E a credencial usada é a chave mestra do projeto, mandada no header pelo emissor (`voip-trunks-healthcheck/index.ts:125-129`).
**Causa raiz:** falta de um token próprio para comunicação entre edges, resolvida reusando a credencial que já estava à mão.
**Caminho recomendado:** use `requireCronToken(req, 'FAILOVER_NOTIFY_TOKEN')` do módulo da etapa 005 (que já compara com `mesmaString`). Gere o token, guarde no Vault e nos secrets da edge, e ajuste `voip-trunks-healthcheck:125-129` para enviá-lo. Na mesma passada, conserte o `fetch` sem `await` que está logo ali — hoje o aviso de failover pode nem sair.
**Arquivos e objetos a tocar:** `supabase/functions/voip-failover-notifier/index.ts`, `supabase/functions/voip-trunks-healthcheck/index.ts`.
**Não tocar / armadilhas:** o `fetch` sem `await` é intencional em código que não quer bloquear — mas aqui ele está **depois** da resposta, então a função pode encerrar antes de o aviso sair. Use `await`.
**Depende de:** 005 · **Libera:** —
**Risco e como reverter:** se o token não estiver configurado, o aviso de failover para.
**Precisa de aprovação humana antes do merge:** **sim** (segredo novo).
**Como verificar:** bearer da service_role → **401** (não é mais aceito); bearer do token novo → 200; forçar um failover de teste gera notificação.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 024 — Tirar a credencial TURN do bundle do navegador
**Onda / Severidade / Camada:** 1 / Média / Frontend + Edge Function
**Achados resolvidos:** A-072
**Problema hoje:** `src/lib/webrtc-config.ts:11-17` lê `VITE_TURN_URL`, `VITE_TURN_USER` e `VITE_TURN_CRED`. Variável `VITE_*` é substituída em tempo de build: a credencial vai no JavaScript público. Quem a copiar usa o relay por conta da empresa.
**Causa raiz:** credencial estática onde o protocolo prevê credencial efêmera.
**Caminho recomendado:** o padrão do TURN (RFC 8489) é credencial temporária derivada de um segredo compartilhado. Crie `supabase/functions/turn-credentials/index.ts` que exige `requireUser` e devolve `{ urls, username: "<expiry>:<uid>", credential: HMAC-SHA1(segredo, username) }` com validade curta (1 h). No front, `getIceServers()` passa a ser `async` e chama a edge; mantenha os STUN públicos como estão (não precisam de credencial). Se o provedor de TURN não suportar credencial efêmera, a alternativa é servir a credencial estática pela edge autenticada — pior, mas ainda melhor que no bundle; nesse caso registre a limitação no corpo da PR.
**Arquivos e objetos a tocar:** novo `supabase/functions/turn-credentials/index.ts`; `src/lib/webrtc-config.ts`; os chamadores de `getIceServers()`.
**Não tocar / armadilhas:** tornar `getIceServers` assíncrona muda a assinatura — rode `npx tsc --noEmit` para achar todos os chamadores em vez de confiar no grep. Há teste para este módulo (`webrtc-config.test.ts`) que carrega o alvo dinamicamente; ajuste-o.
**Depende de:** 005 · **Libera:** —
**Risco e como reverter:** se a edge falhar, o WebRTC perde o relay e chamadas atrás de NAT simétrico não completam. Faça `getIceServers` degradar para só STUN com log de aviso, nunca lançar.
**Precisa de aprovação humana antes do merge:** **sim** (segredo novo).
**Como verificar:** `grep -r "VITE_TURN" dist/` depois do build → **vazio**; e `POST /functions/v1/turn-credentials` sem bearer → 401, com bearer → credencial com `username` contendo timestamp futuro.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 025 — Cabeçalhos de segurança no deploy
**Onda / Severidade / Camada:** 1 / Alta / Infraestrutura
**Achados resolvidos:** A-099
**Problema hoje:** `vercel.json` tem 3 linhas, só um `rewrite`; nenhum bloco `headers`. `index.html` não tem meta de CSP. A aplicação pode ser embutida em iframe de terceiro e não tem CSP nem HSTS.
**Causa raiz:** os 17 módulos de `src/lib/security/` foram escritos como se houvesse um servidor Node com helmet; numa SPA estática os cabeçalhos só podem vir da plataforma, e nunca foram configurados lá.
**Caminho recomendado:** adicione um bloco `headers` em `vercel.json` para `/(.*)`, com: `Strict-Transport-Security: max-age=63072000; includeSubDomains`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` liberando só `microphone=(self)` e `camera=(self)` (o produto precisa de microfone). A **CSP vai numa etapa separada** (026) porque é a única que pode quebrar a aplicação. Antes de escrever, confirme com o dono qual trilha serve produção (A-101, etapa 030) — se for o Lovable, `vercel.json` não tem efeito e a configuração é outra. **Atalho a evitar:** colocar CSP por `<meta>` no `index.html`: `frame-ancestors` e HSTS **não funcionam** por meta tag.
**Arquivos e objetos a tocar:** `vercel.json`.
**Não tocar / armadilhas:** não toque em `src/lib/security/` aqui (é a etapa 295). `X-Frame-Options: DENY` quebra qualquer incorporação legítima — pergunte ao dono se o produto é embutido em algum lugar (o widget de chat é servido de onde?).
**Depende de:** 030 · **Libera:** 026
**Risco e como reverter:** médio. Reverter é remover o bloco.
**Precisa de aprovação humana antes do merge:** **sim** (infraestrutura).
**Como verificar:** `curl -sI https://<dominio>/ | grep -iE "strict-transport|x-frame|x-content-type|referrer-policy"` → as quatro presentes.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 026 — Content-Security-Policy em modo somente-relatório, depois bloqueante
**Onda / Severidade / Camada:** 1 / Alta / Infraestrutura
**Achados resolvidos:** A-099
**Problema hoje:** nenhuma CSP é servida.
**Causa raiz:** idem 025.
**Caminho recomendado:** duas PRs. Primeiro `Content-Security-Policy-Report-Only` com uma política derivada do que a aplicação realmente usa: `default-src 'self'`; `connect-src 'self' https://cfmlmcdyjuotqobjapng.supabase.co wss://cfmlmcdyjuotqobjapng.supabase.co` mais o host de TURN; `img-src 'self' data: blob:`; `media-src 'self' blob:`; `script-src 'self'`; `style-src 'self' 'unsafe-inline'` (o Tailwind injeta estilo inline — sem isso a interface quebra); `frame-ancestors 'none'`. Deixe em report-only por uma semana, colete as violações e só então promova a bloqueante, em **outra** PR. **Atalho a evitar:** publicar a política bloqueante de primeira — você não tem como enumerar à mão todos os hosts que `jspdf`, `html2canvas`, `recharts` e o WebRTC tocam.
**Arquivos e objetos a tocar:** `vercel.json`.
**Não tocar / armadilhas:** o endpoint de relatório precisa existir, senão o report-only não informa nada; use `report-uri` apontando para uma edge simples, ou combine com o dono que a coleta será pelo console do navegador.
**Depende de:** 025 · **Libera:** —
**Risco e como reverter:** alto se promovida cedo demais — a aplicação para de carregar recurso. Reverter: remover o header.
**Precisa de aprovação humana antes do merge:** **sim** (infraestrutura).
**Como verificar:** `curl -sI https://<dominio>/ | grep -i content-security-policy-report-only` presente; e o console do navegador, com a aplicação em uso normal (discar, abrir relatório, exportar PDF), não registra violação antes de promover.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 027 — Restringir o CORS a origens conhecidas
**Onda / Severidade / Camada:** 1 / Média / Edge Function
**Achados resolvidos:** A-100
**Problema hoje:** `supabase/functions/_shared/cors.ts:29` aceita **qualquer** `https://<nome>.lovable.app` por regex. Qualquer pessoa com um projeto na Lovable tem esse subdomínio e fala com as edges pelo navegador do funcionário.
**Causa raiz:** o preview da Lovable gera subdomínio variável, e o regex foi a saída mais rápida.
**Caminho recomendado:** substitua o regex por uma lista explícita, alimentada por `CORS_EXTRA_ORIGINS` (que já existe, `:17-20`). Coloque os previews reais nessa variável de ambiente em vez de aceitar o domínio inteiro. **Antes de mergear**, confirme com o dono quais previews estão em uso, senão o ambiente de desenvolvimento dele para. Troque também o fallback de `:30` (`return ALLOWED_ORIGINS[0]`) por **não emitir** o header quando a origem não for reconhecida — devolver uma origem fixa para quem não é dela mascara erro de configuração.
**Arquivos e objetos a tocar:** `supabase/functions/_shared/cors.ts`.
**Não tocar / armadilhas:** não remova `http://localhost:*` da lista (quebra o desenvolvimento). Depois desta etapa, as 16 funções da etapa 028 continuam com origem fixa — ela é que resolve isso.
**Depende de:** — · **Libera:** 028
**Risco e como reverter:** se um preview em uso ficar de fora, as chamadas de edge param naquele ambiente. Reverter por `git revert`.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** `curl -i -X OPTIONS <edge> -H "Origin: https://qualquer-coisa.lovable.app"` → **sem** `Access-Control-Allow-Origin`; com uma origem da lista → header presente e igual à origem enviada.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 028 — Migrar as 16 edges que ainda respondem com origem fixa
**Onda / Severidade / Camada:** 1 / Média / Edge Function
**Achados resolvidos:** A-100
**Problema hoje:** 16 funções usam `corsHeaders` (deprecated, construído **sem** `req`, logo origem fixa `hello-v3.vercel.app`): `analyze-talk-ratio`, `auto-scorecard`, `compute-adherence`, `compute-deal-health`, `data-lake-flush`, `detect-key-moments`, `dialer-pacing-tick`, `forecast-call-volume`, `forecast-deals`, `generate-coaching-plan`, `generate-meeting-summary`, `global-load-test`, `score-call`, `search-calls`, `teams-fetch-recordings`, `voip-load-test`. **Se a trilha que serve produção for a do Lovable, essas 16 funcionalidades quebram no navegador por CORS.**
**Causa raiz:** `corsHeaders` foi marcado deprecated (`_shared/cors.ts:43`) e 16 consumidores nunca migraram.
**Caminho recomendado:** troque `corsHeaders` por `buildCorsHeaders(req)` nas 16, uma por uma, verificando que a variável `req` está no escopo (nas funções de cron o handler recebe `req` normalmente). É mudança mecânica, mas **faça em 2 ou 3 PRs agrupadas por área** (cron, IA, voip) para que uma falha não obrigue a reverter as 16. Depois, **remova o export `corsHeaders`** de `_shared/cors.ts` para que ninguém mais o use — o type-check acusa qualquer sobra.
**Arquivos e objetos a tocar:** as 16 `index.ts` listadas; `supabase/functions/_shared/cors.ts` (remoção do export, só na última PR).
**Não tocar / armadilhas:** 7 dessas funções estão no baseline do guard como `R4-cors` (A-040) — depois de corrigi-las, a etapa 044 remove as entradas do baseline. Não remova o export antes de migrar todas: `deno check` falha.
**Depende de:** 027 · **Libera:** 044
**Risco e como reverter:** baixo e mecânico.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** `grep -rln "corsHeaders" supabase/functions/*/index.ts | xargs grep -L buildCorsHeaders` → vazio. E `deno check` em cada função tocada.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 029 — Policies de UPDATE e DELETE para `rate_limit_logs`
**Onda / Severidade / Camada:** 1 / Alta / Banco
**Achados resolvidos:** A-065
**Problema hoje:** o estado líquido das policies de `rate_limit_logs` é **3 de INSERT e 1 de SELECT; nenhuma de UPDATE ou DELETE** (medido com `grep "ON public.rate_limit_logs" supabase/migrations/*.sql | grep -oE "FOR (SELECT|INSERT|UPDATE|DELETE|ALL)"`). Mas `src/hooks/useRateLimitData.ts:100` faz `.update({ is_blocked: false })` e `:111` faz `.delete()`, ambos pelo cliente do navegador (onde a RLS vale), e os dois exibem `toast.success`. **RLS sem policy não devolve erro: devolve 0 linhas afetadas.** O admin clica "desbloquear IP", vê a confirmação, e o IP continua bloqueado.
**Causa raiz:** policies criadas só para as operações que existiam quando a tabela nasceu; a tela ganhou ações depois.
**Caminho recomendado:** migration com duas policies restritas a admin, no padrão do repositório (`FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin())` e `FOR DELETE TO authenticated USING (public.is_admin())`). **Declare a cláusula `TO authenticated`** — 263 policies do repositório a omitem (A-069) e você não vai aumentar essa conta. Use `is_admin()`, não `is_admin_or_supervisor()`: desbloquear IP e apagar log de segurança é ação de administrador. Na mesma PR, corrija os dois `toast.success` para checarem o resultado (ver etapa 030).
**Arquivos e objetos a tocar:** nova migration `supabase/migrations/<ts>_rate_limit_logs_write_policies.sql`.
**Não tocar / armadilhas:** não use `FOR ALL` — isso sobrepõe as policies de SELECT/INSERT existentes e muda o comportamento de leitura. `is_admin()` é `VOLATILE` hoje (A-090); a etapa 101 corrige isso e vai melhorar o desempenho destas policies também.
**Depende de:** — · **Libera:** 030, 101
**Risco e como reverter:** baixo. Reverter: `DROP POLICY`.
**Precisa de aprovação humana antes do merge:** **sim** (DDL em produção).
**Como verificar:** `SELECT policyname, cmd, roles FROM pg_policies WHERE tablename='rate_limit_logs'` → 6 linhas, incluindo UPDATE e DELETE com `{authenticated}`. Depois, como admin, desbloquear um IP e conferir `SELECT is_blocked FROM rate_limit_logs WHERE ip_address = '<ip>'` → `false`.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 030 — Descobrir e documentar qual trilha serve produção
**Onda / Severidade / Camada:** 1 / Média / Infraestrutura
**Achados resolvidos:** A-101
**Problema hoje:** o repositório declara `homepage: https://hello-v3.vercel.app` e tem `vercel.json`; `AGENTS.md` diz que o Lovable commita direto na `main` e que há **duas** trilhas de publicação. Qual serve produção é desconhecido. Sem isso, as etapas 025, 026 e 028 podem não ter efeito nenhum, e nenhuma afirmação de "deploy confirmado" tem lastro.
**Causa raiz:** duas plataformas de publicação conectadas ao mesmo repositório, sem documento que diga qual é a oficial.
**Caminho recomendado:** não é uma etapa de código — é de apuração, e ela destrava três outras. Faça, nesta ordem: (1) pergunte ao dono qual URL ele e os usuários abrem; (2) confira no painel da Vercel se o projeto `hello-v3` existe e qual domínio tem (a conta conectada a esta sessão devolveu `projects: []`, que é escopo diferente, não ausência); (3) `curl -sI` no domínio que o dono informar e veja o header `server`/`x-vercel-id` para confirmar quem serve; (4) escreva a resposta em `docs/agentes/lovable-deploy.md`, com data e evidência. Se as duas trilhas estiverem ativas, registre as duas e qual é a canônica.
**Arquivos e objetos a tocar:** `docs/agentes/lovable-deploy.md`.
**Não tocar / armadilhas:** não desligue nenhuma das trilhas por conta própria — isso é decisão e custo do dono.
**Depende de:** — · **Libera:** 025, 026, 028
**Risco e como reverter:** nenhum (documentação).
**Precisa de aprovação humana antes do merge:** não (mas depende de resposta do dono).
**Como verificar:** o documento cita a URL, a data e a saída do `curl -sI` que a comprova.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 031 — Parar de revelar a existência da conta no pedido de reset de senha
**Onda / Severidade / Camada:** 1 / Baixa / Edge Function
**Achados resolvidos:** A-021
**Problema hoje:** `supabase/functions/request-password-reset/index.ts` responde corretamente de forma genérica para conta inexistente ("Se o email existir, uma solicitação será enviada para aprovação."), mas `:77-82` devolve **"Já existe uma solicitação pendente. Aguarde a aprovação de um administrador."** — o que confirma que a conta existe.
**Causa raiz:** mensagem útil para o usuário legítimo escrita sem considerar que ela distingue os dois casos.
**Caminho recomendado:** devolva a **mesma** mensagem genérica nos três caminhos (conta inexistente, pedido pendente, pedido criado) e mova a informação útil para o e-mail, que só chega a quem é dono da caixa. Mantenha o `status: 200` nos três para não distinguir por código. Se o dono quiser o aviso de "já existe pendente", ele pode ir no e-mail.
**Arquivos e objetos a tocar:** `supabase/functions/request-password-reset/index.ts`.
**Não tocar / armadilhas:** não remova a consulta de `:69-75` — ela continua necessária para não criar pedido duplicado; só a **resposta** muda.
**Depende de:** — · **Libera:** —
**Risco e como reverter:** nenhum.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** `POST` com e-mail inexistente, com e-mail que tem pedido pendente e com e-mail novo → **as três respostas idênticas**, byte a byte.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 032 — Verificar e atualizar o contador do autenticador no login por passkey
**Onda / Severidade / Camada:** 1 / Baixa / Edge Function
**Achados resolvidos:** A-022
**Problema hoje:** `supabase/functions/webauthn-authenticate/index.ts:44-48` seleciona `counter` e a coluna **não aparece em mais nenhuma linha do arquivo** — não é comparada nem atualizada. O contador monotônico é o sinal anti-clonagem do WebAuthn: sem ele, um autenticador clonado não é detectado.
**Causa raiz:** o campo foi previsto no schema e lido na consulta, e a regra nunca foi escrita.
**Caminho recomendado:** depois de `verify.ts` validar a assertion, leia o `signCount` da resposta do autenticador: se for **menor ou igual** ao `counter` guardado (e ambos diferentes de zero), **recuse com 401** e registre em `audit_logs` o evento de possível clonagem; se for maior, atualize a coluna. A exceção é autenticador que sempre devolve zero (alguns Apple/Windows Hello fazem isso): nesse caso não compare, apenas registre. Documente essa exceção em comentário, porque é contraintuitiva.
**Arquivos e objetos a tocar:** `supabase/functions/webauthn-authenticate/index.ts`.
**Não tocar / armadilhas:** não mexa em `verify.ts` (a validação de desafio e origem está correta). Se você comparar sem a exceção do zero, usuários de Touch ID podem ser bloqueados.
**Depende de:** — · **Libera:** 033
**Risco e como reverter:** médio — uma comparação errada tranca o login por passkey. Teste com um autenticador real antes de mergear.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** dois logins consecutivos com a mesma passkey → `SELECT counter FROM user_passkeys WHERE id = '<id>'` aumentou entre eles; e um replay com `signCount` antigo → 401.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 033 — Rate limit no login por passkey
**Onda / Severidade / Camada:** 1 / Baixa / Edge Function
**Achados resolvidos:** A-022
**Problema hoje:** `webauthn-authenticate` não tem `checkRateLimitDB`, embora o irmão `webauthn-challenge:30` tenha, e embora esta função **emita magic link** (`:111-117`) e devolva `hashed_token` (`:139`).
**Causa raiz:** o freio foi aplicado à emissão do desafio e não à verificação.
**Caminho recomendado:** adicione `checkRateLimitDB(clientIpFromHeaders(req.headers) ?? "0.0.0.0", "webauthn-authenticate")` como **primeira** instrução do handler, copiando a forma de `webauthn-challenge:30`. Mantenha o fail-open aqui (é caminho de login — ver a decisão da etapa 012).
**Arquivos e objetos a tocar:** `supabase/functions/webauthn-authenticate/index.ts`.
**Não tocar / armadilhas:** não aplique `onError: 'deny'` da etapa 012 nesta função: negar por erro de banco tranca o acesso de todos.
**Depende de:** 032 · **Libera:** —
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** repetir a chamada acima do limite configurado → 429 com `retryAfter`.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 034 — Mover a checagem de DNC e horário para dentro de `initiateCall`
**Onda / Severidade / Camada:** 1 / Crítica / Hooks
**Achados resolvidos:** A-023
**Problema hoje:** o bloqueio existe em **uma** das duas telas de discagem. `src/pages/PhoneDialer.tsx:139` chama `await preDialCheck(number)`; `src/components/calls/UnifiedSoftphone.tsx:101` chama `initiateCall('sip', phoneNumber)` e `:110` `sipCall.startCall(phoneNumber)` **sem nenhuma checagem**. `UnifiedSoftphone` é montado em `src/pages/Calls.tsx:43`, e `grep preDialCheck` só retorna `PhoneDialer.tsx`. Dá para ligar para número da lista "não perturbe" e fora do horário legal usando `/calls`.
**Causa raiz:** a regra de compliance foi implementada no componente que a pediu, em vez de no caminho por onde toda discagem passa.
**Caminho recomendado:** mova a barreira para o ponto único: `useMultiChannelCall.initiateCall` (`src/hooks/useMultiChannelCall.ts:86`). Torne-a `async`, chame `preDialCheck(phoneNumber)` antes de criar a sessão, e devolva `null` com o motivo quando recusada (a função já devolve `CallSession | null`, então a assinatura muda pouco). Ajuste os três chamadores em `UnifiedSoftphone.tsx:85,94,101` e remova a chamada duplicada de `PhoneDialer.tsx:139` **depois** de confirmar que a nova barreira funciona — deixar as duas por uma versão é aceitável e mais seguro. Mostre os `reasons` ao operador com `toast.error`, não um erro genérico. **Atalho a evitar:** adicionar `preDialCheck` em `UnifiedSoftphone` e parar aí. Sobram o discador preditivo (etapa 036) e qualquer tela futura; o ponto único é o que fecha a classe.
**Arquivos e objetos a tocar:** `src/hooks/useMultiChannelCall.ts`, `src/components/calls/UnifiedSoftphone.tsx`.
**Não tocar / armadilhas:** tornar `initiateCall` assíncrona muda a assinatura — use `npx tsc --noEmit` para achar todos os chamadores. **Esta etapa não resolve o furo pelo servidor:** o jssip fala direto com o tronco, então um cliente modificado ainda disca. O fechamento real é a etapa 037.
**Depende de:** — · **Libera:** 035, 036, 037
**Risco e como reverter:** se `preDialCheck` estiver lento ou falhando, toda discagem para. A etapa 035 (fail-closed) é o que torna isso seguro, e por isso vem imediatamente depois.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** `npx vitest run src/hooks/__tests__/useMultiChannelCall*` com um teste novo que mocka `preDialCheck` recusando e afirma que `initiateCall` devolve `null` e nenhuma sessão é criada. Em seguida, pela tela `/calls`, discar para um número que esteja na DNC → recusado com o motivo.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 035 — Fazer a checagem de DNC e horário falhar fechado nos três níveis
**Onda / Severidade / Camada:** 1 / Crítica / Hooks + Banco
**Achados resolvidos:** A-024
**Problema hoje:** fail-open em três camadas para uma regra regulatória:
```
src/hooks/useDNCCompliance.ts:109-111  catch { log.error(…); return false; }   // false = "não está na DNC"
src/hooks/useDNCCompliance.ts:123-125  catch { … return { can_call: true, reason: 'Error checking hours' }; }
supabase/migrations/20260103145030_….sql:244  RETURN jsonb_build_object('can_call', true, 'reason', 'No config found, allowing');
```
Qualquer instabilidade de rede — ou uma tabela de horários vazia — libera a discagem para número proibido, sem aviso.
**Causa raiz:** "não consegui verificar" tratado como "pode ligar", nos três níveis, por simetria de tipo (a função devolve booleano e o erro precisava de um valor).
**Caminho recomendado:** introduza o terceiro estado, como na etapa 003. Em `useDNCCompliance`: `checkDNC` passa a devolver `'yes' | 'no' | 'unknown'` e `checkCallingHours` passa a devolver `{ can_call: boolean; reason: string; unknown?: true }`; nos `catch`, `unknown`. Em `preDialCheck` (`:245-273`), **`unknown` recusa a discagem** com o motivo "não foi possível verificar a conformidade". Na função SQL, troque o `allowing` por `can_call: false, reason: 'No config found'` — **mas confirme antes com o dono**: se nenhuma configuração de horário existir em produção, isso bloqueia toda discagem. A consulta está em "Como verificar"; se não houver configuração, a etapa precisa vir acompanhada de um seed, e aí ela passa a exigir aprovação humana.
**Arquivos e objetos a tocar:** `src/hooks/useDNCCompliance.ts`; nova migration que altera `check_calling_hours`.
**Não tocar / armadilhas:** o fail-open da função SQL pode estar sustentando a operação atual. **Rode a consulta primeiro.** Não altere a lógica de feriados aqui (etapa 122).
**Depende de:** 034 · **Libera:** 037
**Risco e como reverter:** alto se não houver configuração de horário — toda discagem para. Reverter: `git revert` no front e a migration inversa.
**Precisa de aprovação humana antes do merge:** **sim** (altera função do banco e pode interromper a operação).
**Como verificar:** antes — `SELECT count(*) FROM compliance_settings WHERE setting_key LIKE 'calling_hours%'` e `SELECT count(*) FROM calling_hours` (ou o nome real da tabela, confirme no schema). Depois — teste que mocka erro da RPC e afirma que `preDialCheck` devolve `canDial: false`.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 036 — Barreira de compliance no discador preditivo
**Onda / Severidade / Camada:** 1 / Crítica / Hooks
**Achados resolvidos:** A-023
**Problema hoje:** o caminho do discador preditivo não chama `preDialCheck` em lugar nenhum: `src/hooks/usePredictiveDialer.ts:145-151` marca o contato como `dialing` e mostra um toast; o loop automático de `:243-250` faz isso em série.
**Causa raiz:** o discador foi construído como fila de marcação (ver A-076), não como caminho de discagem — e por isso passou longe da regra.
**Caminho recomendado:** em `dialContact` (`:145`), chame `preDialCheck(queueItem.phone)` **antes** de `apiMarkDialing`. Quando recusado, não marque `dialing`: grave `status: 'skipped'` com o motivo em `dialer_queue` (a coluna `result` existe) e siga para o próximo. Isso dá rastro auditável de que a campanha respeitou a regra — que é o que uma fiscalização pede. **Atalho a evitar:** pular o contato sem registrar; sem o registro você não consegue provar conformidade depois.
**Arquivos e objetos a tocar:** `src/hooks/usePredictiveDialer.ts`, `src/hooks/predictive-dialer/api.ts`.
**Não tocar / armadilhas:** `dialer_queue.result` é `text` sem `CHECK` (A-125) — use exatamente a mesma grafia que o resto do código usa para status, e registre o valor novo na etapa 148.
**Depende de:** 034, 035 · **Libera:** 157
**Risco e como reverter:** baixo (a campanha passa a pular contatos, o que é o desejado).
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** com um número de teste na DNC na fila da campanha → após o ciclo, `SELECT status, result FROM dialer_queue WHERE phone = '<numero>'` → `skipped` com o motivo, e nenhuma linha nova em `call_sessions`.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 037 — Barreira de compliance no servidor, não só no cliente
**Onda / Severidade / Camada:** 1 / Crítica / Edge Function + Banco
**Achados resolvidos:** A-023
**Problema hoje:** mesmo depois das etapas 034–036, a regra vive inteiramente no navegador. O `jssip` fala **direto** com o tronco SIP: um cliente modificado, uma aba antiga em cache ou um erro de deploy contorna tudo. Não existe nenhum ponto no servidor que recuse a discagem.
**Causa raiz:** arquitetura em que o cliente fala direto com a telefonia, sem intermediário que possa aplicar política.
**Caminho recomendado:** esta é a única etapa da onda que **muda arquitetura** e por isso precisa de decisão do dono antes de qualquer código. Apresente duas opções, com custo:
(a) **Autorização de discagem por edge**: `sip-config` (ou uma nova `authorize-dial`) passa a emitir um token de curta duração por número discado, depois de checar DNC/horário no servidor; o softphone precisa desse token para iniciar. Fecha o furo para o cliente, mas não para quem tiver a credencial SIP (que, depois da etapa 020, só sai por edge autenticada).
(b) **Política no tronco**: configurar a restrição no provedor SIP (bloqueio de prefixo/horário). Fecha de verdade, depende do provedor e é configuração, não código.
Escreva as duas no corpo da PR, com a recomendação de (a) **mais** (b) — e **não implemente** até o dono escolher. Enquanto não houver decisão, as etapas 034–036 são a mitigação, e isso deve estar escrito em `docs/agentes/telefonia-voip.md`.
**Arquivos e objetos a tocar:** `docs/agentes/telefonia-voip.md` (registro da decisão pendente); código só depois da escolha.
**Não tocar / armadilhas:** não implemente (a) por conta própria: ela adiciona latência a cada discagem e muda o fluxo do softphone, que é o caminho mais sensível do produto.
**Depende de:** 035, 036 · **Libera:** —
**Risco e como reverter:** n/a nesta etapa (só documento).
**Precisa de aprovação humana antes do merge:** **sim** (mudança de arquitetura).
**Como verificar:** o documento registra as duas opções, o custo de cada uma e a data em que foi apresentado ao dono.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 038 — Fazer a importação em lote de DNC verificar o resultado de verdade
**Onda / Severidade / Camada:** 1 / Crítica / Hooks
**Achados resolvidos:** A-025
**Problema hoje:**
```ts
src/hooks/useDNCCompliance.ts:210-227
for (const phone of phones) {
  try { await supabase.rpc('add_to_dnc', {...}); results.success++; }
  catch (error: unknown) { … results.failed++; }
}
```
**O `catch` é inalcançável.** `node_modules/@supabase/postgrest-js/src/PostgrestBuilder.ts:26` define `shouldThrowOnError = false`; `:211-212` só lança com `.throwOnError()`; `:227` converte até erro de rede em resultado resolvido. Logo `results.success++` roda para **todo** telefone, inclusive os recusados pelo banco. Um lote de números que não podem ser ligados pode não entrar na lista, e ninguém é avisado.
**Causa raiz:** `try/catch` usado como se o cliente lançasse. É a mesma raiz da A-052, aqui com consequência regulatória.
**Caminho recomendado:** troque por `const { error } = await supabase.rpc('add_to_dnc', {...}); if (error) { if (error.message.includes('duplicate')) results.duplicates++; else results.failed++; } else results.success++;`. Remova o `try/catch`. **Na mesma PR, conserte o teste**: `src/hooks/__tests__/useDNCCompliance.coverage.test.tsx:120-121` mocka `Promise.reject`, comportamento que o cliente não tem — troque por `Promise.resolve({ data: null, error: { message: 'duplicate key' } })`. E faça o consumidor **ler** o resultado: `src/components/compliance/DNCListManager.tsx:59` chama `await bulkImportDNC(...)` sem olhar o retorno e `src/components/compliance/dnc/ImportDNCDialog.tsx:22-23` só fecha o diálogo — mostre "X importados, Y duplicados, **Z falharam**" e **não feche o diálogo** se `failed > 0`.
**Arquivos e objetos a tocar:** `src/hooks/useDNCCompliance.ts`, `src/hooks/__tests__/useDNCCompliance.coverage.test.tsx`, `src/components/compliance/DNCListManager.tsx`, `src/components/compliance/dnc/ImportDNCDialog.tsx`.
**Não tocar / armadilhas:** não mexa na RPC `add_to_dnc`. **Não confie no teste atual para validar a correção** — ele é parte do problema.
**Depende de:** — · **Libera:** 039, 196
**Risco e como reverter:** baixo; a mudança só torna visível o que já acontecia.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** `npx vitest run src/hooks/__tests__/useDNCCompliance.coverage.test.tsx` com o mock corrigido → o teste **falha** antes da correção do hook e passa depois. Depois, importar um lote com um número já existente → o diálogo mostra 1 duplicado e permanece aberto.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 039 — Reconciliar a lista DNC depois da importação
**Onda / Severidade / Camada:** 1 / Alta / Hooks
**Achados resolvidos:** A-025
**Problema hoje:** mesmo com a etapa 038, não há como saber se os números importados no passado entraram de fato — a contagem de sucesso foi inventada por meses.
**Causa raiz:** consequência histórica da A-025.
**Caminho recomendado:** adicione à tela de DNC um botão "Conferir lista" que compara o arquivo importado com o conteúdo da tabela e lista o que **não** está lá, com opção de reenviar só esses. Implemente como uma função pura em `src/lib/` (fácil de testar) mais a consulta. **Atalho a evitar:** reimportar tudo cegamente — além de lento, dispara duplicados e some com a informação de quando cada número entrou.
**Arquivos e objetos a tocar:** novo `src/lib/dnc/reconcile.ts` + teste; `src/components/compliance/DNCListManager.tsx`.
**Não tocar / armadilhas:** a consulta de conferência precisa de `.in()` em lotes (o PostgREST tem limite de tamanho de URL) — quebre em blocos de 200.
**Depende de:** 038 · **Libera:** —
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** `npx vitest run src/lib/__tests__/reconcile*`; e, na tela, conferir um arquivo com 3 números dos quais 1 não está na lista → relatório aponta exatamente esse.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 040 — Tirar a chave `anon` e o host fixo de dentro das migrations
**Onda / Severidade / Camada:** 1 / Média / Banco
**Achados resolvidos:** A-098
**Problema hoje:** `grep "supabase.co/functions/v1" supabase/migrations/` → 7 arquivos com host literal, e `20260723114001_….sql:13,50` ainda aponta para `dyibdjwuoibwwpidgsxu` (**projeto morto**, DNS que não resolve). Pior, `20261114090557_….sql:16,47` embute o **JWT `anon` de produção literal** dentro de `trigger_auto_scorecard()` e de um `cron.schedule`. Só um cron foi corrigido para ler do Vault (`20261122180000`); os outros 5, criados em novembro **depois** do incidente de migração de projeto, repetem o host fixo.
**Causa raiz:** `net.http_post` precisa de URL absoluta e o host do projeto não existe como configuração — foi digitado.
**Caminho recomendado:** siga exatamente o padrão que `20261122180000_data_lake_flush_cron_token.sql` já estabeleceu: guarde a URL base e o token em `vault.secrets` e leia com `vault.decrypted_secrets` dentro da função. Escreva **uma** função auxiliar `public.edge_function_url(name text)` que monta a URL a partir do segredo, e faça as 7 definições a usarem. Para `auto-scorecard`, troque a chave `anon` pelo `SCORECARD_CRON_TOKEN` da etapa 006 — **as duas etapas vão na mesma PR**. **Atalho a evitar:** só trocar o host do projeto morto e deixar os literais: o próximo incidente de migração repete tudo.
**Arquivos e objetos a tocar:** nova migration `supabase/migrations/<ts>_cron_urls_from_vault.sql`; `supabase/functions/auto-scorecard/index.ts` (junto com a etapa 006).
**Não tocar / armadilhas:** **a chave `anon` embutida precisa ser rotacionada depois**, porque está no histórico do Git de um repositório público — mas rotacionar `anon` invalida o bundle publicado, então é decisão e janela do dono. Registre isso no corpo da PR como item explícito. Não apague as migrations antigas: elas são histórico.
**Depende de:** 005 · **Libera:** 006
**Risco e como reverter:** se o segredo não estiver no Vault, **todos os crons param**. Aplique com o dono acompanhando e verifique job por job.
**Precisa de aprovação humana antes do merge:** **sim** (DDL em produção e segredo).
**Como verificar:** `SELECT jobname, command FROM cron.job` → nenhum `command` contém `eyJ` nem `dyibdjwuoibwwpidgsxu`; e `SELECT jobname, status, start_time FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10` → execuções `succeeded` depois da mudança.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 041 — Fazer a auditoria de dependências reprovar de verdade
**Onda / Severidade / Camada:** 1 / Alta / CI
**Achados resolvidos:** A-041
**Problema hoje:** `.github/workflows/ci.yml:124`: `run: bun audit || true`. O log do job do run `45063328728` (commit `b712310`) reporta `121 vulnerabilities (51 high, 53 moderate, 17 low)` e o job conclui **success**. O único passo de segurança de dependências do projeto existe só para imprimir.
**Causa raiz:** `|| true` colocado para destravar o pipeline e nunca removido.
**Caminho recomendado:** não remova o `|| true` de primeira — com 51 vulnerabilidades altas o job ficaria vermelho e alguém o desligaria de novo. Ordem: (1) esta etapa troca por `bun audit --audit-level=high` **ainda com** `|| true`, mas adiciona um passo que grava a contagem num arquivo e **falha se a contagem subir** em relação a um baseline versionado (`scripts/audit-baseline.json`) — o mesmo mecanismo do guard de edges, que o repositório já conhece; (2) as etapas 045 e 046 derrubam as altas que têm correção; (3) a etapa 282 troca o baseline por `--audit-level=high` puro. **Atalho a evitar:** `continue-on-error: true` no job — tem o mesmo efeito do `|| true` e é mais difícil de notar.
**Arquivos e objetos a tocar:** `.github/workflows/ci.yml`; novo `scripts/audit-baseline.json`; novo `scripts/check-audit-baseline.mjs`.
**Não tocar / armadilhas:** o `bun audit` do CI e o `npm audit` local dão números diferentes (121 vs 30) porque os lockfiles divergem (A-118) — o baseline precisa ser gerado **pelo mesmo comando do CI**, senão falha sempre.
**Depende de:** — · **Libera:** 045, 046, 282
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** **sim** (`.github/workflows/`).
**Como verificar:** rodar o workflow numa branch com uma dependência vulnerável adicionada de propósito → job **falha**; sem ela → passa.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 042 — Proteger a branch `main`
**Onda / Severidade / Camada:** 1 / Média / Infraestrutura
**Achados resolvidos:** A-043
**Problema hoje:** `github_get_branch_rules(branch=main)` → `[]`. Nenhum ruleset, nenhum check obrigatório. Como a plataforma publica a partir da `main`, qualquer push ou merge com CI vermelho entra em produção na hora. `delete_branch_on_merge` também é `false`, então branches mescladas se acumulam.
**Causa raiz:** nunca foi configurado; a disciplina está só no `AGENTS.md`.
**Caminho recomendado:** crie um ruleset com: exigir PR antes do merge, exigir que o check `quality` do `ci.yml` passe, e **permitir** push direto do app do Lovable (`gpt-engineer-app[bot]`) como exceção — sem essa exceção você quebra a trilha de publicação do Lovable, que hoje commita direto na `main`. Ligue `delete_branch_on_merge`. **Converse com o dono antes:** a exceção do bot é um buraco deliberado, e ele precisa saber que existe. **Atalho a evitar:** exigir aprovação de revisor — não há outro humano no projeto, e isso tranca tudo.
**Arquivos e objetos a tocar:** nenhum; configuração do repositório.
**Não tocar / armadilhas:** se o check obrigatório for ligado antes da etapa 041, um CI que hoje passa vai continuar passando — mas qualquer regressão nas 300 etapas passa a travar o merge, o que é o objetivo.
**Depende de:** 001 · **Libera:** —
**Risco e como reverter:** se a exceção do bot não for configurada corretamente, o Lovable para de publicar. Reverter: apagar o ruleset.
**Precisa de aprovação humana antes do merge:** **sim** (infraestrutura).
**Como verificar:** `github_get_branch_rules(branch=main)` → ruleset presente; e um push direto de teste numa branch protegida é recusado.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 043 — Fazer o bloqueio geográfico bloquear, e a tela gravar
**Onda / Severidade / Camada:** 1 / Alta / Banco + Edge Function
**Achados resolvidos:** A-068
**Problema hoje:** três problemas somados. (1) `geo_settings` e `geo_restrictions` só têm policy de `select`; `geo_access_logs` só `insert`/`delete` — mas `src/hooks/useGeoBlocking.ts:61,71,82,91` faz insert, update, insert e delete pelo cliente do navegador: **nenhuma coberta**, e RLS sem policy devolve 0 linhas, não erro. (2) `supabase/functions/validate-geo/index.ts:51-110` **nunca lê `settings.mode`** — trata tudo como allowlist, então escolher "blocklist" na tela não muda nada. (3) `:103-107` devolve `allowed: true, reason: 'Allowlist not configured'` com a lista vazia: **sem países cadastrados, o bloqueio libera todo mundo**.
**Causa raiz:** as três tabelas foram criadas direto no banco, fora do fluxo de migration (A-091), e as migrations seguintes só mexeram em policy e índice — então as policies de escrita nunca existiram. A edge foi escrita para um modo só.
**Caminho recomendado:** três PRs, nesta ordem. Esta é a primeira: **policies de escrita** para as três tabelas, restritas a `is_admin()`, com `TO authenticated` explícito. A segunda (etapa 141) faz a edge ler `mode` e implementar blocklist. A terceira (etapa 142) decide o comportamento com lista vazia — que é pergunta de negócio: "sem país cadastrado, libera ou bloqueia?" **Não decida sozinho.** Esta etapa só destrava a tela.
**Arquivos e objetos a tocar:** nova migration `supabase/migrations/<ts>_geo_write_policies.sql`.
**Não tocar / armadilhas:** as tabelas `geo_*` **não têm `CREATE TABLE` em nenhuma migration** (A-091) — então sua migration de policy vai abortar num ambiente novo. Escreva a migration da etapa 130 (o `CREATE TABLE` reconstruído) **antes ou junto**, ou guarde com `DO $$ IF to_regclass('public.geo_settings') IS NOT NULL THEN … END IF; END $$;`.
**Depende de:** 130 · **Libera:** 141, 142
**Risco e como reverter:** baixo. Reverter: `DROP POLICY`.
**Precisa de aprovação humana antes do merge:** **sim** (DDL em produção).
**Como verificar:** `SELECT policyname, cmd, roles FROM pg_policies WHERE tablename LIKE 'geo_%'` → inclui INSERT/UPDATE/DELETE. Depois, como admin, adicionar um país na tela e conferir `SELECT count(*) FROM geo_restrictions` aumentou.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 044 — Drenar o baseline do guard de edge functions e fazer a regra de autorização reprovar
**Onda / Severidade / Camada:** 1 / Alta / CI
**Achados resolvidos:** A-040
**Problema hoje:** `scripts/audit-edge-baseline.json` (`generated_at: 2026-11-22T12:59:12Z`) tem **51 chaves**: `R7-ssrf` 23, **`R3-auth` 11**, `R5-numeric` 9, `R4-cors` 7, `R9-stub` 1. E `scripts/audit-edge-functions.ts:100` reporta `R3-auth` como `warn`, enquanto `:177` só reprova com `freshErrors` ou `errors`. **O gate passa verde sobre os furos de autorização que ele mesmo detectou** — entre eles `search-calls`, `auto-scorecard`, `chatbot-respond`, `email-inbound`, `embed-kb-article`.
**Causa raiz:** baseline criado para destravar o CI, nunca drenado, somado a uma regra de severidade que não reprova.
**Caminho recomendado:** só execute esta etapa **depois** das etapas 004, 006, 007, 008, 013, 014, 023 e 028 — senão você sobe a severidade e o CI trava com problemas que o plano ainda vai resolver. Ordem: (1) rode `bun scripts/audit-edge-functions.ts` e confirme que as entradas `R3-auth` e `R4-cors` das funções já corrigidas **não** aparecem mais; (2) regenere o baseline (`--update`) e **confira o diff à mão** — ele deve só remover, nunca adicionar; (3) troque a severidade de `R3-auth` de `warn` para `error` em `:100`; (4) rode de novo: se ainda houver `R3-auth`, são funções que o plano não cobriu — liste-as no progresso em vez de silenciá-las. Os 23 `R7-ssrf` em sua maioria são `fetch` para URL constante de provedor de IA (falso positivo da regra) — **trate-os na etapa 283**, não aqui.
**Arquivos e objetos a tocar:** `scripts/audit-edge-functions.ts`, `scripts/audit-edge-baseline.json`.
**Não tocar / armadilhas:** **nunca** regenere o baseline sem ler o diff: `--update` congela qualquer achado novo que tenha entrado no meio do caminho, que é exatamente como o problema nasceu.
**Depende de:** 004, 006, 007, 008, 013, 014, 023, 028 · **Libera:** 283
**Risco e como reverter:** se sobrar `R3-auth` não resolvido, o CI trava. Reverter: voltar a severidade para `warn`.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** `bun scripts/audit-edge-functions.ts` → exit 0, e o resumo mostra 0 achados `R3-auth`.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 045 — Remover `xlsx`, que não é usado e tem duas falhas altas sem correção
**Onda / Severidade / Camada:** 1 / Alta / Dependências
**Achados resolvidos:** A-116
**Problema hoje:** `package.json:105` declara `"xlsx": "^0.18.5"`. `npm audit` → `xlsx high range=* fix=false`: GHSA-4r6h-8v6p-xvw6 (prototype pollution) e GHSA-5pgg-2g8v-p4x9 (ReDoS), **sem versão corrigida**. E `git grep "xlsx" -- src/ e2e/ tests/` → **0 ocorrências**: foi adicionado para um export para Excel que nunca foi implementado, e está no bundle de produção.
**Causa raiz:** dependência adicionada por antecipação e esquecida.
**Caminho recomendado:** `npm uninstall xlsx` e confirme que o `bun.lock` também é atualizado (o CI usa esse). Rode o build e compare o tamanho do bundle — deve cair. **Antes de remover**, confirme com o dono que ninguém espera export para Excel: se esperar, a funcionalidade vira uma etapa própria e a biblioteca de escolha é outra (`exceljs` é mantida e não tem essas falhas).
**Arquivos e objetos a tocar:** `package.json`, `package-lock.json`, `bun.lock`.
**Não tocar / armadilhas:** `scripts/regras_negocio/generate.py:252` cita a string "xlsx" num dicionário e `deno.lock:424` tem uma entrada — **nenhum dos dois é uso real**, não os tome como prova de que o pacote é necessário.
**Depende de:** 041 · **Libera:** 282
**Risco e como reverter:** nenhum se o grep estiver certo; `npm install xlsx` reverte.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** `npm audit --json | grep -c xlsx` → 0; `npx vite build` conclui; `npx tsc --noEmit` → 0 erros.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 046 — Atualizar `react-router-dom` (open redirect com correção disponível)
**Onda / Severidade / Camada:** 1 / Alta / Dependências
**Achados resolvidos:** A-117
**Problema hoje:** `package.json:94` declara `^7.13.1` e o instalado é 7.13.1. `npm audit` → `high`, faixa `7.0.0-pre.0 – 7.14.1`, `fix=true`, incluindo GHSA-wrjc-x8rr-h8h6 (open redirect por contrabarra em `<Link>`/`useNavigate`) e GHSA-2j2x-hqr9-3h42 (`//`). É **a única vulnerabilidade alta que roda no navegador do operador logado** — um link manipulado leva o usuário para fora do sistema parecendo navegação interna.
**Causa raiz:** `^7.13.1` com lockfile preso e Dependabot desligado (A-042).
**Caminho recomendado:** suba para a última 7.x corrigida (acima de 7.14.1) com `npm install react-router-dom@latest` e atualize **também** o `bun.lock`. Rode a suíte inteira: o repositório tem 104 rotas e 100% lazy-loaded, então uma mudança de router aparece nos testes de rota e no E2E. Confira o changelog da versão escolhida para quebras de API — se houver, **pare e registre no progresso**: subir major não está no escopo desta etapa.
**Arquivos e objetos a tocar:** `package.json`, `package-lock.json`, `bun.lock`.
**Não tocar / armadilhas:** não aplique `npm audit fix --force` — ele sobe majors sem aviso e este projeto tem 3 lockfiles.
**Depende de:** 041 · **Libera:** 282
**Risco e como reverter:** médio (é a biblioteca de navegação). Reverter: voltar a versão.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** `npm audit --json | python3 -c "import json,sys; print(json.load(sys.stdin)['vulnerabilities'].get('react-router-dom'))"` → `None`; `npx vitest run` sem regressão; `npx playwright test` (os 7 de `tests/e2e/`) passam.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 047 — Validar o corpo nas edges públicas que gastam dinheiro
**Onda / Severidade / Camada:** 1 / Média / Edge Function
**Achados resolvidos:** A-129
**Problema hoje:** 37 das 94 funções usam `await req.json()` sem nenhuma validação. As mais expostas, por serem públicas e consumirem IA ou e-mail: `chatbot-respond:20`, `email-inbound:29`, `embed-kb-article:19`, `notify-blocked-ip:18`, `notify-new-device:23`, `chat-widget-session:24`, `request-password-reset:26`. Campos de texto sem teto viram custo de IA e de armazenamento; payload com tipo errado derruba a função em 500.
**Causa raiz:** existem **três** validadores no repositório (`_shared/validate.ts`, `_shared/validator.ts` com Zod, `_shared/numeric-schemas.ts`) e nenhum guard de CI exige uso.
**Caminho recomendado:** use `_shared/validator.ts` (Zod, envelope `{ code, message, fields }`) — é o mais completo e o que `analyze-call` e `whatsapp-inbound` já usam. Para cada uma das 7, escreva o schema com `max` explícito em **todo** campo de texto. Esta etapa cobre as 7 públicas; as outras 30 são as etapas 048–050, agrupadas por área. **Atalho a evitar:** validar só os campos obrigatórios e deixar os de texto sem `max` — o custo de IA é proporcional ao tamanho, e é exatamente por aí que a conta é esvaziada.
**Arquivos e objetos a tocar:** as 7 `index.ts` listadas.
**Não tocar / armadilhas:** não unifique os três validadores nesta etapa (é a etapa 286). `request-password-reset` e `chat-widget-session` são pré-login: a resposta 422 não pode revelar se a conta existe (ver etapa 031).
**Depende de:** 005 · **Libera:** 048, 286
**Risco e como reverter:** se um schema for restritivo demais, chamadas legítimas passam a ser recusadas. Logue o payload recusado (sem conteúdo sensível) por 48 h.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** para cada função, um `POST` com campo de texto acima do `max` → 422 com `fields` apontando o campo; com corpo válido → 200.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 048 — Validar o corpo nas edges de IA e transcrição
**Onda / Severidade / Camada:** 1 / Média / Edge Function
**Achados resolvidos:** A-129
**Problema hoje:** sem validação: `score-call`, `generate-summary`, `generate-coaching`, `generate-coaching-plan`, `generate-meeting-summary`, `translate-summary`, `translate-utterance`, `voice-command`, `verify-voice`, `transcribe-recording`, `ocr-virtual-fax`, `send-survey`.
**Causa raiz:** idem 047.
**Caminho recomendado:** mesmo padrão da etapa 047. Aqui o campo crítico é o texto que vai para o prompt: imponha `max` compatível com a janela do modelo e **rejeite** acima disso em vez de truncar (truncar silenciosamente produz resumo errado, que é pior). Para `ocr-virtual-fax` e `transcribe-recording`, valide o tamanho do arquivo/URL recebido.
**Arquivos e objetos a tocar:** as 12 `index.ts` listadas.
**Não tocar / armadilhas:** `search-calls` já valida (`:10-19`) — não refaça. Não mexa nos prompts.
**Depende de:** 047 · **Libera:** 049
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** por função, corpo com texto gigante → 422; corpo válido → 200. E `bun scripts/audit-edge-functions.ts` não acusa regressão.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 049 — Validar o corpo nas edges de cálculo e exportação
**Onda / Severidade / Camada:** 1 / Média / Edge Function
**Achados resolvidos:** A-129
**Problema hoje:** sem validação: `export-data-lake`, `forecast-deals`, `detect-churn-risk`, `compute-account-health`, `compute-adherence`, `compute-deal-health`, `check-alerts`, `check-calling-hours`, `check-dnc`, `data-lake-flush`, `voip-failover-notifier:25`, `wavoip-call:56`, `sip-config:53`, `voip-trunks-manage`, `ldap-sync`, `approve-password-reset:50`, `webauthn-authenticate:24`, `elevenlabs-conversation-token`.
**Causa raiz:** idem 047.
**Caminho recomendado:** mesmo padrão. Aqui há um cuidado específico: várias dessas recebem **número** (janela em horas, limite de linhas, paginação) — use `_shared/numeric-schemas.ts`, que existe exatamente para isso e é o que o guard `guard-edge-numeric` cobra. Imponha teto em todo parâmetro de paginação e de janela temporal.
**Arquivos e objetos a tocar:** as 18 `index.ts` listadas.
**Não tocar / armadilhas:** `export-data-lake` tem uma lista de datasets válidos (`validDatasets`) que já divergiu do CHECK do banco uma vez (PR #85) — ao escrever o schema, derive a lista do mesmo lugar, não a copie.
**Depende de:** 048 · **Libera:** 286
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** por função, parâmetro numérico fora da faixa → 422; `node scripts/guard-edge-numeric.mjs --check` → 0 violações.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 050 — Parar de devolver a mensagem de erro interna ao cliente
**Onda / Severidade / Camada:** 1 / Média / Edge Function
**Achados resolvidos:** A-128
**Problema hoje:** padrão `error: err instanceof Error ? err.message : …` em 28 `index.ts` (`ocr-virtual-fax:89`, `suggest-shift-swaps:105`, `translate-utterance:98`, `voip-quality-alerts-summary:64`, `chat-widget-session:179`, `email-inbound:166`). Os erros do supabase-js trazem nome de tabela, coluna e detalhe de policy. Pior caso em `auto-scorecard:97-100`, que repassa o corpo **e o status** do provedor de IA: o front recebe um 402 "do Hello" que na verdade é falta de crédito no fornecedor.
**Causa raiz:** `err.message` é o caminho mais curto para dar alguma informação ao front, e ninguém separou "o que o cliente pode ver" de "o que vai para o log".
**Caminho recomendado:** crie `_shared/errors.ts` com `internalError(err, correlationId)` que (a) loga o erro completo com `console.error` e um id de correlação, e (b) devolve `{ code: 'internal_error', message: 'Erro interno', correlation_id }`. Troque as 28 ocorrências. Em `auto-scorecard`, **nunca** repasse o status do terceiro: mapeie 402/429 do provedor para `503` com `{ code: 'ai_unavailable' }`. Faça em 3 PRs por área. **Atalho a evitar:** só apagar o `details` e manter `err.message` — a mensagem do PostgREST já contém o nome da policy.
**Arquivos e objetos a tocar:** novo `supabase/functions/_shared/errors.ts`; as 28 `index.ts`.
**Não tocar / armadilhas:** o front pode estar exibindo `error` ao usuário em alguma tela — procure por consumidores que mostrem o campo e ajuste a mensagem lá, senão o usuário passa a ver "Erro interno" sem contexto.
**Depende de:** 047 · **Libera:** 287
**Risco e como reverter:** baixo, mas reduz informação para depurar — por isso o id de correlação é obrigatório, não opcional.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** forçar um erro de banco numa dessas funções → a resposta **não** contém nome de tabela nem de policy, e o log da função contém o erro completo com o mesmo `correlation_id` devolvido.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 051 — Tirar o host de produção dos scripts destrutivos
**Onda / Severidade / Camada:** 1 / Média / Scripts
**Achados resolvidos:** A-115
**Problema hoje:** quatro scripts órfãos têm **produção como fallback do host**. `scripts/cleanup-and-count.mjs:8` → `host: process.env.DB_HOST ?? 'db.cfmlmcdyjuotqobjapng.supabase.co'`, e `:60` → `DELETE FROM auth.users WHERE email LIKE 'test%@gmail.com'`, `:68` → `DELETE FROM auth.identities …`. Também `clean-hold-events.mjs:60` (`DELETE FROM hold_events`), `fix-user-profile.mjs:49,63` (INSERT em `user_profiles`/`user_roles`) e `apply-call-volume-fix.mjs:11`. Nenhum é chamado por `package.json`, workflow ou outro script. Quem tiver `DB_PASSWORD` no ambiente e rodar o script por engano apaga usuários de autenticação em produção.
**Causa raiz:** scripts de diagnóstico pontual commitados com o host de produção como padrão, em vez de exigir a variável.
**Caminho recomendado:** a decisão de apagá-los é da etapa 293 (higiene). **Esta etapa é a correção mínima e urgente:** troque `?? 'db.cfmlmcdyjuotqobjapng.supabase.co'` por `?? (() => { throw new Error('Defina DB_HOST ou SUPABASE_DB_URL — este script não assume produção.') })()` nos quatro, e adicione no topo de cada um um aviso do que ele apaga. É o mesmo padrão que os outros scripts já adotaram para a credencial (`scripts/check-data.mjs:2` lança sem a env). **Atalho a evitar:** só apagar os quatro arquivos agora — se algum for a única forma de fazer uma limpeza que o dono precisa, você remove capacidade sem avisar. Primeiro torne seguro, depois decida remover.
**Arquivos e objetos a tocar:** `scripts/cleanup-and-count.mjs`, `scripts/clean-hold-events.mjs`, `scripts/fix-user-profile.mjs`, `scripts/apply-call-volume-fix.mjs`.
**Não tocar / armadilhas:** não mude a lógica de limpeza; só o host e o aviso.
**Depende de:** — · **Libera:** 293
**Risco e como reverter:** nenhum.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** `DB_PASSWORD=x node scripts/cleanup-and-count.mjs` **sem** `DB_HOST` → sai com erro explícito e **nenhuma** conexão aberta.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 052 — Declarar `TO authenticated` nas policies que governam as tabelas mais sensíveis
**Onda / Severidade / Camada:** 1 / Média / Banco
**Achados resolvidos:** A-069
**Problema hoje:** 263 das 464 policies vivas não declaram `TO`, e o default do Postgres é `PUBLIC`, que inclui `anon`. Das 263, **174 não mencionam `auth.*`** — delegam a `is_admin_or_supervisor()`, `get_user_agent_name()` etc., que retornam falso/nulo para `anon`. É por isso que `20261122183000_….sql:11-13` **preservou** o EXECUTE desses helpers para `anon`: sem ele, a policy lançaria "permission denied for function" em vez de negar. A segurança de 114 tabelas depende desse acoplamento.
**Causa raiz:** `CREATE POLICY` sem `TO` é o default silencioso; só parte das migrations foi escrita com a cláusula, e um sweep anterior (`20260404151943_….sql`) cobriu só uma parte.
**Caminho recomendado:** não tente as 263 de uma vez. Nesta etapa, cubra as tabelas que carregam dado de cliente e de segurança — comece por `conversations`, `conversation_messages`, `call_quality_metrics`, `meeting_summaries`, `agent_devices` (as cinco com mais policies sem `TO`). Use `ALTER POLICY <nome> ON <tabela> TO authenticated;` — não recrie a policy, para não arriscar mudar o predicado. **Gere a lista pelo banco, não pelos arquivos:** `SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname='public' AND roles = '{public}'`; os arquivos não refletem o estado real (há uma migration que reescreve policies dinamicamente, A-089). As demais tabelas são as etapas 143–145.
**Arquivos e objetos a tocar:** nova migration `supabase/migrations/<ts>_policies_to_authenticated_lote1.sql`.
**Não tocar / armadilhas:** **não** revogue o EXECUTE dos helpers para `anon` junto — enquanto houver policy sem `TO` dependendo deles, isso troca "negar" por "erro". A revogação só pode vir depois que **todas** as 263 estiverem com `TO` (etapa 146).
**Depende de:** — · **Libera:** 143, 144, 145, 146
**Risco e como reverter:** baixo (restringe, não amplia). Reverter: `ALTER POLICY … TO public`.
**Precisa de aprovação humana antes do merge:** **sim** (DDL em produção).
**Como verificar:** `SELECT count(*) FROM pg_policies WHERE schemaname='public' AND roles = '{public}'` cai em pelo menos 25 linhas; e um usuário autenticado continua lendo as cinco tabelas normalmente.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 053 — Teste de RLS que realmente toca o banco
**Onda / Severidade / Camada:** 1 / Alta / Testes
**Achados resolvidos:** A-089, A-048
**Problema hoje:** não existe nenhuma afirmação com lastro sobre isolamento entre contas. Os 7 arquivos de `src/__tests__/rls/` mockam o PostgREST — o cabeçalho de `rls-policies.test.ts:1-8` admite isso — e `useSecurityHardening.test.ts` (863 linhas) declara casos como `'should block inactive agents from accessing transcriptions'` sem importar uma linha de produção. Em produção há 163 tabelas, 0 sem RLS e 448 policies, mas **uma migration reescreve policies dinamicamente** (`20260711192700_….sql:49`), então nem os arquivos descrevem o estado real.
**Causa raiz:** testar RLS exige um banco; sem um Postgres descartável no CI, escreveu-se o teste possível em vez do necessário — e ele carrega a mesma promessa do necessário.
**Caminho recomendado:** suba um Postgres descartável no CI e teste contra ele. Ordem: (1) adicione ao `ci.yml` um `services: postgres:17` (a versão de produção); (2) aplique as migrations nele (`supabase db reset` ou `psql -f` em ordem) — **isso vai falhar** por causa das A-091/A-092/A-095, e esse é o segundo resultado valioso desta etapa: a lista exata do que impede recriar o ambiente; (3) escreva `tests/rls/` com casos reais — agente A não lê chamada de agente B, agente inativo não lê transcrição, agente comum não altera `user_roles` —, cada um com `SET LOCAL role` e `SET LOCAL request.jwt.claims`. **Atalho a evitar:** tentar validar RLS contra o banco de produção. Além de arriscado, você não pode criar os usuários de teste de que precisa.
**Arquivos e objetos a tocar:** `.github/workflows/ci.yml`; novo `tests/rls/`; novo `scripts/ci/apply-migrations.sh`.
**Não tocar / armadilhas:** **não apague** `src/__tests__/rls/` nesta etapa — a remoção é a etapa 284, depois que os testes reais estiverem verdes. Se o passo (2) não conseguir aplicar as migrations, **pare, registre a lista de falhas no progresso** e deixe a etapa parcial: ela passa a depender das etapas 130–134.
**Depende de:** 130, 131, 132, 133, 134 · **Libera:** 284
**Risco e como reverter:** o CI fica mais lento (~2 min). Se o job novo for instável, marque-o como não bloqueante **por uma semana**, com data de corte registrada na PR.
**Precisa de aprovação humana antes do merge:** **sim** (`.github/workflows/`).
**Como verificar:** o job novo passa e **falha** quando você remove de propósito uma policy de `call_sessions` numa branch de teste. Essa segunda metade é o que prova que o teste serve para alguma coisa.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 054 — Versionar o `verify_jwt` de todas as edge functions
**Onda / Severidade / Camada:** 1 / Alta / Edge Function
**Achados resolvidos:** A-096
**Problema hoje:** `supabase/config.toml:10-23` declara `verify_jwt = false` para 5 crons. Mas dez funções afirmam, no próprio código, depender de exposição pública: `webauthn-challenge/index.ts:2-3` diz "A edge e publica (verify_jwt=false) e usa a service role…", e o mesmo vale para `whatsapp-inbound` (`// edge-public-ok`), `email-inbound`, `webhook-handler`, `chat-widget-session`, `webauthn-authenticate`, `notify-blocked-ip`, `notify-new-device`, `auto-scorecard`, `request-password-reset`. **Ou essas dez estão em 401 agora** (login por passkey, webhook de WhatsApp e reset de senha quebrados) **ou um deploy sem `--no-verify-jwt` quebra todas de uma vez.** O comentário de `config.toml:1-8` registra que esse mesmo problema já custou anos de 401 silencioso.
**Causa raiz:** a exposição real vive no painel da plataforma, e só 5 funções foram trazidas para o repositório.
**Caminho recomendado:** (1) descubra o estado real — `supabase functions list` mostra a configuração por função; se você não tiver acesso, peça ao dono a captura dessa lista; (2) declare **todas** as 94 em `config.toml`, explicitamente, inclusive as que são `true` (o default implícito é exatamente o que causou o problema anterior); (3) para cada uma das dez que precisa ser pública, confirme que ela tem verificação própria — as etapas 006–016 cobrem nove delas; se alguma ficar pública **sem** verificação própria ao fim disso, liste no progresso como pendência aberta. **Atalho a evitar:** declarar só as dez públicas. As 84 restantes continuam com a exposição definida fora do repositório, que é o problema.
**Arquivos e objetos a tocar:** `supabase/config.toml`.
**Não tocar / armadilhas:** o arquivo cresce muito (94 seções) — tudo bem, é o preço de a exposição ser auditável. **Não mude nenhum valor sem confirmar o estado atual**: declarar `verify_jwt = true` numa função que hoje é pública quebra o webhook correspondente no próximo deploy.
**Depende de:** 013, 014 · **Libera:** 289
**Risco e como reverter:** alto se declarado errado — pode quebrar webhook ou login. A verificação abaixo é obrigatória antes do merge.
**Precisa de aprovação humana antes do merge:** **sim** (configuração de plataforma).
**Como verificar:** depois do deploy, para cada uma das dez públicas, uma chamada sem JWT retorna **a resposta da função** (401 próprio ou 200), e **não** `{"code":"UNAUTHORIZED_INVALID_JWT_FORMAT"}` do gateway. Para uma função privada qualquer, a chamada sem JWT retorna o erro do gateway.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 055 — Fechar a onda 1 com um levantamento do que ficou aberto
**Onda / Severidade / Camada:** 1 / Média / Documentação
**Achados resolvidos:** nenhum novo — consolida A-012 a A-100
**Problema hoje:** ao fim da onda 1 haverá etapas parciais (as que dependem de acesso ao banco ou de decisão do dono) e o dono precisa saber **exatamente** o que continua aberto, sem ler 55 PRs.
**Causa raiz:** n/a — é controle de execução.
**Caminho recomendado:** escreva `docs/qa/06-ONDA1-FECHAMENTO.md` com três listas: (a) etapas concluídas com a evidência de verificação de cada uma; (b) etapas parciais, com o motivo exato e a consulta/ação que falta; (c) etapas que o dono precisa decidir (037 arquitetura de compliance, 030 trilha de deploy, 001 visibilidade do repositório, 040 rotação da chave `anon`). Cada item em uma linha, em linguagem de negócio. **Atalho a evitar:** repetir o conteúdo das PRs — o dono quer o estado, não o histórico.
**Arquivos e objetos a tocar:** novo `docs/qa/06-ONDA1-FECHAMENTO.md`.
**Não tocar / armadilhas:** não altere `03-ACHADOS.md` nem `05-PROGRESSO.md` — o progresso é marcado etapa a etapa, e os achados são o registro da auditoria.
**Depende de:** 001–054 · **Libera:** 056
**Risco e como reverter:** nenhum.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** o documento lista as 54 etapas anteriores, cada uma com estado e evidência; e os números batem com `05-PROGRESSO.md`.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

---

# ONDA 2 — Fluxos principais quebrados (056–100)

> **Leia isto antes da etapa 056.** As etapas 056 a 065 consertam **o problema número um do sistema**: nenhuma ligação é gravada no banco. Elas formam uma sequência; executar a 060 sem a 058 não produz efeito. Leia as dez de uma vez antes de começar a primeira.

## Etapa 056 — Mapear quem é o dono da chamada ativa, antes de mexer em qualquer código
**Onda / Severidade / Camada:** 2 / Crítica / Frontend + Hooks
**Achados resolvidos:** A-001 (preparação)
**Problema hoje:** há **três** representações de chamada ativa no código, e nenhuma conversa com as outras: `useMultiChannelCall` (estado em memória, `src/hooks/useMultiChannelCall.ts:86-99`), `useSipCall` (a conexão jssip real, `src/hooks/useSipCall.ts`) e `ActiveCallBar` (um `useState` local que nada preenche, `src/components/calls/ActiveCallBar.tsx:63`). `useCallSession` (que grava no banco) só é consumido pela terceira.
**Causa raiz:** três ciclos de desenvolvimento adicionaram uma camada cada, sem eleger a fonte de verdade.
**Caminho recomendado:** **não escreva código nesta etapa.** Produza um documento curto em `docs/agentes/telefonia-voip.md` (seção nova) que responda, com `arquivo:linha`: (1) qual hook é o dono do ciclo de vida da chamada — leia os três e decida; a resposta provável é `useMultiChannelCall`, porque é quem o softphone em uso (`UnifiedSoftphone.tsx:37`) consome e quem já tem `activeCalls`, transferência e conferência; (2) em que ponto exato do ciclo o `INSERT` em `call_sessions` deve acontecer (na transição para `connected`, não em `connecting` — senão toda tentativa não atendida vira uma chamada); (3) em que ponto o `UPDATE` de encerramento deve acontecer; (4) quem passa a consumir `useCallSession`. Esse documento é o contrato das etapas 057–065. **Atalho a evitar:** começar ligando `ActiveCallBar` a `useMultiChannelCall`. Faz a barra aparecer, mas mantém a gravação pendurada num componente de interface — e se amanhã a barra for removida, a gravação some de novo. A gravação é responsabilidade do hook de chamada, não de um componente visual.
**Arquivos e objetos a tocar:** `docs/agentes/telefonia-voip.md`.
**Não tocar / armadilhas:** não altere `useSipCall` — ele é o único pedaço de telefonia real do produto (jssip de verdade) e mexer nele sem necessidade é o risco mais caro do plano.
**Depende de:** 055 · **Libera:** 057, 058, 059, 060
**Risco e como reverter:** nenhum.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** o documento responde as quatro perguntas, cada uma com `arquivo:linha`.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 057 — Dar a `useMultiChannelCall` um campo para o id da chamada no banco
**Onda / Severidade / Camada:** 2 / Crítica / Hooks
**Achados resolvidos:** A-001, A-003
**Problema hoje:** `CallSession` (o tipo em memória de `useMultiChannelCall`) tem `id: \`call-${Date.now()}-…\`` (`:89`) — um identificador local que **não** é o UUID de `call_sessions`. O campo que guardaria o id real só é preenchido por `setCallDbSession` (`:169`), que **não tem nenhum chamador de produção** (`grep` → só a definição, o export e um teste).
**Causa raiz:** o campo e o setter foram criados para uma integração que nunca foi concluída.
**Caminho recomendado:** mantenha `setCallDbSession` (não o apague — ele é a peça certa, só está desligada) e garanta que `CallSession` tenha `dbSessionId?: string` explícito no tipo. Adicione um teste que afirma que, depois de `setCallDbSession(callId, 'uuid')`, o `activeCalls` correspondente tem o campo preenchido. Esta etapa é só a preparação de tipo e teste — **nenhum comportamento muda ainda**.
**Arquivos e objetos a tocar:** `src/hooks/useMultiChannelCall.ts`, `src/hooks/__tests__/useMultiChannelCall.coverage.test.tsx`.
**Não tocar / armadilhas:** não remova o teste existente de `setCallDbSession` (`:110`) — ele passa a ser relevante.
**Depende de:** 056 · **Libera:** 058
**Risco e como reverter:** nenhum.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** `npx vitest run src/hooks/__tests__/useMultiChannelCall.coverage.test.tsx` → passa, incluindo o caso novo.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 058 — Gravar `call_sessions` quando a chamada é atendida
**Onda / Severidade / Camada:** 2 / Crítica / Hooks
**Achados resolvidos:** A-001
**Problema hoje:** `useCallSession.startSession` (`src/hooks/useCallSession.ts:47-48`) é o único `INSERT` em `call_sessions` do repositório, e seu único chamador é `ActiveCallBar.tsx:81`, que nunca executa. Resultado medido no banco de produção: `chamadas_7d: 0` (`inventario/estado/banco.json`, 2026-11-20).
**Causa raiz:** ver A-001 e etapa 056.
**Caminho recomendado:** em `useMultiChannelCall`, no ponto onde a chamada passa a `connected` (`updateCallStatus`), chame `startSession(contactName, phoneNumber, agentName)` e, com o UUID devolvido, chame `setCallDbSession`. Três cuidados que decidem se isso funciona:
1. **O nome do agente tem que ser o real.** `ActiveCallBar.tsx:81` passa o literal `'Agente Demo'`. Use o nome do perfil autenticado — há um helper no banco (`get_user_agent_name()`) e o perfil no `AuthContext`; prefira o do contexto no front e deixe a RLS validar.
2. **Grave na transição para `connected`, não em `connecting`** — senão toda tentativa não atendida entra como chamada.
3. **Verifique o erro.** `startSession` precisa devolver `{ id } | null`, e o chamador precisa tratar `null` com `toast.error` visível. Hoje o hook engole (A-053); a correção do engolimento é a etapa 071, mas **o novo chamador já deve nascer verificando**.
**Atalho a evitar:** chamar `startSession` dentro de `initiateCall`. Nesse ponto a chamada ainda não foi atendida, e você infla `call_sessions` com tentativas.
**Arquivos e objetos a tocar:** `src/hooks/useMultiChannelCall.ts`, `src/hooks/useCallSession.ts` (só o retorno), `src/contexts/AuthContext.tsx` (leitura do nome, se necessário).
**Não tocar / armadilhas:** a RLS de INSERT em `call_sessions` é `WITH CHECK (is_admin_or_supervisor() OR is_active_agent(agent_name))` (`20260404153900_c14f803b….sql:16-18`), e `is_active_agent` exige que o nome esteja vinculado ao `auth.uid()` do chamador. **Se você passar o nome errado, o INSERT é recusado silenciosamente** e você vai achar que não funcionou. Teste com um agente real, não com admin.
**Depende de:** 057 · **Libera:** 059, 060, 069
**Risco e como reverter:** se o nome do agente não casar com a RLS, nada é gravado — mas nada piora, porque hoje também não é. Reverter: `git revert`.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** fazer uma chamada real de teste com um agente e conferir `SELECT id, agent_name, caller_phone, status, created_at FROM call_sessions ORDER BY created_at DESC LIMIT 1` → a linha existe, com o nome do agente de verdade e `status = 'active'`.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 059 — Fechar a chamada no banco quando ela termina
**Onda / Severidade / Camada:** 2 / Crítica / Hooks
**Achados resolvidos:** A-001
**Problema hoje:** `useCallSession.endSession` (`:175-176`) faz o `UPDATE` com `ended_at`, `duration_seconds` e `status: 'completed'`, e só é chamado por `ActiveCallBar.tsx:204-208`, que nunca executa. Sem isso, toda chamada gravada pela etapa 058 ficaria eternamente em `status = 'active'`.
**Causa raiz:** idem.
**Caminho recomendado:** em `useMultiChannelCall.endCall` (e em qualquer caminho que remova a chamada de `activeCalls`, inclusive o `session.on('ended')` do jssip), chame `endSession(duration)` usando o `dbSessionId` da etapa 057. Trate os três desfechos distintamente: atendida e encerrada → `completed`; não atendida → `missed`; abandonada na fila → `abandoned`. **Esses três valores importam muito**: a taxa de abandono (A-027) e o nível de serviço (A-028) são calculados a partir deles, e as etapas 103 e 104 dependem de eles estarem certos. Confirme a grafia exata com `grep -rn "'abandoned'\|'missed'\|'completed'" src/ supabase/` antes de escrever.
**Arquivos e objetos a tocar:** `src/hooks/useMultiChannelCall.ts`, `src/hooks/useCallSession.ts`.
**Não tocar / armadilhas:** `call_sessions.status` **não tem CHECK** (A-126) — o banco aceita qualquer texto, então um erro de grafia só aparece como métrica errada semanas depois. A etapa 147 adiciona o CHECK; até lá, confie no `grep`.
**Depende de:** 058 · **Libera:** 060, 069, 103, 104
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** chamada de teste atendida e encerrada → `SELECT status, ended_at, duration_seconds FROM call_sessions ORDER BY created_at DESC LIMIT 1` → `completed`, `ended_at` preenchido, duração plausível. Repita com uma chamada não atendida → `missed`.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 060 — Fazer a barra de chamada ativa renderizar a chamada real
**Onda / Severidade / Camada:** 2 / Crítica / Frontend
**Achados resolvidos:** A-001
**Problema hoje:** `src/components/calls/ActiveCallBar.tsx:63` inicializa `call` como `null` e `:213` é a única atribuição (`setCall(null)`), então `:124 return null` é sempre verdadeiro. O componente está montado em **todas** as páginas (`AppLayout.tsx:85`). Com ele ficam inalcançáveis a transcrição ao vivo (`useLiveTranscription` → edge `voice-transcribe`), o `NextBestActionPanel`, o `CrmSuggestionsCard` e as edges `generate-summary` / `extract-crm-fields` — **todas implementadas**.
**Causa raiz:** estado local sem produtor.
**Caminho recomendado:** depois das etapas 058 e 059, a chamada ativa já vive em `useMultiChannelCall`. Troque o `useState` local por consumo desse hook: `const { activeCalls, activeCallId } = useMultiChannelCall(); const call = activeCalls.find(c => c.id === activeCallId) ?? null;`. **Cuidado real:** `useMultiChannelCall` provavelmente mantém estado por instância do hook — se for esse o caso, `AppLayout` e `UnifiedSoftphone` terão **duas** instâncias independentes e a barra continuará vazia. Verifique isso **primeiro**: se o hook não tiver um provider, esta etapa passa a exigir um (`CallProvider` em `src/contexts/`), seguindo exatamente o padrão de `AuthContext.tsx` / `ReauthContext.tsx`, que já existem no repositório. Nesse caso, faça o provider em uma PR separada antes desta. Remova também a gravação que o componente faz hoje (`startSession` em `:81`), já que ela mudou de lugar na etapa 058 — deixar as duas duplica a linha em `call_sessions`.
**Arquivos e objetos a tocar:** `src/components/calls/ActiveCallBar.tsx`; possivelmente novo `src/contexts/CallContext.tsx` e `src/App.tsx`.
**Não tocar / armadilhas:** **a duplicação de instância do hook é a armadilha central desta etapa.** Se você fizer a barra consumir uma segunda instância, ela continuará em branco e você vai concluir que o problema era outro. Confirme contando as instâncias: `grep -rn "useMultiChannelCall()" src/`.
**Depende de:** 058, 059 · **Libera:** 061, 062, 063, 064, 065
**Risco e como reverter:** médio — a barra aparece em todas as páginas, e um erro aqui afeta a interface inteira. Reverter: `git revert`.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** com uma chamada em curso, a barra aparece em `/dashboard`, `/contacts` e `/history`; ao encerrar, desaparece. Rode também `npx vitest run src/components/calls/__tests__/` sem regressão.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 061 — Religar a transcrição ao vivo
**Onda / Severidade / Camada:** 2 / Alta / Frontend
**Achados resolvidos:** A-001
**Problema hoje:** `useLiveTranscription` e a edge `voice-transcribe` estão implementados e eram alcançados só por `ActiveCallBar`, que não renderizava.
**Causa raiz:** idem A-001.
**Caminho recomendado:** com a barra funcionando (etapa 060), confirme que a transcrição realmente inicia: leia o caminho `ActiveCallBar` → `useLiveTranscription` → `voice-transcribe` e verifique que o `call_session_id` passado é o `dbSessionId` da etapa 057, **não** o id local. Se a edge exigir áudio em formato específico, teste com uma chamada real — não presuma pelo código.
**Arquivos e objetos a tocar:** `src/components/calls/ActiveCallBar.tsx`, `src/hooks/useLiveTranscription.ts` (se o id estiver errado).
**Não tocar / armadilhas:** a edge `voice-transcribe` é uma das que não tem timeout (A-104); se ela pendurar, a barra pode travar. A etapa 246 resolve o timeout — se você observar travamento aqui, registre e siga.
**Depende de:** 060 · **Libera:** 062
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** chamada de teste falando por 15 s → `SELECT count(*) FROM call_transcriptions WHERE call_session_id = '<uuid>'` > 0, e o texto aparece na barra.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 062 — Religar a próxima melhor ação e as sugestões de CRM
**Onda / Severidade / Camada:** 2 / Alta / Frontend
**Achados resolvidos:** A-001
**Problema hoje:** `NextBestActionPanel` e `CrmSuggestionsCard` só eram montados por `ActiveCallBar`.
**Causa raiz:** idem.
**Caminho recomendado:** confirme que os dois recebem o `dbSessionId` e que as edges que eles chamam (`extract-crm-fields` e a de next-best-action) respondem. Trate os três estados em cada painel — carregando, erro e "sem sugestão" —, porque com chamada curta eles vão ficar vazios e um painel em branco sem explicação parece defeito.
**Arquivos e objetos a tocar:** `src/components/calls/ActiveCallBar.tsx` e os dois componentes de painel.
**Não tocar / armadilhas:** não mexa nos prompts das edges.
**Depende de:** 061 · **Libera:** 063
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** chamada de teste → os dois painéis saem de "carregando" para conteúdo ou para estado vazio explícito, sem ficar em branco.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 063 — Garantir que o resumo automático da chamada seja gerado e gravado
**Onda / Severidade / Camada:** 2 / Alta / Hooks
**Achados resolvidos:** A-001, A-062
**Problema hoje:** `useCallSession.endSession:181` insere em `call_summaries`, e `runPostCallIntelligence` (`:126-127`) lê `allTranscriptsRef`. Mas `:78` só empilha nesse ref **depois** do `if (error) throw error` de `:77`; no `catch` (`:80-83`) as transcrições voltam para a fila e nunca entram no ref. Se o salvamento de transcrição falhar uma vez, o resumo, o talk ratio e os momentos-chave saem incompletos ou não são gerados.
**Causa raiz:** duas fontes de verdade para "o que foi transcrito", com atualização só no caminho felizes.
**Caminho recomendado:** empilhe em `allTranscriptsRef` **antes** de tentar gravar — o ref existe para alimentar a análise, não para registrar o que foi persistido. Se a gravação falhar, a análise ainda deve acontecer sobre o texto que existe, e a falha de persistência deve ser reportada separadamente (etapa 071). Uma fonte, dois destinos.
**Arquivos e objetos a tocar:** `src/hooks/useCallSession.ts`.
**Não tocar / armadilhas:** não remova a fila de retentativa do `catch` — ela continua necessária.
**Depende de:** 059 · **Libera:** 064
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** teste que mocka erro no insert de `call_transcriptions` e afirma que `runPostCallIntelligence` ainda recebe os trechos.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 064 — Teste de ponta a ponta do ciclo de vida da chamada
**Onda / Severidade / Camada:** 2 / Alta / Testes
**Achados resolvidos:** A-001
**Problema hoje:** o fluxo mais importante do produto não tem nenhum teste que o exercite de ponta a ponta — e o que existia (`e2e/sip-flow.spec.ts`) **nunca roda** (A-049).
**Causa raiz:** `playwright.config.ts:4` aponta para `tests/e2e`, e o spec de SIP está em `e2e/`.
**Caminho recomendado:** escreva um teste de integração em `src/hooks/__tests__/` que exercite a cadeia com o cliente do Supabase mockado: `initiateCall` → `updateCallStatus('connected')` → afirma que houve `INSERT` em `call_sessions` com o nome correto → `endCall` → afirma `UPDATE` com `status` e `ended_at`. **Mocke o cliente, não o hook** — mockar o hook testa o mock. Esta etapa é mais barata e mais confiável do que tentar E2E com telefonia real; o E2E de SIP é a etapa 285.
**Arquivos e objetos a tocar:** novo `src/hooks/__tests__/callLifecycle.integration.test.tsx`.
**Não tocar / armadilhas:** **não** nomeie o arquivo com `.integration.test.ts` com ponto antes de "integration" — `vitest.config.ts:12` exclui `src/**/*.integration.{test,spec}.*`, e o teste não rodaria. Use `callLifecycle-integration.test.tsx` ou o nome acima com um hífen.
**Depende de:** 063 · **Libera:** 065, 285
**Risco e como reverter:** nenhum.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** `npx vitest run src/hooks/__tests__/callLifecycle*` → passa; e **falha** se você reverter a etapa 058 numa branch de teste.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 065 — Confirmar em produção que a chamada está sendo gravada
**Onda / Severidade / Camada:** 2 / Crítica / Verificação
**Achados resolvidos:** A-001
**Problema hoje:** o snapshot de 2026-11-20 registra `chamadas_7d: 0`. Sem uma confirmação explícita no banco vivo, as etapas 056–064 são só código.
**Causa raiz:** n/a — é a verificação que fecha o bloco.
**Caminho recomendado:** depois do deploy, peça ao dono (ou faça, se tiver acesso) uma chamada real de teste e rode as três consultas de "Como verificar". Registre o resultado em `docs/qa/06-ONDA1-FECHAMENTO.md` (seção nova) com data e número de linhas. **Se vier zero**, não conclua a etapa: volte à etapa 058 e verifique a RLS de INSERT com o nome do agente usado — é a causa mais provável.
**Arquivos e objetos a tocar:** `docs/qa/06-ONDA1-FECHAMENTO.md`.
**Não tocar / armadilhas:** não use um usuário admin para o teste — admin passa pela RLS por outro ramo (`is_admin_or_supervisor()`) e esconderia exatamente o problema que você quer descartar.
**Depende de:** 064 · **Libera:** 066, 069, 101
**Risco e como reverter:** nenhum.
**Precisa de aprovação humana antes do merge:** não (mas precisa da chamada de teste).
**Como verificar:** `SELECT count(*) FROM call_sessions WHERE created_at > now() - interval '1 hour'` > 0; `SELECT status, count(*) FROM call_sessions WHERE created_at > now() - interval '1 day' GROUP BY 1`; `SELECT count(*) FROM call_summaries WHERE created_at > now() - interval '1 hour'`.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 066 — Gravar `hold_events` com o id real da chamada
**Onda / Severidade / Camada:** 2 / Alta / Hooks
**Achados resolvidos:** A-003
**Problema hoje:** `src/hooks/useMultiChannelCall.ts:143` grava `hold_events` com `call_session_id: callSessionId || null` e `:145` fecha o evento com `.eq('call_session_id', callSessionId ?? '')` — que **nunca casa com `null`**. Consequência em cadeia: `ended_at` nunca é preenchido → `useHoldMetrics.ts:60` zera a métrica por agente → `supabase/functions/check-hold-alerts/index.ts:52` (`.is('ended_at', null)`) gera alerta que **nunca cessa** → `HoldAlertsTable.tsx:96` exibe `-`.
**Causa raiz:** o id vinha de `setCallDbSession`, que não tinha chamador (A-003) — resolvido na etapa 058.
**Caminho recomendado:** use o `dbSessionId` que agora existe. E torne o erro impossível de reaparecer: se `dbSessionId` estiver ausente no momento do hold, **não grave** o evento e registre um `log.error` — um `hold_event` sem chamada não serve para nada e é exatamente o lixo que precisa ser limpo depois (etapa 068). Troque o `.eq(..., callSessionId ?? '')` por filtro que use o id real e falhe alto se ele faltar.
**Arquivos e objetos a tocar:** `src/hooks/useMultiChannelCall.ts`.
**Não tocar / armadilhas:** não mexa em `check-hold-alerts` nesta etapa (etapa 067).
**Depende de:** 065 · **Libera:** 067, 068, 069
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** chamada de teste com espera de 10 s → `SELECT call_session_id, started_at, ended_at FROM hold_events ORDER BY started_at DESC LIMIT 1` → `call_session_id` preenchido **e** `ended_at` preenchido após retomar.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 067 — Fazer o alerta de espera parar quando a espera termina
**Onda / Severidade / Camada:** 2 / Alta / Edge Function
**Achados resolvidos:** A-003
**Problema hoje:** `supabase/functions/check-hold-alerts/index.ts:52` filtra `.is('ended_at', null)`. Como `ended_at` nunca era preenchido (A-003), todo hold histórico continua "em andamento" e gera alerta para sempre.
**Causa raiz:** a edge está correta; o dado é que estava errado. Mas ela não tem defesa contra dado velho.
**Caminho recomendado:** depois da etapa 066 o dado novo fica certo. Adicione à edge um teto de janela — só considere holds iniciados nas últimas N horas (parametrizável, default 24) — para que lixo histórico ou um `ended_at` perdido não gere alerta eterno. Isso é defesa em profundidade, não gambiarra: um hold de 3 dias não é um alerta operacional, é um dado corrompido.
**Arquivos e objetos a tocar:** `supabase/functions/check-hold-alerts/index.ts`.
**Não tocar / armadilhas:** não troque o filtro por `ended_at IS NULL AND started_at > …` sem índice — confira se existe índice em `hold_events.started_at`; se não, anote para a etapa 243.
**Depende de:** 066 · **Libera:** 068
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** invocar a edge → o número de alertas gerados cai para o das esperas realmente em curso, e `SELECT count(*) FROM hold_events WHERE ended_at IS NULL AND started_at < now() - interval '1 day'` deixa de influenciar o resultado.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 068 — Decidir o que fazer com os `hold_events` órfãos já gravados
**Onda / Severidade / Camada:** 2 / Média / Banco
**Achados resolvidos:** A-003
**Problema hoje:** todo `hold_events` gravado até a etapa 066 tem `call_session_id` nulo e `ended_at` nulo. Eles poluem a métrica de espera e o contador de "em espera", que cresce monotonicamente.
**Causa raiz:** consequência histórica da A-003.
**Caminho recomendado:** **é decisão do dono, não sua.** Monte as duas opções com números reais (consulta em "Como verificar") e apresente: (a) marcar os órfãos com `ended_at = started_at` e uma nota, preservando a linha para auditoria; (b) apagar. Recomende (a): a linha registra que houve uma espera, e apagar remove evidência operacional. Entregue a migration pronta para a opção recomendada, **sem mergear**. Existe um script `scripts/clean-hold-events.mjs` que faz `DELETE FROM hold_events` — **não o use**; ele apaga tudo, não só os órfãos, e aponta para produção por padrão (A-115, corrigido na etapa 051).
**Arquivos e objetos a tocar:** nova migration `supabase/migrations/<ts>_hold_events_orfaos.sql` (não mergeada até a decisão).
**Não tocar / armadilhas:** não rode nada destrutivo antes da resposta.
**Depende de:** 067 · **Libera:** 069
**Risco e como reverter:** se apagar, irreversível. Por isso a recomendação é marcar.
**Precisa de aprovação humana antes do merge:** **sim** (deleção ou alteração de dado em produção).
**Como verificar:** `SELECT count(*) FROM hold_events WHERE call_session_id IS NULL` e `SELECT count(*) FROM hold_events WHERE ended_at IS NULL` — os dois números vão no corpo da PR.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 069 — Preencher `hold_time_seconds` a partir dos eventos de espera
**Onda / Severidade / Camada:** 2 / Crítica / Banco
**Achados resolvidos:** A-002
**Problema hoje:** a coluna `call_sessions.hold_time_seconds` existe (`20251223211907_….sql:3`) e é **só lida**: `useQueueMetrics.ts:118` (`< 20` → nível de serviço), `useSupervisorPanel.ts:123` (tempo médio de espera). `grep` por escrita em `src/`, `supabase/functions/` e nas 241 migrations → **nenhum writer**. O painel do supervisor afirma que ninguém esperou e que 100% das chamadas foram atendidas na hora.
**Causa raiz:** falta o passo que soma `hold_events` em `call_sessions.hold_time_seconds`.
**Caminho recomendado:** faça no banco, não no front — assim vale para qualquer escritor. Crie um trigger `AFTER UPDATE OF ended_at ON public.hold_events` que soma `extract(epoch from (ended_at - started_at))` de todos os eventos daquela sessão e grava em `call_sessions.hold_time_seconds`. Vantagens sobre calcular no front: é atômico, não depende de o cliente estar aberto, e corrige sozinho quando um evento é fechado com atraso. **Atalho a evitar:** somar no `endSession` do front — se a chamada cair, ou se o `hold_event` for fechado depois, a soma fica errada e ninguém recalcula. **Faça a função `STABLE`? Não:** trigger é `VOLATILE` por natureza; o cuidado com volatilidade (A-090) é só para funções usadas em predicado de RLS.
**Arquivos e objetos a tocar:** nova migration `supabase/migrations/<ts>_hold_time_from_events.sql`.
**Não tocar / armadilhas:** o trigger precisa ser idempotente (recalcular a soma inteira, não incrementar) — senão uma reexecução dobra o valor. Confira se já existe trigger em `hold_events` antes de criar (`SELECT tgname FROM pg_trigger WHERE tgrelid = 'public.hold_events'::regclass`).
**Depende de:** 066, 068 · **Libera:** 103, 104
**Risco e como reverter:** baixo. Reverter: `DROP TRIGGER`.
**Precisa de aprovação humana antes do merge:** **sim** (DDL em produção).
**Como verificar:** chamada de teste com 10 s de espera → `SELECT hold_time_seconds FROM call_sessions WHERE id = '<uuid>'` ≈ 10. Depois, o painel do supervisor passa a mostrar tempo médio de espera diferente de zero.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 070 — Corrigir o id sintético no relatório de uso de tronco
**Onda / Severidade / Camada:** 2 / Alta / Hooks
**Achados resolvidos:** A-004
**Problema hoje:** `src/hooks/useSipCall.ts:278` cria `callId: \`sip-${Date.now()}\`` — não é UUID, e o destino é `p_call_session_id UUID` (`20260418144103_….sql:46`). Pior: `startCall` é memoizado em `:301` **sem `state.callId` nas deps** (com `exhaustive-deps` suprimido em `:300`), então os handlers de `:284`/`:287` capturam o estado de antes da chamada, quando `callId` é `null`. O erro é silenciado em `useTrunkUsageReporter.ts:52-54` (`log.warn`). O rateio de custo por tronco não pode ser cruzado com nenhuma chamada.
**Causa raiz:** closure obsoleta somada a um identificador inventado onde o contrato pede o id do banco.
**Caminho recomendado:** passe o `dbSessionId` (etapa 057) para o reporter, usando um `ref` em vez de valor capturado — `const callIdRef = useRef<string|null>(null)`, atualizado quando a sessão é criada, e lido dentro dos handlers. Isso resolve a closure sem precisar mexer nas deps do `useCallback` (que é o que o `eslint-disable` está escondendo). Depois **remova o `eslint-disable` de `:300`** e veja se o lint aponta outra dependência faltando — se apontar, registre no progresso, não silencie de novo. E troque o `log.warn` de `useTrunkUsageReporter.ts:52` por erro visível: uma falha de rateio de custo não é aviso.
**Arquivos e objetos a tocar:** `src/hooks/useSipCall.ts`, `src/hooks/useTrunkUsageReporter.ts`.
**Não tocar / armadilhas:** `useSipCall` é a telefonia real. **Faça a menor mudança possível** e teste com uma chamada de verdade antes de mergear. Não reescreva o `useCallback`.
**Depende de:** 058 · **Libera:** —
**Risco e como reverter:** médio (toca o caminho de chamada). Reverter: `git revert`.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** chamada de teste → `SELECT call_session_id, trunk_id, seconds FROM trunk_usage ORDER BY created_at DESC LIMIT 1` (confirme o nome real da tabela) → `call_session_id` é um UUID que existe em `call_sessions`.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 071 — Parar de afirmar "Chamada salva" quando a gravação falhou
**Onda / Severidade / Camada:** 2 / Alta / Hooks + Frontend
**Achados resolvidos:** A-054
**Problema hoje:** `src/hooks/useCallSession.ts:193-200` captura o erro, não relança nem devolve status, e o `finally` anula `currentSession`. O consumidor afirma sucesso nos **dois** caminhos:
```ts
src/components/calls/ActiveCallBar.tsx:204  toast.success('Chamada salva com resumo no histórico')
src/components/calls/ActiveCallBar.tsx:205-208
} catch (error) { logger.error('Error ending call:', error);
  await endSession(duration); toast.success('Chamada salva no histórico'); }
```
O segundo `endSession` é no-op, porque `currentSession` já foi anulado no `finally`. Uma chamada atendida pode ficar eternamente em `status = 'active'` e sem resumo, enquanto o agente foi informado que foi salva.
**Causa raiz:** `endSession` não devolve resultado, e o componente tem um `toast.success` dentro do próprio `catch`.
**Caminho recomendado:** `endSession` passa a devolver `{ ok: true } | { ok: false; reason: string }` — não lance exceção, porque o encerramento da chamada **não pode** ser abortado por falha de gravação. No componente, exiba `toast.success` apenas quando `ok`; quando não, `toast.error('A chamada foi encerrada, mas não foi possível salvar o histórico')` e registre. **Remova o `toast.success` do `catch`** e o segundo `endSession`. **Atalho a evitar:** fazer `endSession` lançar — isso interrompe a limpeza do estado da chamada e deixa a interface presa numa chamada que já terminou.
**Arquivos e objetos a tocar:** `src/hooks/useCallSession.ts`, `src/components/calls/ActiveCallBar.tsx`.
**Não tocar / armadilhas:** o `finally` que limpa o estado deve continuar rodando nos dois casos.
**Depende de:** 059, 060 · **Libera:** 072
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** teste que mocka erro no `UPDATE` de `call_sessions` e afirma que **nenhum** `toast.success` foi chamado e que um `toast.error` foi.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 072 — Fila de retentativa para o encerramento de chamada
**Onda / Severidade / Camada:** 2 / Média / Hooks
**Achados resolvidos:** A-054
**Problema hoje:** depois da etapa 071 o agente **sabe** que o histórico não foi salvo, mas a chamada continua perdida.
**Causa raiz:** não há persistência local do que falhou.
**Caminho recomendado:** guarde o encerramento pendente em `localStorage` (id da sessão, duração, resumo) e tente de novo no próximo carregamento e quando a conexão voltar (`navigator.onLine`). O repositório já tem uma fila de retentativa para transcrição no `catch` de `useCallSession:80-83` — siga a mesma forma, sem inventar outra. Limite a 20 itens e descarte com log o que exceder, para não encher o armazenamento do navegador.
**Arquivos e objetos a tocar:** `src/hooks/useCallSession.ts`; novo `src/lib/pendingCallWrites.ts` + teste.
**Não tocar / armadilhas:** não guarde conteúdo de transcrição no `localStorage` — é dado de cliente no navegador. Guarde só os identificadores e a duração.
**Depende de:** 071 · **Libera:** —
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** teste que simula falha, recarrega o hook e afirma que a gravação é retentada; `npx vitest run src/lib/__tests__/pendingCallWrites*`.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 073 — Ligar o botão "Transferir" do softphone
**Onda / Severidade / Camada:** 2 / Alta / Frontend
**Achados resolvidos:** A-082
**Problema hoje:** `src/components/calls/softphone/ActiveCallDisplay.tsx:234` é o único dos 7 controles da barra **sem `onClick`** — mudo (`:173`), espera (`:187`), volume (`:199`), gravar (`:211`), comando de voz (`:223`) e encerrar (`:240`) todos têm. Transferir chamada é função básica de call center, e `transferCall`/`completeTransfer` **já existem** em `useMultiChannelCall.ts:241`.
**Causa raiz:** faltou a prop de callback no componente.
**Caminho recomendado:** adicione `onTransfer` às props de `ActiveCallDisplay`, ligue ao botão, e no pai abra o seletor de destino (ramal ou número) antes de chamar `transferCall`. Veja como `useCallTransfer` trata a transferência cega — e leia o comentário de `useCallTransfer.ts:7-11`, que argumenta **contra** concluir a transferência por timer: respeite isso, exija confirmação explícita de `completeTransfer`. Trate os três estados: transferindo, concluída, falhou.
**Arquivos e objetos a tocar:** `src/components/calls/softphone/ActiveCallDisplay.tsx` e o componente pai.
**Não tocar / armadilhas:** `src/hooks/useMultiChannelCallConference.ts` é um arquivo **órfão** com uma versão deste fluxo que conclui por timer dentro de `useCallback(…, [])` (`:103-105`) — **não o use como referência**; ele é o exemplo errado, e a etapa 294 o remove.
**Depende de:** 060 · **Libera:** —
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** chamada de teste transferida para outro ramal → a chamada muda de destino e `SELECT * FROM call_transfers ORDER BY created_at DESC LIMIT 1` (confirme o nome real) registra a transferência.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 074 — Ligar o "Exportar" do histórico de chamadas
**Onda / Severidade / Camada:** 2 / Alta / Frontend
**Achados resolvidos:** A-083
**Problema hoje:** `src/pages/CallHistory.tsx:62` é um `<Button>` sem `onClick`, ao lado de um "Atualizar" que funciona (`:61`). A capacidade existe: `exportTranscript` vem do hook em `:29` e está ligada **só** ao painel de detalhe (`:198`).
**Causa raiz:** fio não ligado — o handler existe e não foi passado.
**Caminho recomendado:** o botão do topo exporta a **lista filtrada**, não uma transcrição. Escreva uma função `exportCallHistoryCsv(sessions)` em `src/lib/` (pura, testável) que gera CSV a partir do que está em tela, respeitando os filtros ativos, e ligue ao botão. Use CSV, não Excel: a biblioteca `xlsx` está sendo removida por vulnerabilidade (etapa 045). Desabilite o botão quando a lista estiver vazia e mostre o número de linhas exportadas no toast.
**Arquivos e objetos a tocar:** `src/pages/CallHistory.tsx`; novo `src/lib/export/callHistoryCsv.ts` + teste.
**Não tocar / armadilhas:** a lista vem paginada e sem limite em alguns hooks (A-102) — exporte **o que está carregado**, e diga isso no toast ("50 chamadas exportadas"), em vez de tentar baixar a tabela inteira.
**Depende de:** 045 · **Libera:** 075
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** `npx vitest run src/lib/__tests__/callHistoryCsv*`; e, na tela, com filtro aplicado, o arquivo baixado contém exatamente as linhas visíveis.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 075 — Ligar o "Exportar" dos relatórios
**Onda / Severidade / Camada:** 2 / Alta / Frontend
**Achados resolvidos:** A-083
**Problema hoje:** `src/pages/Reports.tsx:93` — botão sem `onClick`, e aqui **não há nenhuma função de export no arquivo** (o único `Download` é o ícone, `:22`).
**Causa raiz:** nunca foi escrita.
**Caminho recomendado:** reuse o utilitário CSV da etapa 074, adaptando as colunas ao conteúdo do relatório em tela. Se o dono preferir PDF, `jspdf` **já está no projeto** (123 kB gzip no bundle, em chunk próprio) e é usado em outro lugar — procure o uso existente e siga o mesmo padrão em vez de criar outro. **Atalho a evitar:** gerar o PDF no servidor por edge function: adiciona custo e latência para algo que o navegador já faz, e o `jspdf` já está pago no bundle.
**Arquivos e objetos a tocar:** `src/pages/Reports.tsx`; `src/lib/export/` (reuso).
**Não tocar / armadilhas:** não importe `jspdf` estaticamente numa página que hoje não o carrega — isso move 123 kB para o chunk da rota e o orçamento de bundle (etapa 047 da onda 1) vai acusar. Use `await import('jspdf')`.
**Depende de:** 074 · **Libera:** —
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** clicar em Exportar baixa um arquivo com o conteúdo do relatório; `npx vite build && node scripts/check-bundle-budget.mjs` → sem violação.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 076 — Fazer o "Salvar" das Configurações salvar de verdade
**Onda / Severidade / Camada:** 2 / Alta / Frontend + Hooks
**Achados resolvidos:** A-081
**Problema hoje:**
```ts
src/pages/Settings.tsx:38-41
const handleSave = () => {
  toast.success('✓ Configurações salvas', { description: 'Suas preferências foram atualizadas' });
};
```
Ligado a dois botões (`:201`, `:288`). As 4 preferências de notificação vivem em `useState` local (`:32-37`) e nunca saem dali. O usuário acredita ter salvo e tudo volta ao padrão no próximo carregamento.
**Causa raiz:** a aba foi montada como maquete e nunca ligada a um hook de preferências — enquanto os irmãos `ProfileSettings`, `VoipSettings` e `BitrixIntegration` são reais.
**Caminho recomendado:** siga o padrão dos irmãos. Veja onde `ProfileSettings` persiste (provavelmente `user_profiles` via `useProfile`) e **verifique se existe coluna ou tabela para preferências de notificação** — se não existir, esta etapa precisa de uma migration, e aí ela exige aprovação humana. Ordem: (1) confirme o destino no schema (`SELECT column_name FROM information_schema.columns WHERE table_name='user_profiles'`); (2) se faltar, crie `user_preferences` com RLS por `auth.uid()` e migration versionada; (3) escreva `useNotificationPreferences` com leitura no mount e `update` verificando `error`; (4) ligue `handleSave`. **Atalho a evitar:** guardar em `localStorage`. Preferência de notificação precisa valer em qualquer dispositivo, e o `localStorage` some quando o usuário troca de navegador — você teria "salvado" de novo sem salvar.
**Arquivos e objetos a tocar:** `src/pages/Settings.tsx`; novo `src/hooks/useNotificationPreferences.ts` + teste; possivelmente nova migration.
**Não tocar / armadilhas:** os 4 switches sem `onCheckedChange` (`:96`, `:257`, `:265`, `:273`) são outra coisa — ver etapa 077. Não resolva os dois no mesmo PR.
**Depende de:** — · **Libera:** 077
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** **sim** se precisar de migration; não, se a coluna já existir.
**Como verificar:** alterar as 4 preferências, salvar, recarregar a página → os valores persistem; `SELECT * FROM user_preferences WHERE user_id = '<uid>'` reflete o escolhido.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 077 — Resolver os quatro switches decorativos das Configurações
**Onda / Severidade / Camada:** 2 / Média / Frontend
**Achados resolvidos:** A-081
**Problema hoje:** `src/pages/Settings.tsx:96` (`<Switch />`, "Programa Beta") e `:257`, `:265`, `:273` (`<Switch defaultChecked />` — cancelamento de eco, supressão de ruído, ganho automático) **não têm `onCheckedChange`**: são enfeites que parecem controlar algo.
**Causa raiz:** controles colocados no layout antes de existir o que eles controlariam.
**Caminho recomendado:** os três de áudio têm destino real: `RECOMMENDED_AUDIO_CONSTRAINTS` em `src/lib/webrtc-config.ts:22-26` já define `echoCancellation`, `noiseSuppression` e `autoGainControl`. Ligue os switches a essas constraints, persistindo pela etapa 076, e aplique-as na captura de mídia do softphone. O "Programa Beta" **não tem destino**: ou o dono diz o que ele significa, ou **remova o controle** — um switch que não faz nada é pior que a ausência dele. Pergunte, e registre a resposta no corpo da PR.
**Arquivos e objetos a tocar:** `src/pages/Settings.tsx`, `src/lib/webrtc-config.ts`, o ponto de captura de mídia do softphone.
**Não tocar / armadilhas:** mudar constraints de áudio afeta a qualidade da chamada — teste com chamada real antes de mergear, e deixe os três ligados por padrão (é o que `RECOMMENDED_AUDIO_CONSTRAINTS` já faz).
**Depende de:** 076 · **Libera:** —
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não (mas o "Programa Beta" depende de resposta).
**Como verificar:** desligar supressão de ruído, salvar, iniciar chamada e inspecionar `track.getSettings()` no console → `noiseSuppression: false`.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 078 — Fazer o discador preditivo efetivamente discar
**Onda / Severidade / Camada:** 2 / Alta / Hooks
**Achados resolvidos:** A-076
**Problema hoje:**
```ts
src/hooks/usePredictiveDialer.ts:145-151
await apiMarkDialing(queueItem);
setCurrentCall(queueItem);
toast.info(`Discando para ${queueItem.name || queueItem.phone}...`);
```
Nenhuma referência a SIP, `startCall` ou edge de telefonia em todo o hook; o loop de `:243-250` faz isso em série. A campanha "preditiva" marca contatos como discados **sem ligar para ninguém**, e as estatísticas de campanha contam essas "discagens".
**Causa raiz:** o discador foi construído como fila de marcação e o passo de telefonia nunca foi ligado.
**Caminho recomendado:** depois de `apiMarkDialing`, chame `initiateCall('sip', queueItem.phone, queueItem.name)` do `useMultiChannelCall` — que, desde a etapa 034, já aplica DNC e horário, e desde a 058 já grava `call_sessions`. Amarre o resultado: se `initiateCall` devolver `null` (recusado ou limite de simultâneas), **desfaça a marcação** (volte o item para `pending`) em vez de deixá-lo como `dialing` para sempre. Atualize `dialer_queue` com o desfecho real quando a chamada terminar. **Atalho a evitar:** chamar `useSipCall.startCall` direto — você pularia a barreira de compliance e a gravação, recriando dois problemas que o plano acabou de fechar.
**Arquivos e objetos a tocar:** `src/hooks/usePredictiveDialer.ts`, `src/hooks/predictive-dialer/api.ts`.
**Não tocar / armadilhas:** o discador roda em laço. Se `initiateCall` ficar lento (ele agora faz uma consulta de compliance), o laço precisa de intervalo — não transforme isso numa tempestade de discagens. Respeite `max_concurrent_calls` da campanha, não o `MAX_SIMULTANEOUS_CALLS = 3` do navegador (A-035, etapa 118).
**Depende de:** 036, 058 · **Libera:** 079, 118
**Risco e como reverter:** **alto** — esta etapa faz o sistema ligar para pessoas de verdade. Teste com uma campanha de um contato controlado. Reverter: `git revert`.
**Precisa de aprovação humana antes do merge:** **sim** (passa a originar chamadas reais, com custo).
**Como verificar:** campanha de teste com 1 contato próprio → o telefone toca, `SELECT count(*) FROM call_sessions WHERE caller_phone = '<numero>'` = 1, e `dialer_queue.status` evolui de `pending` → `dialing` → desfecho.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 079 — Reivindicação atômica do contato no discador
**Onda / Severidade / Camada:** 2 / Crítica / Hooks
**Achados resolvidos:** A-057
**Problema hoje:**
```ts
src/hooks/predictive-dialer/api.ts:88-102   apiGetNextContact → SELECT … .eq('status','pending') … .limit(1)
src/hooks/predictive-dialer/api.ts:104-112  apiMarkDialing →
  .update({ status: 'dialing', last_attempt_at: …, attempts: item.attempts + 1 }).eq('id', item.id);
```
Read-then-write puro: **sem** `.eq('status','pending')` na condição, sem `version`, e **sem checar `error`**. Duas abas ou dois agentes na mesma campanha leem a mesma linha `pending` e ambos a marcam `dialing` — o mesmo cliente recebe duas ligações. `attempts` vem do objeto em memória (perda de atualização). E `api.ts:121-130` grava `completed_contacts` a partir do estado local pelo mesmo mecanismo. Depois da etapa 078, isso deixa de ser teórico: passa a ligar duas vezes de verdade.
**Causa raiz:** o repositório **tem** o padrão certo (`enforce_optimistic_lock` em `deals`, `contacts`, `agents`, `cadences`, `playbooks`, `accounts`, `success_plans` — `20260418125824_….sql:2-20`) e `dialer_queue` ficou fora dele.
**Caminho recomendado:** faça a reivindicação em **uma** operação condicional, não em duas. Substitua `apiGetNextContact` + `apiMarkDialing` por uma RPC `claim_next_dialer_contact(p_campaign_id uuid)` com `UPDATE … SET status='dialing', attempts = attempts + 1 … WHERE id = (SELECT id FROM dialer_queue WHERE campaign_id = … AND status='pending' … ORDER BY priority DESC, created_at FOR UPDATE SKIP LOCKED LIMIT 1) RETURNING *`. O `FOR UPDATE SKIP LOCKED` é o que garante que dois chamadores concorrentes peguem contatos **diferentes**, e o `attempts = attempts + 1` no SQL elimina a perda de atualização. **Atalho a evitar:** adicionar `.eq('status','pending')` ao update atual. Reduz a janela, não a fecha — duas transações ainda podem passar pela leitura antes de qualquer escrita.
**Arquivos e objetos a tocar:** nova migration `supabase/migrations/<ts>_claim_next_dialer_contact.sql`; `src/hooks/predictive-dialer/api.ts`; `src/hooks/usePredictiveDialer.ts`.
**Não tocar / armadilhas:** a RPC precisa de `SECURITY DEFINER` com `SET search_path = public` e `REVOKE` de `anon` — siga o padrão de `20261122183000_hardening_revoke_internal_functions.sql`. **Não** a declare `VOLATILE` por descuido se for usada em predicado (não é o caso aqui, mas leia a A-090 antes de criar qualquer função).
**Depende de:** 078 · **Libera:** 080
**Risco e como reverter:** se a RPC tiver erro, a campanha para de discar (melhor que discar duas vezes). Reverter: voltar o código antigo e `DROP FUNCTION`.
**Precisa de aprovação humana antes do merge:** **sim** (DDL em produção).
**Como verificar:** teste de concorrência real: abra duas sessões e dispare o laço nas duas ao mesmo tempo; depois `SELECT phone, count(*) FROM dialer_queue WHERE status='dialing' GROUP BY 1 HAVING count(*) > 1` → **vazio**. E `SELECT attempts FROM dialer_queue WHERE id='<id>'` incrementa exatamente uma vez por tentativa.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 080 — Verificar o erro nas escritas do discador
**Onda / Severidade / Camada:** 2 / Alta / Hooks
**Achados resolvidos:** A-057, A-052
**Problema hoje:** `apiMarkDialing` (`api.ts:104-112`) descarta o `error` por completo — um claim que falhou deixa a linha `pending` e ela é discada de novo no ciclo seguinte. `apiUpdateQueueItem` e a escrita de `completed_contacts` (`:121-130`) têm o mesmo problema.
**Causa raiz:** `await supabase…` sem desestruturar `error`. O cliente **não lança** (ver `node_modules/@supabase/postgrest-js/src/PostgrestBuilder.ts:26`), então o código segue como se tivesse funcionado.
**Caminho recomendado:** em todas as funções de `src/hooks/predictive-dialer/api.ts`, use `const { data, error } = await …; if (error) throw error;` — e deixe o chamador tratar. `apiGetNextContact` já faz isso (`:101`), então siga a forma que o próprio arquivo estabelece. No laço de `usePredictiveDialer.ts:243-259`, trate a exceção parando a campanha com mensagem, em vez de seguir para o próximo contato: um erro de escrita no claim significa que você não sabe o estado da fila.
**Arquivos e objetos a tocar:** `src/hooks/predictive-dialer/api.ts`, `src/hooks/usePredictiveDialer.ts`.
**Não tocar / armadilhas:** não troque para `.throwOnError()` — mudaria o comportamento de todo o arquivo de uma vez, incluindo caminhos onde "nenhuma linha" é resultado legítimo.
**Depende de:** 079 · **Libera:** 196
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** teste que mocka `error` no claim e afirma que a campanha para com mensagem, sem marcar o contato.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 081 — Registrar a chamada no Bitrix (a proposta do produto)
**Onda / Severidade / Camada:** 2 / Alta / Hooks
**Achados resolvidos:** A-077
**Problema hoje:** `src/hooks/useBitrix.ts:252 registerCall` e `:271 finishCall` existem e mapeiam `telephony.externalcall.register/finish` em `supabase/functions/bitrix-api/index.ts:145-153`. `grep "registerCall\|finishCall"` fora de `useBitrix.ts` e dos testes → **zero**. Nenhuma chamada aparece no CRM do cliente: o produto chama-se "Bitrix Call Connect" e essa ponte não acontece em nenhum caminho do app.
**Causa raiz:** backend pronto, consumidor nunca ligado (o padrão da A-079).
**Caminho recomendado:** ligue nos dois pontos que a etapa 058/059 acabou de criar: ao gravar `call_sessions` (atendida), chame `registerCall`; ao encerrar, `finishCall` com duração e desfecho. Guarde o `CALL_ID` que o Bitrix devolve numa coluna de `call_sessions` (precisa de migration — veja se `external_id` já serve). **Trate a falha sem derrubar a chamada:** se o Bitrix estiver fora, a ligação continua; use a fila `crm_sync_queue` (etapas 082–083) para reenviar. O `circuit-breaker.ts` de `src/lib/bitrix/` já existe e está integrado em `callBitrixApi` — não crie outro.
**Arquivos e objetos a tocar:** `src/hooks/useMultiChannelCall.ts` ou `useCallSession.ts` (o ponto escolhido na etapa 056), `src/hooks/useBitrix.ts`, possivelmente uma migration para a coluna do id externo.
**Não tocar / armadilhas:** não bloqueie o início da chamada esperando o Bitrix. Registro no CRM é efeito colateral, não pré-requisito.
**Depende de:** 059, 083 · **Libera:** —
**Risco e como reverter:** médio (toca o caminho de chamada e um terceiro).
**Precisa de aprovação humana antes do merge:** **sim** se precisar de migration.
**Como verificar:** chamada de teste → a atividade aparece no Bitrix do cliente, e `SELECT external_id FROM call_sessions ORDER BY created_at DESC LIMIT 1` tem o `CALL_ID`.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 082 — Policy de UPDATE para `crm_sync_queue`
**Onda / Severidade / Camada:** 2 / Alta / Banco
**Achados resolvidos:** A-066
**Problema hoje:** o estado líquido de `crm_sync_queue` é `select` (`20260507220616_….sql:20`) + `insert` (`20260507221246_….sql:8`, `20260712220353_….sql:24`), **sem UPDATE**. Mas `src/lib/bitrix/sync-log.ts:29` insere com `status: 'in_progress'` pelo cliente do navegador e `:50-53`/`:66-68` tentam `update({ status: 'success' })` / `'failed'` — barrados silenciosamente. **Toda tentativa de sincronização com o Bitrix fica "em progresso" para sempre.**
**Causa raiz:** policy criada só para as operações que existiam quando a tabela nasceu.
**Caminho recomendado:** migration com policy de UPDATE restrita a quem pode inserir (`is_admin_or_supervisor()`, para casar com a de INSERT) **mais** uma condicionada ao próprio autor, se a tabela tiver coluna de usuário — confirme no schema. Declare `TO authenticated`. **Melhor ainda:** avalie mover a escrita de status para a edge `sync-crm-queue` (service_role, ignora RLS) e deixar o front só lendo — é o desenho mais limpo, e é o que a etapa 083 habilita. Se escolher esse caminho, a policy de UPDATE pode ficar restrita a admin apenas para correção manual.
**Arquivos e objetos a tocar:** nova migration `supabase/migrations/<ts>_crm_sync_queue_update_policy.sql`.
**Não tocar / armadilhas:** não use `FOR ALL`.
**Depende de:** — · **Libera:** 083, 084
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** **sim** (DDL em produção).
**Como verificar:** `SELECT policyname, cmd FROM pg_policies WHERE tablename='crm_sync_queue'` inclui UPDATE; e uma sincronização de teste termina com `status='success'`, não `in_progress`.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 083 — Dar um gatilho à fila de sincronização do CRM
**Onda / Severidade / Camada:** 2 / Alta / Banco + Edge Function
**Achados resolvidos:** A-066, A-080
**Problema hoje:** `supabase/functions/sync-crm-queue/index.ts:37-42` é a única processadora da fila (service_role), e `grep -rn "sync-crm-queue"` fora do próprio diretório **não retorna nada**: nenhum cron, nenhuma chamada do front, nada em `supabase/config.toml`. A fila enche e nada a consome.
**Causa raiz:** processadora escrita e nunca agendada.
**Caminho recomendado:** siga o padrão que o repositório já consolidou para crons: (1) token dedicado no Vault; (2) `requireCronToken` na edge (módulo da etapa 005); (3) `verify_jwt = false` em `config.toml`; (4) `cron.schedule` lendo a URL e o token do Vault, **no formato da etapa 040** (sem host nem chave literais). Intervalo de 5 minutos é suficiente para uma fila de CRM. Adicione limite de itens por execução (50) e marque as falhas com contador de tentativas, para a fila não travar num item ruim.
**Arquivos e objetos a tocar:** `supabase/functions/sync-crm-queue/index.ts`; `supabase/config.toml`; nova migration com o `cron.schedule`.
**Não tocar / armadilhas:** o repositório já teve um cron morrendo em 401 por anos (`config.toml:1-8` conta a história) — **declare o `verify_jwt = false`**, não confie no padrão.
**Depende de:** 005, 040, 082 · **Libera:** 081
**Risco e como reverter:** baixo. Reverter: `cron.unschedule`.
**Precisa de aprovação humana antes do merge:** **sim** (DDL + segredo).
**Como verificar:** `SELECT jobname, schedule FROM cron.job WHERE jobname LIKE '%crm%'` → existe; depois de 10 min, `SELECT status, count(*) FROM crm_sync_queue GROUP BY 1` mostra itens saindo de `pending`.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 084 — Parar de perder lead em silêncio quando o Bitrix está fora
**Onda / Severidade / Camada:** 2 / Alta / Hooks
**Achados resolvidos:** A-055
**Problema hoje:**
```ts
src/hooks/useBitrix.ts:226-238
const { error: queueError } = await supabase.from('crm_sync_queue').insert({ action:'create_lead', … });
if (!queueError) { toast.info('Lead agendado para sincronização', …); return { queued: true }; }
return null;                                   // nenhum toast de erro
```
A policy de INSERT exige `is_admin_or_supervisor()` (`20260712220353_….sql:24-28`), e o insert roda como o usuário logado. **O agente cadastra um lead, não vê erro algum, e o lead não existe nem no Bitrix nem na fila.**
**Causa raiz:** o caminho de contingência tem permissão mais restrita que o caminho principal, e a falha não é reportada.
**Caminho recomendado:** duas correções. (1) **Permissão:** o agente precisa poder enfileirar o próprio lead — amplie a policy de INSERT para `authenticated` com `WITH CHECK` que amarre o item ao autor (se a tabela tiver coluna de usuário; se não tiver, adicione-a na migration). (2) **Feedback:** quando `queueError` existir, `toast.error('Não foi possível salvar o lead. Tente novamente.')` e **devolva o erro**, não `null` — `null` é indistinguível de "não tentou". Mantenha o `toast.info` do caminho feliz, que está correto.
**Arquivos e objetos a tocar:** `src/hooks/useBitrix.ts`; nova migration para a policy (e a coluna, se faltar).
**Não tocar / armadilhas:** não resolva isso dando service_role ao front. Se a amarra por autor for inviável, a alternativa é uma edge `enqueue-crm-action` com `requireUser` — mais código, mesma segurança.
**Depende de:** 082 · **Libera:** —
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** **sim** (DDL em produção).
**Como verificar:** com o Bitrix indisponível (bloqueie o host no ambiente de teste), um agente comum cria um lead → `toast.info` de enfileirado e `SELECT count(*) FROM crm_sync_queue WHERE action='create_lead'` aumentou. Repita forçando erro de policy → `toast.error` aparece.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 085 — Executor das cadências (hoje elas nunca disparam)
**Onda / Severidade / Camada:** 2 / Alta / Edge Function + Banco
**Achados resolvidos:** A-078
**Problema hoje:** `src/hooks/useCadences.ts:72-77` insere em `cadence_enrollments` com `next_action_at` = agora e `status: 'active'`; `src/pages/Cadences.tsx:60` anuncia "Sequências multi-touch automáticas". **Nenhuma edge nem cron toca `cadence_enrollments`** (grep em `supabase/functions/` e nas migrations: só índices e RLS). O time monta sequências de follow-up que nunca disparam.
**Causa raiz:** a entidade e a interface foram construídas; o motor não.
**Caminho recomendado:** crie `supabase/functions/cadence-tick/index.ts` com cron de 15 minutos, no padrão das etapas 040/083 (token do Vault, `verify_jwt=false` declarado). A cada execução: busque inscrições `active` com `next_action_at <= now()` (com `FOR UPDATE SKIP LOCKED`, como na etapa 079 — duas execuções sobrepostas não podem processar a mesma inscrição), execute a etapa corrente conforme `cadence_steps.step_type`, grave o resultado e avance `next_action_at` pelo intervalo da etapa seguinte; ao fim da sequência, `status = 'completed'`. **Comece pelo tipo de etapa mais simples** (tarefa ou lembrete), não por e-mail/ligação automática: entregue o motor funcionando com um tipo e adicione os outros depois. **Atalho a evitar:** processar tudo num `Promise.all` sem lock — duas execuções do cron se sobrepõem e a mesma pessoa recebe o follow-up duas vezes.
**Arquivos e objetos a tocar:** nova `supabase/functions/cadence-tick/index.ts` + testes Deno; `supabase/config.toml`; nova migration com o cron.
**Não tocar / armadilhas:** `cadence_steps.step_type` é `text` **sem CHECK** (A-125) — leia os valores que existem (`SELECT DISTINCT step_type FROM cadence_steps`) antes de escrever o `switch`, e trate o default com log, nunca em silêncio.
**Depende de:** 005, 040 · **Libera:** 086
**Risco e como reverter:** médio — passa a executar ações em nome do time. Comece com a campanha de um usuário só. Reverter: `cron.unschedule`.
**Precisa de aprovação humana antes do merge:** **sim** (DDL, segredo e ação automática em nome do usuário).
**Como verificar:** inscrever um contato de teste numa cadência de 2 etapas → após o primeiro tick, `SELECT status, next_action_at, current_step FROM cadence_enrollments WHERE id='<id>'` avançou; após o segundo, `completed`.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 086 — Editar e excluir cadência e etapa
**Onda / Severidade / Camada:** 2 / Média / Frontend + Hooks
**Achados resolvidos:** A-078
**Problema hoje:** `useCadences` cria e inscreve, mas não há caminho para editar nem excluir cadência ou etapa — fluxo pela metade: o time monta uma sequência errada e não pode corrigi-la.
**Causa raiz:** CRUD entregue só na metade do C.
**Caminho recomendado:** adicione `updateCadence`, `deleteCadence`, `updateStep`, `deleteStep` ao hook, **enviando `version`** no update — `cadences` é uma das tabelas com `enforce_optimistic_lock` (`20260418125824_….sql`), e sem `version` o gatilho não detecta conflito (A-058). Confira as policies de UPDATE/DELETE da tabela **antes** (é o padrão de falha das A-065/A-066/A-067): se faltarem, a migration vem primeiro. Na interface, exclusão com confirmação e aviso de quantas inscrições ativas serão afetadas.
**Arquivos e objetos a tocar:** `src/hooks/useCadences.ts`, `src/pages/Cadences.tsx`, possivelmente nova migration de policy.
**Não tocar / armadilhas:** excluir cadência com inscrições ativas precisa decidir o destino delas (cancelar ou manter) — **pergunte ao dono**, não escolha.
**Depende de:** 085, 110 · **Libera:** —
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** **sim** se precisar de migration ou se envolver deleção de inscrições.
**Como verificar:** editar o nome de uma cadência persiste após recarregar; excluir uma cadência sem inscrições funciona; com inscrições, aparece o aviso.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 087 — Policy de UPDATE para `learning_completions`
**Onda / Severidade / Camada:** 2 / Média / Banco
**Achados resolvidos:** A-067
**Problema hoje:** estado líquido de `learning_completions` = `select`, `insert`, `delete` (`20260417000338_….sql:175-177`), **sem UPDATE**. Mas `src/hooks/useLearning.ts:54-58` faz `.upsert(…, { onConflict: 'agent_name,module_id' })` e `:63` exibe `toast.success('Módulo concluído!')`. Refazer um módulo com nota melhor não grava — e o agente vê a confirmação.
**Causa raiz:** `upsert` com conflito resolve para `UPDATE`, que exige policy própria; só as outras três foram criadas.
**Caminho recomendado:** migration com `FOR UPDATE TO authenticated USING (agent_name = public.get_user_agent_name()) WITH CHECK (agent_name = public.get_user_agent_name())` — o agente atualiza só o próprio registro, no padrão que as policies de `select` da tabela já usam. Na mesma PR, faça o hook verificar o `error` do upsert antes do `toast.success`.
**Arquivos e objetos a tocar:** nova migration; `src/hooks/useLearning.ts`.
**Não tocar / armadilhas:** `get_user_agent_name()` é uma das funções cuja volatilidade importa (A-090, etapa 101) — use-a, mas saiba que a policy fica lenta até a etapa 101.
**Depende de:** — · **Libera:** 101
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** **sim** (DDL em produção).
**Como verificar:** concluir o mesmo módulo duas vezes com notas diferentes → `SELECT score FROM learning_completions WHERE agent_name='<nome>' AND module_id='<id>'` reflete a segunda nota.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 088 — Declarar o papel exigido em cada item do menu
**Onda / Severidade / Camada:** 2 / Alta / Frontend
**Achados resolvidos:** A-086
**Problema hoje:** `src/components/layout/AppSidebar.tsx:320-321` renderiza os grupos inteiros sem checar `profile?.role` (usado só como enfeite em `:337` e `:346`). Dos 93 links, **49** apontam para rotas com `roles:` declarado. Os itens de navegação **não carregam** o campo `roles`, então não há o que filtrar.
**Causa raiz:** a guarda existe na rota e a estrutura de navegação nasceu sem o campo correspondente.
**Caminho recomendado:** esta etapa só prepara o dado; o filtro é a 089. **Não copie a lista de papéis à mão** — ela sairia de sincronia na primeira rota nova. Em vez disso, exporte de `src/routes/protectedRoutes.tsx` um mapa `routeRoles: Record<string, string[] | undefined>` derivado da própria tabela de rotas, e faça o `AppSidebar` consultá-lo pela `url` do item. Assim a fonte de verdade continua sendo uma só, e um item de menu para rota admin passa a ser restrito automaticamente.
**Arquivos e objetos a tocar:** `src/routes/protectedRoutes.tsx` (export novo), `src/components/layout/AppSidebar.tsx` (tipos).
**Não tocar / armadilhas:** o export não pode arrastar os componentes `lazy()` para o bundle de entrada — exporte **só** o mapa de strings, derivado em tempo de módulo, e confira o tamanho do chunk depois (`node scripts/check-bundle-budget.mjs`).
**Depende de:** — · **Libera:** 089
**Risco e como reverter:** nenhum (nada muda visualmente).
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** teste que afirma `routeRoles['/audit-logs']` = `['admin']` e `routeRoles['/contacts']` = `undefined`; e o orçamento de bundle não piora.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 089 — Filtrar o menu pelo papel do usuário
**Onda / Severidade / Camada:** 2 / Alta / Frontend
**Achados resolvidos:** A-086
**Problema hoje:** um agente comum vê 49 itens de menu que todos levam a `/unauthorized`. Não é falha de segurança — a rota barra — é falha de produto: **ninguém consegue saber pelo menu o que de fato pode usar.**
**Causa raiz:** idem 088.
**Caminho recomendado:** com o mapa da etapa 088, filtre cada item por `hasRole(routeRoles[item.url])` usando o `useAuthContext` que `ProtectedRoute.tsx:15` já usa — mesma função, mesma semântica, zero divergência. Esconda também o **grupo** quando todos os seus itens forem filtrados (senão sobra um cabeçalho "Administração" vazio). Enquanto `profile` estiver carregando, mostre o menu mínimo (só itens sem `roles`), não o menu completo — senão o item pisca e desaparece.
**Arquivos e objetos a tocar:** `src/components/layout/AppSidebar.tsx`.
**Não tocar / armadilhas:** **não** remova a guarda da rota. Esconder o item é produto; barrar o acesso é segurança, e as duas coisas precisam continuar existindo. Há 15 rotas ativas sem item de menu nenhum — isso é outro problema (etapa 264), não conserte aqui.
**Depende de:** 088 · **Libera:** 090, 264
**Risco e como reverter:** se o filtro for agressivo demais, um admin pode perder itens. Teste com os três papéis.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** três testes de componente, um por papel, afirmando a contagem de itens visíveis: agente < supervisor < admin, e nenhum item de agente apontando para rota com `roles`.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 090 — Classificar as 49 rotas que não declaram papel
**Onda / Severidade / Camada:** 2 / Média / Frontend
**Achados resolvidos:** A-088
**Problema hoje:** das 95 rotas protegidas, **49 não têm `roles:`** — entre elas `/ranking`, `/alerts`, `/recordings`, `/hold-settings`, `/voice-security`, `/deals`, `/accounts`. A contenção depende inteiramente do que a RLS permitir, que não é verificável pelo repositório (A-089).
**Causa raiz:** `roles:` foi aplicado onde era obviamente administrativo, e o resto ficou implícito.
**Caminho recomendado:** não adivinhe. Produza uma tabela em `docs/agentes/mapa-repo.md` com as 49 rotas e, para cada uma, a resposta a "qual é o papel mínimo que deveria abrir esta tela?" — derivada do que a tela faz, não do nome. Leve ao dono as que não forem óbvias (`/voice-security`, `/hold-settings`, `/alerts` são candidatas a supervisor). **Só depois** declare os `roles:`, em lotes pequenos, porque cada declaração pode tirar acesso de alguém que usa a tela hoje.
**Arquivos e objetos a tocar:** `docs/agentes/mapa-repo.md`.
**Não tocar / armadilhas:** não declare `roles:` nesta etapa. Uma rota que um agente usa diariamente e que você marcar como supervisor vira um chamado no mesmo dia.
**Depende de:** 089 · **Libera:** 091, 265
**Risco e como reverter:** nenhum (documento).
**Precisa de aprovação humana antes do merge:** não (mas as decisões vêm do dono).
**Como verificar:** a tabela tem 49 linhas, cada uma com rota, o que a tela faz e o papel proposto.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 091 — Decidir o que o papel `viewer` significa
**Onda / Severidade / Camada:** 2 / Alta / Banco + Frontend
**Achados resolvidos:** A-087
**Problema hoje:** o enum tem 4 papéis (`CREATE TYPE public.app_role AS ENUM ('admin','supervisor','agent','viewer')`) e `viewer` aparece em `src/contexts/AuthContext.tsx:6`, `ProtectedRoute.tsx:6`, `useAuthProfile.ts:6`, `Permissions.tsx:155`, `RoleStatsCards.tsx:13`. Mas `grep viewer supabase/migrations/*.sql` em contexto de policy ou função retorna **uma única linha** — um CHECK de domínio (`20261122290000_….sql:87`). **Nenhuma policy e nenhuma função do banco distingue `viewer` de `agent`.** Um usuário cadastrado como "somente visualização" tem o mesmo poder de escrita que um agente.
**Causa raiz:** o papel foi adicionado ao enum e à interface e nunca ganhou semântica no banco.
**Caminho recomendado:** pergunte ao dono **antes de qualquer código**: existe alguém cadastrado como `viewer`? A consulta está em "Como verificar". Dois caminhos: (a) **se o papel é necessário** — implemente-o no banco: as policies de escrita precisam excluir `viewer` explicitamente, o que significa revisar as ~255 policies que usam `is_admin_or_supervisor()`/`is_active_agent()`; é trabalho grande, e deve virar sua própria sequência de etapas; (b) **se não é necessário** — remova-o do enum e da interface, que é mais honesto que um papel que não restringe. Recomende (b) se não houver nenhum usuário com o papel. **Atalho a evitar:** filtrar `viewer` só no front. A contenção tem que estar no banco, ou ela não existe.
**Arquivos e objetos a tocar:** `docs/agentes/banco.md` (registro da decisão); código depois da escolha.
**Não tocar / armadilhas:** remover valor de enum em Postgres é trabalhoso (exige recriar o tipo ou conviver com o valor órfão) — se a escolha for (b), a migration precisa de cuidado e vai exigir aprovação humana.
**Depende de:** 090 · **Libera:** —
**Risco e como reverter:** n/a nesta etapa.
**Precisa de aprovação humana antes do merge:** **sim** (mudança de modelo de permissão).
**Como verificar:** `SELECT role, count(*) FROM user_roles WHERE is_active GROUP BY 1` → a contagem de `viewer` fundamenta a decisão, registrada no documento com data.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 092 — `/status`: dizer "sem medição" em vez de 100%
**Onda / Severidade / Camada:** 2 / Alta / Frontend
**Achados resolvidos:** A-007
**Problema hoje:**
```ts
src/pages/Status.tsx:50   if (!total) return 100;
src/pages/Status.tsx:131  const overallOk = services.every(s => s.uptime >= 99);   // → "Todos os sistemas operacionais"
```
Em produção `webhook_flush_metrics` tem **0 linhas** e `voip_trunk_health_checks` tem **1**. É rota **pública** (`publicRoutes.tsx:24`), lida por clientes e prospects: **a página anuncia que tudo está operacional justamente quando não há medição.**
**Causa raiz:** ausência de dado modelada como 100% de saúde, por causa do tipo de retorno (`number`).
**Caminho recomendado:** `computeUptime` passa a devolver `number | null`, com `null` para "sem amostra". A interface renderiza um terceiro estado — selo neutro "Sem medição no período" — distinto de operacional e de incidente. `overallOk` só é verdadeiro se **todos** os serviços tiverem `uptime !== null && uptime >= 99`. **Atalho a evitar:** devolver 0 em vez de `null`: a página passaria a dizer "incidente" sem haver incidente, e o dono manda reverter no mesmo dia. O estado honesto é "não sei", e ele precisa existir no tipo.
**Arquivos e objetos a tocar:** `src/pages/Status.tsx`.
**Não tocar / armadilhas:** não mexa na consulta nesta etapa (o `.limit(20000)` é a etapa 242).
**Depende de:** — · **Libera:** 093, 242
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** teste de `computeUptime([])` → `null`; e, com as tabelas vazias em produção, a página mostra "Sem medição", não o selo verde.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 093 — `/status`: tratar erro em vez de ficar carregando para sempre
**Onda / Severidade / Camada:** 2 / Alta / Frontend
**Achados resolvidos:** A-007
**Problema hoje:** `load()` (`src/pages/Status.tsx:66-127`) **não tem `try/catch`**: `trunkRes.error` e `webhookRes.error` são ignorados, e `setLoading(false)` (`:124`) só roda no caminho de sucesso. Uma recusa de RLS devolve `data: null`, que cai no `!total → 100`; uma exceção deixa o spinner eterno.
**Causa raiz:** a função só tem um caminho.
**Caminho recomendado:** envolva em `try/catch/finally`, com `setLoading(false)` no `finally` e um estado `error` que a interface mostre ("não foi possível carregar o status"). Verifique `trunkRes.error`/`webhookRes.error` explicitamente — eles vêm no resultado, não como exceção (o cliente não lança). Essas duas tabelas são lidas por **anônimo**: se a RLS negar, o erro precisa aparecer, não virar 100%.
**Arquivos e objetos a tocar:** `src/pages/Status.tsx`.
**Não tocar / armadilhas:** o `setInterval` de 5 min (`:126`) precisa continuar funcionando depois de um erro — não limpe o intervalo no `catch`.
**Depende de:** 092 · **Libera:** —
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** teste que mocka `error` nas duas consultas → a página sai do spinner e mostra a mensagem de erro, não o selo verde.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 094 — `health-check`: parar de reportar "operacional" sem medir
**Onda / Severidade / Camada:** 2 / Alta / Edge Function
**Achados resolvidos:** A-007
**Problema hoje:** `supabase/functions/health-check/index.ts:35` faz `trunkTotal ? (…) : 100`, `:57` decide `operational` com `>= 99`, e `:68` devolve `database: { status: 'operational' }` **fixo — o banco nunca é verificado**. O SLO Dashboard mostra "Operacional" ao lado de "amostra insuficiente".
**Causa raiz:** mesma da A-007, no backend; e um status escrito à mão onde deveria haver uma verificação.
**Caminho recomendado:** espelhe a decisão da etapa 092: devolva `status: 'unknown'` quando não houver amostra, e faça o front renderizar esse terceiro estado. Para o banco, **faça uma verificação real** — uma consulta trivial (`SELECT 1`) com medição de latência; se falhar ou passar de um limite, `degraded`. O `error_budget` que a função já calcula (item C1 das pendências) continua, mas um budget calculado sobre zero amostras também é `unknown`, não "saudável".
**Arquivos e objetos a tocar:** `supabase/functions/health-check/index.ts`, `src/pages/admin/SloDashboard.tsx`, `src/components/network/VoipHealthScoreCard.tsx`.
**Não tocar / armadilhas:** há 11 testes Deno de `slo-budget.ts` — rode-os (`deno test -A supabase/functions/health-check/`) e ajuste as expectativas junto, não depois.
**Depende de:** 092 · **Libera:** 095, 118
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** invocar a edge com as tabelas de saúde vazias → `status: 'unknown'` para trunk e webhook, e `database` refletindo a medição real.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 095 — Score de saúde VoIP: parar de dar 83/100 sem dado
**Onda / Severidade / Camada:** 2 / Alta / Edge Function
**Achados resolvidos:** A-006
**Problema hoje:**
```ts
supabase/functions/voip-executive-summary/index.ts:53  0.4*sla + 0.3*mos + 0.2*alerts + 0.1*capacity
:58  if (mosAvg === null) return 75;     // "neutro" quando sem dados
:65  if (totalCalls === 0) return 100;
:183 sla_score: currentSla ?? 75,
```
Com base zerada: 0,4·75 + 0,3·75 + 0,2·100 + 0,1·100 = **82,5 → 83**, exibido em verde com rótulo `SAUDÁVEL` (`src/components/network/VoipHealthScoreCard.tsx:26-29`). Como a CR-1 garante base zerada, **é esse o número que o dono vê hoje**.
**Causa raiz:** fallbacks "neutros" otimistas somados a pesos cheios — ausência de dado vira nota boa.
**Caminho recomendado:** separe cobertura de resultado. Calcule o score **só** sobre as dimensões que têm amostra, e devolva junto um campo `coverage` (quantas das 4 dimensões foram medidas). Se `coverage < 2`, devolva `score: null` e `label: 'sem medição suficiente'` — o cartão mostra isso, não um número. Remova os fallbacks 75 e 100; `null` propaga. **Atalho a evitar:** baixar os fallbacks para 50 ("neutro de verdade"). Continua inventando número, só com outra cor.
**Arquivos e objetos a tocar:** `supabase/functions/voip-executive-summary/index.ts`, `src/components/network/VoipHealthScoreCard.tsx`.
**Não tocar / armadilhas:** o cartão é consumido por mais de uma tela — procure os consumidores (`grep -rn VoipHealthScoreCard src/`) e confirme que todos tratam `null`.
**Depende de:** 094 · **Libera:** —
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** invocar a edge no estado atual (base vazia) → `score: null`, `coverage: 0`; depois de a etapa 065 gerar chamadas reais, `coverage` sobe e o score aparece.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 096 — Remover ou ligar o painel "Análise IA de Performance"
**Onda / Severidade / Camada:** 2 / Alta / Frontend
**Achados resolvidos:** A-005
**Problema hoje:** `src/components/dashboard/PerformanceNarrative.tsx:27-45` exibe "crescimento de 12%", "acima da meta (94%)", "Eficiência +5.2%", "Health Score 9.8" sob o selo "Análise IA de Performance" e badge "Atualizado agora" — **zero imports de dados** (confirmado por varredura: nenhum `use*()`, nenhum `supabase`). Fica em `/dashboard` (`src/pages/Index.tsx:116`), **logo acima dos KPIs reais**, o que faz os números falsos parecerem da mesma fonte dos verdadeiros.
**Causa raiz:** texto de maquete publicado como funcionalidade.
**Caminho recomendado:** pergunte ao dono qual das duas ele quer, e faça só uma: (a) **remover** o componente e seu uso — 20 linhas de diff, resolve hoje; (b) **ligar** a uma narrativa real — já existe a edge `voip-executive-narrative`, que gera texto a partir de dados; o trabalho é chamá-la, tratar carregando/erro/sem-dados e **remover o badge "Atualizado agora"** quando não houver atualização. Recomende (a) agora e (b) como feature própria depois: enquanto o painel mentir, ele é pior que a ausência dele. **Atalho a evitar:** manter o componente e só trocar os números por "—". O selo "Análise IA" continua prometendo uma análise que não existe.
**Arquivos e objetos a tocar:** `src/components/dashboard/PerformanceNarrative.tsx`, `src/pages/Index.tsx`.
**Não tocar / armadilhas:** `AGENTS.md` proíbe painel decorativo — esta etapa é a aplicação literal dessa regra. Se escolher (b), o painel **não pode** renderizar número sem fonte em nenhum caminho, inclusive no de erro.
**Depende de:** — · **Libera:** 097
**Risco e como reverter:** nenhum.
**Precisa de aprovação humana antes do merge:** não (mas a escolha é do dono).
**Como verificar:** `grep -rn "PerformanceNarrative" src/` → vazio (opção a) ou o componente importa um hook de dados e trata os três estados (opção b). E `/dashboard` não exibe nenhum número sem origem.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 097 — Ligar o painel "Integridade da Infraestrutura (10/10)" aos dados reais
**Onda / Severidade / Camada:** 2 / Alta / Frontend
**Achados resolvidos:** A-005
**Problema hoje:** `src/components/dashboard/SystemIntegrityDashboard.tsx:6-11` é um array literal: `{ component: 'SIP Gateway', status: 'Online', latency: '45ms' }`, `{ 'RLS Policies', 'Seguro', '10/10' }`, com o título "Integridade da Infraestrutura (10/10)". Montado em `/observability` (`ObservabilityDashboard.tsx:104`). Uma degradação real de SIP ou de RLS **não gera chamado** — o painel continua verde.
**Causa raiz:** array literal onde deveria haver consulta.
**Caminho recomendado:** a fonte existe depois da etapa 094: `health-check` passa a devolver estado por componente, com `unknown`. Consuma-a aqui. Para "RLS Policies", **não invente nota** — a RPC `check_all_tables_rls_status` existe (é usada em `SecurityReport.tsx:52`): exiba "163 tabelas, 0 sem RLS" como fato, não "10/10" como nota. **Remova o "(10/10)" do título**: é uma nota que ninguém calcula.
**Arquivos e objetos a tocar:** `src/components/dashboard/SystemIntegrityDashboard.tsx`.
**Não tocar / armadilhas:** latência de SIP só existe se houver health check de tronco — e o único tronco de produção **não tem nenhum** (A-132). Então o estado honesto aqui é `unknown`, e a etapa 119 é que resolve o health check.
**Depende de:** 094, 096 · **Libera:** 119
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** `/observability` mostra "Sem medição" para SIP (até a etapa 119) e a contagem real de RLS; nenhum "10/10" na tela.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 098 — Corrigir o cartão "Auditoria de Segurança (10/10)"
**Onda / Severidade / Camada:** 2 / Alta / Frontend
**Achados resolvidos:** A-005
**Problema hoje:** `src/components/executive/SecurityAuditCard.tsx:6-11` é array literal, e `:44` exibe "Última validação automática: `new Date().toLocaleTimeString()`" — **a hora do render passando por hora de validação**. Chega ao usuário por `RealtimeQualityDashboard.tsx:124` → `/observability`.
**Causa raiz:** idem; agravada por um timestamp gerado no cliente que simula uma execução que não houve.
**Caminho recomendado:** remova o cartão, ou ligue-o à edge `rls-audit`, que **existe e não tem chamador** (A-080) — é exatamente o backend que este cartão precisaria. Se ligar: grave o resultado com `created_at` numa tabela e exiba **esse** timestamp, nunca `new Date()`. Se não ligar agora, remova: um cartão de auditoria com hora falsa é a pior combinação possível.
**Arquivos e objetos a tocar:** `src/components/executive/SecurityAuditCard.tsx`, `src/components/network/RealtimeQualityDashboard.tsx`.
**Não tocar / armadilhas:** `rls-audit` usa service_role e está entre as 11 do baseline `R3-auth` (A-040) — se você a ligar, ela precisa da autorização da etapa 005 primeiro.
**Depende de:** 097 · **Libera:** —
**Risco e como reverter:** nenhum.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** nenhum "10/10" na tela, e nenhum timestamp gerado no cliente apresentado como hora de validação.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 099 — Corrigir a contagem de RLS do relatório de conformidade
**Onda / Severidade / Camada:** 2 / Média / Frontend
**Achados resolvidos:** A-010
**Problema hoje:** `src/lib/security-report-data.ts:20` tem `details: ['22 tabelas com RLS habilitado', …]` — texto fixo. Em produção são **163 tabelas e 0 sem RLS** (snapshot 2026-11-20): errado por um fator de 7. A página `/security-report` mistura essa fonte estática com uma real (`rpc('check_all_tables_rls_status')`, `:52`) **sem distinguir as duas na tela**; o KPI "Features de Segurança" (`:128`) conta um array onde 6 de 7 entradas já vêm marcadas `'implemented'`; e o `.txt` exportado (`:89-92`) embute "Resposta de Inserção: < 50ms (Meta 10/10)" e "Gargalos Identificados: Nenhum", com nome `auditoria-voip-10-10-<data>.txt`.
**Causa raiz:** catálogo escrito à mão convivendo com uma consulta real, sem rótulo que diga qual é qual.
**Caminho recomendado:** três mudanças na mesma PR. (1) A contagem vem da RPC que a página **já chama** — remova o número do arquivo estático. (2) Marque visualmente o que é catálogo de controles (texto curado, aceitável) e o que é medição, com rótulo explícito. (3) No `.txt` exportado, **remova** toda afirmação não medida ("< 50ms", "Nenhum gargalo", "Meta 10/10") e renomeie o arquivo para `relatorio-seguranca-<data>.txt` — o nome atual afirma uma nota no próprio nome. **Atalho a evitar:** atualizar o "22" para "163". Em três meses estará errado de novo; o número tem que vir da consulta.
**Arquivos e objetos a tocar:** `src/lib/security-report-data.ts`, `src/pages/SecurityReport.tsx`.
**Não tocar / armadilhas:** a RPC `check_all_tables_rls_status` pode ser lenta — mantenha o estado de carregamento que a página já tem.
**Depende de:** — · **Libera:** —
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** `/security-report` mostra a contagem vinda da RPC (confira contra `SELECT count(*) FROM pg_tables WHERE schemaname='public'`); o `.txt` exportado não contém nenhuma afirmação de desempenho.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 100 — Rotular corretamente os canais do softphone
**Onda / Severidade / Camada:** 2 / Alta / Hooks + Frontend
**Achados resolvidos:** A-085
**Problema hoje:**
```ts
src/hooks/useMultiChannelCall.ts:64-67
{ id:'webrtc', enabled:true,  configured:true }    // ElevenLabs é stub e sempre falha
{ id:'wavoip', enabled:false, configured:false }   // a edge responde sucesso
```
`src/lib/elevenlabs-stub.ts:16-21` **sempre** devolve erro, e `webrtc` é o canal **default** (`:71`). Do outro lado, `supabase/functions/wavoip-call/index.ts:70` responde `{ success: true, connected: true, message: 'Conexão estabelecida' }` e `useWavoipCall.ts:122-129` usa `setTimeout` para marcar `active` com cronômetro rodando. O softphone abre num canal rotulado "configurado" que nunca funciona, e o canal de WhatsApp mostra chamada "ativa" sem chamada existir.
**Causa raiz:** dois stubs com rótulos invertidos em relação ao comportamento.
**Caminho recomendado:** faça o rótulo seguir o comportamento. (1) `webrtc`: `configured: false` enquanto o backend for o stub do ElevenLabs, e **mude o canal default para `sip`**, que é o único real (`useSipCall` com jssip). (2) `wavoip`: mantenha `configured: false` e **remova o `setTimeout` que simula chamada ativa** — se o canal não está configurado, ele não deve produzir cronômetro. A edge `wavoip-call` está declarada como stub com `// edge-stub-ok` e isso é aceitável; o problema é a interface afirmar o contrário. (3) Na tela, canal não configurado aparece desabilitado com o motivo ("requer configuração"), não selecionável.
**Arquivos e objetos a tocar:** `src/hooks/useMultiChannelCall.ts`, `src/hooks/useWavoipCall.ts`, `src/components/calls/UnifiedSoftphone.tsx`.
**Não tocar / armadilhas:** **mudar o canal default afeta todo agente** — é a mudança mais visível desta onda. Confirme com o dono qual canal deve abrir por padrão. Não apague `elevenlabs-stub.ts`: ele é honesto sobre o que é (sempre erro); o problema está no rótulo que o acompanha.
**Depende de:** 060 · **Libera:** —
**Risco e como reverter:** médio (muda o que o agente vê ao abrir o softphone). Reverter: `git revert`.
**Precisa de aprovação humana antes do merge:** não (mas o default é decisão do dono).
**Como verificar:** abrir o softphone → o canal selecionado é `sip`; `webrtc` e `wavoip` aparecem desabilitados com motivo; selecionar WhatsApp não inicia cronômetro nenhum.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

---

# ONDA 3 — Integridade de dados e regras de negócio (101–150)

## Etapa 101 — Marcar como `STABLE` as três funções que governam 270 policies
**Onda / Severidade / Camada:** 3 / Alta / Banco
**Achados resolvidos:** A-090
**Problema hoje:** `is_admin_or_supervisor()` (`20261122250000_….sql:13`), `is_admin()` e `is_supervisor()` (`20261122280000_….sql:11,:29`) e `get_auth_agent_id()` (`20260515174404_….sql:2`) são declaradas **sem marcador de volatilidade** → default `VOLATILE`. As irmãs foram marcadas `STABLE` (`is_admin_user`, `get_user_role`, `has_role`). **270 das 464 policies vivas, em 130 tabelas, chamam uma dessas quatro** (313 ocorrências só de `is_admin_or_supervisor`). Função `VOLATILE` num predicado de RLS é reexecutada **linha a linha** e não pode virar InitPlan — então o embrulho `(SELECT …)` que `20261122200000_rls_initplan_remaining.sql` aplicou **não ajuda** aqui.
**Causa raiz:** marcador esquecido em três funções de um conjunto que foi migrado em lotes. O linter `auth_rls_initplan` do Supabase não acusa porque só olha `auth.*`, não helpers próprios.
**Caminho recomendado:** migration com `CREATE OR REPLACE FUNCTION` das quatro, idênticas ao corpo atual, acrescentando `STABLE` — copie o corpo da última definição de cada uma, não reescreva. `STABLE` é correto aqui: dentro de um comando, o papel do usuário não muda. **Atalho a evitar:** `IMMUTABLE` — elas leem tabela, e `IMMUTABLE` autorizaria o planejador a cachear entre comandos, o que é errado e perigoso.
**Arquivos e objetos a tocar:** nova migration `supabase/migrations/<ts>_role_helpers_stable.sql`.
**Não tocar / armadilhas:** não mude o corpo. Qualquer alteração de lógica aqui afeta 270 policies de uma vez.
**Depende de:** 065 · **Libera:** 102
**Risco e como reverter:** baixo. Reverter: recriar sem `STABLE`.
**Precisa de aprovação humana antes do merge:** **sim** (DDL em produção, alcance amplo).
**Como verificar:** `SELECT proname, provolatile FROM pg_proc WHERE proname IN ('is_admin','is_supervisor','is_admin_or_supervisor','get_auth_agent_id')` → `provolatile = 's'` nas quatro. Depois, `EXPLAIN ANALYZE SELECT * FROM call_sessions LIMIT 100` mostra a função como InitPlan, não como filtro por linha.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 102 — Criar o módulo único de métricas de fila
**Onda / Severidade / Camada:** 3 / Alta / Lib
**Achados resolvidos:** A-027, A-028
**Problema hoje:** nível de serviço e taxa de abandono estão implementados em quatro lugares, com fórmulas diferentes (ver etapas 103 e 104). Não existe um módulo compartilhado entre front e edge.
**Causa raiz:** cópia da fórmula a cada novo consumidor.
**Caminho recomendado:** crie `src/lib/metrics/queue.ts` com funções **puras**: `serviceLevel(calls, thresholdSeconds)`, `abandonmentRate(calls)`, `averageWaitTime(calls)` — todas recebendo a lista e devolvendo `number | null` (`null` para conjunto vazio, a lição das etapas 092–095). Escreva os testes primeiro, incluindo os casos de borda: lista vazia, uma chamada, todas abandonadas, divisão por zero. As edges em Deno não podem importar de `src/` — **duplique as funções em `supabase/functions/_shared/queue-metrics.ts`** com os mesmos testes, e deixe um comentário em cada arquivo apontando para o outro. É duplicação consciente de ~40 linhas, preferível a divergência silenciosa; a alternativa (um pacote compartilhado) não vale a complexidade aqui.
**Arquivos e objetos a tocar:** novos `src/lib/metrics/queue.ts`, `src/lib/__tests__/queue-metrics.test.ts`, `supabase/functions/_shared/queue-metrics.ts` e seu teste Deno.
**Não tocar / armadilhas:** nenhum consumidor muda nesta etapa. **Não** reproduza o limiar fixo: ele vem como parâmetro, e a origem dele é a etapa 103.
**Depende de:** 101 · **Libera:** 103, 104, 105
**Risco e como reverter:** nenhum.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** `npx vitest run src/lib/__tests__/queue-metrics.test.ts` e `deno test -A supabase/functions/_shared/` → ambos verdes, com os mesmos casos.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 103 — Unificar o nível de serviço: um limiar, uma janela, um denominador
**Onda / Severidade / Camada:** 3 / Alta / Hooks + Edge Function
**Achados resolvidos:** A-028
**Problema hoje:** a mesma métrica, com o mesmo nome na tela, tem dois limiares e duas janelas:
```ts
src/hooks/useQueueMetrics.ts:118              (c.hold_time_seconds || 0) < 20     // última hora
supabase/functions/check-goals/index.ts:118   (c.hold_time_seconds || 0) < 20     // última hora
src/hooks/useSupervisorPanel.ts:127           (c.hold_time_seconds || 0) <= 30    // desde 00:00
supabase/functions/check-queue-metrics/index.ts:110 (call.hold_time_seconds || 0) <= 30
```
Nas quatro, o denominador exclui abandonadas (`completed.length`), o que **infla** o indicador: abandono nunca penaliza o nível de serviço. O painel do supervisor e o alerta automático discordam no mesmo instante.
**Causa raiz:** fórmula copiada quatro vezes, sem fonte única nem configuração.
**Caminho recomendado:** o limiar é decisão de negócio e **já tem onde morar**: existe a tabela `queue_metrics_settings` e a tela `/queue-metrics-settings`. Leia o limiar de lá (com default explícito se ausente) e passe para `serviceLevel()` da etapa 102 nos quatro consumidores. Padronize a janela em "última hora" nos quatro — e, se o painel do supervisor precisa do acumulado do dia, exponha **duas** métricas com nomes distintos na tela, nunca a mesma com cálculo diferente. Sobre o denominador: incluir abandonadas muda o número que o dono vê há meses — **leve a ele antes de mergear**, com os dois valores calculados sobre o mesmo período.
**Arquivos e objetos a tocar:** `src/hooks/useQueueMetrics.ts`, `src/hooks/useSupervisorPanel.ts`, `supabase/functions/check-goals/index.ts`, `supabase/functions/check-queue-metrics/index.ts`.
**Não tocar / armadilhas:** esta etapa só produz número correto **depois** da 069 (que preenche `hold_time_seconds`). Antes dela, todo nível de serviço é 100% porque a espera é sempre 0 — e você concluiria que a unificação não mudou nada.
**Depende de:** 069, 102 · **Libera:** 105
**Risco e como reverter:** o indicador muda de valor, e o dono precisa saber por quê. Reverter: `git revert`.
**Precisa de aprovação humana antes do merge:** **sim** (muda um indicador de negócio).
**Como verificar:** com o mesmo conjunto de chamadas, `/queue-dashboard` e o alerta automático reportam **o mesmo** número. Consulta de apoio: `SELECT count(*) FILTER (WHERE hold_time_seconds < 20) * 100.0 / count(*) FROM call_sessions WHERE created_at > now() - interval '1 hour' AND status IN ('completed','abandoned','missed')`.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 104 — Unificar a taxa de abandono
**Onda / Severidade / Camada:** 3 / Alta / Hooks + Banco
**Achados resolvidos:** A-027
**Problema hoje:** duas definições:
```sql
supabase/migrations/20260722213602_….sql:52-58
COUNT(*) FILTER (WHERE status = 'abandoned') / NULLIF(COUNT(*),0)   -- 15 min, TODAS as chamadas no denominador
```
```ts
src/hooks/useQueueMetrics.ts:115-117
(status==='abandoned' || status==='missed') / (completed + abandoned)
```
A versão do banco (que alimenta o **freio do discador**) exclui `missed` e inclui chamadas em curso no denominador → resulta sempre **menor**. O discador continua acelerando enquanto o painel de compliance mostra abandono acima da meta.
**Causa raiz:** a função de pacing foi escrita sem consultar a definição já em uso no front.
**Caminho recomendado:** fixe a definição **uma vez**: numerador = `abandoned` + `missed`; denominador = chamadas **encerradas** no período (exclui as em curso, que ainda não têm desfecho). Aplique em `abandonmentRate()` (etapa 102) e **reescreva a função SQL de pacing para usar a mesma regra** — é a única forma de o freio e o painel concordarem. A janela do pacing (15 min) é legítima e diferente da do painel: o que precisa ser igual é a **fórmula**, não o período.
**Arquivos e objetos a tocar:** `src/hooks/useQueueMetrics.ts`; nova migration que recria a função de pacing de `20260722213602`.
**Não tocar / armadilhas:** a mudança **deixa o freio mais sensível** — o discador vai frear mais. É o comportamento correto, mas avise o dono: ele vai notar queda no volume de discagem.
**Depende de:** 102, 103 · **Libera:** 105
**Risco e como reverter:** médio (afeta o ritmo da campanha). Reverter: migration inversa.
**Precisa de aprovação humana antes do merge:** **sim** (DDL e mudança de comportamento do discador).
**Como verificar:** `SELECT * FROM <funcao_pacing>('<campanha>')` e a taxa exibida em `/outbound-compliance` → mesmo valor para o mesmo período.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 105 — Alinhar o freio do discador à meta de abandono configurada
**Onda / Severidade / Camada:** 3 / Alta / Banco
**Achados resolvidos:** A-027
**Problema hoje:** mesmo com a fórmula unificada (etapa 104), o limite que faz o discador frear está embutido na função SQL, não na configuração da campanha nem nas regras de compliance.
**Causa raiz:** limiar hardcoded.
**Caminho recomendado:** leia o limite de `dialer_campaigns` (se a coluna existir) ou de `compliance_settings`; na ausência, use 3% — o teto usual de regulação de telemarketing — e **registre a escolha num comentário** na migration, para a próxima pessoa saber de onde saiu. Exponha o valor na tela da campanha.
**Arquivos e objetos a tocar:** nova migration; `src/components/dialer/` (exibição).
**Não tocar / armadilhas:** confirme a coluna no schema antes (`SELECT column_name FROM information_schema.columns WHERE table_name='dialer_campaigns'`) — não presuma que existe.
**Depende de:** 104 · **Libera:** —
**Risco e como reverter:** médio.
**Precisa de aprovação humana antes do merge:** **sim** (DDL e comportamento do discador).
**Como verificar:** alterar o limite na campanha muda o ponto em que o pacing freia, observável em `SELECT * FROM <funcao_pacing>('<campanha>')`.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 106 — Limitar a nota da IA ao máximo do critério no scorecard
**Onda / Severidade / Camada:** 3 / Alta / Edge Function
**Achados resolvidos:** A-029
**Problema hoje:** `supabase/functions/score-call/index.ts:83-89` soma `Number(r.score) * Number(crit.weight)` **sem limitar** ao `max_score` do critério — a IA pode devolver nota acima do máximo e o percentual exibido em `src/pages/Scorecards.tsx:207` passa de 100%. A irmã `auto-scorecard/index.ts:116-119` faz o clamp corretamente.
**Causa raiz:** duas edges implementam a mesma rubrica, e só uma defende o intervalo.
**Caminho recomendado:** copie o clamp de `auto-scorecard:116` (`Math.max(0, Math.min(c.max_score, Number(s.score) || 0))`) para `score-call`. Mudança de três linhas, com teste Deno que passa nota acima do máximo e afirma o resultado limitado.
**Arquivos e objetos a tocar:** `supabase/functions/score-call/index.ts` + teste Deno.
**Não tocar / armadilhas:** não altere o denominador nesta etapa (é a 107) — separar as duas correções deixa claro qual mudou qual número.
**Depende de:** — · **Libera:** 107
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** `deno test -A supabase/functions/score-call/` com o caso novo; e `SELECT id FROM call_scorecards WHERE total_score > max_total` → vazio para scorecards novos.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 107 — Uma fórmula só para o score do scorecard
**Onda / Severidade / Camada:** 3 / Alta / Edge Function
**Achados resolvidos:** A-029
**Problema hoje:** o denominador difere entre as duas edges. `score-call/index.ts:83-89` divide pelo máximo de **todos** os critérios; `auto-scorecard/index.ts:116-119` divide só pelos critérios **efetivamente pontuados**. A mesma chamada recebe notas diferentes conforme o caminho, e pela rota `score-call` um critério em branco baixa injustamente a nota.
**Causa raiz:** duas implementações da mesma rubrica.
**Caminho recomendado:** extraia a rubrica para `supabase/functions/_shared/scorecard.ts` (`computeScore(criteria, responses)`), com testes Deno cobrindo: critério não pontuado, nota acima do máximo, peso zero, nenhuma resposta. Faça as duas edges importarem. Decida o denominador explicitamente — recomendo **só os critérios pontuados** (o de `auto-scorecard`), porque um critério que o avaliador não pôde julgar não deveria contar contra o agente — e registre a decisão no comentário do módulo.
**Arquivos e objetos a tocar:** novo `supabase/functions/_shared/scorecard.ts` + teste; `score-call/index.ts`; `auto-scorecard/index.ts`.
**Não tocar / armadilhas:** scorecards **já gravados** ficam com a fórmula antiga. Não recalcule em massa sem o dono: notas de desempenho de agente são dado sensível. Registre a data de corte no comentário.
**Depende de:** 106 · **Libera:** 108
**Risco e como reverter:** médio (muda nota de agente).
**Precisa de aprovação humana antes do merge:** **sim** (muda avaliação de pessoas).
**Como verificar:** `deno test -A supabase/functions/_shared/` verde; e a mesma chamada avaliada pelas duas rotas produz o mesmo percentual.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 108 — Um scorecard automático não deve nascer "enviado"
**Onda / Severidade / Camada:** 3 / Alta / Edge Function
**Achados resolvidos:** A-029, A-126
**Problema hoje:** `auto-scorecard/index.ts:134` grava `status: 'submitted'` e `score-call/index.ts:99` grava `'draft'`. **A revisão humana é pulada dependendo de qual edge avaliou a chamada** — e não há `CHECK` de status em `call_scorecards`.
**Causa raiz:** duas edges decidindo o estado inicial de um fluxo que deveria ter um só.
**Caminho recomendado:** avaliação gerada por IA nasce `'draft'` nas duas, e passa a `'submitted'` só por ação de um supervisor. Se o dono quiser que a IA publique direto, isso é configuração, não comportamento escondido numa das edges. Adicione o `CHECK` de status na mesma migration (coordene com a etapa 125). Ajuste a tela para mostrar os rascunhos pendentes de revisão — senão eles ficam invisíveis.
**Arquivos e objetos a tocar:** `auto-scorecard/index.ts`, `score-call/index.ts`, nova migration com o CHECK, `src/pages/Scorecards.tsx`.
**Não tocar / armadilhas:** scorecards já `submitted` continuam válidos; a mudança vale para os novos.
**Depende de:** 107 · **Libera:** 125
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** **sim** (DDL e mudança de fluxo de avaliação).
**Como verificar:** disparar as duas rotas → `SELECT DISTINCT status FROM call_scorecards WHERE created_at > now() - interval '1 hour'` → só `draft`.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 109 — Escolher a política de SLA mais específica, não a primeira
**Onda / Severidade / Camada:** 3 / Alta / Edge Function
**Achados resolvidos:** A-037
**Problema hoje:**
```ts
supabase/functions/enforce-sla/index.ts:17-20  .from("sla_policies").select("*").eq("is_active", true);   // sem ORDER BY
supabase/functions/enforce-sla/index.ts:51-55  const matched = policies.find(p => (p.channel === conv.channel || p.channel === "all") && …)
```
`find` devolve o primeiro match **na ordem que o banco entregar**. A especificidade descrita no próprio comentário nunca foi implementada, e o teste que deveria pegar isso afirma só `assert(matched !== undefined)` (`__tests__/index.test.ts:18-27`), passando mesmo quando devolve a política genérica de 1440 minutos. Um ticket de WhatsApp com SLA prometido de 5 minutos pode ser cobrado como 24 horas.
**Causa raiz:** ausência de ordenação determinística, somada a um teste que não distingue os casos.
**Caminho recomendado:** ordene por especificidade **no SQL**: `ORDER BY (channel = 'all') ASC, (priority IS NULL) ASC, …` — assim o primeiro match já é o mais específico, e você não depende de ordenação em memória. **Corrija o teste junto**: ele deve afirmar `matched.id === <politica específica>`, não só que existe. É o padrão de "teste que não protege" (A-048) aplicado a uma regra de negócio.
**Arquivos e objetos a tocar:** `supabase/functions/enforce-sla/index.ts`, `supabase/functions/enforce-sla/__tests__/index.test.ts`.
**Não tocar / armadilhas:** confirme os nomes das colunas de especificidade (`channel`, `priority`) no schema antes de escrever o `ORDER BY`.
**Depende de:** — · **Libera:** 111, 112
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** `deno test -A supabase/functions/enforce-sla/` com o teste corrigido → falha antes da mudança, passa depois.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 110 — Enviar `version` nos updates e tirar o lock otimista da inércia
**Onda / Severidade / Camada:** 3 / Alta / Hooks
**Achados resolvidos:** A-058
**Problema hoje:**
```sql
supabase/migrations/20260418125824_….sql:10-11
IF NEW.version IS NOT NULL AND NEW.version <> OLD.version THEN RAISE EXCEPTION 'OPTIMISTIC_LOCK_CONFLICT'
```
Como `version` é `NOT NULL`, **omitir a coluna faz `NEW.version = OLD.version`** → nunca há conflito. Quem atualiza sem enviar: `src/hooks/useDeals.ts:74-85` (`updateDeal`) e `:87` (`updateStage`, o arrasta-e-solta do kanban), `src/hooks/useAccounts.ts:69-73`. `useContacts.ts:203` aceita `version` opcional, mas o único chamador (`CreateContactDialog.tsx:70-81`) não envia. **Nenhuma edge envia.** Dois usuários editando a mesma oportunidade: o último salva por cima sem aviso, e o painel `/concurrency-conflicts` fica **estruturalmente vazio**.
**Causa raiz:** o contrato do gatilho (ADRs 039–041) nunca foi ligado no cliente.
**Caminho recomendado:** inclua `version` na leitura (os tipos já a têm: `useDeals.ts:27`, `useContacts.ts:33`) e envie no `update`. Trate `OPTIMISTIC_LOCK_CONFLICT` com uma mensagem útil — "este registro foi alterado por outra pessoa; recarregue" — e recarregue o registro. O ramo que trata o erro **já existe** em `useDeals.ts:77-81`, hoje inalcançável: ele passa a funcionar. Comece por `deals` (onde o kanban torna a colisão mais provável), depois `accounts`, depois `contacts`. **Atalho a evitar:** adicionar `version` só em `updateDeal` e esquecer `updateStage` — o arrasta-e-solta é justamente o caminho com mais concorrência.
**Arquivos e objetos a tocar:** `src/hooks/useDeals.ts`, `src/hooks/useAccounts.ts`, `src/components/contacts/CreateContactDialog.tsx`.
**Não tocar / armadilhas:** `src/hooks/__tests__/useDeals.conflict.test.ts:32-50` passa hoje porque **mocka** o banco devolvendo o conflito para um update que nunca o provoca. Depois desta etapa ele testa algo real — releia e ajuste as expectativas.
**Depende de:** — · **Libera:** 086, 126
**Risco e como reverter:** médio — usuários passam a ver conflitos que antes eram silenciosamente sobrescritos. **Isso é a correção funcionando**, e o dono precisa ser avisado.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** abrir a mesma oportunidade em duas abas, salvar na primeira, salvar na segunda → a segunda recebe a mensagem de conflito e **não** sobrescreve. E `SELECT count(*) FROM optimistic_lock_conflicts WHERE created_at > now() - interval '1 hour'` > 0 depois do teste.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 111 — Fazer o SLA respeitar o horário comercial
**Onda / Severidade / Camada:** 3 / Alta / Edge Function
**Achados resolvidos:** A-038
**Problema hoje:** a coluna existe (`20260417001411_….sql:350  business_hours_only BOOLEAN DEFAULT false`), o tipo existe (`useSLA.ts:15`), e o cálculo usa tempo corrido: `enforce-sla/index.ts:62-70` faz `createdAt.getTime() + matched.first_response_minutes * 60_000`. `grep business_hours_only supabase/functions/` → **zero**. Um ticket aberto sexta 18h "estoura" o SLA durante o fim de semana.
**Causa raiz:** campo configurável sem implementação.
**Caminho recomendado:** escreva `addBusinessMinutes(start, minutes, schedule)` como função **pura** em `_shared/business-hours.ts`, com testes cobrindo: abertura dentro do horário, abertura fora, atravessar fim de semana, feriado. A fonte do horário já existe no banco (a mesma usada por `check_calling_hours`) — reuse, não crie outra tabela. Quando `business_hours_only` for falso, o comportamento atual continua. **Atalho a evitar:** aproximar com "+16 h por dia útil": erra em todo caso de borda e é impossível de explicar a um cliente que cobra SLA.
**Arquivos e objetos a tocar:** novo `supabase/functions/_shared/business-hours.ts` + teste; `supabase/functions/enforce-sla/index.ts`.
**Não tocar / armadilhas:** fuso horário. A A-033 mostra que `d.getHours()` em Deno é UTC — use explicitamente o fuso da operação, e **teste** com um horário que cruze a meia-noite em UTC.
**Depende de:** 109 · **Libera:** 112
**Risco e como reverter:** médio (muda prazos cobrados).
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** `deno test -A supabase/functions/_shared/business-hours*`; e um ticket de teste aberto sexta 18h com política de 60 min `business_hours_only` → vencimento na segunda, não no sábado.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 112 — Parar de premiar quem adia ou fecha conversa atrasada
**Onda / Severidade / Camada:** 3 / Alta / Hooks + Edge Function
**Achados resolvidos:** A-039
**Problema hoje:** `enforce-sla/index.ts:43` só avalia `status in ('open','pending')`, e `src/hooks/useSLA.ts:51-53` divide por **todas** as conversas de 7 dias. Conversas `snoozed`/`closed` nunca passam pelo enforcement, ficam com `sla_breached = false` e entram no numerador como cumpridas. **Basta adiar ou fechar as atrasadas para a conformidade subir.**
**Causa raiz:** o conjunto avaliado e o conjunto medido são diferentes.
**Caminho recomendado:** duas correções que precisam andar juntas. (1) O enforcement avalia **também** `snoozed` e `closed` — uma conversa fechada depois do prazo violou o SLA, e fechar não desfaz isso; se o produto tiver "pausar SLA" como regra legítima, isso precisa de um campo próprio, não do status. (2) A conformidade divide só pelas conversas que **tinham** SLA aplicável e já venceram — conversa dentro do prazo não é nem cumprida nem violada ainda. **Atalho a evitar:** só mudar o denominador. O numerador continuaria errado, porque `sla_breached` nunca foi calculado para as fechadas.
**Arquivos e objetos a tocar:** `supabase/functions/enforce-sla/index.ts`, `src/hooks/useSLA.ts`.
**Não tocar / armadilhas:** o indicador vai **cair**, possivelmente muito. É a correção funcionando; leve o número antes e depois ao dono na PR.
**Depende de:** 111 · **Libera:** —
**Risco e como reverter:** médio (muda indicador de negócio).
**Precisa de aprovação humana antes do merge:** **sim** (muda indicador).
**Como verificar:** `SELECT status, count(*) FILTER (WHERE sla_breached) FROM conversations WHERE created_at > now() - interval '7 days' GROUP BY 1` → `closed` e `snoozed` passam a ter violações registradas.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 113 — Um limiar só para "qualidade ruim" de chamada
**Onda / Severidade / Camada:** 3 / Média / Lib
**Achados resolvidos:** A-030
**Problema hoje:** 3,5 em quatro lugares e 3,6 em dois: `src/hooks/useVoipQualityMonitor.ts:55` (`>= 3.6`), `supabase/functions/voip-recommendation-simulate/index.ts:14` (`3.6`), `src/hooks/useQualityTrendAnalyzer.ts:60-62` (3,6 e 3,5), `src/components/network/AgentQualityRanking.tsx:154` (`< 3.5`), `src/components/network/QualityHeatmap.tsx:27,62-63` (`3.5`). Uma chamada com nota 3,55 aparece como degradada no mapa, aceitável no detector de tendência e "recuperada" na simulação — três respostas para a mesma chamada.
**Causa raiz:** constante copiada em seis arquivos.
**Caminho recomendado:** crie `src/lib/metrics/mos.ts` com `MOS_THRESHOLDS = { poor: 3.5, fair: 3.6, good: 4.0 }` (confirme a escala com o dono; a convenção MOS é 1–5) e `classifyMos(value)`. Duplique em `_shared/mos.ts` para as edges, como na etapa 102. Troque os seis usos. Escolha **um** valor para "ruim" — recomendo 3,5, que é maioria e é o limiar clássico de MOS aceitável.
**Arquivos e objetos a tocar:** novo `src/lib/metrics/mos.ts` + teste; novo `supabase/functions/_shared/mos.ts` + teste; os 6 arquivos citados.
**Não tocar / armadilhas:** não mude a escala. Se algum dos seis estiver usando escala 0–100, converter errado é pior que divergir.
**Depende de:** — · **Libera:** —
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** `grep -rn "3\.5\|3\.6" src/hooks/useVoipQualityMonitor.ts src/hooks/useQualityTrendAnalyzer.ts src/components/network/AgentQualityRanking.tsx src/components/network/QualityHeatmap.tsx` → nenhum literal; uma chamada com MOS 3,55 recebe a mesma classificação nas três telas.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 114 — Aplicar o limite de ritmo na função que realmente roda
**Onda / Severidade / Camada:** 3 / Média / Banco
**Achados resolvidos:** A-031
**Problema hoje:** `src/lib/dialer/predictive-pace.ts:4` declara "deve espelhar 1:1 a lógica em produção" e `:52` aplica `Math.max(minPace, Math.min(maxPace, suggested))`. A função SQL que **de fato roda** não aplica: `20260722213602_….sql:66,75` tem `v_suggested := v_campaign.max_concurrent_calls;` **sem clamp**. E `calculatePredictivePace` não é importado por nenhum código de produção — só pelo teste de propriedade `predictive-pace.property.test.ts:26`, que roda 1000 casos contra a cópia. **O ritmo pode ficar acima do máximo configurado, e o teste verde diz o contrário.**
**Causa raiz:** porte em TypeScript criado para poder testar, sem mecanismo que garanta o espelhamento.
**Caminho recomendado:** adicione o clamp na função SQL — é a correção. Depois decida o que fazer com a cópia: (a) **apagá-la** e o teste, já que não roda; ou (b) mantê-la e adicionar ao CI um teste que compare as duas implementações sobre os mesmos casos, rodando o SQL no Postgres descartável da etapa 053. Recomendo (b) **se** a etapa 053 estiver pronta; caso contrário (a), porque um teste que prova a cópia é pior que nenhum: ele dá confiança falsa.
**Arquivos e objetos a tocar:** nova migration que recria a função de pacing; `src/lib/dialer/predictive-pace.ts` e seu teste (conforme a escolha).
**Não tocar / armadilhas:** **coordene com a etapa 104**, que também recria essa função — faça as duas na mesma migration ou em ordem, nunca em paralelo.
**Depende de:** 104 · **Libera:** —
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** **sim** (DDL em produção).
**Como verificar:** chamar a função com `max_concurrent_calls` acima do `max_pace` da campanha → o retorno respeita o máximo.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 115 — Parar de elogiar chamada sem áudio
**Onda / Severidade / Camada:** 3 / Média / Edge Function
**Achados resolvidos:** A-032
**Problema hoje:** `src/lib/talkRatio.ts:85-87` devolve `'agent_low'` com duração 0; `supabase/functions/analyze-talk-ratio/index.ts:100-102` faz `agentTime/totalDuration` → **`NaN`**, as duas comparações falham e o resultado cai em `'optimal'`. A tela de detalhe usa a edge, então uma chamada sem áudio é classificada como ideal.
**Causa raiz:** divisão sem proteger o denominador, somada a comparação com `NaN` que sempre é falsa.
**Caminho recomendado:** na edge, se `totalDuration` for 0 ou não houver transcrição, devolva `null` / `'insufficient_data'` e faça a tela exibir "sem áudio suficiente". Alinhe `src/lib/talkRatio.ts` ao mesmo retorno. O caso `NaN` precisa de teste explícito — é o tipo de erro que passa por qualquer revisão.
**Arquivos e objetos a tocar:** `supabase/functions/analyze-talk-ratio/index.ts` + teste Deno; `src/lib/talkRatio.ts` + teste; a tela de detalhe.
**Não tocar / armadilhas:** procure outras divisões sem proteção no mesmo arquivo e nas edges de métrica — anote no progresso o que achar (não corrija aqui).
**Depende de:** — · **Libera:** —
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** chamada com duração 0 → a tela mostra "sem áudio suficiente", não "ideal".
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 116 — Corrigir as 3 horas de erro na "melhor hora para contatar"
**Onda / Severidade / Camada:** 3 / Média / Edge Function
**Achados resolvidos:** A-033
**Problema hoje:** `supabase/functions/compute-best-time/index.ts:58` usa `d.getHours()`, que no Deno é **UTC**, e `src/pages/OutboundCompliance.tsx:200` exibe `${p.best_hour}h` como se fosse hora local — 3 horas de erro no Brasil. O sistema recomenda ligar no horário errado.
**Causa raiz:** hora calculada em UTC e exibida sem conversão.
**Caminho recomendado:** calcule no fuso da operação. O jeito mais robusto é fazer a agregação **no SQL** com `AT TIME ZONE`, usando o fuso configurado da operação — assim não depende do runtime. Se mantiver no TypeScript, use `Intl.DateTimeFormat` com `timeZone` explícito, nunca `getHours()`. Guarde no banco o fuso usado, para a tela não precisar adivinhar. Recalcule os valores existentes (ou marque-os como obsoletos) — números de 3 h errados são pior que ausência.
**Arquivos e objetos a tocar:** `supabase/functions/compute-best-time/index.ts`, `src/pages/OutboundCompliance.tsx`, possivelmente uma migration para a coluna de fuso.
**Não tocar / armadilhas:** horário de verão. Use nome de fuso IANA (`America/Sao_Paulo`), nunca deslocamento fixo.
**Depende de:** — · **Libera:** —
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** **sim** se precisar de migration.
**Como verificar:** contato com chamadas atendidas às 14 h locais → `best_hour` = 14, não 17.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 117 — Um vocabulário só para o status do agente
**Onda / Severidade / Camada:** 3 / Alta / Hooks + Banco
**Achados resolvidos:** A-034
**Problema hoje:** três vocabulários incompatíveis:
```ts
src/hooks/useAgentStatus.ts:8       'available' | 'busy' | 'away' | 'offline'
src/hooks/useQueueMetrics.ts:98-100 'available' | 'busy'||'on_call' | 'break'||'away'
```
```sql
20250102000000_hello_production.sql:57  CHECK (status IN ('online','offline','busy','away','break'))
20260722213602_….sql:34                 WHERE status = 'available';   -- usado pelo pacing
```
`'available'` e `'on_call'` **não constam** do único CHECK versionado; `'online'`/`'break'` nunca são escritos pelo app. Há **três** `CREATE TABLE public.agents` conflitantes (`20250102000000:51`, `20251223203745:2`, `20260515170309:25`). Se o CHECK vigente for o versionado, ou a troca de status é rejeitada, ou "agentes disponíveis" fica fixo em zero — e o discador **sempre freia**.
**Causa raiz:** nenhuma fonte única para o enum, com três DDLs concorrentes no histórico.
**Caminho recomendado:** **primeiro descubra o que está vivo** — `SELECT DISTINCT status FROM agents` e `SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid='public.agents'::regclass`. Sem isso você vai padronizar para o vocabulário errado. Depois: escolha o conjunto (recomendo o do front: `available`, `busy`, `away`, `offline`, mais `on_call` se o produto distingue), crie `src/lib/agentStatus.ts` como fonte única, troque os usos, e **só então** a migration que ajusta o CHECK — com `UPDATE` de normalização dos valores existentes antes, na mesma transação.
**Arquivos e objetos a tocar:** novo `src/lib/agentStatus.ts`; `src/hooks/useAgentStatus.ts`; `src/hooks/useQueueMetrics.ts`; nova migration; a função de pacing.
**Não tocar / armadilhas:** **não** adicione o CHECK antes do `UPDATE` de normalização — a migration aborta e, como o CLI envolve tudo numa transação, você perde o resto do arquivo. É exatamente o modo de falha descrito na A-092.
**Depende de:** 101 · **Libera:** 118, 147
**Risco e como reverter:** **alto** — se a normalização errar, o status dos agentes fica inconsistente e a fila para de rotear. Peça backup da coluna ao dono.
**Precisa de aprovação humana antes do merge:** **sim** (DDL e alteração de dado em produção).
**Como verificar:** `SELECT DISTINCT status FROM agents` → só valores do conjunto novo; trocar o status pela interface funciona; `SELECT count(*) FROM agents WHERE status='available'` reflete a realidade.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 118 — Respeitar o limite de chamadas simultâneas do agente
**Onda / Severidade / Camada:** 3 / Média / Hooks
**Achados resolvidos:** A-035
**Problema hoje:** `src/hooks/useMultiChannelCall.ts:62` define `MAX_SIMULTANEOUS_CALLS = 3` **no navegador**, e a coluna `agents.max_concurrent_calls` (default 1, `20250102000000:59`) **nunca é lida**. O limite real do produto é ignorado, e o do navegador é contornável.
**Causa raiz:** constante no cliente onde existe configuração no banco.
**Caminho recomendado:** leia `max_concurrent_calls` do agente autenticado e use-o em `initiateCall`, mantendo a constante como teto absoluto de segurança (defesa em profundidade, não regra). Como o cliente é contornável, o limite real precisa valer no servidor — isso faz parte da decisão de arquitetura da etapa 037; registre a dependência.
**Arquivos e objetos a tocar:** `src/hooks/useMultiChannelCall.ts`, `src/hooks/useAgentStatus.ts` (leitura do campo).
**Não tocar / armadilhas:** o default é **1**. Se você aplicar sem conferir, agentes que hoje fazem 3 chamadas passam a fazer 1 — confira a distribuição (`SELECT max_concurrent_calls, count(*) FROM agents GROUP BY 1`) e combine com o dono.
**Depende de:** 078, 094, 117 · **Libera:** —
**Risco e como reverter:** médio.
**Precisa de aprovação humana antes do merge:** não (mas confirme a distribuição).
**Como verificar:** agente com `max_concurrent_calls = 1` não consegue abrir a segunda chamada; com 3, consegue até a terceira.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 119 — Fazer o health check do tronco rodar
**Onda / Severidade / Camada:** 3 / Alta / Edge Function + Banco
**Achados resolvidos:** A-132
**Problema hoje:** o snapshot de produção (2026-11-20) mostra o único tronco cadastrado como `"Tronco Principal Teste"`, `servidor_sip: "sip.exemplo.com"`, `health_status: null`, `ultimo_health_check: null`, e o próprio snapshot emite o alerta `telefonia_tronco_sem_health_check`. A edge `voip-trunks-healthcheck` existe, mas **não há cron que a chame**. Sem amostra, `/status` (etapa 092) e o painel de integridade (etapa 097) só podem dizer "sem medição".
**Causa raiz:** a edge foi escrita e nunca agendada — e o tronco cadastrado é um placeholder.
**Caminho recomendado:** duas coisas, nesta ordem. (1) **Pergunte ao dono se existe um tronco real.** Se o único for `sip.exemplo.com`, agendar o health check só vai produzir medição de falha de um host que não existe — e aí o valor da etapa é expor isso, não "consertar". (2) Agende a edge a cada 5 minutos, no padrão das etapas 040/083 (token do Vault, `verify_jwt=false` declarado), gravando em `voip_trunk_health_checks`. Com isso `/status` passa a ter amostra real.
**Arquivos e objetos a tocar:** `supabase/functions/voip-trunks-healthcheck/index.ts` (autorização por token); `supabase/config.toml`; nova migration com o cron.
**Não tocar / armadilhas:** a etapa 023 já ajusta o emissor desta edge (o `fetch` sem `await` e a service_role como senha) — **faça a 023 primeiro** ou as duas juntas, senão o aviso de failover continua não saindo.
**Depende de:** 023, 097 · **Libera:** —
**Risco e como reverter:** baixo. Reverter: `cron.unschedule`.
**Precisa de aprovação humana antes do merge:** **sim** (DDL + segredo).
**Como verificar:** após 15 min, `SELECT checked_at, reachable, latency_ms FROM voip_trunk_health_checks ORDER BY checked_at DESC LIMIT 5` → 3 linhas; e `/status` sai de "Sem medição".
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 120 — Reagendar o retorno conforme a configuração da campanha
**Onda / Severidade / Camada:** 3 / Baixa / Hooks
**Achados resolvidos:** A-036
**Problema hoje:** `src/hooks/usePredictiveDialer.ts:183` reagenda o callback em **1 hora fixa**, ignorando `campaign.retry_delay_minutes` (default 30, `CreateCampaignDialog.tsx:48`). O supervisor configura 30 minutos e o sistema usa 60.
**Causa raiz:** valor embutido onde há configuração.
**Caminho recomendado:** use `campaign.retry_delay_minutes` com fallback explícito ao default do formulário (30), não a 60. Mudança de uma linha mais um teste.
**Arquivos e objetos a tocar:** `src/hooks/usePredictiveDialer.ts`.
**Não tocar / armadilhas:** confirme que a coluna chega ao hook (pode não estar no `select`).
**Depende de:** 078 · **Libera:** —
**Risco e como reverter:** nenhum.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** campanha com 15 min → `SELECT next_attempt_at - last_attempt_at FROM dialer_queue WHERE status='callback' ORDER BY last_attempt_at DESC LIMIT 1` ≈ 15 min.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 121 — Aplicar as três regras de compliance que hoje são só configuração
**Onda / Severidade / Camada:** 3 / Média / Hooks
**Achados resolvidos:** A-026
**Problema hoje:** `src/hooks/useDNCCompliance.ts:245-273` (`preDialCheck`) verifica só `dnc_enabled` e `calling_hours_enabled`. `max_attempts_per_day`, `min_interval_between_calls` e `lgpd_consent_required` **não aparecem em nenhum caminho de execução** — o dono configura "máximo 3 tentativas por dia" numa tela que não controla nada.
**Causa raiz:** tela de configuração entregue antes do consumo das configurações.
**Caminho recomendado:** acrescente as três verificações a `preDialCheck`, cada uma como uma função pura testável e com o motivo específico na recusa. `max_attempts_per_day` e `min_interval_between_calls` precisam do histórico do número: faça **uma** consulta agregada (`count` e `max(created_at)` de `call_sessions` por telefone no dia), não três. `lgpd_consent_required` depende de onde o consentimento é registrado — **se não houver campo, pare e registre no progresso**: a regra não pode ser aplicada sem o dado, e inventar um default seria pior.
**Arquivos e objetos a tocar:** `src/hooks/useDNCCompliance.ts` + testes.
**Não tocar / armadilhas:** `preDialCheck` passa a fazer mais uma consulta por discagem, e desde a etapa 034 ele está no caminho crítico. Meça: se passar de ~200 ms, mova a verificação para a RPC do banco.
**Depende de:** 034, 035 · **Libera:** 123
**Risco e como reverter:** médio (passa a recusar discagens que hoje acontecem — o que é o objetivo).
**Precisa de aprovação humana antes do merge:** **sim** (passa a bloquear operação).
**Como verificar:** com `max_attempts_per_day = 1`, discar duas vezes para o mesmo número no dia → a segunda é recusada com o motivo correto.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 122 — Fazer feriados recorrentes bloquearem todo ano
**Onda / Severidade / Camada:** 3 / Média / Banco
**Achados resolvidos:** A-026
**Problema hoje:** `supabase/migrations/20260103145030_….sql:252-256` compara a **data exata** do feriado e **ignora a coluna `recurring`**. Os feriados recorrentes semeados para 2026 deixam de bloquear em 2027 — silenciosamente, no dia 1º de janeiro.
**Causa raiz:** a coluna foi criada e a comparação nunca a usou.
**Caminho recomendado:** na função `check_calling_hours`, quando `recurring` for verdadeiro, compare **mês e dia** em vez da data completa (`extract(month …) = extract(month …) AND extract(day …) = extract(day …)`). Teste os três casos: feriado fixo do ano corrente, feriado recorrente de ano anterior, dia comum. Feriado móvel (Carnaval, Páscoa) **não** é resolvido por isso — registre a limitação em comentário e no progresso; a solução correta é cadastrar as datas por ano.
**Arquivos e objetos a tocar:** nova migration que recria `check_calling_hours`.
**Não tocar / armadilhas:** a mesma função é alvo da etapa 035 (fail-closed) — faça as duas na mesma migration ou em ordem, nunca em paralelo.
**Depende de:** 035 · **Libera:** —
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** **sim** (DDL em produção).
**Como verificar:** `SELECT * FROM check_calling_hours('<numero>')` num dia que seja feriado recorrente cadastrado em ano anterior → `can_call: false`.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 123 — Resolver a unidade do "intervalo mínimo entre ligações"
**Onda / Severidade / Camada:** 3 / Média / Banco + Frontend
**Achados resolvidos:** A-026
**Problema hoje:** a mesma configuração tem duas unidades. `src/components/compliance/ComplianceSettings.tsx:167` rotula "Intervalo Mínimo (minutos)" com `min=15 max=480`; `20260103145030_….sql:104` semeia `'60'` descrito como **minutos**; `20261122310000_seed_compliance_baseline.sql:12` semeia `'3600'` descrito como **segundos**. A tela mostra 3600 num campo cujo máximo é 480.
**Causa raiz:** seed posterior escrito em outra unidade sem conferir o existente.
**Caminho recomendado:** padronize em **segundos** no banco (a unidade menos ambígua para intervalo) e converta na interface, deixando o rótulo em minutos para o usuário. Migration de normalização: detecte valores plausivelmente em minutos (< 481) e multiplique por 60 — **com log do que mudou**. Depois, nomeie a chave com a unidade (`min_interval_between_calls_seconds`) para o próximo seed não errar.
**Arquivos e objetos a tocar:** nova migration; `src/components/compliance/ComplianceSettings.tsx`; `src/hooks/useDNCCompliance.ts` (consumo, etapa 121).
**Não tocar / armadilhas:** a heurística "< 481 é minuto" pode errar num valor legítimo de 480 segundos. Liste os valores existentes antes (consulta abaixo) e, se houver ambiguidade real, **pergunte ao dono** em vez de adivinhar.
**Depende de:** 121 · **Libera:** —
**Risco e como reverter:** médio (altera dado de configuração).
**Precisa de aprovação humana antes do merge:** **sim** (altera dado em produção).
**Como verificar:** antes — `SELECT setting_key, setting_value FROM compliance_settings WHERE setting_key LIKE '%interval%'`. Depois — valor em segundos, e a tela exibe o equivalente em minutos dentro da faixa.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 124 — Validar a transição de status de conversa
**Onda / Severidade / Camada:** 3 / Média / Hooks
**Achados resolvidos:** A-126
**Problema hoje:** `src/hooks/useConversations.ts:193` aceita qualquer `Partial<Conversation>` — uma conversa resolvida volta a aberta pulando etapas, e nada impede status inválido.
**Causa raiz:** update genérico sem máquina de estados.
**Caminho recomendado:** escreva `src/lib/conversations/transitions.ts` com o mapa de transições permitidas (`open → pending|snoozed|closed`, `closed → open` só com motivo, etc.) e uma função `canTransition(from, to)`. Valide no hook antes de enviar e exiba o motivo quando recusado. **Levante o conjunto real primeiro** (`SELECT DISTINCT status FROM conversations`) — não invente estados. O CHECK no banco é a etapa 147; aqui é a camada de produto.
**Arquivos e objetos a tocar:** novo `src/lib/conversations/transitions.ts` + teste; `src/hooks/useConversations.ts`.
**Não tocar / armadilhas:** a reabertura pode ser legítima no fluxo de atendimento — **não bloqueie sem perguntar**; prefira exigir confirmação a proibir.
**Depende de:** 112 · **Libera:** 147
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** teste que afirma recusa de `closed → pending` e aceitação de `open → closed`.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 125 — Validar a transição de status de scorecard
**Onda / Severidade / Camada:** 3 / Média / Hooks + Banco
**Achados resolvidos:** A-126
**Problema hoje:** `src/hooks/useScorecards.ts:76` aceita qualquer status, e não há `CHECK` em `call_scorecards`. Combinado com a etapa 108 (`draft` → `submitted` só por supervisor), o fluxo precisa de guarda.
**Causa raiz:** idem 124.
**Caminho recomendado:** mesmo padrão da etapa 124, com o mapa `draft → submitted → reviewed`, e a transição `draft → submitted` exigindo papel de supervisor (verifique com `hasRole`, e **também** na policy do banco — front sozinho não contém). Adicione o `CHECK` de status na mesma migration da etapa 108, se ela ainda não tiver ido.
**Arquivos e objetos a tocar:** `src/hooks/useScorecards.ts`; nova migration (CHECK + policy).
**Não tocar / armadilhas:** scorecards existentes podem ter status fora do conjunto — normalize antes do CHECK, como na etapa 117.
**Depende de:** 108, 124 · **Libera:** —
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** **sim** (DDL em produção).
**Como verificar:** agente comum não consegue mover scorecard para `submitted` (403 ou policy recusa); supervisor consegue.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 126 — Somar os pontos da gamificação no banco, não no cliente
**Onda / Severidade / Camada:** 3 / Média / Hooks + Banco
**Achados resolvidos:** A-059
**Problema hoje:** `src/hooks/useGamification.ts:208-240` lê, soma em JavaScript e grava, **descartando `error` nas três operações**. A tabela tem `UNIQUE(agent_id, week_start)` (`20251224023654_….sql:37`), então duas execuções concorrentes que caiam no ramo `insert` fazem a segunda falhar — e o erro é jogado fora. Pontos e chamadas da semana somem quando duas chamadas terminam juntas.
**Causa raiz:** read-modify-write no cliente sobre uma tabela com restrição de unicidade, sem verificação de erro.
**Caminho recomendado:** uma RPC `increment_weekly_stats(p_agent_id, p_week_start, p_calls int, p_points int)` com `INSERT … ON CONFLICT (agent_id, week_start) DO UPDATE SET total_calls = agent_weekly_stats.total_calls + EXCLUDED.total_calls, …`. Um comando, atômico, sem corrida. No hook, chame a RPC e **verifique o `error`**. É o mesmo raciocínio da etapa 079: a atomicidade mora no SQL.
**Arquivos e objetos a tocar:** nova migration com a RPC; `src/hooks/useGamification.ts`.
**Não tocar / armadilhas:** a RPC precisa de `SECURITY DEFINER`, `SET search_path = public` e `REVOKE` de `anon`, no padrão de `20261122183000`.
**Depende de:** 110 · **Libera:** —
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** **sim** (DDL em produção).
**Como verificar:** disparar a RPC 10 vezes em paralelo com 1 ponto cada → `SELECT total_points FROM agent_weekly_stats WHERE …` = 10 exatos.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 127 — Parar de pendurar o alerta de meta numa chamada aleatória
**Onda / Severidade / Camada:** 3 / Média / Hooks + Banco
**Achados resolvidos:** A-056
**Problema hoje:** `src/hooks/useAgentRanking.ts:106-117` busca `.eq('agent_name', agent.name).limit(1).maybeSingle()` **sem `order`** — pega qualquer chamada do agente só para satisfazer a FK —, depois insere o alerta "atingiu todas as metas" sem checar `error`; se não houver nenhuma chamada, o alerta é descartado em silêncio.
**Causa raiz:** `call_alerts.call_session_id` é obrigatório, e um alerta de meta não pertence a nenhuma chamada específica.
**Caminho recomendado:** o alerta de meta não é alerta de chamada. Duas opções: (a) tornar `call_alerts.call_session_id` nullable e usar `null` para alertas de agente; (b) gravar em `notifications` (que existe, tem tabela e o sino do header já lê desde o commit #157) em vez de `call_alerts`. **Recomendo (b)**: menos DDL, e semanticamente é uma notificação, não um alerta de chamada. Verifique o `error` em qualquer caso.
**Arquivos e objetos a tocar:** `src/hooks/useAgentRanking.ts`; (se escolher (a)) nova migration.
**Não tocar / armadilhas:** se escolher (b), reuse a edge `send-notification` **depois** da etapa 011, para o alerta não virar outro caminho sem autorização.
**Depende de:** 011 · **Libera:** —
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** **sim** se escolher (a).
**Como verificar:** agente batendo a meta → notificação aparece no sino, e `SELECT count(*) FROM call_alerts WHERE alert_type='goals_achieved' AND created_at > now() - interval '1 hour'` = 0 (não polui mais os alertas de chamada).
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 128 — Chaves estrangeiras nas quatro colunas que apontam para uma tabela só
**Onda / Severidade / Camada:** 3 / Baixa / Banco
**Achados resolvidos:** A-127
**Problema hoje:** das 44 colunas `*_id` sem FK, quatro apontam para **uma** tabela e poderiam ter integridade: `bitrix_departments.parent_id` (hierarquia sem auto-referência, `20260515171135_….sql:27-32`), `coaching_assignments.scorecard_id`, `call_scorecards.reviewer_id`, `voip_recommendation_actions.recommendation_id`. Apagar um scorecard, uma recomendação ou um departamento deixa referência apontando para o nada, e a tela mostra item vazio em vez de erro.
**Causa raiz:** FK omitida na criação.
**Caminho recomendado:** **primeiro limpe os órfãos**, senão o `ADD CONSTRAINT` aborta — e, como o CLI envolve a migration numa transação, você perde o arquivo inteiro (A-092). Ordem na mesma migration: (1) `UPDATE … SET <col> = NULL WHERE <col> NOT IN (SELECT id FROM <destino>)`; (2) `ADD CONSTRAINT … REFERENCES … ON DELETE SET NULL` (não `CASCADE`: apagar um scorecard não deve apagar a atribuição de coaching). Conte os órfãos antes e registre no corpo da PR.
**Arquivos e objetos a tocar:** nova migration `supabase/migrations/<ts>_add_missing_fks.sql`.
**Não tocar / armadilhas:** **não** adicione FK em `audit_logs.resource_id`, `notifications.source_id` nem `optimistic_lock_conflicts.record_id` — são polimórficas por desenho (apontam para tabelas diferentes conforme o `*_type`). O que falta nelas é o `CHECK` no `*_type`, que é a etapa 139.
**Depende de:** — · **Libera:** 139
**Risco e como reverter:** médio (o `UPDATE … SET NULL` altera dado). Reverter: `DROP CONSTRAINT`, mas o dado nulado não volta.
**Precisa de aprovação humana antes do merge:** **sim** (DDL e alteração de dado).
**Como verificar:** antes, por coluna: `SELECT count(*) FROM <t> WHERE <col> IS NOT NULL AND <col> NOT IN (SELECT id FROM <destino>)`. Depois: `SELECT conname FROM pg_constraint WHERE contype='f' AND conrelid='public.bitrix_departments'::regclass` → existe.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 129 — Documentar o contrato dos ponteiros polimórficos
**Onda / Severidade / Camada:** 3 / Baixa / Banco
**Achados resolvidos:** A-127
**Problema hoje:** `audit_logs.resource_id`, `notifications.source_id` e `optimistic_lock_conflicts.record_id` apontam para tabelas diferentes conforme o `*_type` — e esses `*_type` são exatamente as colunas sem `CHECK` da A-125. Nada no banco nem na documentação diz qual valor de tipo corresponde a qual tabela.
**Causa raiz:** contrato implícito, só no código que escreve.
**Caminho recomendado:** levante os valores reais (`SELECT DISTINCT resource_type FROM audit_logs`, idem para os outros dois) e escreva a tabela de correspondência em `docs/agentes/banco.md`, mais um `COMMENT ON COLUMN` em cada coluna. O `CHECK` com os valores levantados é a etapa 139 — fazê-lo sem este levantamento quebraria escritas legítimas.
**Arquivos e objetos a tocar:** `docs/agentes/banco.md`; nova migration só com `COMMENT ON COLUMN`.
**Não tocar / armadilhas:** não adicione o CHECK aqui.
**Depende de:** 128 · **Libera:** 139
**Risco e como reverter:** nenhum.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** o documento lista, para cada um dos três, todos os valores de tipo que existem em produção e a tabela de destino de cada um.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 130 — Escrever o `CREATE TABLE` das três tabelas `geo_*`
**Onda / Severidade / Camada:** 3 / Alta / Banco
**Achados resolvidos:** A-091
**Problema hoje:** `geo_access_logs`, `geo_restrictions` e `geo_settings` existem no schema real (`src/integrations/supabase/types.ts:3666,3711,3744`) e são usadas em produção (`useGeoBlocking.ts:35,44,53,…`, `validate-geo/index.ts:53,97,112,134`), mas **nenhuma das 241 migrations as cria**. Um ambiente novo não reproduz o banco, e **18 statements de DDL as tratam como existentes sem guarda** — inclusive três `ALTER POLICY` (`20260404151943_….sql:87-90`), que **não aceitam `IF EXISTS`** no Postgres.
**Causa raiz:** tabelas criadas direto no banco, fora do fluxo de migration.
**Caminho recomendado:** reconstrua o DDL a partir de `types.ts`, que **vem do banco real** e tem os tipos e a nulidade de cada coluna, mais os `Relationships` para as FKs. Escreva a migration com `CREATE TABLE IF NOT EXISTS` (para ser inócua em produção, onde as tabelas já existem) seguida de `ENABLE ROW LEVEL SECURITY`, os índices e as policies de leitura. **Marque a migration com um comentário no topo** explicando que ela é retroativa e que o estado de produção é a referência. Peça ao dono o `pg_dump --schema-only -t 'public.geo_*'` se possível: é mais fiel que reconstruir de `types.ts`.
**Arquivos e objetos a tocar:** nova migration `supabase/migrations/<ts>_create_geo_tables_retroativo.sql`.
**Não tocar / armadilhas:** `IF NOT EXISTS` é essencial — sem ele a migration aborta em produção. E ela precisa vir **antes** da etapa 043 (policies de escrita) na ordem de timestamp.
**Depende de:** — · **Libera:** 043, 053, 131
**Risco e como reverter:** baixo em produção (não faz nada); crítico para a reconstrução do ambiente.
**Precisa de aprovação humana antes do merge:** **sim** (DDL em produção).
**Como verificar:** num Postgres descartável, aplicar as migrations em ordem cria as três tabelas; em produção, a migration roda sem efeito e sem erro.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 131 — Guardar os `ALTER POLICY` que abortam em ambiente novo
**Onda / Severidade / Camada:** 3 / Média / Banco
**Achados resolvidos:** A-091
**Problema hoje:** `20260404151943_4d4acd99….sql:87-90` executa `ALTER POLICY "Admins can view geo access logs" ON public.geo_access_logs TO authenticated;` (e mais dois). `ALTER POLICY` **não aceita `IF EXISTS`**, e as três policies alteradas **também nunca são criadas** por migration nenhuma. Num ambiente novo, essa migration aborta.
**Causa raiz:** migration escrita contra o estado de produção, não contra a sequência versionada.
**Caminho recomendado:** **não edite a migration antiga** (ela já foi aplicada; alterá-la cria divergência entre o que rodou e o que está no arquivo). Em vez disso, a migration da etapa 130 passa a **criar** essas três policies, de modo que o `ALTER POLICY` posterior encontre o alvo. Confira, com a aplicação num Postgres descartável, que a ordem de timestamp coloca a 130 antes da `20260404151943` — **não coloca**, porque a 130 tem timestamp de hoje. Então a saída é outra: envolva os três `ALTER POLICY` num bloco `DO $$ … IF EXISTS (SELECT 1 FROM pg_policies WHERE …) THEN EXECUTE … END IF; END $$;` **numa migration nova** que os reaplique de forma idempotente, e documente no topo que a antiga é conhecida como não reaplicável. A lista completa de migrations não reaplicáveis é a etapa 134.
**Arquivos e objetos a tocar:** nova migration `supabase/migrations/<ts>_geo_policies_idempotente.sql`; `docs/agentes/banco.md`.
**Não tocar / armadilhas:** **nunca** reescreva uma migration já aplicada. O ledger guarda a versão, não o conteúdo; editar o arquivo faz o que rodou e o que está versionado divergirem para sempre.
**Depende de:** 130 · **Libera:** 134
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** **sim** (DDL em produção).
**Como verificar:** aplicar a sequência num Postgres descartável vai até o fim sem abortar nas policies `geo_*`.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 132 — Descobrir se a correção de exclusão de conta (LGPD) está de fato aplicada
**Onda / Severidade / Camada:** 3 / Alta / Banco
**Achados resolvidos:** A-092
**Problema hoje:** seis tabelas criadas por migration **não estão em `types.ts`**: `call_records`, `entity_versions`, `migration_rollbacks`, `queue_items`, `saved_filters`, `schema_migrations` — e `types.ts` foi regenerado em 2026-11-22, contendo tabelas de julho, logo não é um arquivo velho. Nenhum `DROP TABLE` para elas nas 241 migrations. O problema concreto: `supabase/migrations/20261123010000_fix_user_delete_cascade.sql` abre com `BEGIN;` e tem `ALTER TABLE public.entity_versions DROP CONSTRAINT IF EXISTS … , ADD CONSTRAINT …` **sem `IF EXISTS` no `ALTER TABLE`**. Se a tabela não existir, a migration aborta e **as outras 6 correções de FK do mesmo arquivo voltam atrás**. Mas `docs/audits/pendencias-2026-07.md:40` declara o item como concluído, citando `entity_versions` entre as FKs corrigidas, com "Provado: DELETE 500 → 200". **Os dois não podem estar certos.**
**Causa raiz:** migrations antigas (dez/2024 – jan/2025) de um esquema anterior que nunca foi aplicado ao projeto atual, somadas a migrations novas escritas como se aquelas tabelas existissem.
**Caminho recomendado:** **esta etapa é de apuração, e ela decide se uma correção de LGPD está no ar ou não.** Rode (ou peça ao dono) as duas consultas de "Como verificar". Três desfechos: (a) a tabela existe → a migration passou, o item F1 está certo, e o que precisa ser corrigido é só `types.ts` (etapa 136); (b) a tabela não existe e a migration **não** consta no ledger → a correção de FK **não está aplicada** e a exclusão de conta continua devolvendo 500; abra uma etapa de correção imediata, com a migration reescrita com guarda; (c) a tabela não existe mas a migration consta → investigue se o `ALTER TABLE` foi removido ou se o apply foi parcial. Registre o desfecho em `docs/agentes/banco.md` **com data**.
**Arquivos e objetos a tocar:** `docs/agentes/banco.md`; possivelmente nova migration no desfecho (b).
**Não tocar / armadilhas:** não reescreva `20261123010000`. Se o desfecho for (b), escreva uma migration **nova** com `DO $$ IF to_regclass('public.entity_versions') IS NOT NULL THEN … END IF; END $$;` em volta da parte que depende dela.
**Depende de:** — · **Libera:** 133, 136
**Risco e como reverter:** nenhum (apuração).
**Precisa de aprovação humana antes do merge:** não (mas precisa de acesso ao banco).
**Como verificar:** `SELECT to_regclass('public.entity_versions')` e `SELECT version FROM supabase_migrations.schema_migrations WHERE version = '20261123010000'`. Depois, o teste funcional: excluir um usuário de teste e conferir que devolve 200, não 500.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 133 — Desfazer o empate de timestamp entre migrations
**Onda / Severidade / Camada:** 3 / Média / Banco
**Achados resolvidos:** A-094
**Problema hoje:** dois pares com a mesma versão:
```
20250102000000_hello_production.sql        ×  20250102000000_performance_indexes.sql
20261122230000_reconcile_admin_role_sources.sql  ×  20261122230000_recordings_retention_cron.sql
```
O timestamp é a chave de versão no ledger (`supabase_migrations.schema_migrations.version`): dois arquivos com a mesma versão não podem ser registrados separadamente, e a ordem passa a depender do nome do arquivo. No par de novembro isso significa perder **ou** a reconciliação de papéis de admin **ou** a retenção de gravações.
**Causa raiz:** dois arquivos gerados no mesmo minuto, sem checagem.
**Caminho recomendado:** **primeiro descubra o que o ledger registrou** (consulta abaixo). Para o par de 2025, as duas provavelmente nunca foram aplicadas (ver A-092) — registre e deixe. Para o par de novembro: renomeie **o arquivo que não está no ledger** para o minuto seguinte (`20261122230100_…`), preservando o conteúdo. Renomear migration não aplicada é seguro; renomear aplicada **não é**. Depois, adicione um guard ao CI que falha com timestamps duplicados — é uma linha de `sort | uniq -d` e evita a recorrência (etapa 288).
**Arquivos e objetos a tocar:** renomeio de um arquivo em `supabase/migrations/`; novo check em `scripts/ci/`.
**Não tocar / armadilhas:** **não renomeie arquivo já registrado no ledger** — o Supabase passaria a tratá-lo como migration nova e tentaria reaplicar.
**Depende de:** 132 · **Libera:** 134, 288
**Risco e como reverter:** baixo se a verificação do ledger for feita antes.
**Precisa de aprovação humana antes do merge:** **sim** (toca a sequência de migrations).
**Como verificar:** `SELECT version FROM supabase_migrations.schema_migrations WHERE version IN ('20250102000000','20261122230000')`; e `ls supabase/migrations/ | cut -d_ -f1 | sort | uniq -d` → vazio.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 134 — Tornar as migrations reaplicáveis (ou documentar quais não são)
**Onda / Severidade / Camada:** 3 / Média / Banco
**Achados resolvidos:** A-095
**Problema hoje:** contadores medidos sobre as 241 migrations:
```
DROP POLICY sem IF EXISTS:        5
CREATE INDEX sem IF NOT EXISTS: 175
CREATE TABLE sem IF NOT EXISTS: 136
```
Mais as 729 `CREATE POLICY` (que no Postgres não têm forma `IF NOT EXISTS`) e o drift das etapas 130–132. **Não há como levantar uma cópia do banco para testar uma mudança antes de aplicá-la em produção** — o que torna toda alteração de schema um teste em cima do cliente.
**Causa raiz:** ledger forward-only sem nenhuma reaplicação testada; o projeto nunca precisou recriar o schema.
**Caminho recomendado:** o objetivo não é editar 241 arquivos — é conseguir **um** banco novo a partir do repositório. Duas estratégias, e a segunda é a recomendada: (a) corrigir arquivo por arquivo (caro, e mexer em migration aplicada é arriscado); (b) **escrever um script de bootstrap** (`scripts/ci/apply-migrations.sh`, o mesmo da etapa 053) que aplica a sequência num banco vazio **e registra a lista de falhas**; corrigir só o que falha, sempre em migration **nova**, e documentar em `docs/agentes/banco.md` as que são conhecidamente não reaplicáveis. No fim, a prova de que funcionou é a etapa 053 passando.
**Arquivos e objetos a tocar:** `scripts/ci/apply-migrations.sh`; `docs/agentes/banco.md`; migrations novas conforme a lista de falhas.
**Não tocar / armadilhas:** **não edite migration já aplicada.** Toda correção vira arquivo novo.
**Depende de:** 131, 133 · **Libera:** 053
**Risco e como reverter:** nenhum (trabalha num banco descartável).
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** `scripts/ci/apply-migrations.sh` contra um Postgres 17 vazio → termina com sucesso, e `SELECT count(*) FROM pg_tables WHERE schemaname='public'` ≈ 163.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 135 — Responder "esta migration está aplicada?" de forma confiável
**Onda / Severidade / Camada:** 3 / Alta / Banco
**Achados resolvidos:** A-093
**Problema hoje:** `inventario/estado/banco.json` (2026-11-20) traz `ledger_registros: 84` e `ledger_versao_max: "20261030120000"`, enquanto o repositório tem **241** migrations, das quais **34 são posteriores** a essa versão. Ao mesmo tempo, `docs/audits/pendencias-2026-07.md` afirma que todas estão registradas e que CHECKs de uma migration de 23/11 foram verificados existindo em produção. **O ledger não é fonte confiável** — provavelmente porque DDL foi aplicada fora do CLI. Hoje **não existe forma de saber quais migrations estão aplicadas** sem conferir objeto por objeto.
**Causa raiz:** duas vias de aplicação de DDL (CLI e painel/Lovable), só uma registrando.
**Caminho recomendado:** pare de confiar no ledger e passe a verificar **o objeto**. Escreva `scripts/ci/verificar-schema.mjs` que, para cada migration das 60 mais recentes, declare o objeto que ela cria (tabela, coluna, policy, função, cron) num manifesto `supabase/migrations/manifest.json` e confira a existência no banco. É mais trabalhoso que ler o ledger e é a única resposta que não mente. Rode-o semanalmente junto com o inventário (`inventario-estado-semanal.yml`) e deixe a saída em `inventario/estado/`. **Atalho a evitar:** inserir à mão as 157 versões faltantes no ledger. Isso faz o ledger **parecer** certo e impede que um apply futuro rode o que precisa rodar.
**Arquivos e objetos a tocar:** novo `scripts/ci/verificar-schema.mjs` + `supabase/migrations/manifest.json`; `.github/workflows/inventario-estado-semanal.yml`.
**Não tocar / armadilhas:** não escreva no ledger.
**Depende de:** 132 · **Libera:** 136
**Risco e como reverter:** nenhum (só leitura).
**Precisa de aprovação humana antes do merge:** **sim** (`.github/workflows/`).
**Como verificar:** rodar o script → lista por migration "objeto presente / ausente", e o número de ausentes é um fato novo registrado no progresso.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 136 — Regenerar `types.ts` e explicar as 4 tabelas de diferença
**Onda / Severidade / Camada:** 3 / Média / Banco
**Achados resolvidos:** A-092
**Problema hoje:** `types.ts` tem **159** tabelas e o banco de produção tem **163** (snapshot 2026-11-20). Quatro tabelas existem no banco e não no arquivo gerado — então o front não as conhece, e qualquer acesso a elas passa por `any` ou cast.
**Causa raiz:** `types.ts` é gerado sob demanda e ficou atrás do schema.
**Caminho recomendado:** regenere (`supabase gen types typescript --project-id cfmlmcdyjuotqobjapng > src/integrations/supabase/types.ts`) e **compare antes e depois**, listando no corpo da PR as tabelas que entraram. Para cada uma, responda: é usada pelo código? tem migration? tem RLS? As que não tiverem migration entram na mesma classe da etapa 130. Rode `npx tsc --noEmit` depois — o arquivo tem 7.787 linhas e a regeneração pode revelar tipos que mudaram.
**Arquivos e objetos a tocar:** `src/integrations/supabase/types.ts`.
**Não tocar / armadilhas:** regenerar pode **quebrar o type-check** se alguma coluna mudou de tipo ou de nulidade. Se quebrar, **isso é informação**: significa que o código assume um schema que não existe mais. Corrija os usos, não force o tipo.
**Depende de:** 135 · **Libera:** —
**Risco e como reverter:** médio (pode exigir ajustes em vários arquivos). Reverter: `git checkout` do arquivo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** contagem de tabelas em `types.ts` = `SELECT count(*) FROM pg_tables WHERE schemaname='public'`; `npx tsc --noEmit` → 0 erros.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 137 — Reescrever (ou remover) o arquivo de índices que não cria nada
**Onda / Severidade / Camada:** 3 / Baixa / Banco
**Achados resolvidos:** A-109
**Problema hoje:** `20250102000000_performance_indexes.sql` tem 322 linhas em blocos `DO $$ … IF to_regclass('X') IS NOT NULL THEN EXECUTE … END IF; END $$;`. As tabelas-alvo `calls` (7 blocos), `users` (4) e `transcriptions` (4) **não existem** — os nomes atuais são `call_sessions`, `user_profiles`, `call_transcriptions`. **15 dos 26 blocos não criam nada.** Quem abrir o arquivo para investigar lentidão vai concluir que os índices existem.
**Causa raiz:** arquivo escrito para um schema anterior e preservado com guardas em vez de reescrito.
**Caminho recomendado:** **não edite o arquivo antigo.** Escreva uma migration nova que crie, para os nomes atuais, os índices que fazem sentido **hoje** — e só esses: muitos dos 15 blocos podem ser redundantes com índices que já existem. Cruze com `SELECT indexname, indexdef FROM pg_indexes WHERE schemaname='public'` antes, e com a etapa 243 (índices faltantes medidos pelo uso real). Marque o arquivo antigo com um comentário no topo? Não — ele está aplicado; registre em `docs/agentes/banco.md` que 15 dos 26 blocos são inócuos.
**Arquivos e objetos a tocar:** nova migration; `docs/agentes/banco.md`.
**Não tocar / armadilhas:** não crie índice "por garantia". O linter de produção já aponta **250 `unused_index`** (`pendencias-2026-07.md:58`) — índice a mais custa em cada gravação.
**Depende de:** 134 · **Libera:** 243
**Risco e como reverter:** baixo. Reverter: `DROP INDEX`.
**Precisa de aprovação humana antes do merge:** **sim** (DDL em produção).
**Como verificar:** cada índice criado aparece em `pg_indexes`, e nenhum duplica definição existente.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 138 — Remover os dois índices exatamente redundantes
**Onda / Severidade / Camada:** 3 / Baixa / Banco
**Achados resolvidos:** A-110
**Problema hoje:** `audit_logs(user_id, created_at DESC)` existe duas vezes com nomes diferentes (`idx_audit_user_timestamp`, `20250102000000_performance_indexes.sql:190`; `idx_audit_logs_user_date`, `20260326203635_….sql:3`), e `meeting_summaries(call_session_id)` tem um `UNIQUE` (`20260417002302_….sql:29`) mais um btree simples na mesma coluna (`20260713124157_….sql:64`). Nenhum dos quatro aparece nos 44 `DROP INDEX` do repositório. São estruturas extras que o banco mantém em cada gravação, sem benefício de leitura.
**Causa raiz:** `IF NOT EXISTS` protege contra nome repetido, não contra definição repetida.
**Caminho recomendado:** confirme no banco que os quatro existem e que os pares são de fato idênticos (`pg_indexes.indexdef`), depois `DROP INDEX IF EXISTS` nos dois redundantes — mantenha o `UNIQUE` (que também serve como índice) e o mais antigo do par de `audit_logs`. Confira o uso antes (`pg_stat_user_indexes.idx_scan`): se o que você pretende remover for o mais usado, remova o outro.
**Arquivos e objetos a tocar:** nova migration `supabase/migrations/<ts>_drop_redundant_indexes.sql`.
**Não tocar / armadilhas:** `idx_audit_failures` (`:225`) é **parcial** (`WHERE success = FALSE`) — **não** é duplicado, não o remova. Os pares btree×BRIN de `20260711194619` e o par parcial de `voice_prints` também não são.
**Depende de:** 137 · **Libera:** —
**Risco e como reverter:** baixo. Reverter: recriar.
**Precisa de aprovação humana antes do merge:** **sim** (DDL em produção).
**Como verificar:** antes, `SELECT indexrelname, idx_scan FROM pg_stat_user_indexes WHERE relname IN ('audit_logs','meeting_summaries')`. Depois, os dois removidos não constam de `pg_indexes` e nenhuma consulta das telas de auditoria piorou (`EXPLAIN ANALYZE`).
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 139 — `CHECK` nas 11 colunas de tipo mais usadas em regra de negócio
**Onda / Severidade / Camada:** 3 / Média / Banco
**Achados resolvidos:** A-125
**Problema hoje:** 22 colunas de status/tipo são `text NOT NULL` **sem `CHECK`**. O contrato vive no TypeScript, que não chega ao banco: um valor errado passa e só aparece como regra que não dispara. Caso concreto já medido: `geo_settings.mode` aceita qualquer coisa, e `validate-geo` nunca lê a coluna (A-068).
**Causa raiz:** colunas criadas como `TEXT NOT NULL` com o conjunto de valores só em comentário.
**Caminho recomendado:** comece pelas que governam regra: `compliance_rules.rule_type`, `dialer_campaigns.mode`, `geo_restrictions.restriction_type`, `geo_settings.mode`, `goal_violations.metric_type`, `goal_violations.threshold_type`, `voip_recommendation_actions.action_type`, `cadence_steps.step_type`, `audit_logs.resource_type`, `notifications.source_type`, `dialer_queue.result`. Para **cada uma**: (1) `SELECT DISTINCT <col> FROM <tabela>` para levantar o que existe; (2) compare com o que o código escreve; (3) se divergir, **normalize antes** com `UPDATE`; (4) só então o `CHECK`. As 11 restantes são a etapa 140. **Atalho a evitar:** derivar o conjunto do tipo TypeScript. O banco pode ter valores legados que o tipo não prevê, e o CHECK aborta a migration (levando o arquivo inteiro consigo).
**Arquivos e objetos a tocar:** nova migration `supabase/migrations/<ts>_text_domain_checks_lote2.sql`.
**Não tocar / armadilhas:** `call_quality_metrics.channel` ficou de fora do lote anterior **de propósito** (3 grafias conviventes, ver item B6 das pendências) — não o inclua sem resolver a normalização.
**Depende de:** 129 · **Libera:** 140, 148
**Risco e como reverter:** médio (pode abortar se a normalização falhar).
**Precisa de aprovação humana antes do merge:** **sim** (DDL em produção).
**Como verificar:** por coluna, `SELECT conname FROM pg_constraint WHERE conrelid='<t>'::regclass AND contype='c'` inclui o novo; e um `INSERT` com valor inválido é recusado.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 140 — `CHECK` nas 11 colunas de tipo restantes
**Onda / Severidade / Camada:** 3 / Baixa / Banco
**Achados resolvidos:** A-125
**Problema hoje:** restam `badges.requirement_type`, `call_control_audit_logs.event_type`, `churn_risk_signals.signal_type`, `contact_interactions.interaction_type`, `cultural_hints.context_type`, `dashboard_goals.metric_type`, `fraud_signals.signal_type`, `kb_article_history.change_type`, `objection_library.objection_type`, `renewals.renewal_type`, `surveys.survey_type`, `time_off_requests.request_type`, `redaction_log.pattern_type`.
**Causa raiz:** idem 139.
**Caminho recomendado:** mesmo método da etapa 139, mesma ordem (levantar, comparar, normalizar, restringir). Estas têm menos impacto em regra, então o ganho é de qualidade de dado — faça num lote só.
**Arquivos e objetos a tocar:** nova migration.
**Não tocar / armadilhas:** tabelas vazias aceitam qualquer CHECK sem erro — e aí o CHECK pode estar errado sem ninguém notar. Para as vazias, derive o conjunto do código **e** registre no comentário que não houve dado para validar.
**Depende de:** 139 · **Libera:** —
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** **sim** (DDL em produção).
**Como verificar:** idem 139, por coluna.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 141 — Fazer `validate-geo` honrar o modo escolhido na tela
**Onda / Severidade / Camada:** 3 / Alta / Edge Function
**Achados resolvidos:** A-068
**Problema hoje:** `src/hooks/useGeoBlocking.ts:61` grava `mode: 'allowlist'` e a interface permite trocar para blocklist, mas `supabase/functions/validate-geo/index.ts:51-110` **nunca lê `settings.mode`** — trata tudo como allowlist. Escolher "blocklist" na tela não muda nada.
**Causa raiz:** a edge foi escrita para um modo só.
**Caminho recomendado:** leia `settings.mode` e ramifique: em `allowlist`, permite só os países listados; em `blocklist`, bloqueia só os listados. Escreva a decisão como função **pura** (`decideGeoAccess(mode, country, list)`) com teste Deno cobrindo as quatro combinações (modo × país na lista ou não) — a lógica é pequena e os erros aqui são invisíveis. O comportamento com lista vazia é a etapa 142.
**Arquivos e objetos a tocar:** `supabase/functions/validate-geo/index.ts` + teste Deno.
**Não tocar / armadilhas:** `geo_settings.mode` é `text` sem CHECK até a etapa 139 — trate valor desconhecido com recusa explícita e log, nunca com `else` silencioso que escolhe um modo.
**Depende de:** 043, 139 · **Libera:** 142
**Risco e como reverter:** médio (muda quem consegue entrar).
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** com `mode='blocklist'` e o país do testador na lista → acesso recusado; fora da lista → permitido. E o inverso com `allowlist`.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 142 — Decidir o que fazer quando a lista geográfica está vazia
**Onda / Severidade / Camada:** 3 / Alta / Edge Function
**Achados resolvidos:** A-068
**Problema hoje:** `supabase/functions/validate-geo/index.ts:103-107` devolve `allowed: true, reason: 'Allowlist not configured'` quando a lista está vazia. **Com o bloqueio geográfico ligado e nenhum país cadastrado, o sistema libera todo mundo** — e a tela diz que o bloqueio está ativo.
**Causa raiz:** fail-open por ausência de configuração, igual às A-024 e A-007.
**Caminho recomendado:** **é pergunta de negócio, não técnica.** Leve ao dono: "com o bloqueio ligado e nenhum país cadastrado, o sistema deve liberar ou bloquear?" As duas respostas são defensáveis — liberar evita trancar todos por engano; bloquear é coerente com "bloqueio ligado". Recomende um terceiro caminho, que é o mais honesto: **não permitir salvar `geo_enabled = true` com lista vazia** — valide na tela e na edge, e o caso deixa de existir. Implemente o que ele escolher.
**Arquivos e objetos a tocar:** `supabase/functions/validate-geo/index.ts`, `src/hooks/useGeoBlocking.ts`, a tela de bloqueio geográfico.
**Não tocar / armadilhas:** se escolher "bloquear", **teste primeiro num ambiente de preview**: um erro aqui tranca o acesso de todos, inclusive o do dono.
**Depende de:** 141 · **Libera:** —
**Risco e como reverter:** **alto** se mal configurado. Tenha o caminho de reversão pronto (`UPDATE geo_settings SET enabled = false`) antes de aplicar.
**Precisa de aprovação humana antes do merge:** **sim** (pode bloquear o acesso de todos).
**Como verificar:** com lista vazia, o comportamento é o que o dono escolheu, e a tela mostra o aviso correspondente.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 143 — `TO authenticated` nas policies de dados de cliente (lote 2)
**Onda / Severidade / Camada:** 3 / Média / Banco
**Achados resolvidos:** A-069
**Problema hoje:** depois da etapa 052, ainda restam ~238 policies sem cláusula `TO`, avaliadas também para `anon`.
**Causa raiz:** ver A-069.
**Caminho recomendado:** mesmo método da etapa 052 — gere a lista **pelo banco** (`SELECT tablename, policyname FROM pg_policies WHERE schemaname='public' AND roles='{public}'`), use `ALTER POLICY … TO authenticated`, não recrie. Este lote: tabelas de contato, negócio e conta (`contacts`, `deals`, `accounts`, `contact_interactions`, `renewals`, `success_plans`). Faça ~40 por migration, para que uma falha não obrigue a reverter tudo.
**Arquivos e objetos a tocar:** nova migration.
**Não tocar / armadilhas:** não revogue os helpers de `anon` (etapa 146).
**Depende de:** 052 · **Libera:** 144
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** **sim** (DDL em produção).
**Como verificar:** a contagem de policies com `roles='{public}'` cai conforme o lote; usuário autenticado continua lendo as tabelas.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 144 — `TO authenticated` nas policies operacionais (lote 3)
**Onda / Severidade / Camada:** 3 / Média / Banco
**Achados resolvidos:** A-069
**Problema hoje:** idem, para as tabelas de operação: `call_sessions`, `call_transcriptions`, `call_summaries`, `call_analyses`, `hold_events`, `dialer_*`, `queue_*`, `agent_*`.
**Causa raiz:** idem.
**Caminho recomendado:** idem 143. **Atenção especial:** `voip_trunk_health_checks` e `webhook_flush_metrics` são lidas por **anônimo** na página pública `/status` — essas duas **precisam** continuar acessíveis a `anon` na operação de SELECT. Declare `TO anon, authenticated` nelas explicitamente, em vez de deixar sem cláusula: o efeito é o mesmo e a intenção fica registrada.
**Arquivos e objetos a tocar:** nova migration.
**Não tocar / armadilhas:** se você restringir as duas tabelas de `/status` a `authenticated`, a página pública quebra — e, por causa da etapa 092, ela vai mostrar "Sem medição" em vez de erro, o que esconde a causa.
**Depende de:** 143 · **Libera:** 145
**Risco e como reverter:** médio.
**Precisa de aprovação humana antes do merge:** **sim** (DDL em produção).
**Como verificar:** `/status` continua carregando sem login; usuário autenticado continua vendo as telas de operação.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 145 — `TO authenticated` no restante das policies (lote 4)
**Onda / Severidade / Camada:** 3 / Média / Banco
**Achados resolvidos:** A-069
**Problema hoje:** o restante das policies sem `TO`, incluindo as 4 de `storage.objects` que o parser encontrou.
**Causa raiz:** idem.
**Caminho recomendado:** idem 143. Para `storage.objects`, confirme que nenhum bucket precisa de leitura anônima antes de restringir — o bucket `avatars` da PR #160 é privado, mas confira os outros quatro (`call-recordings`, `data-lake-exports`, `virtual-fax-docs`, `queue-audio`).
**Arquivos e objetos a tocar:** nova migration.
**Não tocar / armadilhas:** policies de `storage.*` quebram upload e download se erradas — teste cada bucket.
**Depende de:** 144 · **Libera:** 146
**Risco e como reverter:** médio.
**Precisa de aprovação humana antes do merge:** **sim** (DDL em produção).
**Como verificar:** `SELECT count(*) FROM pg_policies WHERE schemaname IN ('public','storage') AND roles='{public}'` → 0; upload e download funcionam em cada bucket.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 146 — Revogar de `anon` o EXECUTE dos helpers de papel
**Onda / Severidade / Camada:** 3 / Média / Banco
**Achados resolvidos:** A-069
**Problema hoje:** `20261122183000_….sql:11-13` **preservou** o EXECUTE de `is_admin_or_supervisor()`, `get_user_agent_name()` e outros para `anon` — porque, sem ele, as 174 policies sem `TO` que delegam a esses helpers lançariam "permission denied for function" em vez de negar. É um acoplamento frágil: basta alguém revogar um helper "por hardening" para que 114 tabelas passem a dar erro.
**Causa raiz:** policies sem `TO` dependendo de função que precisa ser executável por `anon`.
**Caminho recomendado:** **só execute depois de 052, 143, 144 e 145** — com todas as policies declarando `TO authenticated`, `anon` nunca chega a avaliar o predicado, e o EXECUTE deixa de ser necessário. Confirme com a consulta de "Como verificar" **antes** de revogar. Depois, `REVOKE EXECUTE … FROM anon` nos helpers, no padrão de `20261123000000_fix_anon_rpc_exposure.sql`.
**Arquivos e objetos a tocar:** nova migration `supabase/migrations/<ts>_revoke_anon_role_helpers.sql`.
**Não tocar / armadilhas:** **não** revogue `check_login_lockout`/`record_*_login` aqui — elas são pré-login e têm o tratamento próprio da etapa 002. Se a consulta mostrar qualquer policy ainda com `roles='{public}'`, **pare**: revogar agora troca "negar" por "erro" em produção.
**Depende de:** 052, 143, 144, 145 · **Libera:** —
**Risco e como reverter:** **alto** se feito fora de ordem. Reverter: `GRANT EXECUTE … TO anon`.
**Precisa de aprovação humana antes do merge:** **sim** (DDL em produção).
**Como verificar:** antes — `SELECT count(*) FROM pg_policies WHERE schemaname='public' AND roles='{public}'` → **0**. Depois — um cliente anônimo que tente ler uma tabela protegida recebe conjunto vazio, **não** erro de permissão de função.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 147 — `CHECK` no status de `call_sessions` e de `conversations`
**Onda / Severidade / Camada:** 3 / Média / Banco
**Achados resolvidos:** A-126
**Problema hoje:** não há `CHECK` de status em `call_sessions` nem em `conversations`. O banco aceita qualquer texto, e um erro de grafia em `'abandoned'`/`'missed'`/`'completed'` só aparece como métrica errada semanas depois — exatamente o risco que as etapas 059, 103 e 104 criam ao passar a escrever esses valores.
**Causa raiz:** colunas de status como `text` livre.
**Caminho recomendado:** levante (`SELECT DISTINCT status FROM call_sessions`, idem `conversations`), normalize o que divergir, e adicione o `CHECK` com o conjunto consolidado nas etapas 059 e 124. Faça **depois** daquelas duas, não antes: o conjunto só está definido ali.
**Arquivos e objetos a tocar:** nova migration.
**Não tocar / armadilhas:** `call_sessions` é a tabela mais escrita do produto — um CHECK errado derruba a gravação de chamada, que acabou de ser consertada. Teste no Postgres descartável da etapa 053 primeiro.
**Depende de:** 059, 117, 124 · **Libera:** —
**Risco e como reverter:** médio. Reverter: `DROP CONSTRAINT`.
**Precisa de aprovação humana antes do merge:** **sim** (DDL em produção).
**Como verificar:** `INSERT` com status inválido é recusado; uma chamada de teste real continua sendo gravada normalmente.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 148 — `CHECK` no resultado da fila do discador
**Onda / Severidade / Camada:** 3 / Baixa / Banco
**Achados resolvidos:** A-125
**Problema hoje:** `dialer_queue.result` e `dialer_queue.status` são `text` sem `CHECK`, e a etapa 036 passa a escrever um valor novo (`skipped`) nesse domínio.
**Causa raiz:** idem 139.
**Caminho recomendado:** consolide o conjunto a partir do que as etapas 036, 078, 079 e 120 escrevem, levante o que existe, normalize e adicione o `CHECK`. Documente o significado de cada valor em `COMMENT ON COLUMN` — a próxima pessoa a mexer no discador vai precisar.
**Arquivos e objetos a tocar:** nova migration.
**Não tocar / armadilhas:** o discador escreve em laço; um CHECK errado para a campanha.
**Depende de:** 036, 078, 079, 120, 139 · **Libera:** —
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** **sim** (DDL em produção).
**Como verificar:** uma campanha de teste roda do início ao fim sem violação de CHECK, e `SELECT DISTINCT status, result FROM dialer_queue` só tem valores do conjunto.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 149 — Decidir o destino das tabelas sem nenhum uso
**Onda / Severidade / Camada:** 3 / Média / Banco
**Achados resolvidos:** A-124
**Problema hoje:** `password_reset_tokens`, `email_verification_tokens`, `account_journey_history`, `queue_skill_requirements` têm **zero referências** em `src/`, `supabase/functions/` e `scripts/`, e zero `INSERT`/`UPDATE` nas migrations (só policies). O snapshot confirma 0 linhas em todas, mais `customer_journey_stages` e `entity_versions`. Existem **duas estruturas paralelas** para recuperação de senha: `password_reset_requests` (a usada) e a de "tokens" (abandonada). O produto **parece** ter recuperação de senha e verificação de e-mail próprias no banco e não tem.
**Causa raiz:** backend criado antes do consumidor, aplicado também a tabelas.
**Caminho recomendado:** **não apague por conta própria.** Primeiro confirme que não há acesso invisível — acesso por RPC ou nome dinâmico não é detectável estaticamente — com `SELECT relname, n_tup_ins, n_tup_upd, seq_scan FROM pg_stat_user_tables WHERE relname IN (…)`. Se `seq_scan` e `n_tup_ins` forem 0, leve ao dono a lista com uma frase por tabela ("o que o produto perderia se isso fosse removido"). Entregue a migration de remoção pronta, **sem mergear**. Para `email_verification_tokens`, a pergunta por trás é melhor: **a verificação de e-mail funciona hoje?** Se o fluxo é todo do Supabase Auth, a tabela é mesmo desnecessária; registre isso.
**Arquivos e objetos a tocar:** `docs/agentes/banco.md`; nova migration (não mergeada).
**Não tocar / armadilhas:** `entity_versions` está no meio da contradição da etapa 132 — **não a inclua** nesta etapa.
**Depende de:** 132, 135 · **Libera:** —
**Risco e como reverter:** se apagar, irreversível sem backup.
**Precisa de aprovação humana antes do merge:** **sim** (deleção de estrutura em produção).
**Como verificar:** a consulta de `pg_stat_user_tables` no corpo da PR, mais a decisão do dono registrada com data.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 150 — Fechar a onda 3 conferindo que os indicadores concordam
**Onda / Severidade / Camada:** 3 / Média / Verificação
**Achados resolvidos:** consolida A-027 a A-039
**Problema hoje:** a onda 3 muda vários indicadores de negócio. Sem uma conferência final, o dono não tem como saber se o painel, o alerta e o freio do discador passaram a concordar.
**Causa raiz:** n/a — controle de execução.
**Caminho recomendado:** monte uma planilha de conferência (em `docs/qa/06-ONDA3-FECHAMENTO.md`) com, para o mesmo período de 1 hora: nível de serviço no painel do supervisor, no `/queue-dashboard` e no alerta automático; taxa de abandono no painel e na função de pacing; score do scorecard pelas duas rotas; MOS classificado nas três telas. **Todos os pares têm que bater.** Onde não baterem, há achado novo — registre no progresso em vez de ajustar às pressas.
**Arquivos e objetos a tocar:** novo `docs/qa/06-ONDA3-FECHAMENTO.md`.
**Não tocar / armadilhas:** a conferência só vale **depois** da etapa 065 (chamadas sendo gravadas) e da 069 (`hold_time_seconds` preenchido). Com base vazia, todos os indicadores concordam em zero e a conferência não prova nada.
**Depende de:** 101–149 · **Libera:** 151
**Risco e como reverter:** nenhum.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** o documento tem os pares de números, com a consulta que produziu cada um.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

---

# ONDA 4 — Funcionalidades incompletas (151–195)

> Esta onda trata do padrão mais comum do repositório: **backend construído, fio nunca ligado**. Antes de "implementar" qualquer coisa aqui, confirme que o backend existe — na maioria dos casos ligar o fio é o trabalho todo.

## Etapa 151 — Ligar o enforcement de SLA à interface
**Onda / Severidade / Camada:** 4 / Média / Frontend
**Achados resolvidos:** A-079
**Problema hoje:** `src/hooks/useSLA.ts:94 useEnforceSla` invoca a edge `enforce-sla` e **não tem nenhum consumidor** — a varredura dos 202 hooks exportados não achou referência fora da própria definição. A varredura de violações nunca é disparada pela interface.
**Causa raiz:** hook e edge entregues, botão nunca criado.
**Caminho recomendado:** o enforcement é periódico por natureza — o caminho certo **não** é um botão, é um cron, no padrão das etapas 040/083 (token do Vault, `verify_jwt=false` declarado). Agende a cada 10 minutos. Mantenha `useEnforceSla` para disparo manual do supervisor em `/sla-policies`, com confirmação. Com as etapas 109–112 feitas, o enforcement passa a produzir resultado correto; sem elas, agendá-lo só multiplica o número errado — **faça depois**.
**Arquivos e objetos a tocar:** `supabase/functions/enforce-sla/index.ts` (token de cron); `supabase/config.toml`; nova migration com o cron; `src/pages/SlaPolicies.tsx` (botão manual).
**Não tocar / armadilhas:** não dispare o enforcement a cada render nem por `refetchInterval` no front — ele escreve no banco.
**Depende de:** 109, 111, 112 · **Libera:** —
**Risco e como reverter:** baixo. Reverter: `cron.unschedule`.
**Precisa de aprovação humana antes do merge:** **sim** (DDL + segredo).
**Como verificar:** `SELECT jobname FROM cron.job WHERE jobname LIKE '%sla%'` existe; após 20 min, `SELECT count(*) FROM conversations WHERE sla_breached` reflete as conversas realmente atrasadas.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 152 — Registrar visualização de artigo da base de conhecimento
**Onda / Severidade / Camada:** 4 / Média / Frontend
**Achados resolvidos:** A-079
**Problema hoje:** `src/hooks/useKnowledgeBase.ts:165 useRecordKbView` existe e **nada o chama**; `:181-183` só loga o erro do insert. A tabela `kb_article_views` nunca recebe linha, então "este artigo ajudou?" e a contagem de visualizações não existem — e a tabela aparece como candidata a órfã.
**Causa raiz:** hook pronto, chamada nunca inserida na tela.
**Caminho recomendado:** chame `useRecordKbView` quando o artigo é **efetivamente lido** (montagem do detalhe, não hover no card), com proteção contra registro duplicado no mesmo render. Faça o insert **verificar o erro** e, se falhar, apenas logar — contagem de visualização não deve interromper a leitura. Confirme que existe policy de INSERT para o papel do leitor (é o padrão de falha das etapas 029/066/087): se não houver, a migration vem primeiro.
**Arquivos e objetos a tocar:** `src/hooks/useKnowledgeBase.ts`, a tela de detalhe do artigo; possivelmente nova migration de policy.
**Não tocar / armadilhas:** não registre a visualização num `useEffect` sem dependência estável — você gravaria uma linha por render.
**Depende de:** — · **Libera:** 153
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** **sim** se precisar de policy.
**Como verificar:** abrir um artigo → `SELECT count(*) FROM kb_article_views WHERE article_id='<id>'` aumentou exatamente 1.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 153 — Mostrar o artigo da base de conhecimento (hook órfão `useKbArticle`)
**Onda / Severidade / Camada:** 4 / Média / Frontend
**Achados resolvidos:** A-079
**Problema hoje:** `src/hooks/useKnowledgeBase.ts:116 useKbArticle` não tem consumidor — a tela de conhecimento lista, mas o detalhe por artigo não é alcançado por esse caminho.
**Causa raiz:** idem.
**Caminho recomendado:** verifique **primeiro** como a tela exibe o artigo hoje (pode haver uma segunda implementação inline, e aí o problema é duplicação, não ausência). Se não houver, ligue `useKbArticle` ao detalhe, com os três estados. Se houver, **remova o hook órfão** em vez de criar um segundo caminho — e registre a duplicação encontrada.
**Arquivos e objetos a tocar:** `src/pages/Knowledge.tsx` e componentes de detalhe; ou `src/hooks/useKnowledgeBase.ts` (remoção).
**Não tocar / armadilhas:** não presuma que o hook órfão é a peça que falta. Em 11 casos deste repositório, o "código morto" era a segunda implementação de algo que já funcionava.
**Depende de:** 152 · **Libera:** —
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** abrir o detalhe de um artigo mostra o conteúdo; ou `grep -rn "useKbArticle" src/` → vazio, se a decisão foi remover.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 154 — Decidir o destino do resumo automático de reunião
**Onda / Severidade / Camada:** 4 / Média / Frontend
**Achados resolvidos:** A-079
**Problema hoje:** `src/hooks/useMeetingSummary.ts:228 useAutoMeetingSummary` não tem consumidor. A edge `generate-meeting-summary` existe e a tabela `meeting_summaries` tem até índice único por `call_session_id`.
**Causa raiz:** idem.
**Caminho recomendado:** com a chamada sendo gravada (etapa 058), o gatilho natural é o fim da chamada: `runPostCallIntelligence` em `useCallSession.ts:126` já é o ponto onde a inteligência pós-chamada roda. Ligue ali, respeitando o índice único (não gere duas vezes para a mesma sessão). Se o dono não quiser resumo automático em toda chamada (custo de IA), exponha como ação do supervisor em `/meeting-summaries`. **Pergunte antes:** é decisão de custo.
**Arquivos e objetos a tocar:** `src/hooks/useCallSession.ts` ou `src/pages/MeetingSummaries.tsx`.
**Não tocar / armadilhas:** a edge não tem timeout (A-104) — se o provedor demorar, o encerramento da chamada não pode travar. Dispare sem aguardar o resultado (fire-and-forget com log), ou pela fila.
**Depende de:** 063 · **Libera:** —
**Risco e como reverter:** baixo (mas gera custo de IA).
**Precisa de aprovação humana antes do merge:** **sim** (custo).
**Como verificar:** chamada de teste → `SELECT count(*) FROM meeting_summaries WHERE call_session_id='<uuid>'` = 1, e a segunda tentativa não duplica.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 155 — Decidir o destino da verificação de voz ao vivo
**Onda / Severidade / Camada:** 4 / Média / Frontend
**Achados resolvidos:** A-079
**Problema hoje:** `src/hooks/useVoiceBiometrics.ts:185 useLiveVoiceVerification` não tem consumidor. A edge `verify-voice` existe e é uma das que **fazem autenticação corretamente** (`index.ts:24-27`).
**Causa raiz:** idem.
**Caminho recomendado:** o destino natural é a chamada ativa, agora que a barra renderiza (etapa 060): verificar a voz do cliente durante o atendimento, exibindo o resultado em `/voice-security`. **Mas isso é uma decisão de produto e de privacidade** — biometria de voz tem implicação de LGPD (dado biométrico é dado sensível). **Não ligue sem o dono confirmar** que há base legal e aviso ao cliente. Se não houver, a recomendação é **remover** o hook e registrar a razão — deixar código de biometria pronto e desligado é um risco guardado.
**Arquivos e objetos a tocar:** `docs/agentes/telefonia-voip.md` (decisão); depois, código conforme a escolha.
**Não tocar / armadilhas:** não ative biometria "para testar" com voz de cliente real.
**Depende de:** 060 · **Libera:** —
**Risco e como reverter:** n/a nesta etapa.
**Precisa de aprovação humana antes do merge:** **sim** (dado sensível, LGPD).
**Como verificar:** a decisão registrada com data, e o código em um dos dois estados (ligado com aviso, ou removido).
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 156 — Mostrar as inscrições de cadência na interface
**Onda / Severidade / Camada:** 4 / Média / Frontend
**Achados resolvidos:** A-079
**Problema hoje:** `src/hooks/useCadences.ts:87 useCadenceEnrollments` não tem consumidor: o time inscreve contatos (etapa 085) e **não tem tela que mostre quem está inscrito, em que etapa, e qual a próxima ação**.
**Causa raiz:** idem.
**Caminho recomendado:** ligue o hook em `/cadences`, com uma lista por cadência: contato, etapa atual, `next_action_at`, status. Com a etapa 085, esses campos passam a se mover — sem ela, a lista mostraria todos parados em "etapa 1 desde sempre", o que é informação útil mas confusa. **Faça depois da 085.** Trate os três estados e ofereça cancelar inscrição (verifique a policy de UPDATE antes).
**Arquivos e objetos a tocar:** `src/pages/Cadences.tsx` e componentes.
**Não tocar / armadilhas:** sem limite nem paginação a lista cresce indefinidamente (A-102) — já nasça com `.range()`.
**Depende de:** 085 · **Libera:** —
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** a tela lista as inscrições de teste criadas na etapa 085, com a etapa correta.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 157 — Mostrar os acertos dos trackers
**Onda / Severidade / Camada:** 4 / Média / Frontend
**Achados resolvidos:** A-079
**Problema hoje:** `src/hooks/useTrackers.ts:58 useTrackerMatches` não tem consumidor. O supervisor cadastra trackers (termos a monitorar nas chamadas) em `/trackers` e **não vê os acertos**.
**Causa raiz:** idem.
**Caminho recomendado:** ligue em `/trackers`, listando por tracker as chamadas em que o termo apareceu, com link para o detalhe da chamada. Os acertos dependem de transcrição, que só existe depois da etapa 061 — antes dela a lista é vazia por falta de dado, não por defeito. Deixe o estado vazio explicar isso ("nenhuma chamada transcrita no período").
**Arquivos e objetos a tocar:** `src/pages/Trackers.tsx`.
**Não tocar / armadilhas:** idem 156 (paginação).
**Depende de:** 036, 061 · **Libera:** —
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** com uma chamada transcrita contendo o termo, o tracker correspondente lista o acerto.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 158 — Remover o hook de conferência duplicado e defeituoso
**Onda / Severidade / Camada:** 4 / Média / Hooks
**Achados resolvidos:** A-079
**Problema hoje:** `src/hooks/useMultiChannelCallConference.ts` é um **arquivo inteiro órfão**, duplicata de `useCallTransfer` + a conferência de `useMultiChannelCall.ts:190`. E contém um defeito que a versão viva evitou **de propósito**: `:103-105` agenda `setTimeout(() => completeTransfer(callId), 2000)` dentro de `useCallback(…, [])` com deps suprimidas (`:104`), capturando o `completeTransfer` do primeiro render — `activeCalls` vazio, transferência cega que nunca completaria. O comentário de `useCallTransfer.ts:7-11` argumenta exatamente contra concluir transferência por timer.
**Causa raiz:** versão abandonada mantida ao lado da boa.
**Caminho recomendado:** confirme a ausência de consumidor com todas as formas de import (`grep -rn "useMultiChannelCallConference\|MultiChannelCallConference" src/`, incluindo `await import`), e **apague o arquivo**. Antes, verifique se a conferência de `useMultiChannelCall.ts:190` cobre tudo o que o órfão fazia — se houver uma capacidade só nele, registre no progresso em vez de perdê-la.
**Arquivos e objetos a tocar:** remoção de `src/hooks/useMultiChannelCallConference.ts` e de seu teste, se houver.
**Não tocar / armadilhas:** é a etapa em que mais vale a armadilha nº 1 das instruções: confirme o grep com todas as formas antes de apagar.
**Depende de:** 073 · **Libera:** —
**Risco e como reverter:** baixo (`git revert` restaura).
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** `npx tsc --noEmit` → 0 erros; `npx vitest run` sem regressão; `grep` → vazio.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 159 — Levantar o que falta para os hooks dormentes restantes
**Onda / Severidade / Camada:** 4 / Média / Documentação
**Achados resolvidos:** A-079
**Problema hoje:** depois das etapas 151–158, sobram hooks que `ESTADO_ATUAL.md` §3 R10 já apontava (`useAdherence`, `useChatbot`, `useChurnRisk`, `useCallPlaylists`, `useCoachingAssignments`, `useComplianceRules`, `useSurveys`, `useNotifications`) — alguns já ligados depois de agosto, outros não. A lista de agosto **não é confiável hoje**.
**Causa raiz:** inventário desatualizado.
**Caminho recomendado:** refaça a varredura **agora**: para cada hook exportado em `src/hooks/`, procure consumidor com todas as formas de import. Produza em `docs/estado/hooks-dormentes.md` a lista atual, e para cada item: a tabela/edge que ele usa, se há dado em produção, e uma frase sobre o que o produto ganharia. **Não implemente nada nesta etapa** — o valor é a lista confiável, que o dono usa para priorizar.
**Arquivos e objetos a tocar:** novo `docs/estado/hooks-dormentes.md`; script de varredura em `scripts/inventario/`.
**Não tocar / armadilhas:** 11 "códigos mortos" dos docs de estado já se revelaram falsos positivos (commits #154, #155, #156). Confirme cada um por leitura antes de listar.
**Depende de:** 158 · **Libera:** 160
**Risco e como reverter:** nenhum.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** o documento lista cada hook com a evidência de ausência de consumidor (comando e saída).
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 160 — Ligar ou remover os hooks dormentes, dois a dois
**Onda / Severidade / Camada:** 4 / Média / Frontend
**Achados resolvidos:** A-079
**Problema hoje:** o resultado da etapa 159.
**Causa raiz:** idem.
**Caminho recomendado:** com a lista em mãos, leve ao dono e faça **duas por PR**, na ordem que ele priorizar. Para cada um, a decisão é binária: liga (com os três estados e a verificação de erro) ou remove (com o teste). **Não deixe nenhum no meio** — um hook pronto e desligado é a dívida que gerou metade desta auditoria. Registre no progresso a decisão de cada um.
**Arquivos e objetos a tocar:** conforme a decisão de cada hook.
**Não tocar / armadilhas:** ligar um hook pode expor uma tabela sem policy adequada (padrão das etapas 029/066/087) — confira a policy **antes** de ligar.
**Depende de:** 159 · **Libera:** —
**Risco e como reverter:** baixo por item.
**Precisa de aprovação humana antes do merge:** não (mas a priorização é do dono).
**Como verificar:** por item: se ligado, a funcionalidade aparece e grava; se removido, `grep` vazio e type-check limpo.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 161 — Decidir o destino de `translate-summary` e `sync-crm-queue`
**Onda / Severidade / Camada:** 4 / Baixa / Edge Function
**Achados resolvidos:** A-080
**Problema hoje:** as duas têm referência **apenas** nos arquivos de inventário (`inventario/estado/edges.json`, `banco.json`) — nenhum chamador real. `sync-crm-queue` é resolvida pela etapa 083 (ganha cron). Sobra `translate-summary`: a tradução de conversa existe de verdade (`useLiveTranslation`, `TranslationCenter`, edge `translate-utterance`), mas a de **resumo** não tem consumidor.
**Causa raiz:** backend pronto sem consumidor.
**Caminho recomendado:** para `translate-summary`, o destino natural é o detalhe da chamada: botão "traduzir resumo" ao lado do resumo gerado. Ligue, ou remova a função. Como ela está entre as 37 sem validação de corpo (A-129) e sem timeout (A-104), **se a decisão for ligar, as etapas 048 e 246 precisam cobri-la**; se for remover, elas deixam de precisar.
**Arquivos e objetos a tocar:** a tela de detalhe da chamada, ou remoção de `supabase/functions/translate-summary/`.
**Não tocar / armadilhas:** não remova `translate-utterance` — essa **é** usada.
**Depende de:** 083 · **Libera:** 162
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** se ligada, traduzir um resumo funciona; se removida, `ls supabase/functions/ | grep translate-summary` → vazio e nenhum teste quebra.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 162 — Decidir o destino de `check-dnc` e `check-calling-hours` como edges
**Onda / Severidade / Camada:** 4 / Baixa / Edge Function
**Achados resolvidos:** A-080
**Problema hoje:** as duas edges têm referência **só em testes** (`src/hooks/__tests__/useEdgeFunctionIntegrity.test.ts`, `supabase/functions/_shared/__tests__/local-supabase.ts`). A lógica real é consumida como **RPC** por `score-call-attempt:33-37` e pelo `preDialCheck` do front. São dois endpoints deployados e expostos que ninguém usa.
**Causa raiz:** a mesma regra implementada como RPC e como edge, e só a RPC ganhou consumidor.
**Caminho recomendado:** **remova as duas edges** e mantenha as RPCs, que são o caminho em uso e o mais barato (sem salto de rede). Antes: confirme que nenhum chamador externo (Bitrix, n8n, Postman do dono) as usa — **pergunte**, porque isso não é detectável no repositório. Ajuste os testes que as mencionam; `useEdgeFunctionIntegrity.test.ts` é um dos 29 testes-espelho (A-048) e será tratado na etapa 284, mas não deixe o CI vermelho no caminho.
**Arquivos e objetos a tocar:** remoção de `supabase/functions/check-dnc/` e `check-calling-hours/`; ajuste dos testes citados.
**Não tocar / armadilhas:** remover edge **deployada** exige `supabase functions delete`, não só apagar o diretório — senão ela continua no ar. Registre isso na PR.
**Depende de:** 161 · **Libera:** —
**Risco e como reverter:** baixo se ninguém externo chamava. Reverter: redeploy.
**Precisa de aprovação humana antes do merge:** **sim** (remove endpoint publicado).
**Como verificar:** `POST /functions/v1/check-dnc` → 404; `preDialCheck` continua funcionando (etapa 034).
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 163 — Ligar "Priorizar" no discador preditivo
**Onda / Severidade / Camada:** 4 / Média / Frontend
**Achados resolvidos:** A-084
**Problema hoje:** `src/components/dialer/PredictiveDialerPanel.tsx:80` é um `<DropdownMenuItem>` com ícone `SkipForward` e rótulo "Priorizar", **sem `onClick`**.
**Causa raiz:** marcação entregue sem handler.
**Caminho recomendado:** `dialer_queue` tem coluna `priority` e `apiGetNextContact` já ordena por ela (`api.ts:96`) — então priorizar é um `update` de `priority`. Escreva `apiSetPriority(id, priority)` verificando o `error` (padrão da etapa 080) e ligue ao item. Dê retorno visível: a lista precisa refletir a nova ordem (invalide a query).
**Arquivos e objetos a tocar:** `src/components/dialer/PredictiveDialerPanel.tsx`, `src/hooks/predictive-dialer/api.ts`.
**Não tocar / armadilhas:** confirme que existe policy de UPDATE em `dialer_queue` para o papel do supervisor — é o padrão de falha das etapas 029/066/087.
**Depende de:** 080 · **Libera:** —
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** priorizar um contato → ele passa a ser o próximo da fila, e `SELECT priority FROM dialer_queue WHERE id='<id>'` mudou.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 164 — Ligar as duas ações de triagem da análise de IA
**Onda / Severidade / Camada:** 4 / Média / Frontend
**Achados resolvidos:** A-084
**Problema hoje:** `src/components/ai/AICallAnalysis.tsx:356` ("Marcar como resolvido") e `:360` ("Requer follow-up") são botões **sem `onClick`** — as duas ações de triagem que o analista precisaria tomar sobre uma chamada analisada.
**Causa raiz:** idem.
**Caminho recomendado:** precisa de destino no banco. Verifique se `call_analyses` tem coluna de triagem (`SELECT column_name FROM information_schema.columns WHERE table_name='call_analyses'`); se não, a migration vem primeiro (uma coluna `triage_status` com CHECK, no espírito das etapas 139/147). "Requer follow-up" deveria criar um callback agendado — `useScheduledCallbacks` existe; reuse em vez de criar outra entidade.
**Arquivos e objetos a tocar:** `src/components/ai/AICallAnalysis.tsx`; possivelmente nova migration; `src/hooks/useScheduledCallbacks.ts`.
**Não tocar / armadilhas:** `useScheduledCallbacks` é um dos hooks com `catch` engolindo erro em cinco pontos (A-053, etapa 205) — **não ligue antes** da 205, ou um follow-up pode ser perdido em silêncio.
**Depende de:** 205 · **Libera:** —
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** **sim** se precisar de migration.
**Como verificar:** marcar resolvido persiste após recarregar; "requer follow-up" cria linha em `scheduled_callbacks`.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 165 — Ligar os botões de navegação do dashboard
**Onda / Severidade / Camada:** 4 / Baixa / Frontend
**Achados resolvidos:** A-084
**Problema hoje:** `src/components/dashboard/RecentCalls.tsx:53` ("Ver todas") e `:103` ("Mais opções", que tem `aria-label` mas nenhuma ação) são botões sem `onClick`. E `src/components/calls/softphone/TabContents.tsx:88` é um botão de telefone na lista de chamadas ativas, também sem handler.
**Causa raiz:** idem.
**Caminho recomendado:** "Ver todas" → `navigate('/history')` (ou `/call-history`, veja a etapa 264 sobre a duplicata). "Mais opções" → ou abre o menu com as ações reais (ver detalhe, retornar ligação), ou **é removido**: um menu vazio é pior que nenhum botão. O botão de telefone em `TabContents` deve retomar a chamada selecionada (`switchToCall` existe em `useMultiChannelCall.ts:100`).
**Arquivos e objetos a tocar:** `src/components/dashboard/RecentCalls.tsx`, `src/components/calls/softphone/TabContents.tsx`.
**Não tocar / armadilhas:** `switchToCall` muda a chamada ativa — teste com duas chamadas simultâneas, não com uma.
**Depende de:** 060 · **Libera:** —
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** cada botão produz o efeito descrito; nenhum botão sem ação permanece nos três arquivos.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 166 — Resolver o menu "mais opções" do cartão de contato
**Onda / Severidade / Camada:** 4 / Baixa / Frontend
**Achados resolvidos:** A-084
**Problema hoje:** `src/components/contacts/ContactCard.tsx:100` tem `onClick={(e) => e.stopPropagation()}` — ou seja, **engole o clique** e não faz mais nada. É pior que um botão sem handler: parece intencional.
**Causa raiz:** o `stopPropagation` foi adicionado para o clique não abrir o cartão, e a ação nunca veio.
**Caminho recomendado:** ou abra um menu com as ações que já existem no detalhe (ligar, editar, favoritar, excluir), mantendo o `stopPropagation`, ou **remova o botão**. Se abrir o menu, reuse os handlers de `ContactDetailSheet` em vez de duplicá-los.
**Arquivos e objetos a tocar:** `src/components/contacts/ContactCard.tsx`.
**Não tocar / armadilhas:** o `stopPropagation` é necessário — se você o remover, o clique no menu abre o cartão.
**Depende de:** — · **Libera:** —
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** o botão abre o menu sem abrir o cartão, ou não existe mais.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 167 — Ligar "Ver Alertas" do painel de limite de requisições
**Onda / Severidade / Camada:** 4 / Baixa / Frontend
**Achados resolvidos:** A-084
**Problema hoje:** `src/pages/RateLimitDashboard.tsx:52` é um botão "Ver Alertas" **sem `onClick`**, e ele fica **dentro do alerta de incidente** — justamente o momento em que o admin precisa agir.
**Causa raiz:** idem.
**Caminho recomendado:** `navigate('/admin/security-alerts')` ou abra a lista filtrada de `rate_limit_alerts` na própria tela. A segunda é melhor: o admin está olhando o incidente, tirá-lo da tela custa contexto.
**Arquivos e objetos a tocar:** `src/pages/RateLimitDashboard.tsx`.
**Não tocar / armadilhas:** esta tela tem dois botões que mentem sucesso (etapa 029 corrigiu a policy; confirme que os `toast` agora refletem o resultado).
**Depende de:** 029 · **Libera:** —
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** clicar mostra os alertas correspondentes.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 168 — Ligar os botões "Configurar" e os testes de áudio
**Onda / Severidade / Camada:** 4 / Baixa / Frontend
**Achados resolvidos:** A-084
**Problema hoje:** `src/pages/Calls.tsx:137` e `:157` são botões "Configurar" (Wavoip e SIP Genérico) sem `onClick`; `src/pages/Settings.tsx:278` e `:282` são "Testar microfone" / "Testar áudio", também sem handler.
**Causa raiz:** idem.
**Caminho recomendado:** "Configurar" → `navigate('/admin/voip-trunks')` para SIP; para Wavoip, como o canal é stub (etapa 100), o honesto é **remover** o botão ou abrir um aviso "canal não disponível". Os dois testes de áudio são implementáveis sem backend: `navigator.mediaDevices.getUserMedia` para o microfone (mostrando um medidor de nível) e um `Audio` com um tom curto para a saída. São as duas funcionalidades mais úteis do bloco — um agente que não consegue testar o microfone antes do turno descobre o problema na primeira ligação.
**Arquivos e objetos a tocar:** `src/pages/Calls.tsx`, `src/pages/Settings.tsx`; novo `src/lib/audio/deviceTest.ts`.
**Não tocar / armadilhas:** `getUserMedia` exige permissão do navegador e falha em contexto não seguro — trate a recusa com mensagem clara, e **libere o stream** ao terminar (senão o microfone fica ocupado).
**Depende de:** 100 · **Libera:** —
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** "Testar microfone" mostra o nível de áudio reagindo à voz; "Testar áudio" toca o tom; nenhum botão sem ação nos dois arquivos.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 169 — Explicar na tela a regra do coaching automático
**Onda / Severidade / Camada:** 4 / Baixa / Frontend
**Achados resolvidos:** A-131
**Problema hoje:** `supabase/functions/generate-coaching-track/track-engine.ts` exige mínimo de 3 amostras, limiar 3.0 (escala 0–5) e janela de 14 dias, e devolve `skipped` quando não atende. **Nada em `/coaching` explica isso**: o supervisor vê "nenhuma trilha" sem saber por quê.
**Causa raiz:** regra do motor não exposta à interface.
**Caminho recomendado:** faça o estado vazio informar a regra e o que falta: "nenhuma trilha gerada — são necessárias 3 avaliações com nota abaixo de 3,0 nos últimos 14 dias; este agente tem 1". Os números vêm do motor, não de texto fixo — exponha-os na resposta da edge para a interface não duplicar as constantes (seria mais um caso de A-030).
**Arquivos e objetos a tocar:** `supabase/functions/generate-coaching-track/index.ts` (expor os parâmetros na resposta), `src/pages/Coaching.tsx`.
**Não tocar / armadilhas:** não copie `3`, `3.0` e `14` para o front. É exatamente assim que nascem as divergências da onda 3.
**Depende de:** — · **Libera:** —
**Risco e como reverter:** nenhum.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** com um agente de 1 avaliação, a tela mostra a regra e a contagem atual.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 170 — Alinhar a meta de SLO entre a tela e o cálculo
**Onda / Severidade / Camada:** 4 / Média / Frontend + Edge Function
**Achados resolvidos:** A-011
**Problema hoje:** `src/pages/admin/SloDashboard.tsx:35` declara `trunk_uptime: 99.9` e `:94` exibe essa meta; `supabase/functions/health-check/index.ts:47` usa `targetPct: 99` e `:57` decide `operational` com `>= 99`. Com 99,4% a tela diz "meta 99,9%" e, ao lado, "Operacional / budget saudável" — o alerta nunca dispara na meta anunciada.
**Causa raiz:** a meta está escrita em dois lugares.
**Caminho recomendado:** uma fonte. A meta é decisão de negócio, então o melhor lugar é configuração (tabela de SLO ou `compliance_settings`); o segundo melhor é a edge devolver a meta junto com o resultado, e a tela só exibir. **Não deixe a tela declarar a meta.** Pergunte ao dono qual é a meta real — 99% e 99,9% são compromissos muito diferentes (3,65 dias/ano contra 8,8 horas/ano).
**Arquivos e objetos a tocar:** `supabase/functions/health-check/index.ts`, `src/pages/admin/SloDashboard.tsx`.
**Não tocar / armadilhas:** a etapa 094 também mexe nesta edge — coordene ou faça junto.
**Depende de:** 094 · **Libera:** —
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não (mas a meta é do dono).
**Como verificar:** a tela exibe a mesma meta que a edge usa para decidir, e com uptime entre as duas o estado muda corretamente.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 171 — Resolver as duas estruturas paralelas de recuperação de senha e verificação de e-mail
**Onda / Severidade / Camada:** 4 / Média / Banco + Documentação
**Achados resolvidos:** A-124
**Problema hoje:** existem **duas** estruturas para o mesmo fluxo. `password_reset_requests` é a usada (pela edge `request-password-reset` e pela tela `/password-reset-approval`); `password_reset_tokens` tem 0 linhas e nenhuma referência em código. O mesmo vale para `email_verification_tokens`. O produto **parece** ter recuperação de senha e verificação de e-mail próprias no banco, e o fluxo real é outro.
**Causa raiz:** uma implementação começada, abandonada, e substituída por outra sem remover a primeira.
**Caminho recomendado:** antes de tocar no banco (isso é a etapa 149), responda a pergunta que importa: **a verificação de e-mail funciona hoje?** Teste criando uma conta: o e-mail chega? o link ativa? Se o fluxo é todo do Supabase Auth, as duas tabelas são desnecessárias e o produto está correto — registre isso em `docs/agentes/banco.md` com a evidência do teste. Se **não** funciona, você encontrou uma funcionalidade incompleta de verdade, e ela merece sua própria sequência de etapas: anote no progresso com prioridade alta, porque conta sem e-mail verificado é porta de entrada.
**Arquivos e objetos a tocar:** `docs/agentes/banco.md`.
**Não tocar / armadilhas:** não apague as tabelas aqui (etapa 149).
**Depende de:** — · **Libera:** 149
**Risco e como reverter:** nenhum.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** o documento descreve o fluxo real de verificação de e-mail, com o resultado do teste de criação de conta (data e desfecho).
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 172 — Parar de contar "features de segurança" a partir de um array literal
**Onda / Severidade / Camada:** 4 / Média / Frontend
**Achados resolvidos:** A-010
**Problema hoje:** o KPI "Features de Segurança" em `src/pages/SecurityReport.tsx:128` é `securityFeatures.filter(f => f.status === 'implemented').length` — um array onde **6 de 7 entradas já vêm marcadas `'implemented'`** em `src/lib/security-report-data.ts`. O número é a contagem de um texto que alguém escreveu, apresentada como indicador.
**Causa raiz:** catálogo curado usado como fonte de métrica.
**Caminho recomendado:** um catálogo de controles é legítimo — o problema é transformá-lo em KPI. Remova o KPI e exiba o catálogo como **lista de controles com o estado de cada um**, onde cada estado tem origem declarada: "RLS: 163 tabelas (medido)", "CSP: não configurado (ver etapa 026)". Onde não houver medição, escreva "não verificado". A etapa 099 já tira a contagem fixa de RLS; esta tira o KPI.
**Arquivos e objetos a tocar:** `src/pages/SecurityReport.tsx`, `src/lib/security-report-data.ts`.
**Não tocar / armadilhas:** não troque o literal por outro literal com números maiores.
**Depende de:** 099 · **Libera:** —
**Risco e como reverter:** nenhum.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** a tela não exibe nenhum número cuja origem não esteja declarada ao lado.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 173 — Dar estados e defesa ao gráfico de espera do dashboard
**Onda / Severidade / Camada:** 4 / Alta / Frontend
**Achados resolvidos:** A-003, A-009
**Problema hoje:** `src/components/dashboard/HoldTrendChart.tsx:26-33` consulta `call_sessions` e `hold_events` **sem tratar `error`, sem `isLoading` e sem estado vazio**, e `:35-37` calcula `const inCall = activeCalls - activeHolds` — que vai a **negativo** quando há mais holds abertos que chamadas ativas (exatamente o que a A-003 produzia). O gráfico fica cada vez mais errado sem nada na tela indicar falha.
**Causa raiz:** componente que assume caminho felizes, somado a uma subtração sem piso.
**Caminho recomendado:** trate os três estados (o padrão correto está em `src/components/dashboard/QueueStatus.tsx`, que o faz certo — use-o como referência); verifique `error` nas duas consultas; e aplique `Math.max(0, activeCalls - activeHolds)` **com um log de aviso quando o valor seria negativo** — valor negativo aqui significa dado inconsistente, e silenciar isso foi o que escondeu a A-003 por meses.
**Arquivos e objetos a tocar:** `src/components/dashboard/HoldTrendChart.tsx`.
**Não tocar / armadilhas:** o clamp **não** substitui a correção da etapa 066 — ele é a defesa, não o conserto.
**Depende de:** 066, 069 · **Libera:** —
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** teste que mocka erro nas consultas → a tela mostra erro, não um gráfico zerado; e teste com mais holds que chamadas → nenhum valor negativo e um aviso no log.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 174 — Fazer o painel de conflitos de concorrência mostrar conflitos
**Onda / Severidade / Camada:** 4 / Média / Frontend
**Achados resolvidos:** A-058
**Problema hoje:** `/concurrency-conflicts` lê `optimistic_lock_conflicts` e fica **estruturalmente vazio**, porque nenhum chamador envia `version` e o gatilho nunca dispara (A-058). A tela existe, o backend existe, e a ausência de conteúdo passa por "não há conflito".
**Causa raiz:** consequência da A-058.
**Caminho recomendado:** depois da etapa 110 a tabela passa a receber linhas. Aqui: confirme que a tela as exibe corretamente, e **mude o estado vazio** para dizer o que significa — "nenhum conflito registrado nos últimos 7 dias" é informação; uma tabela em branco não é. Verifique também a retenção: o cron `cleanup-lock-conflicts-weekly` apaga registros com mais de 90 dias, então a tela nunca mostra histórico longo — diga isso na tela.
**Arquivos e objetos a tocar:** `src/pages/ConcurrencyConflicts.tsx` e componentes.
**Não tocar / armadilhas:** não conclua que a correção falhou se a tela continuar vazia no dia seguinte — conflito real exige dois usuários editando o mesmo registro. Force um na verificação.
**Depende de:** 110 · **Libera:** —
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** provocar um conflito (duas abas, etapa 110) → a linha aparece na tela com os dois usuários e o registro.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 175 — Completar o CRUD da lista DNC
**Onda / Severidade / Camada:** 4 / Média / Frontend
**Achados resolvidos:** A-123, A-025
**Problema hoje:** `src/components/compliance/dnc/DNCTable.tsx:73` é um botão-ícone de **exclusão sem rótulo acessível** e, pelo que a tela oferece, não há edição de motivo nem de validade de uma entrada já cadastrada. Numa lista que tem efeito regulatório, remover um número por engano é o erro mais caro.
**Causa raiz:** CRUD entregue sem editar e com exclusão sem proteção.
**Caminho recomendado:** (1) `aria-label="Remover <telefone> da lista"` no botão (o padrão correto está em `src/components/dashboard/RecentCalls.tsx:106`); (2) confirmação explícita com o número visível antes de remover; (3) registre quem removeu e quando — se a tabela não tiver essas colunas, **isso é obrigatório numa lista de DNC** e a migration vem primeiro; (4) edição de motivo e validade. A exclusão em lista regulatória deve ser rastreável.
**Arquivos e objetos a tocar:** `src/components/compliance/dnc/DNCTable.tsx`, `src/hooks/useDNCCompliance.ts`; possivelmente nova migration.
**Não tocar / armadilhas:** não implemente exclusão em lote sem confirmação por item — é a operação de onde vem a multa.
**Depende de:** 038 · **Libera:** —
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** **sim** se precisar de migration.
**Como verificar:** remover uma entrada exige confirmação, registra autor e data, e o leitor de tela anuncia o telefone; editar o motivo persiste.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 176 — Fazer a remediação de anomalia atualizar a lista
**Onda / Severidade / Camada:** 4 / Média / Hooks
**Achados resolvidos:** A-064
**Problema hoje:** `src/hooks/useAnomalyRemediation.ts:38-61` tem `onSuccess` que só emite `toast.success('Remediação aplicada')`; o arquivo **não importa `useQueryClient`** e não invalida nada. A lista vem de `useVoipAnomalies.ts:51` (`queryKey: ['voip-anomalies', periodHours]`, `refetchInterval: 120_000`), então a anomalia fica listada por até 2 minutos e o operador reaplica — e a edge responde "já aplicada recentemente" (guarda de idempotência de 1 h), o que parece erro.
**Causa raiz:** mutação sem invalidação da query que ela altera.
**Caminho recomendado:** importe `useQueryClient` e invalide `['voip-anomalies']` no `onSuccess`. Padrão de uma linha, e o repositório já o usa em outros hooks (`useDialerFavorites.ts:146-153`). **Atalho a evitar:** baixar o `refetchInterval` para 10 s — resolve a aparência e multiplica as consultas.
**Arquivos e objetos a tocar:** `src/hooks/useAnomalyRemediation.ts`.
**Não tocar / armadilhas:** a etapa 177 muda o que a remediação **faz**. Esta só conserta a atualização da tela — não misture.
**Depende de:** — · **Libera:** 177
**Risco e como reverter:** nenhum.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** aplicar uma remediação → a anomalia sai da lista imediatamente, sem esperar o refetch.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 177 — Parar de responder "aplicado" sem aplicar nada
**Onda / Severidade / Camada:** 4 / Alta / Edge Function
**Achados resolvidos:** A-008
**Problema hoje:** `supabase/functions/voip-anomaly-remediation/index.ts:206-236` insere em `voip_recommendation_actions` com `outcome: 'auto_applied'` e responde `applied: true`. **No arquivo inteiro não há `fetch` nem chamada a `voip-trunks-manage`/`voip_trunks`** — o único efeito é o INSERT. Esses registros alimentam "efetividade" em `voip-recommendation-insights/index.ts:64,104` e "ações aplicadas" em `voip-diagnostic-voice-qa/index.ts:111,171`. O painel afirma que a anomalia foi remediada e calcula taxa de sucesso sobre ações que nunca aconteceram.
**Causa raiz:** o `plan` é calculado por função pura (`planRemediation`) e nunca executado. O guard R9 do CI só acusa stub quando não há banco **nem** fetch (`scripts/audit-edge-functions.ts:130-137`), e este caso escapa porque grava no banco.
**Caminho recomendado:** a escolha é do dono, e as duas respostas são aceitáveis — o que **não** é aceitável é a terceira, que é a atual. (a) **Executar de verdade:** as ações da whitelist (`force_codec_opus_low`, `pause_outbound_campaigns`, `throttle_concurrent_calls`) viram chamadas reais a `voip-trunks-manage` ou a atualizações de campanha, com o `outcome` refletindo o resultado. (b) **Declarar como sugestão:** troque `outcome: 'auto_applied'` por `'suggested'`, `applied: true` por `applied: false, suggestion: true`, e ajuste o painel para dizer "sugestões geradas", não "ações aplicadas". Recomende (b) **agora** (é honesto e barato) e (a) como feature. Em qualquer caso, **ajuste o KPI de efetividade** na mesma PR — ele é o motivo pelo qual isso importa.
**Arquivos e objetos a tocar:** `supabase/functions/voip-anomaly-remediation/index.ts`, `voip-recommendation-insights/index.ts`, `voip-diagnostic-voice-qa/index.ts`, `src/components/network/RecommendationInsightsCard.tsx`.
**Não tocar / armadilhas:** registros antigos com `auto_applied` continuam no banco e poluem o KPI. Decida com o dono se eles são reclassificados ou se o KPI passa a contar a partir de uma data de corte — e **escreva a data de corte no código**, não num comentário solto.
**Depende de:** 176 · **Libera:** 178
**Risco e como reverter:** se escolher (a), o sistema passa a mexer em configuração de tronco automaticamente — **isso exige aprovação e teste cuidadoso**.
**Precisa de aprovação humana antes do merge:** **sim**.
**Como verificar:** opção (b): a resposta não contém `applied: true`, o painel diz "sugestões", e `SELECT DISTINCT outcome FROM voip_recommendation_actions WHERE created_at > <corte>` → `suggested`. Opção (a): a configuração do tronco muda de fato, verificável em `voip_trunks`.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 178 — Fazer o "Aplicar" da recomendação de capacidade registrar algo
**Onda / Severidade / Camada:** 4 / Média / Frontend
**Achados resolvidos:** A-008
**Problema hoje:**
```ts
src/components/network/QualityForecastCard.tsx:48-54
const handleApply = (rec: { id: string; title: string }) => {
  log.info('Aplicando recomendação de capacity', { id: rec.id });
  toast.success('Recomendação registrada', { description: rec.title, … });
};
```
Nada é gravado nem invocado — e o toast afirma "registrada". O irmão `VoipRecommendationsPanel.tsx:120-126` chama `executeAction` e `recordAction`.
**Causa raiz:** handler-esqueleto que anuncia o que não fez.
**Caminho recomendado:** reuse `recordAction` do painel vizinho, com o `outcome` honesto decidido na etapa 177 (`suggested` ou `applied`, conforme a escolha). Se a recomendação de capacidade for só informativa (aumentar canais do tronco é ação humana), então o botão correto é **"Marcar como lida"** ou "Criar tarefa", não "Aplicar" — renomeie. Rótulo que promete execução e só grava log é o mesmo problema da A-008 em escala menor.
**Arquivos e objetos a tocar:** `src/components/network/QualityForecastCard.tsx`.
**Não tocar / armadilhas:** não copie `executeAction` se a ação não é executável — copiar o rótulo sem a execução é como o problema nasceu.
**Depende de:** 177 · **Libera:** —
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** clicar grava linha em `voip_recommendation_actions` com o `outcome` correto, e o rótulo descreve o que acontece.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 179 — Mostrar as violações de SLA numa tela
**Onda / Severidade / Camada:** 4 / Média / Frontend
**Achados resolvidos:** A-039, A-079
**Problema hoje:** depois das etapas 109–112 e 151, o enforcement passa a marcar `sla_breached` corretamente — mas a conformidade aparece só como percentual. **Não há tela que liste quais conversas violaram e por quanto**, que é o que o supervisor precisa para agir.
**Causa raiz:** o indicador existe, o detalhe não.
**Caminho recomendado:** em `/sla-policies` (ou numa aba de `/queue-dashboard`), liste as conversas com `sla_breached`, ordenadas pelo atraso, com link para o atendimento. Use `.range()` desde o início (A-102). O percentual já vem de `useSLA`; aqui é a lista. **Atalho a evitar:** criar outra tela nova — o supervisor já tem telas demais (93 itens de menu); encaixe onde ele já olha.
**Arquivos e objetos a tocar:** `src/pages/SlaPolicies.tsx` ou `src/pages/QueueDashboard.tsx`; `src/hooks/useSLA.ts`.
**Não tocar / armadilhas:** depende das etapas 109–112 para a marcação estar correta; antes delas, a lista mostraria violações erradas.
**Depende de:** 112, 151 · **Libera:** —
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** com uma conversa atrasada de teste, ela aparece na lista com o atraso correto.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 180 — Fechar a onda 4 com o inventário de fios ligados
**Onda / Severidade / Camada:** 4 / Média / Documentação
**Achados resolvidos:** consolida A-076 a A-085
**Problema hoje:** a onda 4 liga funcionalidades que estavam construídas e inalcançáveis. Sem um registro, ninguém sabe o que passou a existir — e o dono precisa saber para conferir e para contar aos clientes.
**Causa raiz:** n/a — controle de execução.
**Caminho recomendado:** escreva `docs/qa/06-ONDA4-FECHAMENTO.md` listando, em linguagem de negócio: o que passou a funcionar (uma linha cada), o que foi removido por não ter destino, o que ficou aguardando decisão do dono. Atualize `SYSTEM_FEATURES.md` **removendo** as marcações `[x]` dos itens que esta auditoria mostrou não funcionar — é a primeira vez que esse documento vai ficar honesto (ele tem 185 itens, todos marcados como concluídos, datado de 2026-03-15).
**Arquivos e objetos a tocar:** novo `docs/qa/06-ONDA4-FECHAMENTO.md`; `SYSTEM_FEATURES.md`.
**Não tocar / armadilhas:** não marque como concluído o que você não verificou em execução. A regra do repositório é explícita: "pronto" = mergeado + deploy confirmado + comportamento verificado.
**Depende de:** 151–179 · **Libera:** 181
**Risco e como reverter:** nenhum.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** o documento cobre cada etapa de 151 a 179, e `SYSTEM_FEATURES.md` passa a ter itens não marcados.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

---

# ONDA 5 — Robustez: erros, estados e concorrência (181–235)

> **Contexto que vale para quase toda esta onda.** O cliente do Supabase **não lança exceção** em erro: `node_modules/@supabase/postgrest-js/src/PostgrestBuilder.ts:26` define `shouldThrowOnError = false`, `:211-212` só lança com `.throwOnError()`, e `:227` converte até erro de rede em resultado resolvido. Por isso `await supabase…` sem desestruturar `error` **sempre parece ter funcionado**, e `try/catch` em volta de uma chamada do Supabase tem o `catch` inalcançável. Esse único fato explica 35 gravações cegas (A-052), 52 `catch` inúteis (A-053) e 32 consultas que viram zero (A-009).

## Etapa 181 — Verificar o erro nas gravações do ciclo de chamada
**Onda / Severidade / Camada:** 5 / Alta / Hooks
**Achados resolvidos:** A-052
**Problema hoje:** gravações sem desestruturar `error` em `src/hooks/useCallSession.ts:133` (`call_transcripts_searchable`), `src/hooks/useMultiChannelCall.ts:143` (`hold_events`), `src/hooks/useCallRecording.ts:56` (`call_recordings`), `src/hooks/useVoipQualityMonitor.ts:179` (`call_quality_metrics`).
**Causa raiz:** ver o bloco acima.
**Caminho recomendado:** em cada um, `const { error } = await …; if (error) { … }`. O tratamento varia pelo que a gravação significa: índice de busca e métrica de qualidade podem degradar com log (`log.error`) sem interromper a chamada; `call_recordings` **não** — se a gravação não foi registrada, o agente precisa saber, porque é o registro legal do atendimento. Comece por `call_recordings`.
**Arquivos e objetos a tocar:** os 4 hooks citados.
**Não tocar / armadilhas:** não transforme tudo em `throw` — num caminho de chamada ao vivo, uma exceção não tratada derruba a interface no pior momento.
**Depende de:** 066 · **Libera:** 196
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** teste por hook que mocka `error` e afirma o comportamento (log ou toast), e que a chamada **não** é interrompida.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 182 — Verificar o erro nas gravações da trilha de auditoria
**Onda / Severidade / Camada:** 5 / Alta / Hooks
**Achados resolvidos:** A-052, A-053
**Problema hoje:** `src/hooks/useSupervisorPanel.ts:206` e `:225` gravam em **`call_control_audit_logs`** sem verificar o erro, e `src/hooks/useAuditLog.ts:50` tem `catch` que engole a falha. Uma trilha de auditoria que pode não existir sem ninguém saber é pior que não ter trilha: ela cria a crença de que houve registro.
**Causa raiz:** idem; agravada por tratar auditoria como efeito colateral opcional.
**Caminho recomendado:** auditoria é o caso em que a falha **precisa** ser visível: verifique o `error`, registre no logger com severidade alta e mostre ao usuário que a ação foi feita **mas não registrada**. Se a ação auditada for sensível (escuta de chamada, sussurro, intervenção), considere **bloquear a ação** quando o registro falhar — leve a decisão ao dono, porque é trade-off entre operação e conformidade.
**Arquivos e objetos a tocar:** `src/hooks/useSupervisorPanel.ts`, `src/hooks/useAuditLog.ts`.
**Não tocar / armadilhas:** não troque a gravação por uma edge sem necessidade; a policy de INSERT já deve existir — confirme.
**Depende de:** 181 · **Libera:** 196
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não (a menos que opte por bloquear a ação).
**Como verificar:** teste que mocka `error` no insert de auditoria → log de erro emitido e aviso ao usuário.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 183 — Verificar o erro nas gravações de sessão e autenticação
**Onda / Severidade / Camada:** 5 / Alta / Hooks
**Achados resolvidos:** A-052
**Problema hoje:** `src/hooks/useSessionManager.ts:133` (`active_sessions`) e `:152` (`auth.signOut`), e `src/hooks/useWebAuthn.ts:214` (`user_passkeys`) gravam sem verificar o resultado. Uma passkey que o usuário acredita ter registrado e que não foi gravada é uma porta que ele pensa ter e não tem.
**Causa raiz:** idem.
**Caminho recomendado:** `useWebAuthn` é o mais grave: se o insert de `user_passkeys` falhar, **desfaça o registro no autenticador** (ou, se não for possível, avise explicitamente que o registro não foi concluído) — jamais exiba sucesso. Em `useSessionManager`, a revogação de sessão que falha precisa aparecer: o usuário clicou em "encerrar sessões" por um motivo.
**Arquivos e objetos a tocar:** `src/hooks/useSessionManager.ts`, `src/hooks/useWebAuthn.ts`.
**Não tocar / armadilhas:** o fluxo de passkey tem reauth (`ReauthContext`) — não quebre a exigência de reautenticação ao mexer no caminho de erro.
**Depende de:** 182 · **Libera:** 196
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** mockando erro no insert de passkey, a tela mostra falha e a chave **não** aparece na lista.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 184 — Verificar o erro nas gravações de conversas e mensagens
**Onda / Severidade / Camada:** 5 / Média / Hooks
**Achados resolvidos:** A-052
**Problema hoje:** `src/hooks/useConversations.ts:180` atualiza `conversations` sem verificar o resultado — e, como RLS sem policy devolve 0 linhas em vez de erro (A-065), nem o `error` cobre tudo: confirme também a contagem de linhas afetadas.
**Causa raiz:** idem, com o agravante da RLS silenciosa.
**Caminho recomendado:** verifique `error` **e** use `.select()` no update para saber quantas linhas voltaram; zero linhas num update que deveria afetar uma é falha, não sucesso. Esse padrão (`update(...).select()`) é a defesa contra policy ausente e vale a pena onde a ação é visível ao usuário.
**Arquivos e objetos a tocar:** `src/hooks/useConversations.ts`.
**Não tocar / armadilhas:** `.select()` num update aumenta o retorno — não o use em update em lote grande.
**Depende de:** 183 · **Libera:** 196
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** teste que simula policy ausente (0 linhas) → a interface mostra falha, não sucesso.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 185 — Verificar o erro nas gravações de gamificação e ranking
**Onda / Severidade / Camada:** 5 / Média / Hooks
**Achados resolvidos:** A-052
**Problema hoje:** `src/hooks/useGamification.ts:224` e `:229` (`agent_weekly_stats`) e `src/hooks/useAgentRanking.ts:110` (`call_alerts`) gravam sem verificação.
**Causa raiz:** idem.
**Caminho recomendado:** a correção estrutural de `useGamification` é a etapa 126 (RPC atômica) — aqui, garanta que a chamada à RPC **verifique o erro**. Em `useAgentRanking`, a correção é a etapa 127. Esta etapa é a rede de segurança das duas: nenhuma escrita sem verificação.
**Arquivos e objetos a tocar:** `src/hooks/useGamification.ts`, `src/hooks/useAgentRanking.ts`.
**Não tocar / armadilhas:** se as etapas 126 e 127 já tiverem sido feitas, confira que não sobrou escrita antiga.
**Depende de:** 126, 127 · **Libera:** 196
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** `grep -n "await supabase" src/hooks/useGamification.ts src/hooks/useAgentRanking.ts` → toda ocorrência desestrutura `error`.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 186 — Verificar o erro nas operações de armazenamento
**Onda / Severidade / Camada:** 5 / Média / Hooks
**Achados resolvidos:** A-052
**Problema hoje:** `src/hooks/useQueueAudioPrompts.ts:88` remove objeto do bucket (`storage.from(BUCKET).remove`) sem verificar o resultado. Um áudio de fila que o usuário acredita ter removido e que continua no bucket é um arquivo que continua tocando para o cliente.
**Causa raiz:** idem, no cliente de storage.
**Caminho recomendado:** verifique o `error` do `remove` e **confirme a ordem**: remova a referência no banco **depois** de o objeto sair, nunca antes — senão sobra objeto órfão que ninguém mais alcança. O repositório já aprendeu isso: a edge `cleanup-recordings` apaga o objeto antes da linha, de propósito, e o comentário explica por quê (item C2 das pendências). Siga a mesma ordem.
**Arquivos e objetos a tocar:** `src/hooks/useQueueAudioPrompts.ts`.
**Não tocar / armadilhas:** o inverso (linha antes do objeto) cria órfão invisível. A ordem importa.
**Depende de:** 185 · **Libera:** 196
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** remover um áudio de teste → o objeto some do bucket **e** a linha some; com erro simulado no storage, a linha permanece e o usuário é avisado.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 187 — Varrer e corrigir as gravações cegas restantes
**Onda / Severidade / Camada:** 5 / Média / Hooks
**Achados resolvidos:** A-052
**Problema hoje:** a medição encontrou **35** ocorrências de `await supabase…` sem desestruturar `error`; as etapas 181–186 cobrem as mais consequentes. O resto está espalhado por hooks e componentes.
**Causa raiz:** idem.
**Caminho recomendado:** rode a varredura você mesmo (o comando está em "Como verificar") para ter a lista **atual**, e corrija o que sobrou em 2 ou 3 PRs agrupadas por área. Para cada uma, decida o tratamento pelo significado da escrita — não aplique `throw` em bloco.
**Arquivos e objetos a tocar:** conforme a varredura.
**Não tocar / armadilhas:** há casos legítimos de ignorar o resultado (telemetria best-effort). Quando for o caso, **escreva `void supabase…` com um comentário** dizendo por quê — assim a próxima varredura não o acusa de novo.
**Depende de:** 186 · **Libera:** 196
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** `grep -rn "^\s*await supabase" src/ --include=*.ts --include=*.tsx | grep -v __tests__` → só ocorrências com comentário justificando.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 188 — Fazer o mesmo nas edge functions
**Onda / Severidade / Camada:** 5 / Média / Edge Function
**Achados resolvidos:** A-052
**Problema hoje:** o mesmo padrão existe nas edges — por exemplo, `email-inbound/index.ts:148` insere em `conversation_messages` **sem verificar o resultado**, logo depois de um insert cujo erro é tratado.
**Causa raiz:** idem, do outro lado.
**Caminho recomendado:** varra `supabase/functions/*/index.ts` pelo mesmo padrão e corrija. Nas edges o tratamento é mais simples: devolva erro ao chamador (com o envelope da etapa 050) ou registre e continue, conforme a escrita seja essencial. **Nunca** devolva 200 com uma escrita essencial falhada — é o que faz um webhook parar de reentregar algo que não foi salvo.
**Arquivos e objetos a tocar:** conforme a varredura em `supabase/functions/`.
**Não tocar / armadilhas:** cuidado com a ordem em `email-inbound` (etapa 015) — não desfaça a idempotência.
**Depende de:** 187 · **Libera:** 196
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** `grep -rn "await supabase" supabase/functions/*/index.ts | grep -v "const {"` → só ocorrências justificadas; `deno check` limpo.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 189 — Parar de engolir falha nos alertas de contato
**Onda / Severidade / Camada:** 5 / Média / Hooks
**Achados resolvidos:** A-053
**Problema hoje:** `src/hooks/useContactAlerts.ts:68,85,107,123,140` — cinco blocos `catch` envolvendo escrita, sem `throw`, `toast.error`, `setError` nem `return false`. O usuário cria um alerta de contato e nada indica se ele existe.
**Causa raiz:** padrão "log e segue", correto para leitura, aplicado a escrita.
**Caminho recomendado:** em cada um dos cinco, devolva um resultado que o chamador possa verificar (`{ ok, error }`) e exiba `toast.error` quando falhar. Lembre que o `catch` em si é quase inalcançável (ver o bloco de contexto da onda): o que precisa existir é a verificação de `error`, **e** o `catch` como rede para exceções de verdade (rede caindo no meio da serialização, por exemplo).
**Arquivos e objetos a tocar:** `src/hooks/useContactAlerts.ts` e seus consumidores.
**Não tocar / armadilhas:** não remova o `catch`; complete-o.
**Depende de:** 188 · **Libera:** 196
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** teste por função que mocka `error` e afirma que o chamador recebe falha e exibe mensagem.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 190 — Parar de engolir falha na gravação de contatos
**Onda / Severidade / Camada:** 5 / Média / Hooks
**Achados resolvidos:** A-053
**Problema hoje:** `src/hooks/useContacts.ts:168,230,256,330` — quatro `catch` sobre escrita sem reportar. Criar ou editar contato é a operação mais frequente do agente.
**Causa raiz:** idem.
**Caminho recomendado:** idem 189. Aqui há um detalhe: `useContacts.ts:203` já aceita `version` para o lock otimista (etapa 110) — ao tratar o erro, **distinga o conflito de lock** (`OPTIMISTIC_LOCK_CONFLICT`) dos demais, com mensagem própria: "alguém editou este contato, recarregue" é acionável; "erro ao salvar" não é.
**Arquivos e objetos a tocar:** `src/hooks/useContacts.ts`.
**Não tocar / armadilhas:** não mude a assinatura pública do hook sem rodar `npx tsc --noEmit` — ele tem muitos consumidores.
**Depende de:** 110, 189 · **Libera:** 196
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** salvar contato com erro simulado → mensagem específica; com conflito de versão → mensagem de conflito.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 191 — Parar de engolir falha na gravação de contas
**Onda / Severidade / Camada:** 5 / Média / Hooks
**Achados resolvidos:** A-053
**Problema hoje:** `src/hooks/useAccounts.ts:62,76,90` — três `catch` sobre escrita sem reportar, na entidade que sustenta renovações e planos de sucesso.
**Causa raiz:** idem.
**Caminho recomendado:** idem 190, incluindo o tratamento de conflito de lock (etapa 110 também cobre `accounts`).
**Arquivos e objetos a tocar:** `src/hooks/useAccounts.ts`.
**Não tocar / armadilhas:** idem.
**Depende de:** 110, 190 · **Libera:** 196
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** idem 190, para contas.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 192 — Parar de engolir falha na administração de ramais
**Onda / Severidade / Camada:** 5 / Média / Hooks
**Achados resolvidos:** A-053
**Problema hoje:** `src/hooks/useExtensionsAdmin.ts:83` — `catch` sobre escrita sem reportar. Um ramal que o admin acredita ter configurado e que não foi salvo só aparece quando o agente não consegue atender.
**Causa raiz:** idem.
**Caminho recomendado:** idem. Como a tela de ramais é administrativa e de baixa frequência, vale **confirmar a gravação relendo** o registro depois de salvar e mostrar o estado atual — é a forma mais simples de dar certeza ao admin.
**Arquivos e objetos a tocar:** `src/hooks/useExtensionsAdmin.ts`, `src/pages/admin/ExtensionsAdmin.tsx`.
**Não tocar / armadilhas:** `useExtensionsOverview` tem `usePageVisibility` integrado (item B7 das pendências) — não quebre a pausa de realtime ao mexer na tela.
**Depende de:** 191 · **Libera:** 196
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** salvar um ramal com erro simulado → mensagem de falha e o valor antigo permanece na tela.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 193 — Parar de engolir falha no relatório de uso de tronco
**Onda / Severidade / Camada:** 5 / Média / Hooks
**Achados resolvidos:** A-053, A-004
**Problema hoje:** `src/hooks/useTrunkUsageReporter.ts:52-54` silencia a falha com `log.warn`. Uma falha de rateio de custo por tronco **não é aviso** — é dinheiro que não será cobrado nem atribuído.
**Causa raiz:** severidade de log subdimensionada.
**Caminho recomendado:** suba para `log.error` com o contexto (tronco, chamada, segundos) e, se possível, enfileire para reenvio (mesma ideia da etapa 072). A causa raiz do id inválido é a etapa 070 — esta trata do que acontece quando a gravação falha por qualquer outro motivo.
**Arquivos e objetos a tocar:** `src/hooks/useTrunkUsageReporter.ts`.
**Não tocar / armadilhas:** não faça a falha interromper a chamada.
**Depende de:** 070, 192 · **Libera:** 196
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** com erro simulado, o log registra em nível de erro com os identificadores, e a chamada segue.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 194 — Varrer os `catch` que escondem escrita, lote 1
**Onda / Severidade / Camada:** 5 / Média / Hooks
**Achados resolvidos:** A-053
**Problema hoje:** a medição encontrou **52** blocos `catch` envolvendo `insert/update/upsert/delete/rpc` sem `throw`, `toast.error`, `setError` nem `return false`. As etapas 189–193 cobrem os mais consequentes; restam os demais.
**Causa raiz:** idem.
**Caminho recomendado:** refaça a varredura para ter a lista atual e corrija em lotes de ~8 arquivos. Para cada um, a pergunta é: **se isto falhar, o usuário precisa saber?** Se sim, reporte; se não, deixe o log e **escreva o porquê no comentário** — assim a varredura seguinte não o acusa.
**Arquivos e objetos a tocar:** conforme a varredura.
**Não tocar / armadilhas:** não aplique o mesmo tratamento a todos. Um `catch` numa telemetria e um num salvamento de dado do cliente merecem respostas diferentes.
**Depende de:** 193 · **Libera:** 195
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** a lista do lote está vazia na varredura seguinte, ou cada remanescente tem comentário.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 195 — Varrer os `catch` que escondem escrita, lote 2
**Onda / Severidade / Camada:** 5 / Média / Hooks + Frontend
**Achados resolvidos:** A-053
**Problema hoje:** restante da lista da etapa 194, incluindo os que estão em componentes e não em hooks.
**Causa raiz:** idem.
**Caminho recomendado:** idem 194. Ao chegar em componentes, prefira **mover a escrita para um hook** em vez de tratar o erro no JSX — o repositório já segue essa separação na maioria dos casos, e misturar os dois é o que produz `toast.success` dentro de `catch` (A-054).
**Arquivos e objetos a tocar:** conforme a varredura.
**Não tocar / armadilhas:** mover escrita de componente para hook é refatoração — **só faça onde a etapa exige tratar o erro**, não como limpeza geral.
**Depende de:** 194 · **Libera:** 196
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** idem 194.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 196 — Criar o guard que impede a volta das gravações cegas
**Onda / Severidade / Camada:** 5 / Alta / CI
**Achados resolvidos:** A-052, A-053
**Problema hoje:** depois de corrigir 35 gravações cegas e 52 `catch` inúteis, **nada impede que a próxima PR reintroduza o padrão** — e ele é fácil de escrever sem perceber, porque o código parece correto.
**Causa raiz:** ausência de guard para um erro que o compilador não pega.
**Caminho recomendado:** escreva `scripts/guard-supabase-error.mjs --check`, no mesmo estilo de `scripts/guard-edge-numeric.mjs` (que já existe e é cobrado no CI). Ele acusa: (a) `await supabase…` cuja expressão não é desestruturada com `error`, sem comentário de dispensa; (b) `catch` contendo `toast.success`. Adicione um baseline **vazio** — e, se não der para zerar na primeira passada, um baseline mínimo com data de expiração escrita no arquivo, para não repetir a história da A-040. Plugue no `ci.yml` junto com os outros três guards.
**Arquivos e objetos a tocar:** novo `scripts/guard-supabase-error.mjs`; `.github/workflows/ci.yml`; `AGENTS.md` (registrar o guard).
**Não tocar / armadilhas:** o guard precisa de **baixa taxa de falso positivo**, senão vira o próximo `|| true`. Teste contra o repositório inteiro e ajuste até só acusar casos reais.
**Depende de:** 038, 080, 181–195 · **Libera:** —
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** **sim** (`.github/workflows/`).
**Como verificar:** `node scripts/guard-supabase-error.mjs --check` → exit 0 no estado corrigido; e exit 1 numa branch onde você reintroduz o padrão de propósito.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 197 — Parar de transformar erro de consulta em zero no painel de fila
**Onda / Severidade / Camada:** 5 / Alta / Hooks
**Achados resolvidos:** A-009
**Problema hoje:** `src/hooks/useQueueMetrics.ts:93-96` desestrutura **só `data`** em três consultas. Em falha de rede ou recusa de RLS o retorno é `data: null`, e o cálculo segue com `|| 0` — o painel mostra "0 chamadas ativas, 0 agentes", que parece dia calmo e é consulta falhando. **O painel não consegue ficar vermelho.**
**Causa raiz:** desestruturação parcial somada a default `|| 0`.
**Caminho recomendado:** desestruture `error` nas três; se qualquer uma falhar, **não calcule**: devolva um estado de erro que a tela exiba ("não foi possível carregar as métricas"). A distinção entre "zero" e "não sei" é a mesma das etapas 092–095, aqui no front. **Atalho a evitar:** trocar `|| 0` por `?? 0` — não muda nada no caso `null`.
**Arquivos e objetos a tocar:** `src/hooks/useQueueMetrics.ts`, a tela que o consome.
**Não tocar / armadilhas:** este hook também tem o poll de 5 s e o realtime sem debounce (A-105, etapa 244) — não misture as duas mudanças.
**Depende de:** 196 · **Libera:** 198
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** teste que mocka `error` → a tela mostra erro, **não** zeros.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 198 — Idem nos painéis de segurança
**Onda / Severidade / Camada:** 5 / Alta / Hooks
**Achados resolvidos:** A-009
**Problema hoje:** `src/hooks/useSecurityMonitoringData.ts:49,64` e `src/hooks/useSecurityDashboard.ts:51,54` descartam o `error` — então "0 eventos de segurança" pode ser tranquilidade ou cegueira. Num painel de segurança, essa ambiguidade é o pior caso possível.
**Causa raiz:** idem.
**Caminho recomendado:** idem 197. Aqui, vá além: quando a consulta falhar, o painel deve mostrar **estado de alarme de monitoramento** ("monitoramento indisponível"), não um estado neutro. Um painel de segurança que não sabe o que está acontecendo precisa dizer isso com destaque.
**Arquivos e objetos a tocar:** `src/hooks/useSecurityMonitoringData.ts`, `src/hooks/useSecurityDashboard.ts` e as telas.
**Não tocar / armadilhas:** `useSecurityMonitoringData` tem `usePageVisibility` integrado — preserve a pausa de realtime.
**Depende de:** 197 · **Libera:** 199
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** com erro simulado, o painel exibe "monitoramento indisponível" em destaque.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 199 — Idem na lista de IPs permitidos
**Onda / Severidade / Camada:** 5 / Média / Hooks
**Achados resolvidos:** A-009
**Problema hoje:** `src/hooks/useIPWhitelist.ts:48,51,54,61` — quatro consultas com o `error` descartado. Uma lista de IPs permitidos que aparece vazia por erro de consulta leva o admin a concluir que não há restrição configurada.
**Causa raiz:** idem.
**Caminho recomendado:** idem 197, com atenção especial ao estado vazio: "nenhum IP cadastrado" e "não foi possível carregar" precisam ser visualmente distintos nesta tela, porque a ação do admin é oposta em cada caso.
**Arquivos e objetos a tocar:** `src/hooks/useIPWhitelist.ts`, `src/pages/IpWhitelist.tsx`.
**Não tocar / armadilhas:** não confunda com `validate-ip` (a edge), que tem o problema de N+1 (etapa 249).
**Depende de:** 198 · **Libera:** 200
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** os dois estados aparecem diferentes na tela, com erro simulado e com tabela vazia.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 200 — Idem no ranking, nos scorecards e nos planos de sucesso
**Onda / Severidade / Camada:** 5 / Média / Hooks
**Achados resolvidos:** A-009
**Problema hoje:** `src/hooks/useAgentRanking.ts:165,166`, `src/hooks/useScorecards.ts:61` e `src/hooks/useSuccessPlans.ts:50` descartam o `error`. Ranking vazio por erro de consulta vira "nenhum agente produziu nada".
**Causa raiz:** idem.
**Caminho recomendado:** idem 197.
**Arquivos e objetos a tocar:** os três hooks e suas telas.
**Não tocar / armadilhas:** o ranking depende de `call_sessions`, que só tem dado depois da etapa 065 — distinga "sem chamadas no período" de "erro".
**Depende de:** 199 · **Libera:** 201
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** por tela, erro simulado produz mensagem de erro; tabela vazia produz estado vazio.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 201 — Varrer as consultas cegas restantes
**Onda / Severidade / Camada:** 5 / Média / Hooks
**Achados resolvidos:** A-009
**Problema hoje:** a medição encontrou **32** ocorrências do padrão `const { data: X } = await supabase…` em `src/hooks` (fora de testes); as etapas 197–200 cobrem as que viram número em tela.
**Causa raiz:** idem.
**Caminho recomendado:** refaça a varredura (comando em "Como verificar"), corrija o restante em 2 PRs, e **inclua esse padrão no guard da etapa 196** — ele é o mesmo erro de família e merece a mesma proteção.
**Arquivos e objetos a tocar:** conforme a varredura; `scripts/guard-supabase-error.mjs`.
**Não tocar / armadilhas:** há casos em que ignorar o erro de **leitura** é aceitável (um enriquecimento opcional da tela). Comente-os.
**Depende de:** 200 · **Libera:** 202
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** `grep -rn "const { data: [a-zA-Z]* } = await supabase" src/hooks/ | grep -v __tests__` → vazio ou só casos comentados.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 202 — Padronizar o estado de erro das telas
**Onda / Severidade / Camada:** 5 / Média / Frontend
**Achados resolvidos:** A-009
**Problema hoje:** depois das etapas 197–201, muitos hooks passam a devolver erro — e cada tela vai inventar a própria forma de exibi-lo, do jeito que já aconteceu com o contrato de erro das edges (A-130).
**Causa raiz:** ausência de componente padrão.
**Caminho recomendado:** verifique se já existe um componente de estado de erro no repositório (procure por `ErrorState`, `EmptyState`) — **se existir, use-o**; se não, crie um em `src/components/ui/` seguindo o estilo do shadcn já vendorizado, com três variantes: erro, vazio e sem permissão. Converta as telas das etapas 197–201 para ele. O ganho é consistência e um único lugar para melhorar a mensagem depois.
**Arquivos e objetos a tocar:** novo (ou existente) componente de estado; as telas das etapas anteriores.
**Não tocar / armadilhas:** não crie um segundo componente se já houver um — este repositório tem três validadores e dois dropdowns de notificação pela mesma razão.
**Depende de:** 201 · **Libera:** 203
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** as telas tocadas usam o mesmo componente, e `npx vitest run` continua verde.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 203 — Estados de carregamento e vazio nas telas de operação
**Onda / Severidade / Camada:** 5 / Média / Frontend
**Achados resolvidos:** A-009
**Problema hoje:** a varredura heurística de "estados ausentes" deu muito ruído, e só dois casos foram confirmados por leitura: `HoldTrendChart` (etapa 173) e `Status` (etapas 092–093). **Não presuma que os outros estão errados** — vários candidatos (`QueueStatus`, `Permissions`, `CapacityForecastChart`) se mostraram corretos.
**Causa raiz:** n/a — esta etapa é de verificação dirigida.
**Caminho recomendado:** percorra **as telas do fluxo central** (discador, chamadas, histórico, fila, ranking, executivo) e, em cada uma, confirme por leitura que os três estados existem. Corrija só o que faltar, usando o componente da etapa 202. **Registre no progresso quantas telas você conferiu e quantas estavam corretas** — esse número é informação útil para o dono.
**Arquivos e objetos a tocar:** conforme a conferência.
**Não tocar / armadilhas:** não "melhore" tela que já está correta.
**Depende de:** 202 · **Libera:** 204
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** lista das telas conferidas no progresso, com o veredito de cada uma.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 204 — Fazer o agente ficar offline ao fechar o navegador
**Onda / Severidade / Camada:** 5 / Alta / Hooks
**Achados resolvidos:** A-060
**Problema hoje:**
```ts
src/hooks/useAgentStatus.ts:112-130
const handleBeforeUnload = async () => {
  if (currentAgentId) {
    const { data: { session } } = await supabase.auth.getSession();   // await em beforeunload
    …
    fetch(url, { method: 'PATCH', …, keepalive: true }).catch(() => {});
  }
};
```
`beforeunload` é **síncrono**: a continuação depois do `await` não tem garantia de executar antes do descarregamento, então o `fetch` com `keepalive` — que seria o jeito certo — normalmente nunca é emitido. O `.catch(() => {})` apaga qualquer sinal. Quem fecha o navegador continua "disponível" no painel, e a fila manda chamada para um agente que não está lá.
**Causa raiz:** operação assíncrona num evento que não espera.
**Caminho recomendado:** elimine o `await`: guarde o token da sessão num `ref` atualizado a cada mudança de auth, e no `beforeunload` **dispare direto** o `fetch(..., { keepalive: true })` (ou `navigator.sendBeacon`, que foi feito exatamente para isso). Troque `visibilitychange` por complemento — alguns navegadores não disparam `beforeunload` em mobile. E **não engula o erro**: registre. Como nem isso é 100% confiável, a defesa real é do lado do servidor: um `last_seen` atualizado periodicamente e um job que marca offline quem sumiu — proponha isso ao dono como etapa seguinte.
**Arquivos e objetos a tocar:** `src/hooks/useAgentStatus.ts`.
**Não tocar / armadilhas:** `sendBeacon` só faz POST e não aceita cabeçalhos arbitrários — se o endpoint exigir `Authorization`, use `fetch` com `keepalive`.
**Depende de:** 117 · **Libera:** 205
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** abrir o sistema, ficar disponível, fechar a aba → `SELECT status, updated_at FROM agents WHERE id='<id>'` passa a `offline` em segundos.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 205 — Parar de engolir falha no agendamento de retorno ao cliente
**Onda / Severidade / Camada:** 5 / Alta / Hooks
**Achados resolvidos:** A-053
**Problema hoje:** `src/hooks/useScheduledCallbacks.ts:108,132,154,173,192` — **cinco** `catch` sobre escrita, sem reportar. Um retorno agendado que não foi gravado é um cliente que fica esperando uma ligação que ninguém vai fazer, e o agente acredita ter agendado.
**Causa raiz:** idem ao bloco da onda.
**Caminho recomendado:** idem 189, com prioridade: este é o hook em que a falha silenciosa custa diretamente ao cliente final. Além de reportar, **releia o registro após gravar** e mostre o agendamento confirmado com data e hora — confirmação visível vale mais que ausência de erro.
**Arquivos e objetos a tocar:** `src/hooks/useScheduledCallbacks.ts`, `src/components/callbacks/`.
**Não tocar / armadilhas:** a tela de callbacks tem botão-ícone sem rótulo (`ScheduledCallbacksList.tsx:326`) — é a etapa 272, não misture.
**Depende de:** 204 · **Libera:** 164
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** agendar com erro simulado → mensagem de falha e **nenhum** agendamento na lista; sem erro → agendamento confirmado com data visível.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 206 — Evitar a corrida entre "carregar mais" e troca de filtro no histórico
**Onda / Severidade / Camada:** 5 / Baixa / Hooks
**Achados resolvidos:** A-061
**Problema hoje:** `src/hooks/useCallHistory.ts:111-118` anexa ou substitui conforme a página, **sem flag de requisição vigente nem `AbortController`**: a resposta que chegar por último vence. Trocar `statusFilter`/`sentimentFilter` enquanto um `loadMore` está em voo faz a página 1 ser anexada à lista nova.
**Causa raiz:** ausência de controle de requisição concorrente. (A busca por texto está protegida por debounce em `CallHistory.tsx:39`, então o caso de digitação não ocorre.)
**Caminho recomendado:** guarde um `requestIdRef` incrementado a cada nova busca e, ao receber a resposta, **descarte** o resultado se o id não for o corrente. É mais simples que `AbortController` e funciona mesmo quando a requisição já voltou. Zere `page` e `sessions` ao trocar de filtro, no mesmo efeito.
**Arquivos e objetos a tocar:** `src/hooks/useCallHistory.ts`.
**Não tocar / armadilhas:** o efeito de `:77-81` tem deps suprimidas — ao mexer, **remova o `eslint-disable`** e veja o que o linter aponta.
**Depende de:** 205 · **Libera:** —
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** teste que dispara `loadMore` e troca o filtro antes da resposta → a lista final contém só itens do filtro novo.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 207 — Registrar a reordenação de favoritos só depois de persistir
**Onda / Severidade / Camada:** 5 / Baixa / Hooks
**Achados resolvidos:** A-063
**Problema hoje:** `src/hooks/useDialerFavorites.ts:202-215` grava o histórico **antes** de `reorderMutation.mutate`, ao contrário das irmãs (`:164-170`, `:118-124`), que gravam em `onSuccess`. O rollback visual existe (`:146-153`), mas a entrada de histórico fica — o histórico afirma uma reordenação que pode não ter sido salva. A mutação ainda é um `Promise.all` de N updates independentes (`:137-144`): falha no meio deixa posições parcialmente aplicadas.
**Causa raiz:** registro de auditoria fora do `onSuccess`, e atualização em lote sem atomicidade.
**Caminho recomendado:** mova `trackFavoriteChange` para o `onSuccess`, como as irmãs. Para a atomicidade, troque os N updates por **uma** RPC que recebe a lista de ids na ordem e atualiza tudo numa transação — mesmo raciocínio das etapas 079 e 126.
**Arquivos e objetos a tocar:** `src/hooks/useDialerFavorites.ts`; nova migration com a RPC.
**Não tocar / armadilhas:** não remova o rollback visual.
**Depende de:** 206 · **Libera:** —
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** **sim** se criar a RPC.
**Como verificar:** com erro simulado na mutação, **nenhuma** entrada de histórico é criada e a ordem volta ao estado anterior.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 208 — Criar o utilitário de `fetch` com prazo para as edges
**Onda / Severidade / Camada:** 5 / Média / Edge Function
**Achados resolvidos:** A-104
**Problema hoje:** **90 das 94** edges chamam `fetch` sem `AbortSignal`. Só `bitrix-api` e `voip-trunks-healthcheck:21` usam. E `_shared/resilience.ts:199` chama `fetch(input, init)` **sem `signal` padrão**, então o retry e o circuit breaker que existem não protegem contra pendurar. Quando o provedor de IA fica lento, a chamada do usuário fica pendurada até o limite da plataforma.
**Causa raiz:** nenhum wrapper impõe prazo, e o módulo de resiliência não o adiciona.
**Caminho recomendado:** adicione `timeoutMs` ao `fetch` de `_shared/resilience.ts:199` com `AbortSignal.timeout(ms)` e um default explícito (15 s para IA, 5 s para healthcheck) — assim toda edge que já usa o módulo ganha prazo **sem mudar**. Depois exporte `fetchComPrazo(url, init, ms)` para as que não usam. Trate o `AbortError` como erro de upstream (503), não como erro interno.
**Arquivos e objetos a tocar:** `supabase/functions/_shared/resilience.ts` + teste Deno.
**Não tocar / armadilhas:** `AbortSignal.timeout` existe no Deno moderno; confirme a versão antes. Se não houver, use `AbortController` com `setTimeout` e **limpe o timer** no `finally`, senão a função não encerra.
**Depende de:** 050 · **Libera:** 209, 210, 211
**Risco e como reverter:** baixo (arquivo compartilhado, mas com default conservador).
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** teste Deno com um servidor que não responde → a chamada rejeita em ~15 s com `AbortError`, não fica pendurada.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 209 — Prazo nas edges de IA
**Onda / Severidade / Camada:** 5 / Média / Edge Function
**Achados resolvidos:** A-104
**Problema hoje:** sem prazo: `auto-scorecard:81` (OpenRouter), `chatbot-respond:99`, `embed-kb-article:30`, `analyze-call`, `realtime-analysis`, `extract-crm-fields`, `generate-meeting-summary`, `voice-command`, `whatsapp-rewrite`, `generate-summary`, `generate-coaching`, `generate-coaching-plan`, `translate-utterance`, `score-call`, `voip-executive-narrative:127`. Das 22 edges que chamam IA, **15 não têm prazo, retry nem circuit breaker**, e `analyze-call` não trata 429.
**Causa raiz:** idem.
**Caminho recomendado:** passe as 15 a usar `fetchComPrazo` (ou o módulo de resiliência inteiro, que também dá retry com backoff e circuit breaker — `score-call` e `bitrix-api` já o usam e servem de referência). Trate **429** explicitamente: respeite o `Retry-After` quando vier, e devolva 503 ao cliente, nunca o status do terceiro (etapa 050). Faça em 3 PRs de 5 funções.
**Arquivos e objetos a tocar:** as 15 `index.ts` citadas.
**Não tocar / armadilhas:** retry em chamada de IA **custa dinheiro** — limite a 1 retentativa e só em erro transitório (5xx, timeout), nunca em 4xx.
**Depende de:** 208 · **Libera:** 212
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** por função, simular upstream lento → resposta 503 em até ~15 s, com log registrando o timeout.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 210 — Prazo nas edges de e-mail e de integração
**Onda / Severidade / Camada:** 5 / Média / Edge Function
**Achados resolvidos:** A-104
**Problema hoje:** `notify-blocked-ip:48`, `notify-new-device:52` (Resend), `teams-fetch-recordings`, `ocr-virtual-fax`, `elevenlabs-conversation-token`, `ldap-sync` chamam terceiros sem prazo.
**Causa raiz:** idem.
**Caminho recomendado:** idem 209, com prazo menor (5–8 s): envio de e-mail e busca de token não deveriam demorar. Em `ldap-sync`, cuidado adicional: conexão LDAP tem timeout próprio, e `LDAP_ALLOW_SELF_SIGNED` indica que já há configuração de TLS envolvida — não mexa nessa parte.
**Arquivos e objetos a tocar:** as 6 `index.ts` citadas.
**Não tocar / armadilhas:** não adicione retry em envio de e-mail sem idempotência — o cliente receberia duas vezes.
**Depende de:** 209 · **Libera:** 212
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** idem 209, por função.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 211 — Prazo e proteção na cadeia edge→edge
**Onda / Severidade / Camada:** 5 / Média / Edge Function
**Achados resolvidos:** A-104
**Problema hoje:** `voip-capacity-recommendations:156` chama **outra edge** (`fetch(forecastUrl, …)`) sem prazo, somando dois tempos de execução; `voip-diagnostic-voice-qa:142` e `voip-executive-narrative:127` fazem o mesmo. Uma cadeia de duas edges lentas estoura o limite da plataforma e o relatório simplesmente não volta.
**Causa raiz:** composição de serviços sem orçamento de tempo.
**Caminho recomendado:** defina um **orçamento de tempo** por requisição: a edge externa tem 20 s; a chamada interna recebe no máximo metade. Passe o prazo restante explicitamente. Melhor ainda, avalie se a chamada interna é necessária — duas edges que sempre andam juntas podem compartilhar um módulo em `_shared/` e virar uma chamada só, eliminando o salto de rede. Proponha, não imponha: é mudança de desenho.
**Arquivos e objetos a tocar:** as 3 `index.ts` citadas.
**Não tocar / armadilhas:** se unificar, cuidado com a autorização: a edge interna pode estar confiando em ser chamada só pela externa.
**Depende de:** 210 · **Libera:** 212
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** com a edge interna lenta, a externa responde dentro do orçamento com erro claro, em vez de estourar o limite.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 212 — Guard de CI para `fetch` sem prazo
**Onda / Severidade / Camada:** 5 / Média / CI
**Achados resolvidos:** A-104
**Problema hoje:** depois das etapas 208–211, nada impede que a próxima edge nasça com `fetch` sem prazo.
**Causa raiz:** ausência de guard.
**Caminho recomendado:** adicione a regra ao `scripts/audit-edge-functions.ts`, que já é rodado pelo CI: acuse `fetch(` sem `signal`/`AbortSignal` e sem passar pelo módulo de resiliência. Severidade `error`, **sem baseline** — você acabou de zerar o conjunto, e um baseline aqui recriaria o problema da A-040.
**Arquivos e objetos a tocar:** `scripts/audit-edge-functions.ts`.
**Não tocar / armadilhas:** não adicione ao baseline "só por enquanto".
**Depende de:** 209, 210, 211 · **Libera:** —
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** `bun scripts/audit-edge-functions.ts` → exit 0; adicionando um `fetch` sem prazo numa branch de teste → exit 1.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 213 — Padronizar o contrato de erro das edge functions
**Onda / Severidade / Camada:** 5 / Baixa / Edge Function
**Achados resolvidos:** A-130
**Problema hoje:** **79** arquivos devolvem `{ error }`; **6** devolvem `{ success: false, error }` (`wavoip-call:50`, `webauthn-*`); apenas **2** usam o envelope padronizado `{ code, message, fields }` de `_shared/validator.ts:17-31` (`analyze-call` e `whatsapp-inbound`). O status de validação varia entre 400 (`search-calls:22`) e 422 (`validator.ts:92`). Cada tela precisa de um tratamento próprio, e a mensagem some quando o formato não é o esperado.
**Causa raiz:** o envelope foi criado depois da maioria das funções, e a migração nunca aconteceu.
**Caminho recomendado:** adote o envelope de `_shared/validator.ts` em todas, com status fixos: 400 para corpo malformado, 422 para validação, 401/403 para autorização, 429 para limite, 503 para upstream, 500 para interno. Migre **junto com as etapas 047–050 e 208–211**, que já tocam essas funções — abrir uma PR só para o envelope multiplica o trabalho. No front, crie um `parseEdgeError(resp)` e use nos consumidores.
**Arquivos e objetos a tocar:** as edges, em lotes; novo `src/lib/edgeError.ts`.
**Não tocar / armadilhas:** mudar o formato **quebra o front** que lê `error` como string. Faça o `parseEdgeError` aceitar os dois formatos durante a transição.
**Depende de:** 050, 212 · **Libera:** —
**Risco e como reverter:** médio (contrato entre front e backend).
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** por função migrada, a resposta de erro tem `{ code, message }` e a tela exibe a mensagem corretamente.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 214 — Fazer a suíte de testes rodar sem configuração manual
**Onda / Severidade / Camada:** 5 / Baixa / Testes
**Achados resolvidos:** A-050
**Problema hoje:** `npx vitest run` → `Test Files 2 failed | 275 passed (277)`, `Tests 3289 passed`. Os dois que falham na **coleta** são `src/hooks/__tests__/useFinancialImpact.property.test.ts` e `src/lib/__tests__/executive-dashboard-utils.test.ts`, com `Error: Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY`. No CI os secrets existem; localmente, depois que o `.env` saiu do versionamento, a suíte não roda limpa — e **nada documenta isso**.
**Causa raiz:** o cliente do Supabase é instanciado em tempo de import e exige as variáveis, inclusive em teste.
**Caminho recomendado:** defina valores de teste em `src/test/setup.ts` (que já existe e é o `setupFiles` do vitest): se `import.meta.env.VITE_SUPABASE_URL` estiver ausente, preencha com um valor obviamente falso (`https://test.invalid`). Assim a suíte roda em qualquer máquina e **nunca** aponta para produção por engano. Documente em `AGENTS.md` na mesma PR.
**Arquivos e objetos a tocar:** `src/test/setup.ts`, `AGENTS.md`.
**Não tocar / armadilhas:** **não** coloque a URL real de produção no setup de teste — seria o caminho mais rápido para um teste escrever no banco de verdade.
**Depende de:** — · **Libera:** 215
**Risco e como reverter:** nenhum.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** num shell **sem** as variáveis, `npx vitest run` → `277 passed`, 0 arquivos falhando.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 215 — Retentativa com espera nas chamadas ao Bitrix
**Onda / Severidade / Camada:** 5 / Média / Frontend
**Achados resolvidos:** A-104
**Problema hoje:** o circuit breaker existe (`src/lib/bitrix/circuit-breaker.ts`, integrado em `useBitrix.callBitrixApi`), mas não há retentativa com espera progressiva para erro transitório nem tratamento explícito de 429 do Bitrix.
**Causa raiz:** resiliência implementada pela metade — o breaker evita insistir, mas nada tenta de novo quando faria sentido.
**Caminho recomendado:** adicione retentativa com espera crescente (3 tentativas, 1 s/2 s/4 s) **apenas** para erros transitórios (rede, 5xx, 429 com `Retry-After`), antes de o breaker abrir. Nunca retente operação de escrita sem idempotência — para `create_lead`, o caminho correto é a fila `crm_sync_queue` (etapas 082–084), não a retentativa.
**Arquivos e objetos a tocar:** `src/lib/bitrix/circuit-breaker.ts` ou um módulo de retry ao lado; `src/hooks/useBitrix.ts`.
**Não tocar / armadilhas:** não retente `create_lead` no cliente — duplicaria leads.
**Depende de:** 084, 214 · **Libera:** —
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** teste que devolve 503 duas vezes e sucesso na terceira → a operação conclui; com 429 e `Retry-After: 5`, a espera é respeitada.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 216 — Encerrar as assinaturas de realtime em todos os caminhos
**Onda / Severidade / Camada:** 5 / Baixa / Hooks
**Achados resolvidos:** A-105 (preparação)
**Problema hoje:** a varredura dos 38 arquivos com `.channel(` encontrou `removeChannel` no cleanup em **todos** — não há vazamento conhecido. Mas vários hooks combinam realtime com `setInterval`, e o intervalo nem sempre é limpo nos mesmos caminhos.
**Causa raiz:** n/a — esta etapa é de verificação dirigida e prevenção.
**Caminho recomendado:** confirme, hook a hook, que **todo** `setInterval`/`setTimeout` tem `clear` no cleanup e que o cleanup roda em todas as saídas (desmontagem, troca de dependência, erro). Onde encontrar um sem limpeza, corrija. **Registre no progresso quantos conferiu e quantos estavam certos** — se todos estiverem, isso é um resultado positivo que merece ser escrito.
**Arquivos e objetos a tocar:** conforme a conferência.
**Não tocar / armadilhas:** não "melhore" cleanup que já está correto.
**Depende de:** — · **Libera:** 244
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** lista no progresso; e um teste que monta/desmonta um hook de realtime 50 vezes sem crescer o número de canais.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 217 — Remover os `eslint-disable` de dependências de efeito, um a um
**Onda / Severidade / Camada:** 5 / Média / Hooks
**Achados resolvidos:** A-004, A-061
**Problema hoje:** existem **43** ocorrências de `// eslint-disable-next-line react-hooks/exhaustive-deps`. O linter varreu os erros de dependência comuns, então **é exatamente atrás desses 43 que moram os bugs vivos** — dois já estão documentados: `useSipCall.ts:300` (closure obsoleta que produz id nulo, A-004) e `useCallHistory.ts:77-81` (corrida de filtro, A-061).
**Causa raiz:** supressão usada como solução para dependência que causaria loop.
**Caminho recomendado:** um por PR, começando pelos do fluxo de chamada. Para cada: remova a supressão, veja o que o linter aponta, e resolva **a causa** — geralmente usando `useRef` para valor que não deve disparar re-execução, ou `useCallback` estável para função. Se a supressão for mesmo necessária, **deixe um comentário explicando por quê** logo acima; uma supressão justificada é aceitável, uma silenciosa não.
**Arquivos e objetos a tocar:** um hook por PR.
**Não tocar / armadilhas:** não remova as 43 de uma vez. Cada uma pode mudar o comportamento de um efeito, e você não vai conseguir atribuir a regressão.
**Depende de:** 070, 206 · **Libera:** —
**Risco e como reverter:** médio por item. Reverter: `git revert` da PR específica.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** por PR, `npx eslint <arquivo>` sem a supressão → 0 problemas; e o teste do hook continua verde.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 218 — Proteger as ações de escrita contra duplo clique
**Onda / Severidade / Camada:** 5 / Média / Frontend
**Achados resolvidos:** A-057 (classe)
**Problema hoje:** a medição encontrou **49 de 241** arquivos com `<Button>` aplicando `disabled` durante a operação. Os demais não foram verificados um a um, mas o padrão de duplo clique criando registro duplicado é real — e, com a chamada passando a ser gravada (etapa 058), ele fica caro.
**Causa raiz:** ausência de convenção.
**Caminho recomendado:** não varra os 241. Vá pelas **ações que gravam**: criar contato, criar lead, agendar retorno, importar DNC, salvar configurações, iniciar chamada. Em cada uma, `disabled={isPending}` com indicador visual. Onde a mutação usa React Query, `isPending` já existe; onde não usa, um `useState` local basta. **Atalho a evitar:** debounce no clique — esconde o problema e atrapalha quem clica rápido de propósito.
**Arquivos e objetos a tocar:** os componentes das ações listadas.
**Não tocar / armadilhas:** a proteção de interface **não substitui** a atomicidade no banco (etapas 079, 126) — é a segunda linha, não a primeira.
**Depende de:** 217 · **Libera:** —
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** por ação, clicar duas vezes rápido → **um** registro criado.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 219 — Invalidação de cache após as mutações principais
**Onda / Severidade / Camada:** 5 / Média / Hooks
**Achados resolvidos:** A-064 (classe)
**Problema hoje:** o caso confirmado é `useAnomalyRemediation` (etapa 176). O padrão — mutação que não invalida a query que ela altera — pode existir em outros hooks, e o sintoma (tela desatualizada, usuário repete a ação) é sempre o mesmo.
**Causa raiz:** `onSuccess` sem `invalidateQueries`.
**Caminho recomendado:** varra os hooks que usam `useMutation` e confira se cada um invalida a query correspondente. Corrija os que faltarem. **Não invalide demais**: invalidar uma chave muito ampla recarrega telas inteiras e piora o problema da etapa 244. Invalide a chave específica.
**Arquivos e objetos a tocar:** conforme a varredura.
**Não tocar / armadilhas:** onde houver atualização otimista, a invalidação deve vir no `onSettled`, não no `onSuccess`, para o rollback funcionar.
**Depende de:** 176, 218 · **Libera:** —
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** por mutação corrigida, a lista reflete a mudança **sem** recarregar a página.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 220 — Rollback nas atualizações otimistas
**Onda / Severidade / Camada:** 5 / Média / Hooks
**Achados resolvidos:** A-064 (classe)
**Problema hoje:** `useDialerFavorites` tem rollback (`:146-153`) e serve de referência. A varredura não confirmou outros casos de atualização otimista **sem** rollback, mas o padrão merece conferência dirigida, porque a falha é invisível: a tela mostra o estado novo e o banco tem o antigo.
**Causa raiz:** n/a — verificação dirigida.
**Caminho recomendado:** liste os hooks que fazem `setQueryData` antes da mutação e confirme que cada um tem `onError` restaurando o estado anterior. Corrija os que faltarem, seguindo `useDialerFavorites`. Registre no progresso quantos conferiu.
**Arquivos e objetos a tocar:** conforme a conferência.
**Não tocar / armadilhas:** rollback precisa guardar o valor **anterior** no `onMutate` — restaurar por refetch é mais lento e pode trazer estado intermediário.
**Depende de:** 219 · **Libera:** —
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** por hook, com erro simulado, a interface volta ao estado anterior.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 221 — Incluir a chave de filtro em todas as `queryKey`
**Onda / Severidade / Camada:** 5 / Média / Hooks
**Achados resolvidos:** A-064 (classe)
**Problema hoje:** `useVoipAnomalies.ts:51` usa `['voip-anomalies', periodHours]` — correto. O risco é o oposto: uma `queryKey` que **não** inclui todos os parâmetros do filtro serve dado de um filtro para outro, e o usuário vê números errados sem nenhum sinal.
**Causa raiz:** chave de cache incompleta.
**Caminho recomendado:** varra os `useQuery` e confirme que cada chave contém **todos** os parâmetros que mudam o resultado (período, papel, agente, status). Corrija os que faltarem. Este é um erro que não aparece em teste unitário e aparece imediatamente em uso real — vale a conferência manual.
**Arquivos e objetos a tocar:** conforme a varredura.
**Não tocar / armadilhas:** incluir objeto não estável na chave (um `{}` recriado a cada render) causa refetch infinito. Use valores primitivos ou memoize.
**Depende de:** 220 · **Libera:** —
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** trocar o filtro e voltar → os números correspondem ao filtro atual, não ao anterior.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 222 — Tratar sessão expirada sem perder o que o usuário digitou
**Onda / Severidade / Camada:** 5 / Média / Frontend
**Achados resolvidos:** A-009 (classe)
**Problema hoje:** quando a sessão expira no meio de uma edição, a consulta seguinte falha e — pelas correções das etapas 197–201 — a tela passa a mostrar erro. O usuário perde o que digitou, e o erro não diz que o problema é a sessão.
**Causa raiz:** erro de autenticação tratado como erro genérico.
**Caminho recomendado:** em `parseEdgeError` (etapa 213) e no tratamento de erro do cliente Supabase, **distinga 401/JWT expirado** e trate-o num ponto único: tente renovar a sessão; se não conseguir, mostre um diálogo de "sua sessão expirou, entre novamente" **preservando o formulário** (guarde o rascunho em memória, não em `localStorage`, se houver dado de cliente). Só depois redirecione.
**Arquivos e objetos a tocar:** `src/lib/edgeError.ts`, `src/contexts/AuthContext.tsx`, o componente de diálogo.
**Não tocar / armadilhas:** não redirecione para `/login` direto do interceptor — é o comportamento que faz o usuário perder trabalho.
**Depende de:** 213, 221 · **Libera:** —
**Risco e como reverter:** médio (toca o fluxo de autenticação).
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** com a sessão invalidada no meio de uma edição, o diálogo aparece e, após novo login, o formulário continua preenchido.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 223 — Sincronizar o fim de sessão entre abas
**Onda / Severidade / Camada:** 5 / Baixa / Hooks
**Achados resolvidos:** A-009 (classe)
**Problema hoje:** não há escuta de `onAuthStateChange` sincronizando abas no caminho de rota — sair em uma aba deixa a outra aparentemente autenticada até a próxima consulta falhar.
**Causa raiz:** estado de autenticação por aba.
**Caminho recomendado:** escute `supabase.auth.onAuthStateChange` no `AuthContext` e reaja a `SIGNED_OUT` limpando o estado e redirecionando. O cliente do Supabase já propaga o evento entre abas pelo armazenamento — não implemente sincronização própria.
**Arquivos e objetos a tocar:** `src/contexts/AuthContext.tsx`, `src/hooks/useAuth.ts`.
**Não tocar / armadilhas:** o evento também dispara em renovação de token; reaja **só** a `SIGNED_OUT`, senão a aba se desloga sozinha ao renovar.
**Depende de:** 222 · **Libera:** —
**Risco e como reverter:** médio (fluxo de autenticação).
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** duas abas abertas, sair em uma → a outra volta ao login em segundos.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 224 — Teste de concorrência para o claim do discador
**Onda / Severidade / Camada:** 5 / Alta / Testes
**Achados resolvidos:** A-057
**Problema hoje:** a etapa 079 corrige a reivindicação do contato com `FOR UPDATE SKIP LOCKED`, mas **nada no CI impede que alguém volte ao read-then-write** — e o sintoma (mesmo cliente ligado duas vezes) só aparece em produção.
**Causa raiz:** ausência de teste de concorrência.
**Caminho recomendado:** no Postgres descartável da etapa 053, escreva um teste que dispara N chamadas concorrentes de `claim_next_dialer_contact` sobre uma fila de N contatos e afirma que **cada contato foi reivindicado exatamente uma vez**. É o único tipo de teste que prova atomicidade; um teste com mock não prova nada aqui.
**Arquivos e objetos a tocar:** novo `tests/rls/` ou `tests/db/claim_concurrency.test.ts`; `.github/workflows/ci.yml`.
**Não tocar / armadilhas:** o teste precisa de conexões **distintas** para haver concorrência real — um pool com uma conexão serializaria tudo e o teste passaria sempre.
**Depende de:** 053, 079 · **Libera:** —
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** **sim** (`.github/workflows/`).
**Como verificar:** o teste passa com a RPC e **falha** se você restaurar o `apiMarkDialing` antigo numa branch de teste.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 225 — Teste de lock otimista contra o banco
**Onda / Severidade / Camada:** 5 / Média / Testes
**Achados resolvidos:** A-058, A-048
**Problema hoje:** `src/hooks/__tests__/useDeals.conflict.test.ts:32-50` passa porque **mocka** o banco devolvendo o conflito para um update que, na prática, nunca o provoca. O teste existe, é verde, e não protege nada.
**Causa raiz:** teste escrito contra o mock, não contra o gatilho.
**Caminho recomendado:** no Postgres descartável, teste o gatilho de verdade: insira uma linha, leia a `version`, faça dois updates com a mesma `version` e afirme que o segundo levanta `OPTIMISTIC_LOCK_CONFLICT`. Depois, afirme também o caso que causou o problema: update **sem** enviar `version` **não** levanta — documentando no teste que essa é a razão pela qual o cliente precisa enviá-la.
**Arquivos e objetos a tocar:** novo teste em `tests/db/`; `src/hooks/__tests__/useDeals.conflict.test.ts` (ajustar ou remover).
**Não tocar / armadilhas:** não apague o teste antigo antes de o novo estar verde.
**Depende de:** 053, 110, 224 · **Libera:** —
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** o teste novo passa; removendo o gatilho numa branch de teste, ele falha.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 226 — Fazer o `webhook-handler` processar o evento que ele valida
**Onda / Severidade / Camada:** 5 / Média / Edge Function
**Achados resolvidos:** A-073
**Problema hoje:** `supabase/functions/webhook-handler/index.ts` **valida o HMAC corretamente** — é a referência de assinatura do repositório, usada nas etapas 013–014 — e depois **descarta o evento**: `:71` só faz `console.log`. A segurança está certa e o efeito não existe.
**Causa raiz:** handler criado como esqueleto, com a parte difícil (assinatura) feita e a fácil (processar) não.
**Caminho recomendado:** descubra primeiro **que eventos chegam aqui** (leia os logs da função, ou pergunte ao dono qual integração aponta para ela). Sem isso você implementaria um processamento inventado. Depois, grave o evento numa tabela de entrada e processe de forma idempotente, no padrão de `security-alerts-webhook-queue` (que o item B5 das pendências cita como a referência de fila com chave de idempotência). Se a resposta for "nenhuma integração usa", então a função é código morto e a etapa vira remoção.
**Arquivos e objetos a tocar:** `supabase/functions/webhook-handler/index.ts`; possivelmente nova migration de tabela de entrada.
**Não tocar / armadilhas:** não mexa na validação de HMAC — ela é a parte boa, e as etapas 013/014 a reutilizam.
**Depende de:** 013 · **Libera:** 227
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** **sim** se criar tabela.
**Como verificar:** um evento de teste assinado corretamente → linha gravada; o mesmo evento reenviado → nenhuma linha nova.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 227 — Fila de retentativa para os webhooks de entrada
**Onda / Severidade / Camada:** 5 / Média / Edge Function
**Achados resolvidos:** A-074
**Problema hoje:** quando o processamento de um webhook falha por motivo transitório (banco indisponível, IA fora), a função devolve 5xx e **depende do provedor reentregar** — o que, no caso de `email-inbound`, produzia o laço de 500 da etapa 015. Não há fila própria para os de entrada (só para os de saída, `security-alerts-webhook-queue`).
**Causa raiz:** confiança na política de reentrega de terceiros.
**Caminho recomendado:** inverta a responsabilidade: a função **aceita** (200), grava o payload cru numa tabela de entrada com `status: 'pending'` e chave de idempotência, e um cron processa. Assim o provedor nunca reentrega, a ordem é preservada e uma falha de processamento não vira laço. Aplique a `whatsapp-inbound` e `email-inbound`. **Atalho a evitar:** processar na hora e devolver 200 mesmo em falha — você perderia a mensagem silenciosamente, que é pior que o laço.
**Arquivos e objetos a tocar:** nova migration com a tabela de entrada e o cron; `whatsapp-inbound/index.ts`, `email-inbound/index.ts`; nova edge de processamento.
**Não tocar / armadilhas:** a tabela de entrada guarda payload de cliente — **precisa de RLS restritiva** desde a criação, e retenção definida (não guarde payload cru para sempre).
**Depende de:** 015, 226 · **Libera:** 232
**Risco e como reverter:** médio (muda o caminho de entrada das mensagens).
**Precisa de aprovação humana antes do merge:** **sim** (DDL + arquitetura de entrada).
**Como verificar:** com o processamento falhando de propósito, a mensagem fica `pending` e é processada depois; o provedor recebe 200 na primeira tentativa.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 228 — Unificar e proteger a consulta de geolocalização (servidor e navegador)
**Onda / Severidade / Camada:** 5 / Média / Edge Function + Frontend
**Achados resolvidos:** A-104, A-135
**Problema hoje:** `supabase/functions/validate-geo/index.ts:73` chama `http://ip-api.com/json/${clientIp}?fields=…` — **sem TLS** e sem prazo. A resposta que decide se o login é permitido viaja em claro e pode ser alterada no caminho; e se o provedor travar, a tela de login pendura. (Não há SSRF aqui: `clientIp` é validado como literal em `_shared/client-ip.ts:6-14`.)
**Causa raiz:** o plano gratuito do `ip-api.com` não oferece HTTPS.
**Caminho recomendado:** não dá para só trocar o esquema — o provedor gratuito não aceita. Três saídas, em ordem de preferência: (1) usar o país que o **próprio provedor de borda** já informa (Vercel envia `x-vercel-ip-country`; Cloudflare, `cf-ipcountry`) — é grátis, confiável e não tem salto de rede; (2) assinar um provedor com HTTPS; (3) manter o atual **com prazo** e tratar falha como "não sei" (que, pela etapa 142, tem comportamento definido). Verifique a opção (1) primeiro: ela provavelmente resolve sem custo.
**Além disso (A-135):** medido em navegador em 2026-11-23 — `/login` e `/dashboard` disparam `GET https://ipapi.co/json/` **do navegador do usuário**. São **dois provedores de geolocalização diferentes** para a mesma pergunta (este no cliente, `ip-api.com` no servidor), e o do cliente envia o **IP de toda pessoa que abre a tela de login** para um terceiro não declarado — implicação de LGPD, e um ponto de falha externo no caminho de entrada. Remova a chamada do cliente: se a informação é necessária, ela vem da mesma fonte do servidor, pela edge já autenticada. Confirme o que o front faz com a resposta antes de remover (pode estar alimentando o bloqueio geográfico ou um registro de acesso).
**Arquivos e objetos a tocar:** `supabase/functions/validate-geo/index.ts`; o ponto do front que chama `ipapi.co` (`grep -rn "ipapi" src/`).
**Não tocar / armadilhas:** o cabeçalho do provedor de borda **só existe** se a requisição passar por ele — uma chamada direta à edge do Supabase não tem. Trate a ausência.
**Depende de:** 142, 208 · **Libera:** —
**Risco e como reverter:** médio (decide acesso).
**Precisa de aprovação humana antes do merge:** não (a menos que envolva assinatura paga).
**Como verificar:** chamada de teste → o país é determinado sem a requisição em HTTP; com o provedor fora, o resultado é o definido na etapa 142.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 229 — Identificador de correlação de ponta a ponta
**Onda / Severidade / Camada:** 5 / Média / Edge Function + Frontend
**Achados resolvidos:** A-128
**Problema hoje:** a etapa 050 passa a devolver `correlation_id` nos erros, mas **não há nada que ligue** a requisição do front ao log da edge e ao erro do banco. Quando o dono relata "deu erro ao salvar", ninguém consegue achar o log correspondente. O `_shared/cors.ts:22` já aceita `x-request-id`, `x-correlation-id` e `x-trace-id` nos cabeçalhos — a infraestrutura está metade pronta.
**Causa raiz:** cabeçalhos aceitos e nunca usados.
**Caminho recomendado:** gere um id no front por ação do usuário (não por requisição — uma ação pode fazer várias chamadas), envie em `x-correlation-id` em toda invocação de edge, e registre-o em **todo** log da edge. Guarde-o também em `audit_logs` quando a ação for auditável. Com isso, uma reclamação do dono vira uma busca de uma linha. `src/lib/tracing.ts` já existe — leia antes de criar outro mecanismo.
**Arquivos e objetos a tocar:** `src/lib/tracing.ts`, o cliente de invocação de edges, `_shared/errors.ts`.
**Não tocar / armadilhas:** não coloque dado de cliente no id. Um UUID basta.
**Depende de:** 050, 213 · **Libera:** 230
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** provocar um erro no front → o `correlation_id` exibido aparece no log da edge correspondente.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 230 — Registrar os erros do navegador em algum lugar
**Onda / Severidade / Camada:** 5 / Média / Frontend
**Achados resolvidos:** A-097
**Problema hoje:** `.env.example:57-60` documenta `SENTRY_DSN` e `DD_API_KEY`, e **nenhum dos dois existe** no código (verificado com `git grep`: 0 ocorrências cada). Ou seja: o projeto parece ter monitoramento de erro de front e não tem. Um erro de JavaScript que quebre uma tela para um agente **não deixa rastro nenhum**.
**Causa raiz:** variáveis herdadas de um boilerplate, sem implementação.
**Caminho recomendado:** duas opções, e a segunda é suficiente para começar: (1) integrar um serviço (tem custo e precisa de decisão do dono); (2) **gravar no próprio banco** — uma tabela `client_errors` com RLS de inserção para autenticados, alimentada por um `window.onerror` + `onunhandledrejection` que registra mensagem, rota, papel e `correlation_id` (etapa 229), com limite de taxa no cliente para não inundar. A opção (2) usa o que já existe e dá visibilidade imediata. Depois, remova `SENTRY_DSN`/`DD_API_KEY` do `.env.example` (etapa 291) para o arquivo parar de prometer.
**Arquivos e objetos a tocar:** novo `src/lib/errorReporter.ts`; `src/main.tsx`; nova migration com a tabela.
**Não tocar / armadilhas:** não registre o stack inteiro com dado de cliente dentro. Limite o tamanho e **nunca** registre conteúdo de formulário.
**Depende de:** 229 · **Libera:** 231
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** **sim** (DDL em produção).
**Como verificar:** provocar um erro de JavaScript numa tela → linha em `client_errors` com rota e `correlation_id`.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 231 — Avisar quando um cron falha
**Onda / Severidade / Camada:** 5 / Alta / Banco
**Achados resolvidos:** A-133
**Problema hoje:** `inventario/estado/banco.json` (2026-11-20) registra `data-lake-flush-daily` com **100% de falha em 7 dias** (6 de 6, de 15/11 a 20/11) e emite os alertas `cron_falhando` e `cron_parado`. Esse alerta existe **só no snapshot semanal** — ninguém é avisado quando acontece. O histórico do repositório mostra que isso já custou caro duas vezes: a purga de locks ficou anos em 401 (`config.toml:1-8`) e este cron falhou 6 dias seguidos por `schema "net" does not exist`.
**Causa raiz:** `pg_cron` registra falha em `cron.job_run_details` e nada lê essa tabela em tempo útil.
**Caminho recomendado:** crie um cron de vigilância (a cada hora) que consulta `cron.job_run_details` das últimas 2 horas e, se algum job tiver falhado, insere em `notifications` para os admins (ou chama a edge de notificação, depois da etapa 011). **Inclua o próprio vigilante na checagem de outra forma** — um vigia que para de rodar não se avisa: compare também a hora da última execução de cada job com o schedule esperado, para detectar job **parado**, não só job que falha. Foi exatamente o caso de 15 a 20/11.
**Arquivos e objetos a tocar:** nova migration com a função de vigilância e o cron.
**Não tocar / armadilhas:** `cron.job_run_details` cresce — o snapshot mostra 166 linhas e 155 kB. Inclua retenção na mesma migration.
**Depende de:** 011, 230 · **Libera:** 232
**Risco e como reverter:** baixo. Reverter: `cron.unschedule`.
**Precisa de aprovação humana antes do merge:** **sim** (DDL em produção).
**Como verificar:** desative temporariamente um cron de teste, espere a janela, e confirme que a notificação chegou. E `SELECT jobname, status, start_time FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20` para conferir o estado atual de todos.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 232 — Vigiar as filas que podem encher
**Onda / Severidade / Camada:** 5 / Média / Banco
**Achados resolvidos:** A-066, A-074
**Problema hoje:** depois das etapas 083 e 227 o sistema passa a ter filas (`crm_sync_queue`, a tabela de entrada de webhooks, `optimistic_lock_conflicts`). Fila sem vigilância é a próxima A-133: enche em silêncio e alguém descobre semanas depois.
**Causa raiz:** n/a — prevenção derivada do padrão observado.
**Caminho recomendado:** estenda o vigilante da etapa 231 para checar, por fila: quantidade de itens `pending`, idade do item mais antigo, e itens com muitas tentativas. Limiares conservadores (ex.: mais de 100 pendentes, ou item com mais de 1 hora) geram notificação. **Reuse o vigilante** — não crie um segundo cron por fila.
**Arquivos e objetos a tocar:** a migration da etapa 231 (estendida) ou uma nova.
**Não tocar / armadilhas:** limiar baixo demais gera ruído e o alerta vira ignorado — é o mecanismo da A-107. Comece conservador e ajuste com dado real.
**Depende de:** 083, 227, 231 · **Libera:** —
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** **sim** (DDL em produção).
**Como verificar:** inserir 101 itens `pending` numa fila de teste → notificação gerada na próxima execução.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 233 — Estados de falha visíveis no softphone
**Onda / Severidade / Camada:** 5 / Alta / Frontend
**Achados resolvidos:** A-009 (classe)
**Problema hoje:** o softphone é a tela em que o agente passa o turno, e os caminhos de falha mais importantes — registro SIP perdido, microfone negado, tronco indisponível, rede caindo no meio da chamada — não têm tratamento visível verificado. Com o canal default mudando para `sip` (etapa 100), o estado do registro passa a ser a informação mais importante da tela.
**Causa raiz:** o estado de conexão existe em `useSipCall` e não é exposto com destaque.
**Caminho recomendado:** mostre o estado do registro SIP de forma permanente e inequívoca (registrado / registrando / falha, com o motivo), e trate explicitamente: permissão de microfone negada (com instrução de como conceder), registro perdido (com tentativa automática e botão de tentar agora), chamada caindo (aviso, não silêncio). Use o componente de estado da etapa 202 onde couber. **Esta é a etapa de maior retorno percebido pelo agente** em toda a onda.
**Arquivos e objetos a tocar:** `src/components/calls/UnifiedSoftphone.tsx`, `src/hooks/useSipCall.ts` (só exposição de estado).
**Não tocar / armadilhas:** **não reescreva `useSipCall`** — exponha o que ele já sabe. É o único pedaço de telefonia real do produto.
**Depende de:** 100, 202 · **Libera:** —
**Risco e como reverter:** médio (tela principal do agente).
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** negar a permissão de microfone → mensagem com instrução; desligar a rede → aviso de registro perdido e nova tentativa automática.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 234 — Teste de resiliência das edges contra upstream fora do ar
**Onda / Severidade / Camada:** 5 / Média / Testes
**Achados resolvidos:** A-104
**Problema hoje:** depois das etapas 208–212 as edges têm prazo, mas nada no CI prova que elas **se comportam bem** quando o terceiro falha.
**Causa raiz:** ausência de teste de falha de dependência.
**Caminho recomendado:** para as 5 edges mais críticas (`auto-scorecard`, `chatbot-respond`, `analyze-call`, `notify-new-device`, `bitrix-api`), escreva testes Deno que injetam um `fetch` falso devolvendo: timeout, 429 com `Retry-After`, 500, e corpo inválido. Afirme o status devolvido e que **nada foi gravado pela metade**. O repositório já tem 33 arquivos de teste Deno — siga o estilo deles.
**Arquivos e objetos a tocar:** novos testes em `supabase/functions/*/__tests__/`.
**Não tocar / armadilhas:** injetar `fetch` global em teste Deno exige restaurar no `finally`, senão os testes seguintes herdam o mock.
**Depende de:** 212 · **Libera:** —
**Risco e como reverter:** nenhum.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** `deno test -A supabase/functions/` → todos passam, incluindo os novos.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 235 — Fechar a onda 5 com um levantamento do que o sistema passou a reportar
**Onda / Severidade / Camada:** 5 / Média / Documentação
**Achados resolvidos:** consolida A-052 a A-064, A-104
**Problema hoje:** a onda 5 muda o sistema de "silencioso" para "falante". O dono vai começar a ver erros que antes não existiam na tela — e precisa saber que **isso é a correção**, não uma piora.
**Causa raiz:** n/a — controle de execução e comunicação.
**Caminho recomendado:** escreva `docs/qa/06-ONDA5-FECHAMENTO.md` com: (a) o que passou a ser reportado ao usuário que antes era silencioso (lista por tela); (b) os guards novos no CI e o que cada um impede; (c) onde o sistema agora avisa sozinho (cron falhando, fila cheia, erro de navegador). Uma linha por item, em linguagem de negócio. **Avise explicitamente** que um aumento no número de mensagens de erro na primeira semana é esperado e desejável.
**Arquivos e objetos a tocar:** novo `docs/qa/06-ONDA5-FECHAMENTO.md`.
**Não tocar / armadilhas:** não minimize o número de erros que vão aparecer. Se aparecerem muitos, é informação sobre o estado real do sistema.
**Depende de:** 181–234 · **Libera:** 236
**Risco e como reverter:** nenhum.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** o documento cobre as etapas 181 a 234.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

---

# ONDA 6 — Performance (236–258)

> **Nota de método.** O banco tem 26 MB, 341 linhas nas seis maiores tabelas de log e **zero chamadas nos últimos 7 dias** (`inventario/estado/banco.json`). Nenhum problema desta onda dói **hoje**; todos doem no primeiro mês de operação real. Por isso ela vem depois da 1–5, e por isso cada etapa traz o gatilho que a torna urgente.

## Etapa 236 — Paginação nas listagens do histórico e das gravações
**Onda / Severidade / Camada:** 6 / Alta / Hooks
**Achados resolvidos:** A-102
**Problema hoje:** **66 dos 99 hooks** que leem o banco não têm `.limit()` nem `.range()` (medição própria). As listagens de maior volume futuro são as de chamada: `useActiveCallsRealtime.ts:35,40` faz `select('*')` em `call_sessions` e `hold_events` sem limite nenhum.
**Causa raiz:** consultas escritas quando a base estava vazia.
**Caminho recomendado:** comece por `call_sessions`, `call_transcriptions`, `call_recordings` e `hold_events` — as que crescem por chamada. Use `.range(from, to)` com tamanho de página de 50 e `count: 'exact'` só quando a tela mostrar o total (ele custa uma varredura). Para a lista de chamadas **ativas**, o limite natural é pequeno (dezenas) — `.limit(200)` como teto de segurança basta, com log se bater no teto.
**Arquivos e objetos a tocar:** `src/hooks/useActiveCallsRealtime.ts`, `src/hooks/useCallHistory.ts`, `src/hooks/useCallRecording.ts` e as telas.
**Não tocar / armadilhas:** o PostgREST tem limite próprio de linhas por resposta — sem `range`, a resposta vem **truncada silenciosamente**, o que é pior que lenta: a tela mostra dado incompleto como se fosse completo.
**Depende de:** 235 · **Libera:** 237
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** com 500 chamadas de teste, a tela carrega a primeira página rapidamente e "carregar mais" traz as seguintes.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 237 — Paginação nas listagens de contatos, negócios e contas
**Onda / Severidade / Camada:** 6 / Média / Hooks
**Achados resolvidos:** A-102
**Problema hoje:** `useAccounts`, `useContacts`, `useDeals` e `useCadences` leem sem limite.
**Causa raiz:** idem.
**Caminho recomendado:** idem 236. Aqui a busca por texto importa: existem índices trigram em `call_sessions.caller_name/phone/agent_name` (item B3 das pendências) — **confira se contatos têm equivalente** antes de ligar busca por substring numa tabela grande; se não tiverem, anote para a etapa 243.
**Arquivos e objetos a tocar:** os quatro hooks e suas telas.
**Não tocar / armadilhas:** paginação sem ordenação estável produz itens repetidos entre páginas. Ordene sempre por uma coluna única (ou por `created_at, id`).
**Depende de:** 236 · **Libera:** 238
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** navegar três páginas e voltar → nenhum item repetido nem faltando.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 238 — Paginação nas listagens administrativas e de auditoria
**Onda / Severidade / Camada:** 6 / Média / Hooks
**Achados resolvidos:** A-102
**Problema hoje:** limites altos em vez de paginação: `useWebhookHealthData.ts:27` (`.limit(10000)`), `useSecurityAlertNotifications.ts:103` (`5000`), `RoleAuditTrail.tsx:168` (`5000`), `AgentQualityRanking.tsx:47,55` (`5000` cada), `useSLA.ts:48` (`2000`), `useOptimisticLockConflicts.ts:45` (`1000`), `SecurityAuditDashboard.tsx:84` (`1000`).
**Causa raiz:** limite alto usado como substituto de paginação.
**Caminho recomendado:** troque por `.range()` com página de 50–100 e, onde a tela só precisa de um agregado (contagem, média), **faça o agregado no banco** com uma RPC em vez de trazer 5.000 linhas para somar no navegador. `AgentQualityRanking` é o caso mais claro: ele traz 10.000 linhas para calcular médias por agente — uma consulta com `GROUP BY` resolve com uma fração do tráfego.
**Arquivos e objetos a tocar:** os hooks e componentes citados; possivelmente novas RPCs de agregação.
**Não tocar / armadilhas:** mover agregação para RPC exige `SECURITY DEFINER` com `REVOKE` de `anon` e cuidado com a volatilidade (etapa 101).
**Depende de:** 237 · **Libera:** 239
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** **sim** se criar RPC.
**Como verificar:** por tela, o volume transferido cai (aba de rede do navegador) e o número exibido continua igual.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 239 — Agregar no banco as métricas de insights de contato
**Onda / Severidade / Camada:** 6 / Baixa / Hooks
**Achados resolvidos:** A-102
**Problema hoje:** `src/hooks/useContactInsights.ts:59-64` faz `select('*')` em `contact_interactions` **sem limite nem janela de data**, e calcula **todas** as métricas do painel no cliente. O painel fica mais lento a cada mês de operação, até estourar o teto de linhas do PostgREST e passar a mostrar dado truncado sem avisar.
**Causa raiz:** agregação no cliente sobre tabela que cresce.
**Caminho recomendado:** uma RPC que devolve as métricas agregadas, com janela de data como parâmetro (default 90 dias). O cliente passa a receber alguns números em vez de milhares de linhas. **Atalho a evitar:** só adicionar `.limit(1000)` — as métricas passariam a ser calculadas sobre uma amostra arbitrária, e ficariam **erradas** em vez de lentas. Errado é pior que lento.
**Arquivos e objetos a tocar:** nova migration com a RPC; `src/hooks/useContactInsights.ts`.
**Não tocar / armadilhas:** idem 238 sobre `SECURITY DEFINER`.
**Depende de:** 238 · **Libera:** 240
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** **sim** (DDL em produção).
**Como verificar:** os números do painel batem com os atuais, e o tráfego cai de milhares de linhas para um objeto.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 240 — Paginar as duas consultas da página pública de status
**Onda / Severidade / Camada:** 6 / Média / Frontend
**Achados resolvidos:** A-102
**Problema hoje:** `src/pages/Status.tsx:80` e `:85` fazem `.limit(20000)` **cada**, numa rota **pública** e anônima, recarregando a cada 5 minutos. Qualquer visitante dispara duas varreduras de até 20.000 linhas.
**Causa raiz:** agregação de 90 dias feita no cliente.
**Caminho recomendado:** o cálculo é um agregado por dia — faça no banco. Crie uma view materializada (ou uma RPC com `GROUP BY date_trunc('day', …)`) que devolva **90 linhas**, uma por dia, e deixe a página só desenhar. A view materializada tem a vantagem de poder ser atualizada por cron (barata) e de não varrer nada por visita; é o desenho certo para uma página pública.
**Arquivos e objetos a tocar:** nova migration com a view/RPC e o refresh; `src/pages/Status.tsx`.
**Não tocar / armadilhas:** view materializada precisa de policy de leitura para `anon` (ver etapa 144) e de `REFRESH` agendado — sem o refresh, a página congela no passado, que é o oposto do objetivo.
**Depende de:** 092, 093, 144, 239 · **Libera:** 241
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** **sim** (DDL em produção).
**Como verificar:** a página carrega com duas consultas que devolvem ≤ 90 linhas cada; os percentuais são idênticos aos anteriores.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 241 — Índice em `call_sessions.created_at`
**Onda / Severidade / Camada:** 6 / Alta / Banco
**Achados resolvidos:** A-103
**Problema hoje:** todos os índices de `call_sessions` cobrem `caller_name`/`caller_phone`/`agent_name` (trigram), `contact_id`, `deal_id`, `status` (parcial), `(agent_name, started_at DESC)` e `started_at DESC`. **Nenhum com `created_at` como primeira coluna.** Mas os consumidores filtram por `created_at`, não por `started_at` — 15 ocorrências: `useQueueMetrics.ts:96`, `useSupervisorPanel.ts:118,119`, `useExecutiveDashboard.ts:115`, `useAgentRanking.ts:219`, `useHoldMetrics.ts:42-43`, `check-queue-metrics/index.ts:84,96`, `check-goals/index.ts:83,95`. O painel executivo, o do supervisor e as métricas de fila **varrem a tabela inteira** a cada carga.
**Causa raiz:** a tabela nasceu com `started_at` indexado e o código passou a usar `created_at` como recorte de período; nenhum índice acompanhou.
**Caminho recomendado:** antes de criar o índice, **pergunte se as duas colunas deveriam ser diferentes**: `created_at` é quando a linha foi inserida, `started_at` quando a chamada começou. Se são sempre iguais na prática, o certo é **o código usar `started_at`** (que já tem índice) e não criar índice novo. Confira (`SELECT count(*) FROM call_sessions WHERE created_at <> started_at`). Se forem de fato diferentes e `created_at` é o recorte correto, crie `CREATE INDEX idx_call_sessions_created_at ON public.call_sessions (created_at DESC)`. **Decida com dado, não por gosto** — índice a mais custa em cada gravação, e a tabela já tem 7.
**Arquivos e objetos a tocar:** nova migration, **ou** os 9 consumidores (se a decisão for usar `started_at`).
**Não tocar / armadilhas:** o linter de produção já aponta **250 `unused_index`** — não aumente a conta sem necessidade medida.
**Depende de:** 240 · **Libera:** 242
**Risco e como reverter:** baixo. Reverter: `DROP INDEX`.
**Precisa de aprovação humana antes do merge:** **sim** (DDL em produção).
**Como verificar:** `EXPLAIN ANALYZE` de uma consulta do painel executivo → passa de `Seq Scan` para `Index Scan`, com tempo menor.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 242 — Índices derivados do uso real, não do palpite
**Onda / Severidade / Camada:** 6 / Média / Banco
**Achados resolvidos:** A-103
**Problema hoje:** o repositório tem 440 `CREATE INDEX` e o linter de produção aponta **250 índices não usados**. Ao mesmo tempo, consultas do fluxo central varrem tabela (etapa 241). A relação entre índice criado e índice útil se perdeu.
**Causa raiz:** índices criados por antecipação, sem medição posterior.
**Caminho recomendado:** use o banco como fonte. (1) `SELECT relname, indexrelname, idx_scan FROM pg_stat_user_indexes WHERE idx_scan = 0 ORDER BY relname` → candidatos a remover; (2) `SELECT * FROM pg_stat_statements ORDER BY total_exec_time DESC LIMIT 20` (se a extensão estiver disponível) → consultas que mais custam; (3) `EXPLAIN ANALYZE` nas 5 piores. Crie **só** os índices que as consultas reais pedem, e **remova** os não usados em lote separado (etapa 294). Faça isso **depois** de a operação ter volume real — índice medido numa base vazia é índice adivinhado.
**Arquivos e objetos a tocar:** nova migration; `docs/agentes/banco.md` (registro da medição).
**Não tocar / armadilhas:** `idx_scan = 0` numa base sem uso **não** significa índice inútil. Só meça depois de haver tráfego — registre a data da medição.
**Depende de:** 241 · **Libera:** 294
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** **sim** (DDL em produção).
**Como verificar:** a medição no corpo da PR, mais `EXPLAIN ANALYZE` antes e depois de cada índice criado.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 243 — Índices para as buscas por texto que existirem
**Onda / Severidade / Camada:** 6 / Baixa / Banco
**Achados resolvidos:** A-103
**Problema hoje:** há índices trigram em `call_sessions.caller_name/caller_phone/agent_name` (item B3 das pendências), o que acelera `ILIKE`. Outras telas com busca por substring podem não ter equivalente — e `ILIKE '%termo%'` sem trigram varre a tabela.
**Causa raiz:** o trigram foi aplicado onde a busca doía primeiro.
**Caminho recomendado:** levante onde o código faz `.ilike(` (`grep -rn "\.ilike(" src/ supabase/functions/`), confira se a coluna tem índice GIN trigram, e crie onde faltar **e** onde a tabela for crescer. Para tabelas pequenas e estáveis (catálogos), não crie — varredura de 50 linhas é mais rápida que índice.
**Arquivos e objetos a tocar:** nova migration.
**Não tocar / armadilhas:** índice trigram é grande. Não o crie em coluna de texto longo (corpo de e-mail, transcrição) sem avaliar o tamanho — para texto longo, o caminho é busca full-text (`tsvector`), que o repositório já usa em `call_transcripts_searchable`.
**Depende de:** 242 · **Libera:** —
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** **sim** (DDL em produção).
**Como verificar:** `EXPLAIN ANALYZE` de uma busca por substring na tela correspondente usa o índice.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 244 — Reduzir a tempestade de consultas do painel de fila
**Onda / Severidade / Camada:** 6 / Média / Hooks
**Achados resolvidos:** A-105
**Problema hoje:**
```ts
src/hooks/useQueueMetrics.ts:148-157
const interval = setInterval(fetchMetrics, 5000);
supabase.channel('queue-metrics')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'call_sessions' }, () => fetchMetrics())
  .on('postgres_changes', { event: '*', schema: 'public', table: 'agents' }, () => fetchMetrics())
```
Cada evento dispara `fetchMetrics`, que faz **3 consultas**. Em call center as linhas de `call_sessions` mudam de status o tempo todo: com dezenas de chamadas simultâneas, o dashboard gera centenas de consultas por minuto — exatamente na hora de pico. Mesmo padrão em `usePredictiveDialer.ts:262-281`.
**Causa raiz:** realtime sem agrupamento, somado a poll redundante.
**Caminho recomendado:** três mudanças, nesta ordem de ganho: (1) **remova o poll de 5 s** — com realtime funcionando ele é redundante; mantenha um poll de segurança de 60 s para o caso de o canal cair; (2) **agrupe** os eventos: um `debounce` de 1 s antes de `fetchMetrics`, de modo que uma rajada de 20 eventos produza uma atualização; (3) assine só os eventos que importam (`UPDATE` de `status`, não `*`). Some a isso `usePageVisibility`, que **já existe no repositório** (item B7 das pendências) e pausa quando a aba está oculta.
**Arquivos e objetos a tocar:** `src/hooks/useQueueMetrics.ts`, `src/hooks/usePredictiveDialer.ts`.
**Não tocar / armadilhas:** debounce em painel de supervisor tem limite — 1 s é aceitável, 5 s não. O supervisor precisa ver a fila mudando.
**Depende de:** 197, 216 · **Libera:** 245
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** com 20 mudanças de status em 2 s, o número de consultas disparadas cai de ~60 para 3 (conte na aba de rede).
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 245 — Parar o laço de re-render de 1 Hz do lembrete de espera
**Onda / Severidade / Camada:** 6 / Média / Hooks
**Achados resolvidos:** A-106
**Problema hoje:** `src/hooks/useHoldReminder.ts:95` cria um objeto novo a cada tick e `:117` grava em `alertedCalls` **incondicionalmente**, antes de qualquer verificação de quantidade. Esse estado está nas deps do callback (`:118`), que está nas deps do efeito (`:133-136`), que recria o `setInterval` de 1 s. A cada segundo: novo estado → novo callback → efeito desmonta e recria o intervalo. **Acontece mesmo sem nenhuma chamada em espera** — ambos os toggles nascem ligados (`src/lib/holdReminderSounds.ts:102,121`) e o indicador é montado sem condição (`UnifiedSoftphone.tsx:203`). O notebook do agente esquenta e a interface fica pesada sem motivo aparente.
**Causa raiz:** estado gravado sem comparação, dentro de uma cadeia de dependências que se realimenta.
**Caminho recomendado:** duas correções pequenas. (1) Em `:117`, só chame `setAlertedCalls` **se o conteúdo mudou** (compare as chaves antes); (2) guarde `alertedCalls` num `useRef` em vez de estado, já que ele não precisa disparar render — e mantenha estado só do que a interface mostra. Qualquer uma das duas quebra o laço; faça as duas. Verifique também que o efeito não recria o intervalo: as deps do `useEffect` devem ser estáveis.
**Arquivos e objetos a tocar:** `src/hooks/useHoldReminder.ts`.
**Não tocar / armadilhas:** o lembrete sonoro precisa continuar funcionando — teste com uma chamada em espera de verdade, não só verificando que o render parou.
**Depende de:** 244 · **Libera:** 246
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** com o React DevTools (profiler) e nenhuma chamada em espera, o componente **não** re-renderiza por segundo; com uma chamada em espera, o lembrete toca na hora certa.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 246 — Transformar o alerta repetitivo de meta em alerta de transição
**Onda / Severidade / Camada:** 6 / Média / Hooks
**Achados resolvidos:** A-107
**Problema hoje:** `src/hooks/useQueueMetrics.ts:79-89` (`checkAndNotifyGoals`) dispara `toast.error` por status **atual**, sem memória do que já foi avisado, e é chamado em `:129` a cada `fetchMetrics` — que roda a cada 5 s mais a cada evento de realtime. Enquanto uma meta estiver crítica, o supervisor recebe o mesmo toast de 10 s **a cada 5 segundos**. Na prática ele aprende a ignorar, e a degradação real passa batida.
**Causa raiz:** notificação derivada do estado, não da transição de estado.
**Caminho recomendado:** guarde o estado anterior de cada meta e notifique **só na transição** (ok → crítico), com um segundo aviso na volta (crítico → ok), que também é informação. Acrescente um intervalo mínimo entre avisos da mesma meta (15 min). Esse padrão vale para qualquer alerta derivado de métrica — registre-o em `docs/agentes/mapa-repo.md` para não reaparecer.
**Arquivos e objetos a tocar:** `src/hooks/useQueueMetrics.ts`.
**Não tocar / armadilhas:** guardar o estado anterior em `useState` recria o problema da etapa 245 — use `useRef`.
**Depende de:** 245 · **Libera:** 247
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** com uma meta crítica por 5 minutos, **um** toast é exibido, não 60.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 247 — Eliminar o N+1 da validação de IP
**Onda / Severidade / Camada:** 6 / Média / Edge Function
**Achados resolvidos:** A-108
**Problema hoje:** `supabase/functions/validate-ip/index.ts:68-82` faz `for (const entry of globalWhitelist) { … await supabase.rpc('check_ip_in_cidr', { p_ip, p_cidr: entry.ip_address }) … }`, repetido em `:93-104` para a lista do usuário. **Validar um acesso custa tantas idas ao banco quantas faixas de IP houver cadastradas** — e isso está no caminho que libera o acesso.
**Causa raiz:** `check_ip_in_cidr` existe como RPC de uma linha, em vez de um predicado aplicado num único `select`.
**Caminho recomendado:** faça **uma** consulta: `SELECT 1 FROM ip_whitelist WHERE <ip>::inet <<= ip_address::inet AND …` — o Postgres tem o operador de contenção de rede nativo (`<<=`), então a verificação inteira vira um `WHERE`. Mantenha a RPC para quem já a use, mas pare de chamá-la em laço. Se a coluna for `text`, o cast funciona; se houver valor inválido gravado, o cast falha — então valide a entrada na gravação (etapa 139 cobre o CHECK) ou use `WHERE ip_address ~ '^[0-9./:]+$'` como guarda.
**Arquivos e objetos a tocar:** `supabase/functions/validate-ip/index.ts`.
**Não tocar / armadilhas:** um erro aqui **libera ou bloqueia acesso indevidamente**. Escreva teste Deno com casos de borda: IP dentro da faixa, fora, faixa `/32`, IPv6.
**Depende de:** 246 · **Libera:** 248
**Risco e como reverter:** médio (caminho de acesso).
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** com 50 faixas cadastradas, a função faz **1** consulta (não 50), e os testes de borda passam.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 248 — Eliminar o N+1 do cálculo de melhor horário
**Onda / Severidade / Camada:** 6 / Média / Edge Function
**Achados resolvidos:** A-108
**Problema hoje:** `supabase/functions/compute-best-time/index.ts:31,39-45` busca `.limit(200)` contatos e, **para cada um**, faz `await supabase.from('call_sessions').select(…).eq('contact_id', contact.id).limit(500)` — até **200 consultas de 500 linhas** por execução.
**Causa raiz:** agrupamento feito no TypeScript em vez do SQL.
**Caminho recomendado:** uma consulta com `GROUP BY contact_id, hora` devolvendo direto a contagem de atendimentos por hora por contato. Com a correção de fuso da etapa 116, isso vira um `date_trunc`/`extract` com `AT TIME ZONE` no próprio `GROUP BY` — as duas correções se encaixam, faça-as juntas ou em sequência imediata.
**Arquivos e objetos a tocar:** `supabase/functions/compute-best-time/index.ts`; possivelmente uma RPC.
**Não tocar / armadilhas:** o resultado precisa ser **idêntico** ao atual (fora a correção de fuso). Compare as saídas antes e depois para um conjunto de contatos.
**Depende de:** 116, 247 · **Libera:** 249
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** **sim** se criar RPC.
**Como verificar:** a execução faz 1–2 consultas em vez de 200, e o `best_hour` de uma amostra de contatos é o mesmo (já corrigido o fuso).
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 249 — Eliminar o N+1 do resumo de notificações
**Onda / Severidade / Camada:** 6 / Baixa / Edge Function
**Achados resolvidos:** A-108
**Problema hoje:** `supabase/functions/process-digest/index.ts:46-57` faz **um `select` em `notifications` por usuário** de digest.
**Causa raiz:** idem.
**Caminho recomendado:** uma consulta que traz as notificações de **todos** os usuários do lote (`.in('user_id', ids)`) e agrupa em memória — ou um `GROUP BY` se só a contagem importar. O lote de ids precisa ser quebrado em blocos de ~200 (limite de tamanho de URL do PostgREST).
**Arquivos e objetos a tocar:** `supabase/functions/process-digest/index.ts`.
**Não tocar / armadilhas:** não mude o conteúdo do digest nesta etapa.
**Depende de:** 248 · **Libera:** 250
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** com 100 usuários, a execução faz 1–2 consultas; o conteúdo dos digests é idêntico ao anterior.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 250 — Guard de CI contra N+1 em edge function
**Onda / Severidade / Camada:** 6 / Baixa / CI
**Achados resolvidos:** A-108
**Problema hoje:** três N+1 foram encontrados por um detector ad hoc (que também produziu 4 falsos positivos, descartados por leitura: `check-contact-alerts:60`, `check-hold-alerts:85`, `voip-failover-notifier:37`, `detect-key-moments:130` acumulam em array e fazem **um** insert). Nada impede o próximo.
**Causa raiz:** ausência de guard.
**Caminho recomendado:** adicione a regra ao `scripts/audit-edge-functions.ts` como **`warn`** (não `error`): `for`/`for await`/`map` contendo `await supabase…from(`/`.rpc(` numa janela de ~28 linhas. A severidade `warn` é correta aqui porque a taxa de falso positivo é real — e, diferente da A-040, um `warn` que aparece no log da PR e é lido tem valor; o problema da A-040 era `warn` **mais** baseline silenciando. **Não crie baseline para esta regra.**
**Arquivos e objetos a tocar:** `scripts/audit-edge-functions.ts`.
**Não tocar / armadilhas:** se a taxa de falso positivo for alta, ajuste a janela em vez de desligar a regra.
**Depende de:** 249 · **Libera:** —
**Risco e como reverter:** nenhum.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** o guard acusa um N+1 introduzido de propósito e **não** acusa os 4 falsos positivos conhecidos.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 251 — Reduzir o chunk de entrada do front
**Onda / Severidade / Camada:** 6 / Média / Frontend
**Achados resolvidos:** A-111
**Problema hoje:** o build emite aviso de chunk acima de 900 kB, e `index.js` tem **319,6 kB gzip** — a primeira carga de quem abre o sistema. `jspdf` (123,3 kB gzip) e `html2canvas` (46,3 kB) já estão em chunks próprios, o que é correto; o problema é o shell.
**Causa raiz:** dependências pesadas importadas estaticamente no caminho de entrada.
**Caminho recomendado:** descubra **o que** está no chunk antes de mexer: rode o build com análise de bundle (`npx vite build --mode production` e inspecione, ou adicione `rollup-plugin-visualizer` temporariamente — **não** o commite). Alvos típicos: `recharts` (o chunk `CartesianChart.js` tem 97 kB), `@radix-ui` em excesso, e o cliente do Supabase. Mova o que não é necessário na primeira tela para `lazy()`. As rotas já são 100% lazy — o ganho está nas bibliotecas do shell.
**Arquivos e objetos a tocar:** `src/App.tsx`, `src/components/layout/`, conforme a análise.
**Não tocar / armadilhas:** não quebre o `AuthContext` nem o `ProtectedRoute` em lazy — eles estão no caminho de **toda** navegação, e lazy ali adiciona um salto a cada rota.
**Depende de:** 250 · **Libera:** 252
**Risco e como reverter:** médio (pode introduzir tela branca se o lazy for mal colocado).
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** `npx vite build && node scripts/check-bundle-budget.mjs` → `index.js` abaixo de 280 kB gzip, e a aplicação carrega normalmente em `vite preview`.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 252 — Transformar o orçamento de bundle em meta de produto
**Onda / Severidade / Camada:** 6 / Média / CI
**Achados resolvidos:** A-047
**Problema hoje:** `scripts/check-bundle-budget.mjs:58-66` calibra cada limite como `Math.ceil(tamanhoAtual * 1.1)` no modo `--update`. Hoje `index.js` tem teto de **346 kB gzip** contra o real de 319,6 (92% do limite) — enquanto `docs/audits/pendencias-2026-07.md` (C7) declara cumprida a meta de "<200 kB gz por rota". O gate impede crescimento de 10%, não garante a meta.
**Causa raiz:** orçamento derivado do estado atual.
**Caminho recomendado:** depois da etapa 251, fixe os limites **à mão**, derivados da meta de produto, e **documente a meta** em `scripts/bundle-budget.json` num campo `_meta`. Mantenha o `--update` para conveniência, mas registre em `AGENTS.md` que regravá-lo exige justificativa na PR (o próprio script já diz isso na mensagem de erro — torne-o verdade). Corrija também a afirmação do documento de pendências: a meta **não** está cumprida.
**Arquivos e objetos a tocar:** `scripts/bundle-budget.json`, `AGENTS.md`, `docs/audits/pendencias-2026-07.md`.
**Não tocar / armadilhas:** não fixe um limite que o build atual já viola — o CI ficaria vermelho e alguém regravaria o baseline, repetindo a A-040. Fixe no valor atingido na etapa 251 e aperte em passos.
**Depende de:** 251 · **Libera:** —
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** `node scripts/check-bundle-budget.mjs` → passa; e aumentar o bundle em 5% numa branch de teste → falha.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 253 — Pausar realtime e poll quando a aba está oculta, e tirar o monitoramento das páginas públicas
**Onda / Severidade / Camada:** 6 / Média / Hooks
**Achados resolvidos:** A-105, A-134
**Problema hoje:** `usePageVisibility` existe e está integrado em `useSecurityMonitoringData` e `useExtensionsOverview` (item B7 das pendências) — **só nesses dois**. Os demais hooks com poll e realtime continuam consultando com a aba em segundo plano, o que num call center significa dezenas de abas abertas consumindo banco sem ninguém olhando.
**Causa raiz:** a integração foi feita onde doía e não generalizada.
**Caminho recomendado:** aplique `usePageVisibility` aos hooks com `setInterval` ou `refetchInterval`, começando pelos de painel (`useQueueMetrics`, `useVoipAnomalies`, `useExecutiveDashboard`). Use também `refetchIntervalInBackground: false` no React Query, como o B7 já fez. **Exceção importante:** o softphone e a chamada ativa **não** devem pausar — o agente pode estar em outra aba durante a ligação.
**Além disso (A-134), e faça esta parte primeiro:** medido em navegador em 2026-11-23 — **toda** rota pública (`/landing`, `/pricing`, `/vs/3cplus`, `/marketplace`, `/unauthorized`, `/login`…) dispara `GET /rest/v1/call_quality_metrics?select=*&order=created_at.desc&limit=50` **duas vezes** e abre **dois** WebSockets de realtime, para visitante anônimo. Um hook de monitoramento de qualidade VoIP está montado acima do roteador. Mova-o para dentro da área autenticada (ou condicione-o à sessão), troque `select=*` pelas colunas usadas, e descubra por que a chamada é duplicada — montagem dupla do hook é o suspeito. **Verifique também** a policy de leitura de `call_quality_metrics`: se ela permite `anon`, métrica operacional está pública (ver A-069 e etapa 144).
**Arquivos e objetos a tocar:** os hooks de painel; o ponto de montagem do monitor de qualidade (`src/App.tsx` ou `AppLayout`); `src/hooks/usePageVisibility.ts` (sem mudança).
**Não tocar / armadilhas:** pausar o canal de chamada ativa perderia eventos de uma ligação em curso. Liste explicitamente os hooks que **não** devem pausar, e escreva por quê.
**Depende de:** 244 · **Libera:** —
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** com a aba oculta por 2 minutos, nenhuma consulta dos painéis é disparada (aba de rede); ao voltar, há um refetch único.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 254 — Virtualizar as listas longas
**Onda / Severidade / Camada:** 6 / Baixa / Frontend
**Achados resolvidos:** A-102
**Problema hoje:** `@tanstack/react-virtual` está nas dependências (`package.json`), o que indica que a virtualização foi adotada em algum lugar — mas as listas de histórico, contatos e alertas renderizam o que a consulta trouxer. Com paginação (etapas 236–238) o problema diminui; com página de 50 e rolagem infinita, volta.
**Causa raiz:** biblioteca presente, uso parcial.
**Caminho recomendado:** descubra onde `react-virtual` já é usado (`grep -rn "useVirtualizer" src/`) e **siga esse padrão** nas listas que acumulam itens por rolagem. Não virtualize lista de ≤ 50 itens — o custo de complexidade não se paga.
**Arquivos e objetos a tocar:** as listas que acumulam por rolagem.
**Não tocar / armadilhas:** virtualização quebra `Ctrl+F` do navegador e leitores de tela se feita sem `aria-rowcount`. Se a lista precisa ser pesquisável, prefira paginação explícita.
**Depende de:** 236, 237, 238 · **Libera:** —
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** com 1.000 itens carregados, a rolagem permanece fluida e o número de nós no DOM fica constante.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 255 — Retenção dos logs que crescem sem parar
**Onda / Severidade / Camada:** 6 / Média / Banco
**Achados resolvidos:** A-110 (relacionado)
**Problema hoje:** o item B1 das pendências mediu as seis tabelas de log candidatas a partição: `audit_logs` (334 linhas), `call_quality_metrics` (4), `login_attempts` (2), `voip_trunk_health_checks` (1), `rls_audit_logs` (0), `webhook_flush_metrics` (0) — **968 kB no total**, e a decisão de **não particionar** está correta nesse volume. Mas o próprio item registra que **a retenção de 90 dias continua pendente**, e com a operação real essas tabelas passam a crescer por chamada. `cron.job_run_details` também: 166 linhas, 155 kB, com 158 registros de mais de 7 dias.
**Causa raiz:** retenção tratada junto com particionamento e adiada com ele.
**Caminho recomendado:** um cron de retenção por classe de dado, com prazos que o dono aprove: logs de saúde e de execução de cron (30 dias), métricas de qualidade (180 dias, para análise de tendência), `audit_logs` (**pergunte** — trilha de auditoria pode ter exigência legal de guarda maior), `login_attempts` (90 dias). Use `DELETE` em lotes com `LIMIT`, não um `DELETE` único, para não travar a tabela. O repositório já tem dois exemplos bons: `cleanup-recordings` e `cleanup-lock-conflicts`.
**Arquivos e objetos a tocar:** nova migration com as funções e os crons.
**Não tocar / armadilhas:** **não apague `audit_logs` sem decisão do dono.** Apagar trilha de auditoria pode ser problema legal, e é irreversível.
**Depende de:** 231 · **Libera:** —
**Risco e como reverter:** médio (deleção de dado). Reverter: `cron.unschedule` — mas o apagado não volta.
**Precisa de aprovação humana antes do merge:** **sim** (deleção de dado em produção).
**Como verificar:** após a primeira execução, `SELECT count(*) FROM <tabela> WHERE created_at < now() - interval '<prazo>'` → 0, e o total da tabela caiu conforme esperado.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 256 — Medir o custo real das policies de RLS
**Onda / Severidade / Camada:** 6 / Média / Banco
**Achados resolvidos:** A-090
**Problema hoje:** a etapa 101 marca as três funções como `STABLE`, o que deveria permitir ao planejador transformá-las em InitPlan — mas **ninguém mediu** se o ganho aconteceu. O re-lint de 2026-11-22 (item E2 das pendências) ainda aponta 323 `multiple_permissive_policies` e 13 `auth_rls_initplan`.
**Causa raiz:** otimização aplicada sem medição.
**Caminho recomendado:** depois da etapa 101 e com volume real de dado, meça: `EXPLAIN (ANALYZE, BUFFERS)` de um `SELECT` nas três tabelas mais acessadas (`call_sessions`, `contacts`, `conversations`), como um usuário com papel de agente. Compare com a medição anterior (guarde as duas em `docs/agentes/banco.md`). Ataque depois os `multiple_permissive_policies`: várias policies permissivas na mesma operação **são somadas com OR** e todas avaliadas — consolidar duas policies numa reduz o trabalho pela metade. Comece pelas tabelas com 5+ policies na mesma operação.
**Arquivos e objetos a tocar:** `docs/agentes/banco.md`; nova migration de consolidação, se a medição justificar.
**Não tocar / armadilhas:** consolidar policy **muda a lógica de acesso**. Só faça com o teste de RLS da etapa 053 verde, e verifique cada papel.
**Depende de:** 053, 101, 146 · **Libera:** —
**Risco e como reverter:** médio (toca controle de acesso).
**Precisa de aprovação humana antes do merge:** **sim** (DDL em produção).
**Como verificar:** as duas medições no documento, com o tempo de execução antes e depois.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 257 — Conferir o limite de conexões do banco
**Onda / Severidade / Camada:** 6 / Média / Infraestrutura
**Achados resolvidos:** A-105 (relacionado)
**Problema hoje:** o snapshot registra `max_connections: 60` e `max_worker_processes: 6`, com `cron.max_running_jobs: 32` e `cron.use_background_workers: off`. Com 5+ crons, realtime por agente e o PostgREST, 60 conexões é apertado para uma operação com dezenas de agentes — e o sintoma de esgotamento é a aplicação inteira parando de responder, não uma tela lenta.
**Causa raiz:** configuração padrão do plano, não dimensionada para o uso previsto.
**Caminho recomendado:** não aumente nada sem medir. Levante o uso real (`SELECT count(*), state FROM pg_stat_activity GROUP BY state`) em horário de pico e compare com o limite. Confirme que o pooler do Supabase está em uso pelo front (ele é, por padrão, mas verifique a URL configurada). **Se o uso passar de 70% do limite**, a conversa é com o dono: ou plano maior, ou reduzir conexões (as etapas 244 e 253 ajudam diretamente). Registre a medição.
**Arquivos e objetos a tocar:** `docs/agentes/banco.md`.
**Não tocar / armadilhas:** `cron.use_background_workers: off` significa que os crons usam conexões normais — com 32 jobs simultâneos permitidos e 60 conexões, isso é um risco real quando houver mais crons. Esta auditoria adiciona vários; **conte-os**.
**Depende de:** 244, 253 · **Libera:** —
**Risco e como reverter:** nenhum (medição).
**Precisa de aprovação humana antes do merge:** não (mudança de plano é decisão do dono).
**Como verificar:** a medição de pico no documento, com a conclusão sobre folga.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 258 — Fechar a onda 6 com os números antes e depois
**Onda / Severidade / Camada:** 6 / Média / Verificação
**Achados resolvidos:** consolida A-102 a A-111
**Problema hoje:** otimização sem medição registrada não se distingue de mudança sem efeito.
**Causa raiz:** n/a — controle de execução.
**Caminho recomendado:** escreva `docs/qa/06-ONDA6-FECHAMENTO.md` com uma tabela: por item otimizado, a medição antes, a medição depois, e o comando que produziu cada uma. Inclua: tamanho do `index.js`, consultas por minuto do painel de fila, consultas por execução das três edges de N+1, tempo de `EXPLAIN ANALYZE` das consultas do painel executivo, e o número de re-renders do softphone em repouso. **Se algum item não melhorou, diga** — e registre a hipótese.
**Arquivos e objetos a tocar:** novo `docs/qa/06-ONDA6-FECHAMENTO.md`.
**Não tocar / armadilhas:** não meça com a base vazia. Se não houver volume real, registre isso e marque a onda como **parcialmente verificada**: é a verdade.
**Depende de:** 236–257 · **Libera:** 259
**Risco e como reverter:** nenhum.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** a tabela está completa, com comando e resultado em cada linha.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

---

# ONDA 7 — Experiência de uso e consistência (259–281)

## Etapa 259 — Rótulo acessível nos botões-ícone do discador e da chamada
**Onda / Severidade / Camada:** 7 / Média / Frontend
**Achados resolvidos:** A-123
**Problema hoje:** a varredura encontrou **71** `<Button size="icon">` sem `aria-label`, `title`, `sr-only`, texto visível nem `Tooltip` por perto. No fluxo de chamada: `src/components/calls/softphone/DialpadTab.tsx:44` (apagar dígito), `src/components/calls/ConferenceSection.tsx:62`, `src/components/calls/ActiveCallsIndicator.tsx:101`. Quem usa leitor de tela não consegue operar o discador.
**Causa raiz:** o padrão correto existe no repositório (`src/components/dashboard/RecentCalls.tsx:106` usa `aria-label` + `aria-hidden` no ícone) e não é cobrado por lint nem teste.
**Caminho recomendado:** adicione `aria-label` descritivo (o que o botão **faz**, não o nome do ícone: "apagar último dígito", não "backspace") e `aria-hidden="true"` no ícone. Onde houver `Tooltip`, o conteúdo dele pode servir de rótulo via `aria-label` — não confie no tooltip sozinho, ele não é anunciado por todos os leitores.
**Arquivos e objetos a tocar:** os 3 componentes citados.
**Não tocar / armadilhas:** não use o `title` do SVG — é inconsistente entre leitores.
**Depende de:** 258 · **Libera:** 260
**Risco e como reverter:** nenhum.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** inspecionar a árvore de acessibilidade do navegador: cada botão tem nome acessível não vazio.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 260 — Rótulo acessível nos botões-ícone de contatos
**Onda / Severidade / Camada:** 7 / Média / Frontend
**Achados resolvidos:** A-123
**Problema hoje:** `src/components/contacts/ContactCard.tsx:71` (favoritar) e `:100`, `src/components/contacts/ContactDetailSheet.tsx:95-96`.
**Causa raiz:** idem.
**Caminho recomendado:** idem 259. Para o botão de favoritar, o rótulo deve refletir a **ação**, que muda com o estado: "adicionar aos favoritos" / "remover dos favoritos" — e `aria-pressed` para comunicar o estado.
**Arquivos e objetos a tocar:** os 2 componentes citados.
**Não tocar / armadilhas:** rótulo que não muda com o estado é pior que ausente: informa errado.
**Depende de:** 259 · **Libera:** 261
**Risco e como reverter:** nenhum.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** idem 259, mais a verificação de `aria-pressed` alternando.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 261 — Rótulo acessível na navegação da transcrição
**Onda / Severidade / Camada:** 7 / Média / Frontend
**Achados resolvidos:** A-123
**Problema hoje:** `src/components/recordings/TranscriptionDialog.tsx:119` e `:122` — botões de navegar entre ocorrências na transcrição, sem rótulo. É a tela em que a navegação por teclado mais importa.
**Causa raiz:** idem.
**Caminho recomendado:** idem 259 ("ocorrência anterior" / "próxima ocorrência"), e anuncie a posição com uma região `aria-live` ("ocorrência 3 de 12") — sem isso, quem navega por leitor de tela não sabe onde está.
**Arquivos e objetos a tocar:** `src/components/recordings/TranscriptionDialog.tsx`.
**Não tocar / armadilhas:** `aria-live="assertive"` interrompe a leitura; use `polite`.
**Depende de:** 260 · **Libera:** 262
**Risco e como reverter:** nenhum.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** navegar entre ocorrências com leitor de tela anuncia a posição.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 262 — Rótulo acessível nos botões de exclusão
**Onda / Severidade / Camada:** 7 / Média / Frontend
**Achados resolvidos:** A-123
**Problema hoje:** `src/components/compliance/dnc/DNCTable.tsx:73` (**excluir** da lista DNC), `src/components/callbacks/ScheduledCallbacksList.tsx:326`, `src/components/ranking/AgentGoalsGrid.tsx:54`. Exclusão sem rótulo é a pior combinação: a ação é destrutiva e o usuário não sabe o que vai apagar.
**Causa raiz:** idem.
**Caminho recomendado:** rótulo que **inclui o alvo** ("remover o número 11 99999-9999 da lista"), não só o verbo. Combine com a confirmação da etapa 175. Para a lista DNC isso não é acabamento: é a diferença entre remover o número certo e o errado.
**Arquivos e objetos a tocar:** os 3 componentes citados.
**Não tocar / armadilhas:** rótulo com dado de cliente aparece em captura de tela de acessibilidade — está correto aqui (é o alvo da ação), mas não replique isso em log.
**Depende de:** 175, 261 · **Libera:** 263
**Risco e como reverter:** nenhum.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** o leitor de tela anuncia a ação **e** o alvo em cada um dos três.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 263 — Varrer os botões-ícone restantes, começando pelo cadastro
**Onda / Severidade / Camada:** 7 / Média / Frontend
**Achados resolvidos:** A-123, A-136
**Problema hoje:** das 71 ocorrências, as etapas 259–262 cobrem as 10 mais usadas. Restam ~61 espalhadas.
**Causa raiz:** idem.
**Comece por este, que está medido em navegador (A-136):** em `/register`, os **dois** botões de revelar senha (campos "Senha" e "Confirmar Senha") não têm texto, `aria-label`, `title` nem `sr-only` — enquanto o equivalente em `/login` **tem** `aria-label="Mostrar senha"`. Copie o do login. É rota pública de criação de conta: quem usa leitor de tela não consegue conferir a senha que digitou ao se cadastrar.
**Caminho recomendado:** depois desse, refaça a varredura para ter a lista atual e corrija em 3 ou 4 PRs por área de tela. Não é trabalho interessante, mas é mecânico e rápido — e cada um que fica é uma tela que um operador com deficiência visual não consegue usar.
**Arquivos e objetos a tocar:** conforme a varredura.
**Não tocar / armadilhas:** `src/components/ui/` é shadcn vendorizado — se o botão sem rótulo estiver lá, o rótulo vem de quem o usa, não do componente base. Não edite o shadcn.
**Depende de:** 262 · **Libera:** 264
**Risco e como reverter:** nenhum.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** a varredura devolve zero ocorrências fora de `src/components/ui/`.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 264 — Regra de lint para botão-ícone sem nome acessível
**Onda / Severidade / Camada:** 7 / Média / CI
**Achados resolvidos:** A-123, A-046
**Problema hoje:** depois de corrigir 71 botões, nada impede o 72º. E a correção é fácil de esquecer, porque o botão funciona perfeitamente para quem usa o mouse.
**Causa raiz:** ausência de regra.
**Caminho recomendado:** adicione `eslint-plugin-jsx-a11y` com as regras mínimas (`jsx-a11y/control-has-associated-label`, `alt-text`, `label-has-associated-control`), **como `warn` primeiro** para ver o volume, e promova a `error` quando estiver zerado. É uma dependência de desenvolvimento nova — justifique na PR (o `AGENTS.md` exige aviso para dependência nova). Alternativa sem dependência: um script de varredura próprio, como os outros guards do repositório; pior em cobertura, mas sem custo de dependência.
**Além disso (A-046):** `eslint.config.js:8` ignora `supabase/**`, `*.config.js`, `*.config.ts`, e `:11` restringe a `**/*.{ts,tsx}`, o que exclui todo `.mjs` de `scripts/`. O gate de lint que o CI anuncia como verde **não olha** `vite.config.ts`, `vitest.config.ts`, `playwright.config.ts` nem nenhuma edge function — e a regra que proíbe `parseInt` vale só em `src/`. Nesta mesma PR, inclua os arquivos de config e `scripts/**/*.mjs` no escopo do ESLint (as edges têm `deno check` e o guard próprio, então podem ficar de fora com a razão escrita no arquivo). Espere avisos novos: corrija ou justifique, não amplie o ignore.
**Arquivos e objetos a tocar:** `eslint.config.js`, `package.json`.
**Não tocar / armadilhas:** o plugin acusa muita coisa em componentes shadcn — adicione `src/components/ui/` aos ignores dessa regra específica, não ao ignore global.
**Depende de:** 263 · **Libera:** —
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** `npx eslint src/` → 0 problemas de a11y; adicionando um botão sem rótulo numa branch de teste → acusado.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 265 — Resolver as rotas que não têm entrada em nenhum menu
**Onda / Severidade / Camada:** 7 / Média / Frontend
**Achados resolvidos:** A-086
**Problema hoje:** existem rotas ativas sem item de menu — funcionalidades que só são alcançáveis por quem souber a URL. A auditoria de agosto contou 15 (6 de negócio + 9 administrativas); o número de hoje precisa ser remedido, porque o menu mudou.
**Causa raiz:** rotas adicionadas sem entrada de navegação.
**Caminho recomendado:** com o mapa da etapa 088, compare as 95 rotas protegidas com os links do `AppSidebar` e liste as sem entrada. Para cada: ou **adicione ao menu** (com o papel correto, etapa 089), ou **remova a rota** se a funcionalidade foi substituída, ou **registre** como alcançável só por link direto, se for intencional (uma tela de detalhe, por exemplo, não precisa de item de menu). As três respostas são válidas; nenhuma resposta não é.
**Arquivos e objetos a tocar:** `src/components/layout/AppSidebar.tsx`, `src/routes/protectedRoutes.tsx`, `docs/agentes/mapa-repo.md`.
**Não tocar / armadilhas:** a paleta de comandos (se existir) pode ser o caminho de acesso de algumas — procure antes de concluir que uma rota é inacessível. O commit #142 adicionou "Qualidade de Voz ao menu **e à paleta de comandos**", então a paleta existe.
**Depende de:** 088, 089, 090 · **Libera:** 266
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** a lista no documento tem uma decisão por rota, e nenhuma rota de negócio fica sem caminho de acesso.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 266 — Resolver a duplicata `/history` e `/call-history`
**Onda / Severidade / Camada:** 7 / Baixa / Frontend
**Achados resolvidos:** A-086
**Problema hoje:** as duas rotas existem e, pela varredura, `/call-history` é a única com caminho de rota sem item de menu, duplicando `/history`. Duas URLs para a mesma coisa confundem o usuário e dobram a manutenção.
**Causa raiz:** renomeação de rota sem remover a antiga.
**Caminho recomendado:** descubra se as duas apontam para a **mesma** página (`grep -n "history" src/routes/protectedRoutes.tsx`). Se sim, mantenha uma e faça a outra **redirecionar** (não apenas apague — links antigos e favoritos existem). Se forem páginas diferentes, dê nomes que digam a diferença.
**Arquivos e objetos a tocar:** `src/routes/protectedRoutes.tsx`.
**Não tocar / armadilhas:** remover rota sem redirecionar gera 404 para quem tem a URL salva — e, numa SPA com `vercel.json` reescrevendo tudo para `index.html`, o 404 aparece como tela em branco ou como a rota curinga, que é pior.
**Depende de:** 265 · **Libera:** 267
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** abrir a URL antiga leva à nova; só uma aparece no menu.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 267 — Padronizar as mensagens de confirmação de sucesso
**Onda / Severidade / Camada:** 7 / Baixa / Frontend
**Achados resolvidos:** A-054 (classe)
**Problema hoje:** depois das ondas 2 e 5, as mensagens passam a refletir o resultado real — mas cada tela tem a própria redação, e algumas afirmam coisas que não aconteceram ("✓ Configurações salvas", "Recomendação registrada"). O risco é voltar ao padrão antigo em telas novas.
**Causa raiz:** ausência de convenção.
**Caminho recomendado:** escreva a convenção em `docs/agentes/mapa-repo.md`, curta: a mensagem de sucesso **descreve o que foi gravado** ("3 números adicionados à lista"), não um adjetivo ("salvo com sucesso"); nunca é exibida antes da confirmação da gravação; nunca aparece dentro de `catch`. Revise as mensagens das telas tocadas pelas ondas 2 e 5 para seguirem isso. O guard da etapa 196 já impede `toast.success` em `catch`.
**Arquivos e objetos a tocar:** `docs/agentes/mapa-repo.md`; as telas revisadas.
**Não tocar / armadilhas:** não reescreva todas as mensagens do sistema — só as das telas que o plano já tocou. Reescrita em massa de texto é churn.
**Depende de:** 196, 266 · **Libera:** 268
**Risco e como reverter:** nenhum.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** a convenção está no documento, e as telas revisadas a seguem.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 268 — Estados vazios que explicam, não que só dizem "vazio"
**Onda / Severidade / Camada:** 7 / Média / Frontend
**Achados resolvidos:** A-005 (classe)
**Problema hoje:** com a base praticamente sem dados (`chamadas_7d: 0`), quase toda tela do sistema está em estado vazio **agora** — e a maioria não explica por quê. A etapa 169 resolveu isso para o coaching; o mesmo tratamento vale para as demais.
**Causa raiz:** estado vazio tratado como caso degenerado, não como a primeira experiência do usuário.
**Caminho recomendado:** nas telas do fluxo central, o estado vazio deve dizer **o que falta e como obter**: "nenhuma chamada no período — as chamadas aparecem aqui depois do primeiro atendimento", com link para o discador quando fizer sentido. Use o componente da etapa 202. Esta é a etapa de maior efeito percebido para quem está começando a usar o sistema — e, dado o estado atual da base, é o que o dono vê em quase toda tela.
**Arquivos e objetos a tocar:** as telas do fluxo central.
**Não tocar / armadilhas:** não confunda vazio com erro nem com "sem permissão" — são três estados, e as etapas 199 e 202 já os separam.
**Depende de:** 202, 267 · **Libera:** 269
**Risco e como reverter:** nenhum.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** com a base vazia, cada tela do fluxo central explica o vazio em uma frase.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 269 — Remover o que promete internacionalização e não entrega
**Onda / Severidade / Camada:** 7 / Baixa / Frontend
**Achados resolvidos:** A-112 (classe)
**Problema hoje:** `i18n.json` declara três locales (`en`, `pt-BR`, `es`) e um mapa de namespaces por página. Medição: **zero consumidores** (nada em `src/`, `vite.config.ts` ou `package.json` referencia o arquivo), **nenhuma biblioteca de i18n** no `package.json`, e dos 3 locales declarados só `en` tem arquivo (`public/locales/en/common.json`, 10 strings) — que nada lê. A interface é toda em português e o `defaultLocale` declarado é `en`.
**Causa raiz:** declaração de uma feature que nunca foi construída.
**Caminho recomendado:** **remova** `i18n.json` e `public/locales/`, e registre em `docs/adr/` que a localização da interface não existe — o ADR-016 ("Multilingual Real-Time Translation & **Localization** Suite", status "Aceito") cobre duas features, e só a tradução de conversas foi feita (`useLiveTranslation`, `TranslationCenter`, edge `translate-utterance` — essas são reais). Se o dono quiser localização de verdade, é um projeto próprio, não um arquivo de configuração. **Atalho a evitar:** deixar o arquivo "para o futuro". Ele faz a próxima pessoa achar que metade do caminho está feito.
**Arquivos e objetos a tocar:** remoção de `i18n.json` e `public/locales/`; `docs/adr/` (nota sobre o ADR-016).
**Não tocar / armadilhas:** **não** remova nada da tradução de conversas — ela funciona e é outra coisa.
**Depende de:** 268 · **Libera:** 270
**Risco e como reverter:** nenhum (`git revert`).
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** `npx vite build` conclui; `grep -rn "i18n" src/ vite.config.ts` → vazio.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 270 — Conferir as telas autenticadas em largura de celular
**Onda / Severidade / Camada:** 7 / Média / Frontend
**Achados resolvidos:** A-137 (escopo) — **esta etapa produz achados**
**Problema hoje:** as **10 rotas públicas já foram verificadas** em navegador (2026-11-23, 3 larguras, 30 capturas): **nenhuma tem overflow horizontal a 390 px**, nenhuma imagem sem `alt`, nenhum campo sem rótulo (A-137). **O que continua sem verificação são as telas de dentro do sistema** — discador, chamada ativa, histórico, fila, painéis —, que exigem login. Para um produto que agentes usam em turno, e cujo softphone pode ser usado em tablet, isso é uma camada inteira sem cobertura.
**Causa raiz:** n/a — é lacuna de verificação.
**Caminho recomendado:** use o Playwright, que **já roda no CI** (7 testes em `tests/e2e/`) e cujo navegador está disponível no ambiente (`executablePath: '/opt/pw-browsers/chromium'` quando a versão do projeto não casar com a instalada). Autentique com as credenciais de teste do ambiente `e2e` e capture o fluxo central em três larguras (390, 768, 1280): discador, chamada ativa, histórico, fila, painel executivo. **Olhe as imagens** — não automatize comparação ainda. Registre os problemas como achados novos no progresso, não os corrija aqui. **Não repita as rotas públicas:** elas já estão medidas (A-137).
**Arquivos e objetos a tocar:** novo `tests/e2e/screenshots.spec.ts` ou `scripts/capturas/`.
**Não tocar / armadilhas:** não transforme isso em teste de regressão visual na primeira passada — comparação de pixel gera falso positivo constante. Primeiro **veja**; automatize comparação depois, se valer.
**Depende de:** 269 · **Libera:** 271
**Risco e como reverter:** nenhum.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** as capturas existem para as 5 telas em 3 larguras, e a lista de problemas encontrados está no progresso.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 271 — Corrigir o que a conferência de celular encontrar, lote 1
**Onda / Severidade / Camada:** 7 / Média / Frontend
**Achados resolvidos:** os gerados pela etapa 270
**Problema hoje:** a definir pela etapa 270.
**Causa raiz:** a definir.
**Caminho recomendado:** corrija os problemas de maior impacto primeiro: tela que não cabe (rolagem horizontal), botão inalcançável, texto cortado, sobreposição. O repositório usa Tailwind — a correção quase sempre é um breakpoint (`sm:`, `md:`) ou um `flex-wrap`, não CSS novo. **Se a etapa 270 não encontrar nada**, registre isso e marque esta etapa como não necessária: é um resultado legítimo e vale ser escrito.
**Arquivos e objetos a tocar:** conforme os achados.
**Não tocar / armadilhas:** não troque o sistema de layout. Ajuste os breakpoints.
**Depende de:** 270 · **Libera:** 272
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** recapturar as telas → os problemas corrigidos não aparecem mais.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 272 — Corrigir o que a conferência de celular encontrar, lote 2
**Onda / Severidade / Camada:** 7 / Baixa / Frontend
**Achados resolvidos:** os gerados pela etapa 270
**Problema hoje:** o restante da lista da etapa 270.
**Causa raiz:** a definir.
**Caminho recomendado:** idem 271, para os itens de acabamento. Inclua aqui a conferência de **alvo de toque**: botão-ícone de 24 px é difícil de acertar com o dedo; a recomendação usual é 44 px de área clicável. No discador isso importa de verdade.
**Arquivos e objetos a tocar:** conforme os achados.
**Não tocar / armadilhas:** aumentar alvo de toque pode quebrar o layout de desktop — use classes responsivas.
**Depende de:** 271 · **Libera:** 273
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** idem 271.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 273 — Navegação por teclado no fluxo de chamada
**Onda / Severidade / Camada:** 7 / Média / Frontend
**Achados resolvidos:** A-123 (relacionado)
**Problema hoje:** não verificado nesta auditoria. Num call center, operar o discador sem tirar a mão do teclado é diferença de produtividade real, e atalhos para atender/encerrar/mudo são expectativa básica de quem vem de outro sistema.
**Causa raiz:** n/a — lacuna de verificação.
**Caminho recomendado:** percorra o fluxo (login → discador → chamada → encerrar) **só com o teclado** e registre onde o foco se perde, onde não há indicador visível de foco, e onde a ordem de tabulação é ilógica. Corrija o essencial: foco visível (o Tailwind tem `focus-visible:`), ordem lógica, e `Esc` fechando diálogo. **Não adicione atalhos globais** nesta etapa — isso é feature, precisa de decisão do dono, e atalho que conflita com o do navegador gera chamado.
**Arquivos e objetos a tocar:** os componentes do fluxo de chamada.
**Não tocar / armadilhas:** `outline: none` sem substituto é o erro mais comum — procure por ele no CSS.
**Depende de:** 272 · **Libera:** 274
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** percorrer o fluxo inteiro com Tab/Enter/Esc, sem mouse, e registrar que foi possível.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 274 — Barra de progresso de carregamento de rota
**Onda / Severidade / Camada:** 7 / Baixa / Frontend
**Achados resolvidos:** nenhum — melhoria derivada de A-111
**Problema hoje:** as 104 rotas são 100% lazy-loaded, o que é a arquitetura correta — mas significa que **toda** navegação baixa um chunk. O commit #162 já corrigiu a barra de progresso para refletir o carregamento real do chunk; esta etapa é a conferência de que o estado de transição está bom em conexão lenta.
**Causa raiz:** n/a — verificação.
**Caminho recomendado:** com a aba de rede limitada a "3G rápido", navegue entre 5 rotas e observe: há indicador imediato? a tela anterior permanece ou pisca em branco? um chunk que falha mostra erro ou tela vazia? Corrija o que faltar, usando o `Suspense` que já existe no `App.tsx`. Trate especialmente **falha de carregamento de chunk** (acontece após um deploy novo, quando o arquivo antigo deixa de existir): o certo é recarregar a página, e isso precisa ser explícito.
**Arquivos e objetos a tocar:** `src/App.tsx`, o componente de fallback do `Suspense`.
**Não tocar / armadilhas:** falha de chunk depois de deploy é um caso real e frequente numa SPA publicada a cada merge — se não for tratada, o usuário vê tela branca e acha que o sistema caiu.
**Depende de:** 273 · **Libera:** 275
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** com rede lenta, a navegação mostra progresso; simulando 404 num chunk, a aplicação oferece recarregar.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 275 — Conferir que o tema escuro não esconde informação
**Onda / Severidade / Camada:** 7 / Baixa / Frontend
**Achados resolvidos:** nenhum — lacuna de verificação
**Problema hoje:** existe `ThemeContext` (`src/contexts/ThemeContext.tsx`), então o sistema tem tema claro e escuro. Nenhuma tela foi aberta nesta auditoria, então **não há verificação** de que os estados de erro, aviso e sucesso continuam legíveis no escuro — e cor de alerta mal contrastada no escuro é informação perdida justamente no momento crítico.
**Causa raiz:** n/a — lacuna.
**Caminho recomendado:** capture as mesmas telas da etapa 270 nos dois temas e compare. Verifique especialmente: selos de estado (as etapas 092–097 criaram vários), mensagens de erro, gráficos (`recharts` tem cores próprias que podem não respeitar o tema). Corrija o que não tiver contraste suficiente. O Tailwind do projeto já tem as variáveis de tema — use-as, não cor fixa.
**Arquivos e objetos a tocar:** conforme a conferência.
**Não tocar / armadilhas:** não redefina a paleta. Ajuste os usos que não a seguem.
**Depende de:** 274 · **Libera:** 276
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** capturas nos dois temas, com os estados de erro e aviso legíveis em ambos.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 276 — Uma só palavra para cada conceito na interface
**Onda / Severidade / Camada:** 7 / Baixa / Frontend
**Achados resolvidos:** A-034 (reflexo na interface)
**Problema hoje:** a divergência de vocabulário do status de agente (A-034: `available`/`online`, `busy`/`on_call`, `away`/`break`) **aparece na tela**: o mesmo estado pode ser chamado de duas formas em telas diferentes. O mesmo risco existe para "chamada perdida" × "abandonada" (A-027) e para os nomes das métricas (A-028).
**Causa raiz:** vocabulário técnico divergente vazando para a interface.
**Caminho recomendado:** depois das etapas 103, 104 e 117, que unificam os valores, unifique os **rótulos**: um arquivo de termos em `src/lib/labels.ts` mapeando valor técnico → texto exibido, usado por todas as telas. Assim "missed" é sempre "não atendida", em qualquer lugar. É também o lugar onde uma futura tradução entraria, se o dono quiser (etapa 269).
**Arquivos e objetos a tocar:** novo `src/lib/labels.ts`; as telas que exibem status.
**Não tocar / armadilhas:** não mude os valores **técnicos** aqui — eles foram unificados nas etapas 103/104/117 e mexer de novo quebraria as métricas.
**Depende de:** 103, 104, 117, 275 · **Libera:** 277
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** o mesmo status aparece com o mesmo texto em `/calls`, `/history`, `/queue-dashboard` e `/executive`.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 277 — Formato único para número, data e duração
**Onda / Severidade / Camada:** 7 / Baixa / Frontend
**Achados resolvidos:** A-033 (classe)
**Problema hoje:** o erro de fuso da A-033 (hora UTC exibida como local) é o sintoma de um problema mais amplo: não há um lugar único que formate data, hora e duração. Existem utilitários (`formatDuration`, `formatDurationFriendly` apareceram na varredura), mas em arquivos diferentes.
**Causa raiz:** formatação ad hoc por tela.
**Caminho recomendado:** consolide em `src/lib/format.ts`: `formatDate`, `formatDateTime`, `formatDuration`, `formatPercent`, `formatPhone` — todos com fuso e locale explícitos (`pt-BR`, `America/Sao_Paulo` ou o fuso da operação), **nunca** `toLocaleString()` sem argumento, que depende da máquina do usuário. Troque os usos. Comece pelas telas de relatório, onde a divergência de formato é mais visível.
**Arquivos e objetos a tocar:** novo (ou consolidado) `src/lib/format.ts`; as telas.
**Não tocar / armadilhas:** `toLocaleString()` sem argumento num navegador em inglês mostra data no formato americano — é a causa mais comum de "o sistema mostrou a data errada".
**Depende de:** 116, 276 · **Libera:** 278
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** com o navegador configurado em `en-US`, as datas continuam no formato brasileiro.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 278 — Confirmação antes de toda ação destrutiva
**Onda / Severidade / Camada:** 7 / Média / Frontend
**Achados resolvidos:** A-123 (relacionado)
**Problema hoje:** a etapa 175 adiciona confirmação na exclusão de DNC. O padrão precisa valer para as demais exclusões — e, com os botões-ícone sem rótulo (A-123), hoje é possível apagar algo sem nem saber o quê.
**Causa raiz:** ausência de convenção.
**Caminho recomendado:** levante as ações de exclusão (`grep -rn "\.delete()" src/hooks/`), e para cada uma confirme que há diálogo de confirmação **nomeando o alvo**. O repositório tem `@radix-ui/react-alert-dialog` nas dependências — use-o, é o componente certo. Para exclusões irreversíveis com efeito amplo (apagar campanha com contatos, apagar cadência com inscrições), exija que o usuário **digite o nome**, não só clique em "confirmar".
**Arquivos e objetos a tocar:** as telas com exclusão.
**Não tocar / armadilhas:** não adicione confirmação a tudo — confirmação em ação reversível (desfavoritar, por exemplo) só atrapalha e treina o usuário a clicar em "sim" sem ler.
**Depende de:** 175, 277 · **Libera:** 279
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** cada exclusão irreversível pede confirmação nomeando o alvo; as reversíveis não pedem.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 279 — Tela de "sem permissão" que ajuda
**Onda / Severidade / Camada:** 7 / Baixa / Frontend
**Achados resolvidos:** A-086
**Problema hoje:** antes da etapa 089, 49 links levavam a `/unauthorized`. Depois dela, isso praticamente desaparece — mas a rota continua existindo e sendo alcançada por link direto, favorito antigo ou mudança de papel. A tela precisa dizer **o que fazer**, não só que não deu.
**Causa raiz:** página de erro genérica.
**Caminho recomendado:** a tela deve informar: qual tela foi tentada, qual papel é necessário, qual papel o usuário tem, e um caminho (voltar, ou pedir acesso ao administrador). Com os dados que o `AuthContext` e o mapa da etapa 088 já têm, isso é direto. **Não** mostre a lista de papéis do sistema nem detalhes de policy — é informação interna.
**Arquivos e objetos a tocar:** `src/pages/Unauthorized.tsx`.
**Não tocar / armadilhas:** não revele a existência de telas que o usuário não pode ver além da que ele tentou acessar.
**Depende de:** 089, 278 · **Libera:** 280
**Risco e como reverter:** nenhum.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** como agente, acessar `/audit-logs` por URL → a tela diz qual papel é necessário e oferece voltar.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 280 — Revisar as páginas públicas de marketing
**Onda / Severidade / Camada:** 7 / Média / Frontend
**Achados resolvidos:** A-007 (relacionado)
**Problema hoje:** há 11 rotas públicas, entre elas `/landing`, `/pricing`, `/vs/3cplus` (comparativo com um concorrente), `/marketplace` e `/status`. A etapa 092 corrigiu o `/status`, que afirmava 100% de uptime sem medição. **As outras quatro não foram auditadas quanto ao que afirmam** — e uma página pública que promete funcionalidade que não existe é um problema comercial, não técnico.
**Causa raiz:** páginas de marketing fora do escopo da auditoria técnica.
**Caminho recomendado:** leia as quatro e compare cada afirmação com o que esta auditoria mediu. Candidatos a conferir: funcionalidades listadas em `/pricing` que estão entre os "fios não ligados" da onda 4; comparações em `/vs/3cplus`; itens do `/marketplace`. **Leve a lista ao dono** — ele decide o que ajustar; você só aponta a divergência entre o que a página promete e o que o sistema faz hoje. É a mesma disciplina das etapas 096–099, aplicada ao texto comercial.
**Arquivos e objetos a tocar:** `docs/qa/06-PAGINAS-PUBLICAS.md` (a lista); as páginas, conforme a decisão do dono.
**Não tocar / armadilhas:** **não altere texto comercial por conta própria.** Preço, comparação com concorrente e promessa de funcionalidade são decisão do dono.
**Depende de:** 180, 279 · **Libera:** 281
**Risco e como reverter:** nenhum.
**Precisa de aprovação humana antes do merge:** **sim** (conteúdo comercial).
**Como verificar:** o documento lista cada afirmação e o veredito (confere / não confere / não verificável), com referência à etapa correspondente.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 281 — Fechar a onda 7
**Onda / Severidade / Camada:** 7 / Baixa / Documentação
**Achados resolvidos:** consolida A-123, A-086, A-112
**Problema hoje:** n/a — controle de execução.
**Causa raiz:** n/a.
**Caminho recomendado:** escreva `docs/qa/06-ONDA7-FECHAMENTO.md` com: os achados **novos** que as etapas 270–275 produziram (responsividade, teclado, tema), o que foi corrigido, e o que ficou. Inclua as capturas de tela como anexo ou referência. Esta onda é a única que **gera** achados em vez de só resolvê-los — registre-os em `03-ACHADOS.md` como uma seção nova, para não se perderem.
**Arquivos e objetos a tocar:** novo `docs/qa/06-ONDA7-FECHAMENTO.md`; `docs/qa/03-ACHADOS.md` (seção nova).
**Não tocar / armadilhas:** não reescreva os achados existentes de `03-ACHADOS.md` — acrescente.
**Depende de:** 259–280 · **Libera:** 282
**Risco e como reverter:** nenhum.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** os achados novos estão numerados em sequência a partir de A-134.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

---

# ONDA 8 — Higiene: código morto, CI e observabilidade (282–300)

## Etapa 282 — Fazer a auditoria de dependências reprovar sem baseline
**Onda / Severidade / Camada:** 8 / Alta / CI
**Achados resolvidos:** A-041
**Problema hoje:** a etapa 041 trocou `bun audit || true` por um baseline que impede o número de **subir**. Depois das etapas 045 (remover `xlsx`) e 046 (atualizar `react-router-dom`), as altas com correção disponível devem estar resolvidas — mas o baseline continua lá, e baseline que fica é baseline que cresce (foi exatamente o que aconteceu com a A-040).
**Causa raiz:** mecanismo de transição mantido como permanente.
**Caminho recomendado:** rode `bun audit --audit-level=high` e veja o que sobrou. Para cada vulnerabilidade remanescente: se tem correção, aplique; se não tem (como era o caso do `xlsx`), decida — remover o pacote, substituí-lo, ou aceitar com justificativa **datada** no arquivo. Então troque o baseline por `bun audit --audit-level=high` puro, sem `|| true`. **Apague o arquivo de baseline** — deixá-lo vazio convida a repopulá-lo.
**Arquivos e objetos a tocar:** `.github/workflows/ci.yml`; remoção de `scripts/audit-baseline.json` e `scripts/check-audit-baseline.mjs`.
**Não tocar / armadilhas:** o número do `bun audit` difere do `npm audit` (121 contra 30 na medição desta auditoria) porque os lockfiles divergem — a etapa 297 resolve a causa. Até lá, use **sempre** o comando do CI como referência.
**Depende de:** 041, 045, 046, 297 · **Libera:** —
**Risco e como reverter:** o CI pode ficar vermelho se sobrar vulnerabilidade sem correção. Reverter: voltar o baseline.
**Precisa de aprovação humana antes do merge:** **sim** (`.github/workflows/`).
**Como verificar:** o job `security` passa; adicionando um pacote com vulnerabilidade alta numa branch de teste → job falha.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 283 — Triar os 23 achados de SSRF do baseline
**Onda / Severidade / Camada:** 8 / Média / Edge Function
**Achados resolvidos:** A-040
**Problema hoje:** `scripts/audit-edge-baseline.json` tem **23** entradas `R7-ssrf`. A maioria é `fetch` para URL **constante** de provedor de IA (`analyze-call`, `auto-scorecard`, `chatbot-respond`, `translate-utterance`…), ou seja, **falso positivo** da regra, que só verifica se o destino passou pela whitelist. Mas "a maioria" não é "todas", e ninguém separou.
**Causa raiz:** regra que não distingue URL constante de URL vinda do corpo.
**Caminho recomendado:** triagem, uma por uma: se a URL é **constante no código**, não é SSRF — remova do baseline e **ajuste a regra** para não acusar URL literal. Se a URL vem do corpo ou do banco, é SSRF de verdade e precisa passar por `_shared/allowed-hosts.ts` (que existe e já é usado por `bitrix-api` e `voip-trunks-healthcheck`). Documente o veredito de cada uma no corpo da PR. Ao fim, o baseline de `R7-ssrf` deve estar **vazio**, com a regra mais precisa.
**Arquivos e objetos a tocar:** `scripts/audit-edge-functions.ts`, `scripts/audit-edge-baseline.json`, as edges com SSRF real.
**Não tocar / armadilhas:** não remova do baseline sem ler o código da função. Uma SSRF real escondida entre 22 falsos positivos é o pior caso.
**Depende de:** 044 · **Libera:** —
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** `bun scripts/audit-edge-functions.ts` → 0 achados `R7-ssrf`, e o baseline não tem mais nenhuma entrada dessa regra.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 284 — Remover ou reescrever os 29 testes que não testam nada
**Onda / Severidade / Camada:** 8 / Alta / Testes
**Achados resolvidos:** A-048, A-045
**Problema hoje:** **29 de 277** arquivos de teste não importam **nada** do projeto — nem `from '@/…'`, nem `from '../…'`, nem `await import('@/…')`. Reimplementam a lógica e afirmam sobre a própria cópia. Os piores pela promessa que fazem: `src/hooks/__tests__/useSecurityHardening.test.ts` (**863 linhas**, declara casos como `'should enforce agent-scoped access for call_transcriptions'` e `'should block inactive agents from accessing transcriptions'`), os **7** arquivos de `src/__tests__/rls/` (443 linhas, cujo cabeçalho admite usar "mocks do PostgREST"), e `useMFA.test.ts` (testa uma reimplementação com `Math.random()` enquanto o código real usa `crypto.getRandomValues`).
**Causa raiz:** testar RLS e segurança exige banco; escreveu-se o teste possível, com o nome do teste necessário.
**Caminho recomendado:** com o teste de RLS real da etapa 053 verde, **apague** os 7 de `src/__tests__/rls/` e `useSecurityHardening.test.ts` — eles não perdem cobertura real, porque não tinham nenhuma. Para os outros 21, decida um por um: se a lógica copiada existe no projeto, **importe-a** (o teste passa a valer); se não existe, o teste está testando uma ideia, e o certo é remover. `useMFA.test.ts` deve importar `useMFA` e verificar o uso de `crypto.getRandomValues`. **Atalho a evitar:** deixar os 29 "porque teste é bom". Eles produzem 3.289 testes verdes que não impedem nenhuma regressão nas áreas que mais prometem cobrir.
**Além disso (A-045):** o threshold de cobertura de 75% mede **só** `src/lib/**` e `src/hooks/**` (`vitest.config.ts:21`) — `src/components/` (278 arquivos), `src/pages/` (127) e `src/routes/` ficam **fora do denominador**, então "75% de cobertura" não diz nada sobre as telas que o usuário opera. Amplie o `include` para `src/**`, meça o número real, e **ajuste o threshold para o valor medido** em vez de estreitar o escopo de novo — depois aperte em passos. Fazer isso junto com a remoção dos testes-espelho é o momento certo: os dois números mudam na mesma PR e o dono vê o efeito líquido.
**Arquivos e objetos a tocar:** os 29 arquivos de teste; `vitest.config.ts` (`include` e thresholds).
**Não tocar / armadilhas:** **não apague antes** de o teste real existir — a etapa 053 é dependência rígida. E avise no corpo da PR que o número total de testes vai **cair**: isso é melhora, não regressão, e precisa estar escrito.
**Depende de:** 053 · **Libera:** 285
**Risco e como reverter:** baixo (`git revert`).
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** a varredura (`para cada *.test.ts*, há import do projeto?`) devolve zero; `npx vitest run` passa com o total menor.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 285 — Fazer os 31 testes E2E órfãos rodarem, ou removê-los
**Onda / Severidade / Camada:** 8 / Alta / Testes
**Achados resolvidos:** A-049
**Problema hoje:** `playwright.config.ts:4` aponta `testDir: './tests/e2e'`, que tem 4 specs. Existem **7 specs em `e2e/`** na raiz — `calls`, `dashboard`, `extensions-management`, `login`, `observability`, `security-lockout`, `sip-flow` — com **31 `test(`** ao todo, que **nunca executam**. O log do CI confirma: o passo de E2E reporta `7 passed`. Login, fluxo SIP, bloqueio de segurança e gestão de ramais **parecem** cobertos e não são.
**Causa raiz:** duas gerações de suíte E2E coexistindo; a config migrou e os specs antigos ficaram.
**Caminho recomendado:** **leia os 7 antes de decidir.** Provavelmente alguns estão desatualizados (escritos para telas que mudaram) e outros são valiosos — `sip-flow` e `security-lockout` cobrem exatamente o que esta auditoria mostrou estar sem proteção. Para cada um: mova para `tests/e2e/` e conserte, ou apague com justificativa. **Não** aponte `testDir` para a raiz incluindo os 7 de uma vez: eles vão falhar e alguém vai desligar o passo de E2E — que é o padrão de falha da A-041.
**Arquivos e objetos a tocar:** `e2e/*.spec.ts` (mover ou remover), `playwright.config.ts` se necessário.
**Não tocar / armadilhas:** `AGENTS.md` afirma que `bunx playwright test` não sobe por conflito de porta — **isso está desatualizado**: a config sobe o próprio servidor (`:21-25`) e o E2E roda no CI. Corrija essa afirmação na etapa 288.
**Depende de:** 284 · **Libera:** 288
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** **sim** se mexer no workflow.
**Como verificar:** `npx playwright test` roda N testes, todos passando, e `ls e2e/` está vazio ou só com o que foi justificado.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 286 — Um validador só para as edge functions
**Onda / Severidade / Camada:** 8 / Média / Edge Function
**Achados resolvidos:** A-129, A-130
**Problema hoje:** existem **três** validadores no repositório — `_shared/validate.ts`, `_shared/validator.ts` (Zod, com o envelope `{ code, message, fields }`) e `_shared/numeric-schemas.ts` — e nenhum guard exige uso. As etapas 047–049 fizeram 37 funções passarem a validar; se cada uma escolher um validador diferente, o contrato de erro volta a divergir.
**Causa raiz:** três gerações de utilitário convivendo.
**Caminho recomendado:** eleja `_shared/validator.ts` (é o que tem envelope padronizado e Zod) como o oficial, mantenha `numeric-schemas.ts` como complemento dele (o guard `guard-edge-numeric` já o cobra), e **migre** os usos de `validate.ts` — são poucos (`search-calls` é um). Depois **apague** `validate.ts`, para o `deno check` impedir uso novo. Documente a escolha em `docs/agentes/edge-functions.md`.
**Arquivos e objetos a tocar:** as edges que usam `validate.ts`; remoção de `supabase/functions/_shared/validate.ts`; `docs/agentes/edge-functions.md`.
**Não tocar / armadilhas:** não migre e apague na mesma PR se houver muitos consumidores — migre, confirme, apague depois.
**Depende de:** 047, 048, 049, 213 · **Libera:** 287
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** `grep -rn "_shared/validate.ts\|from '../_shared/validate'" supabase/functions/` → vazio; `deno check` limpo em todas as funções.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 287 — Pôr o catálogo de edge functions no CI
**Onda / Severidade / Camada:** 8 / Média / CI
**Achados resolvidos:** A-112
**Problema hoje:** `docs/edge-functions/README.md` é o índice que o dono e os agentes usam como "estado real" — e está errado. `:69` classifica `fuzz-test-runner` como **público com 80 linhas**; o arquivo tem 142 linhas e exige admin (`index.ts:44-62`). `:54` diz que `data-lake-flush` é "público / 135 linhas"; são 177, com `getClaims` e token de cron. O gerador (`scripts/inventario/gerar-catalogo-edges.mjs`) **tem** modo `--check`, e ele **não roda no CI** (`ci.yml:44` só executa `scripts/audit-edge-functions.ts`).
**Causa raiz:** gerador com verificação e verificação não plugada.
**Caminho recomendado:** regenere o catálogo e adicione `node scripts/inventario/gerar-catalogo-edges.mjs --check` ao `ci.yml`, junto dos outros guards. Uma PR que mexa numa edge e não atualize o catálogo passa a falhar — que é exatamente o comportamento desejado para um documento que outros usam como fonte.
**Arquivos e objetos a tocar:** `docs/edge-functions/README.md` (regenerado), `.github/workflows/ci.yml`.
**Não tocar / armadilhas:** regenere **depois** das etapas 004–016 e 054, senão o catálogo registra a classificação antiga de autorização.
**Depende de:** 054, 286 · **Libera:** 288
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** **sim** (`.github/workflows/`).
**Como verificar:** `node scripts/inventario/gerar-catalogo-edges.mjs --check` → exit 0; alterando uma edge sem regenerar → exit 1.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 288 — Corrigir as afirmações erradas do `AGENTS.md`
**Onda / Severidade / Camada:** 8 / Alta / Documentação
**Achados resolvidos:** A-112
**Problema hoje:** `AGENTS.md` é o documento que **todo agente de IA lê antes de trabalhar**, e cinco afirmações dele estão medidas como erradas hoje: (1) diz que o repositório é **privado** — é **público**; (2) diz que `bunx playwright test` **não sobe** por conflito de porta — ele **roda no CI** e passa; (3) diz que `supabase/config.toml` versiona **um só** `verify_jwt` — versiona **5**; (4) manda excluir `coverage/` e `covout/` do grep por serem 466 arquivos versionados — são **0**, já estão no `.gitignore`; (5) diz que **7 scripts** carregam JWT `service_role` de produção versionado — **nenhum** carrega mais.
**Causa raiz:** documento escrito a partir da auditoria de agosto e não reconciliado depois das correções.
**Caminho recomendado:** corrija as cinco, **cada uma com a evidência do estado atual** (comando e saída) num comentário ou numa seção de nota. Acrescente a informação que falta: o repositório é público (consequência para segredos), o guard de integridade do próprio `AGENTS.md` é inócuo em push para `main` (A-044) e o `main` não tem proteção (A-043) — até as etapas 042 e 044 serem feitas. **Este é o documento de maior alavancagem do repositório:** cada afirmação errada aqui se multiplica por cada agente que o lê.
**Arquivos e objetos a tocar:** `AGENTS.md`; `docs/agentes/*.md` onde houver as mesmas afirmações.
**Não tocar / armadilhas:** o guard `check-claude-md-integrity.mjs` compara o tamanho do conjunto `AGENTS.md` + `docs/agentes/` com a base — **uma redução grande falha o guard**. Se você remover muito texto, o guard reclama; ajuste o conteúdo mantendo as seções, ou o guard precisa de uma base nova (e aí explique na PR).
**Depende de:** 285, 287 · **Libera:** 289
**Risco e como reverter:** nenhum.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** `node scripts/ci/check-claude-md-integrity.mjs` → exit 0; e cada uma das cinco correções tem o comando de evidência ao lado.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 289 — Guard contra timestamp duplicado de migration
**Onda / Severidade / Camada:** 8 / Média / CI
**Achados resolvidos:** A-094, A-122
**Problema hoje:** dois pares de migrations compartilham timestamp (`20250102000000` e `20261122230000`), e o timestamp é a chave de versão no ledger. A etapa 133 corrige os pares; nada impede o próximo.
**Causa raiz:** ausência de verificação.
**Caminho recomendado:** uma linha num script novo (ou no guard existente): `ls supabase/migrations/ | cut -d_ -f1 | sort | uniq -d` — se houver saída, falha. Adicione ao `ci.yml`. Aproveite e verifique também: nome de arquivo fora do padrão, e migration com timestamp **no futuro** (que o CLI aplica fora de ordem).
**Além disso (A-122):** na mesma PR, endureça o `ci.yml`, que é o pipeline que publica produção e carrega os secrets do ambiente `e2e`. Hoje ele **baixa e executa script remoto não fixado duas vezes por run** (`:75` e `:85`: `curl -fsSL https://deno.land/install.sh | sh`) e referencia actions por **tag móvel** (`:22` `actions/checkout@v4`, `:25` `oven-sh/setup-bun@v2`, `:108` e `:119-120` `actions/upload-artifact@v4`) — enquanto `inventario-estado-semanal.yml:46,90,115` já fixa por SHA. Troque: use a action oficial `denoland/setup-deno` fixada por SHA em vez do `curl | sh`, e fixe as quatro actions do `ci.yml` por SHA, como o outro workflow já faz.
**Arquivos e objetos a tocar:** novo `scripts/ci/check-migrations.mjs`; `.github/workflows/ci.yml`.
**Não tocar / armadilhas:** o guard precisa rodar **antes** do passo de aplicação de migrations, se houver.
**Depende de:** 133, 288 · **Libera:** —
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** **sim** (`.github/workflows/`).
**Como verificar:** exit 0 no estado corrigido; criando um arquivo com timestamp duplicado → exit 1.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 290 — Documentar as 24 variáveis de ambiente que o sistema usa
**Onda / Severidade / Camada:** 8 / Média / Documentação
**Achados resolvidos:** A-097
**Problema hoje:** 24 variáveis são lidas em runtime (`import.meta.env.*` em `src/`, `Deno.env.get()` em `supabase/`) e **não estão no `.env.example`** — 10 delas são segredos: `ELEVENLABS_API_KEY`, `RESEND_API_KEY`, `SIP_PASSWORD`, `SIP_SERVER`, `SIP_USERNAME`, `MS_CLIENT_SECRET`, `MS_CLIENT_ID`, `MS_TENANT_ID`, `WAVOIP_TOKEN`, `CLEANUP_CRON_TOKEN`, `COACHING_CRON_TOKEN`, `DATA_LAKE_CRON_TOKEN`, `DIALER_CRON_TOKEN`, `RECORDINGS_CRON_TOKEN`, `BITRIX_WEBHOOK_URL`, `CORS_EXTRA_ORIGINS`, `WEBAUTHN_ALLOWED_ORIGINS`, `LDAP_ALLOW_SELF_SIGNED`, `ADMIN_EMAIL`, `FROM_EMAIL`, `ELEVENLABS_AGENT_ID`, `VITE_TURN_URL`, `VITE_TURN_USER`, `VITE_TURN_CRED`. Quem for recriar o ambiente não tem como saber o que configurar, e a funcionalidade falha em silêncio.
**Causa raiz:** `.env.example` não é atualizado quando uma edge passa a ler um segredo novo, e nenhum guard confere.
**Caminho recomendado:** documente as 24 com **nome, onde é usada, se é obrigatória e o que quebra sem ela** — e **nunca** o valor. Para as de edge function, registre também que elas vivem nos secrets da função (`supabase secrets set`), não no `.env` do front. Escreva um guard (`scripts/ci/check-env-example.mjs`) que extrai os nomes do código e compara com o arquivo — assim a próxima variável nova é cobrada automaticamente.
**Arquivos e objetos a tocar:** `.env.example`; novo `scripts/ci/check-env-example.mjs`; `.github/workflows/ci.yml`.
**Não tocar / armadilhas:** **nenhum valor real no arquivo**, nem de exemplo que pareça real. Use `<obtenha no painel do provedor>`.
**Depende de:** 289 · **Libera:** 291
**Risco e como reverter:** nenhum.
**Precisa de aprovação humana antes do merge:** **sim** (`.github/workflows/`).
**Como verificar:** o guard passa; adicionando um `Deno.env.get('NOVA')` numa edge sem documentar → falha.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 291 — Remover do `.env.example` as 28 variáveis de uma stack que não existe
**Onda / Severidade / Camada:** 8 / Média / Documentação
**Achados resolvidos:** A-097
**Problema hoje:** `.env.example` documenta 28 variáveis de um projeto que este não é: `NEXT_PUBLIC_API_URL`/`NEXT_PUBLIC_APP_VERSION` (`:3-4` — o projeto é **Vite**, não Next), `REDIS_*` (`:35-38`), `JWT_SECRET`/`JOB_ENCRYPTION_KEY` (`:40-42`), `CALLS_SERVICE_URL`/`CONTACTS_SERVICE_URL` (`:48-49`), `STORAGE_*` (`:52-55`), `SENTRY_DSN`/`DD_API_KEY` (`:57-60`), `TEST_*` (`:63-65`), `FEATURE_*` (`:67-69`). Catorze foram verificadas com `git grep` em todo o repositório: **0 ocorrências cada**. O arquivo faz o projeto parecer ter Redis, fila, Sentry e Datadog que não existem, e esconde as 24 que importam.
**Causa raiz:** template copiado de um boilerplate de backend Node e nunca podado.
**Caminho recomendado:** apague as 28. Antes, rode `git grep` em cada uma para confirmar — **não confie na lista desta auditoria sem reverificar**, porque o código pode ter mudado. Se alguma estiver em uso, mantenha e documente. `SENTRY_DSN`/`DD_API_KEY` merecem uma nota: o monitoramento de erro do front é a etapa 230, e se o dono optar por um serviço, a variável volta — com implementação.
**Arquivos e objetos a tocar:** `.env.example`.
**Não tocar / armadilhas:** não apague `VITE_SUPABASE_URL` nem `VITE_SUPABASE_PUBLISHABLE_KEY` — são as duas que o build e os testes exigem (etapa 214).
**Depende de:** 290 · **Libera:** 292
**Risco e como reverter:** nenhum.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** o guard da etapa 290 passa nos dois sentidos (nada usado sem documentar, nada documentado sem uso).
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 292 — Corrigir o gerador de inventário de rotas
**Onda / Severidade / Camada:** 8 / Média / Scripts
**Achados resolvidos:** A-113, A-051
**Problema hoje:** `inventario/estado/rotas.json` declara `src/pages/admin/SecurityAuditDashboard.tsx` como "página órfã que nenhuma rota alcança". **É falso:** `src/routes/protectedRoutes.tsx:85` a importa (`lazy(() => import("@/pages/admin/SecurityAuditDashboard"))`) e `:197` a roteia em `/admin/security-audit`. Como `AGENTS.md` manda usar esse inventário como índice **antes** de usar `grep`, o erro se propaga para todo agente que confiar nele.
**Causa raiz:** o gerador (`scripts/inventario/gerar-rotas.mjs`) não reconhece a forma de import usada, ou não casa o nome da constante com o `element:` da rota.
**Caminho recomendado:** leia o gerador e descubra por que ele perde essa página — o padrão `const X = lazy(() => import("@/pages/..."))` seguido de `{ path: "...", element: X }` exige casar a constante, não o caminho. Corrija, regenere, e **adicione um caso de teste** com exatamente essa forma, para não regredir. Verifique se há outros falsos positivos ou negativos comparando o total de rotas com a contagem direta (`grep -c "path:"`).
**Além disso (A-051):** `.github/workflows/inventario-estado-semanal.yml:156-162` roda `gh pr merge --auto --squash` com `continue-on-error: true`, mas o repositório tem `allow_auto_merge: false` — o `gh` falha, o `continue-on-error` engole, e **o PR semanal de inventário é aberto e nunca mescla**: a "documentação de estado automática" para de atualizar sem nenhum alerta. Duas saídas: ligar o auto-merge no repositório (clique no painel, e aí o passo funciona), ou **remover o passo** e assumir que o PR é mesclado à mão. Escolha uma e remova o `continue-on-error`, que é o que esconde a falha.
**Arquivos e objetos a tocar:** `scripts/inventario/gerar-rotas.mjs` + teste; `inventario/estado/rotas.json` (regenerado); `.github/workflows/inventario-estado-semanal.yml`.
**Não tocar / armadilhas:** esta é a terceira vez que um detector de import ingênuo produz conclusão errada neste repositório (ver as três armadilhas nas instruções). Teste o gerador contra **todas** as formas: `lazy()`, import multilinha, `await import()`, re-export por barrel.
**Depende de:** 291 · **Libera:** 293
**Risco e como reverter:** nenhum.
**Precisa de aprovação humana antes do merge:** **sim** (toca `.github/workflows/`).
**Como verificar:** `npm run inventario:rotas` → `paginas_orfas` não inclui `SecurityAuditDashboard.tsx`; o total de rotas bate com a contagem direta.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 293 — Decidir o destino dos 15 scripts órfãos
**Onda / Severidade / Camada:** 8 / Média / Scripts
**Achados resolvidos:** A-115
**Problema hoje:** nenhuma referência em `package.json`, em `.github/` nem em outro script para: `apply-call-volume-fix.mjs`, `check-cfmlmc-db.mjs`, `check-data.mjs`, `check-rls.mjs`, `clean-hold-events.mjs`, `cleanup-and-count.mjs`, `fix-user-profile.mjs`, `full-audit.sh`, `inspect-schema.mjs`, `inventario/gerar-catalogo-edges.mjs`, `test-api-direct.mjs`, `test-auth-flow.mjs`, `test-authenticated-queries.mjs`, `test-call-volume-rpc.mjs`, `test-dashboard-rpcs.mjs`, `test-rls-access.mjs`, `test-validate-ip.mjs`. A etapa 051 já tirou o host de produção dos quatro destrutivos — o risco agudo está contido; sobra a decisão.
**Causa raiz:** scripts de diagnóstico pontual commitados e esquecidos.
**Caminho recomendado:** três grupos. (1) `inventario/gerar-catalogo-edges.mjs` **passa a ser chamado pelo CI** na etapa 287 — não é órfão. (2) Os de **diagnóstico** (`check-data`, `check-rls`, `inspect-schema`, `test-*`) são úteis para quem tem acesso ao banco: mova para `scripts/diagnostico/` com um README dizendo o que cada um faz e que exigem variáveis de ambiente. (3) Os **destrutivos** (`cleanup-and-count`, `clean-hold-events`, `fix-user-profile`, `apply-call-volume-fix`): pergunte ao dono se ele os usa; se não, **apague** — script destrutivo esquecido num repositório público é risco sem contrapartida.
**Arquivos e objetos a tocar:** `scripts/` (reorganização e remoções), novo `scripts/diagnostico/README.md`.
**Não tocar / armadilhas:** confirme com `grep` em todo o repositório antes de apagar — inclusive em `docs/`, onde um runbook pode citar o script.
**Depende de:** 051, 287, 292 · **Libera:** 294
**Risco e como reverter:** baixo (`git revert`).
**Precisa de aprovação humana antes do merge:** **sim** (remove capacidade de diagnóstico).
**Como verificar:** `ls scripts/*.mjs` só tem os chamados pelo CI ou pelo `package.json`; o README de diagnóstico descreve cada um dos mantidos.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 294 — Remover os índices que nunca são usados
**Onda / Severidade / Camada:** 8 / Média / Banco
**Achados resolvidos:** A-110
**Problema hoje:** o re-lint de produção de 2026-11-22 (item E2 das pendências) aponta **250 `unused_index`**. Cada índice custa em toda gravação da tabela — e `call_sessions`, que passa a receber uma linha por chamada (etapa 058), tem 7.
**Causa raiz:** índices criados por antecipação.
**Caminho recomendado:** **não remova com base no lint de uma base sem uso.** Espere a operação ter volume (a etapa 242 estabelece a medição), e então: `SELECT relname, indexrelname, idx_scan, pg_size_pretty(pg_relation_size(indexrelid)) FROM pg_stat_user_indexes WHERE idx_scan = 0 ORDER BY pg_relation_size(indexrelid) DESC` → comece pelos maiores. Remova em lotes de 10, com `DROP INDEX IF EXISTS`, e **meça depois de cada lote**. Mantenha sempre: índices de chave primária, únicos (eles impõem restrição, não só aceleram) e os que suportam FK.
**Arquivos e objetos a tocar:** novas migrations, em lotes.
**Não tocar / armadilhas:** **nunca** remova índice `UNIQUE` achando que é só desempenho — ele garante integridade (foi o caso de `email_tickets.message_id`, etapa 015). E `idx_scan = 0` pode significar "a consulta que o usaria ainda não rodou neste período de estatística": confira `pg_stat_reset` recente.
**Depende de:** 242 · **Libera:** 295
**Risco e como reverter:** médio. Reverter: recriar o índice (guarde o `indexdef` de cada um removido na própria migration, em comentário).
**Precisa de aprovação humana antes do merge:** **sim** (DDL em produção).
**Como verificar:** por lote, nenhuma consulta das telas principais piorou (`EXPLAIN ANALYZE` antes e depois), e o tamanho do banco caiu.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 295 — Decidir o destino dos 17 módulos de segurança sem importador
**Onda / Severidade / Camada:** 8 / Alta / Frontend
**Achados resolvidos:** A-099
**Problema hoje:** os 17 arquivos de `src/lib/security/` (CSP, HSTS, `https-enforcer`, `rate-limiter`, `input-sanitizer`, `xss-prevention`, `csrf-token`, `sql-sanitizer`, `jwt-handler`) são importados **somente** pelo barrel `src/lib/security/index.ts`, e `git grep "getSecurityHeaders|buildCSPHeader|DEFAULT_SECURITY_HEADERS" -- src/` fora de testes retorna **apenas as próprias definições** (`helmet-config.ts:16,27`) e o re-export (`index.ts:10`). **Nenhum importador de produção** — e 4 arquivos de teste verdes dão a impressão de que os cabeçalhos estão aplicados.
**Causa raiz:** o módulo foi escrito como se houvesse um servidor Node com helmet; numa SPA estática os cabeçalhos só podem vir da plataforma — que é o que as etapas 025 e 026 fazem.
**Caminho recomendado:** separe o que tem destino do que não tem. Os de **cabeçalho** (`helmet-config`, CSP, HSTS, `https-enforcer`) foram substituídos pelo `vercel.json` das etapas 025–026: **remova**, e deixe no `vercel.json` um comentário apontando que a política vive ali. Os de **sanitização** (`input-sanitizer`, `xss-prevention`, `sql-sanitizer`) podem ter uso legítimo — verifique se o código valida entrada em algum lugar e, se sim, **ligue-os**; se a validação vive toda no Zod das edges, remova. `rate-limiter` no cliente não protege nada (o atacante controla o cliente): remova, o freio é o `_shared/rate-limit.ts`. `jwt-handler` e `csrf-token`: o Supabase cuida dos dois; remova. **Decida um por um e escreva a razão de cada decisão na PR** — são ~700 linhas, e apagar em bloco sem ler é como o problema inverso começa.
**Arquivos e objetos a tocar:** `src/lib/security/` e seus testes; `vercel.json` (comentário).
**Não tocar / armadilhas:** não apague antes de as etapas 025 e 026 estarem **no ar e verificadas** — senão você remove a intenção documentada sem ter a implementação real.
**Depende de:** 025, 026, 294 · **Libera:** 296
**Risco e como reverter:** baixo (`git revert`).
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** `npx tsc --noEmit` → 0 erros; `npx vitest run` passa (com menos testes); e os cabeçalhos continuam sendo servidos (`curl -sI`).
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 296 — Remover os cinco componentes órfãos
**Onda / Severidade / Camada:** 8 / Baixa / Frontend
**Achados resolvidos:** A-114
**Problema hoje:** **1.094 linhas** sem nenhuma referência (varredura que considerou `lazy()`, import multilinha e `await import()`): `src/components/alerts/AlertsDropdown.tsx` (285), `src/components/contacts/ContactAlertsDropdown.tsx` (250), `src/components/notifications/NotificationBell.tsx` (170), `src/components/lazy/LazyComponent.tsx` (18) — os três primeiros substituídos por `UnifiedNotificationDropdown`, o único montado (`AppLayout.tsx:80`) — e `src/components/calls/WebRTCCall.tsx` (371), que tem **só o próprio teste** como consumidor. Quem for mexer em notificação tem três chances de editar o arquivo errado, e a suíte reporta cobertura de código que não roda.
**Causa raiz:** substituição feita sem remover o antecessor.
**Caminho recomendado:** **reconfirme** a ausência de consumidor com todas as formas de import (é a armadilha nº 1) e remova os cinco, junto com os testes que só os exercitam. `WebRTCCall.tsx` merece uma segunda olhada: 371 linhas de WebRTC podem conter algo que `useSipCall` não faz — leia antes de apagar e, se houver, registre no progresso em vez de perder.
**Arquivos e objetos a tocar:** remoção dos 5 componentes e dos testes correspondentes.
**Não tocar / armadilhas:** `LazyComponent.tsx` tem 18 linhas e nome genérico — confirme que nenhum `lazy()` o usa indiretamente.
**Depende de:** 295 · **Libera:** 297
**Risco e como reverter:** baixo (`git revert`).
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** `npx tsc --noEmit` → 0 erros; `npx vite build` conclui; `npx vitest run` passa.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 297 — Um lockfile só, num registry que o dono controla
**Onda / Severidade / Camada:** 8 / Alta / Infraestrutura
**Achados resolvidos:** A-118
**Problema hoje:** três lockfiles: `bun.lock` (221 kB, **o que o CI usa** — `ci.yml:30`), `bun.lockb` (199 kB, formato binário antigo do bun) e `package-lock.json` (408 kB, 793 pacotes em `registry.npmjs.org`). E `grep -c 'europe-west1-npm.pkg.dev' bun.lock` → **138** (+5 em `europe-west4`), apontando para `lovable-core-prod/sandbox-npm-cache` — um Artifact Registry privado da Lovable. **Se esse cache for desligado ou rotacionado, o build do CI para** e ninguém sabe por quê. Além disso, `npm install` local e `bun install` no CI instalam árvores **diferentes** — foi o que produziu os dois números divergentes de `audit` (121 contra 30).
**Causa raiz:** o lock foi gerado dentro do sandbox da Lovable, que proxia o npm, e commitado com as URLs do cache interno; a migração npm → bun não removeu o lock antigo.
**Caminho recomendado:** decida com o dono qual gerenciador é o oficial — o CI usa bun, então o caminho de menor atrito é **bun**. Então: (1) apague `bun.lockb` (formato morto); (2) **regenere `bun.lock` fora do sandbox da Lovable**, para as URLs apontarem para `registry.npmjs.org`; (3) decida sobre `package-lock.json` — mantê-lo exige disciplina de atualizar os dois, então o melhor é removê-lo e documentar que o projeto usa bun. **Antes de apagar o `package-lock.json`, confirme que `bun install` instala tudo**: a auditoria de agosto mediu `bun install` recuperando 393 pacotes contra 503 do `npm ci`, deixando de fora `fast-check`, `@dnd-kit/core`, `jspdf`, `web-vitals` e `react-markdown`. Se isso ainda acontecer, **pare**: o problema é maior que o lockfile.
**Arquivos e objetos a tocar:** `bun.lock` (regenerado), remoção de `bun.lockb` e possivelmente `package-lock.json`; `AGENTS.md` (qual gerenciador é oficial).
**Não tocar / armadilhas:** **não** apague `package-lock.json` antes de confirmar que `bun install` instala as 503 dependências. Ele é hoje a única forma de instalar sem o registry da Lovable — e foi como esta auditoria conseguiu rodar.
**Depende de:** 296 · **Libera:** 282, 298
**Risco e como reverter:** **alto** — mexer no lockfile pode quebrar o CI e o build. Faça numa PR isolada e confira o CI verde antes de mergear.
**Precisa de aprovação humana antes do merge:** **sim** (infraestrutura de build).
**Como verificar:** `grep -c 'pkg.dev' bun.lock` → **0**; `bun install && bun run build` conclui; `npx vitest run` passa; e o CI fica verde na própria PR.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 298 — Separar dependências de produção das de desenvolvimento
**Onda / Severidade / Camada:** 8 / Baixa / Infraestrutura
**Achados resolvidos:** A-119
**Problema hoje:** estão em `"dependencies"`: `typescript` (`:100`), `vite` (`:102`), `vitest` (`:103`), `jsdom` (`:78`), `@vitest/coverage-v8` (`:67`), `@testing-library/react|dom|jest-dom` (`:60-62`), `fast-check` (`:74`), `lovable-tagger` (`:82`), `@types/*` (`:63-65`), `postcss`/`autoprefixer`/`tailwindcss`. Também `isomorphic-dompurify` (`:77`) e `react-is` (`:88`), sem nenhum import em `src/`. Consequência prática: `npm audit --omit=dev` continua apontando vulnerabilidades de ferramenta porque elas estão classificadas como produção — o que atrapalha exatamente o gate da etapa 282.
**Causa raiz:** `bun add` sem `-d`, repetidamente.
**Caminho recomendado:** mova as de ferramenta para `devDependencies`. **Cuidado com duas:** `tailwindcss` e `postcss` são usadas no **build**, e se o ambiente de build instalar só produção, o CSS não é gerado — confirme como a plataforma de deploy instala antes de mover essas duas. `isomorphic-dompurify` e `react-is`: confirme com `git grep` e remova se de fato não forem usadas (`react-is` pode ser dependência transitiva declarada por engano).
**Arquivos e objetos a tocar:** `package.json`, lockfile.
**Não tocar / armadilhas:** mover `tailwindcss` para dev **pode quebrar o deploy** e o sintoma é sutil: a aplicação sobe sem estilo. Teste o build com `--omit=dev` antes de mergear.
**Depende de:** 297 · **Libera:** 299
**Risco e como reverter:** médio.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** `npm ci --omit=dev && npx vite build` conclui **com** CSS; `npm audit --omit=dev` passa a refletir só o que vai para produção.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 299 — Remover a configuração morta de TypeScript e de Vite
**Onda / Severidade / Camada:** 8 / Baixa / Infraestrutura
**Achados resolvidos:** A-120, A-121
**Problema hoje:** dois casos. (1) `tsconfig.json` não tem `references` nem `files` (só `include: ["src"]`, `:26-27`), então `tsc --noEmit` **nunca lê** `tsconfig.app.json` nem `tsconfig.node.json` — e `tsconfig.app.json:27` declara `"types": ["vitest/globals"]` contra `"types": ["vite/client","node"]` do principal. Quem editar o arquivo achando que muda o type-check não muda nada. (2) `vite.config.ts:16-18` tem `preview: { historyApiFallback: true }` — chave do **webpack-dev-server**, que o Vite não reconhece (ele faz fallback de SPA por padrão via `appType`).
**Causa raiz:** estrutura de solution-style tsconfig do template Vite abandonada pela metade, e uma cópia de config de outro bundler.
**Caminho recomendado:** **ou** apague os dois tsconfigs extras, **ou** ligue-os com `references` — a primeira é mais simples e o projeto não precisa de build separado para `node`. Apague a chave `historyApiFallback`, e **confirme que o preview continua servindo rota profunda** (é o que o Playwright usa, `playwright.config.ts:21-25`): se quebrar, o certo é `appType: 'spa'` explícito.
**Arquivos e objetos a tocar:** remoção de `tsconfig.app.json` e `tsconfig.node.json`; `vite.config.ts`.
**Não tocar / armadilhas:** depois de apagar os tsconfigs, rode `npx tsc --noEmit` **e** `npx vitest run` — se algum deles dependia de um `types` declarado lá, o erro aparece agora.
**Depende de:** 298 · **Libera:** 300
**Risco e como reverter:** baixo.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** `npx tsc --noEmit` → 0 erros; `npx vite build && npx vite preview` serve `/history` direto sem 404; `npx playwright test` passa.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

## Etapa 300 — Refazer a medição de estado e aposentar os documentos que mentem
**Onda / Severidade / Camada:** 8 / Alta / Documentação
**Achados resolvidos:** A-112 e fechamento geral
**Problema hoje:** ao fim das 299 etapas, **todo documento de estado deste repositório estará desatualizado** — inclusive os cinco que esta auditoria produziu. E o padrão que a auditoria mediu continuaria valendo: `SYSTEM_FEATURES.md` com 185 itens e **zero** pendentes, datado de 2026-03-15; 53 ADRs sem nenhum "Proposto" ou "Superado"; `ESTADO_ATUAL.md` de agosto descrevendo um sistema que já não existe. **Os documentos que declaram conclusão são os menos precisos, e o que rastreia pendências é o mais preciso** — é o inverso do que a leitura casual sugere, e é o que precisa mudar.
**Causa raiz:** documento de estado escrito uma vez e nunca reconciliado, sem mecanismo que o force.
**Caminho recomendado:** três coisas, nesta ordem.
1. **Refaça a medição**, não a narrativa: rode os mesmos comandos desta auditoria (type-check, lint, vitest, guards, build, orçamento, `npm audit`, as varreduras de gravação cega, de `catch` e de botão sem handler) e registre os números em `docs/qa/07-ESTADO-APOS-PLANO.md`. Números medidos, com o comando ao lado.
2. **Aposente o que não se mantém:** marque `ESTADO_ATUAL.md` e `SYSTEM_FEATURES.md` como **históricos** no topo, com a data e um ponteiro para o documento novo — não os apague (são registro), mas pare de deixá-los parecer atuais. Nos ADRs, acrescente status real onde a decisão foi superada.
3. **Deixe o mecanismo:** o que torna `docs/audits/pendencias-2026-07.md` o documento mais confiável do repositório é que ele **é mantido**. Escreva, em `AGENTS.md`, que todo documento de estado precisa trazer a data e o comando que produziu cada número — e que documento sem isso é histórico, não estado.
**Arquivos e objetos a tocar:** novo `docs/qa/07-ESTADO-APOS-PLANO.md`; `ESTADO_ATUAL.md` e `SYSTEM_FEATURES.md` (cabeçalho de histórico); `docs/adr/` (status); `AGENTS.md`; `docs/qa/05-PROGRESSO.md` (fechamento).
**Não tocar / armadilhas:** **não declare pronto o que não foi verificado em execução.** A regra do repositório é explícita: "pronto" = PR mergeada + deploy confirmado + comportamento verificado. Se 40 das 300 etapas ficaram parciais por falta de acesso ao banco, o documento diz **40 parciais** — essa é a informação mais valiosa que ele pode ter, e é o oposto do que os documentos atuais fazem.
**Depende de:** 001–299 · **Libera:** —
**Risco e como reverter:** nenhum.
**Precisa de aprovação humana antes do merge:** não.
**Como verificar:** o documento novo tem, para cada número, o comando que o produziu e a data; `05-PROGRESSO.md` tem as 300 linhas marcadas com o estado real de cada uma; e a contagem de etapas concluídas, parciais e não feitas **bate** com o checklist.
**Checklist de conclusão:**
[ ] mudança aplicada só nos arquivos listados
[ ] typecheck, lint e testes dos arquivos tocados passam
[ ] verificação acima executada, com a evidência registrada
[ ] deploy confirmado, quando se aplica
[ ] etapa marcada no arquivo de progresso

---

## Backlog — achados cobertos, mas com trabalho remanescente além das 300 etapas

As 300 etapas cobrem **todos** os 9 achados Críticos e os 55 Altos. O que segue é trabalho real que não caberia como etapa atômica verificável e que o dono deve decidir se vira um plano próprio:

| Tema | Por quê ficou fora | Achados |
|---|---|---|
| Implementar o papel `viewer` de verdade no banco | exige revisar ~255 policies uma a uma; é um projeto, não uma etapa (a etapa 091 decide **se** vale) | A-087 |
| Localização da interface (3 idiomas) | a etapa 269 remove a declaração falsa; fazer i18n de verdade são ~130 páginas de tradução | A-112 |
| Particionar as tabelas de log | medido e **corretamente adiado** (968 kB / 341 linhas); reabrir quando qualquer uma passar de 1 M de linhas | item B1 das pendências |
| Consolidar as 323 `multiple_permissive_policies` | a etapa 256 mede e começa; o conjunto inteiro é um projeto de banco | A-090 |
| Contrato Deno para as 68 edges sem `validate()` | as etapas 047–049 cobrem as 37 sem validação nenhuma; as demais validam à mão e funcionam | item C4 das pendências |
| `password_hibp_enabled` (proteção de senha vazada) | a API recusa com `HTTP 402 entitlement_required` — exige plano pago, é decisão de custo | item E2 das pendências |
| Teste de regressão visual | a etapa 270 captura e olha; comparação automática de pixel gera falso positivo e precisa de infraestrutura própria | — |
