# Prod Readiness — adm01-debug/Hello_V3

> Relatório de prontidão de produção gerado em 2026-11-13 sobre a main final `25e39c40` (squash das PRs #28→#32). Última atualização 2026-11-13 22:56 local.
> Formato: cada funcionalidade com **OK** (prova ao lado) ou **BLOQUEADO** (erro exato + o que falta). Zero itens "não verificado".

---

## 1. Estado global

| Critério | Estado | Evidência |
|---|---|---|
| CI na main | **OK** | check-runs de `75a5df1`, `4060612d`, `feeb678` e `25e39c4` (final): `Lint • Type-check • Test • Build` = success; `Security audit` = success (run `43535599150`, head `25e39c4`) |
| Deploy produção | **OK** | deployments Production: `7778038501` sha=4060612d, `7778849478` sha=feeb678, `7779947391` sha=25e39c4 → todos `success` |
| PRs abertas | 0 | consulta 2026-11-13 22:53Z |
| Baseline testes | **OK** | CI reporta Test success em todos os merges; nenhum teste removido ou afrouxado no diff dos PRs |
| Smoke HTTP (home) | **OK** | `https://hello-v3.vercel.app/` → HTTP 200, `<title>CallCenter Pro – Gestão Inteligente de Call Center</title>` (2026-11-13) |

---

## 2. Pipeline de contexto (destrave desta sessão)

| Item | Estado | Evidência |
|---|---|---|
| Fix query de grants (PR #28) | **OK** | `snapshot.py` usa `aclexplode` (~608-629); local 6.3s vs 131.5s, paridade 1952 rows, 109 unittests. Squash `8ed39f4` |
| Fix guard de segredos (PR #29) | **OK** | `contexto.yml:251` `grep -rIPl '(?!\[REDACTED\]@)'`; ignora senha já redigida. Squash `75a5df1` |
| Secrets `SUPABASE_DB_URL`/`SUPABASE_ACCESS_TOKEN` | **OK** | gravados no repo (projeto `cfmlmcdyjuotqobjapng`, região us-east-2) |
| Publicar `docs/contexto/supabase/` na branch `contexto` | **OK** | provado fim-a-fim em 4 heads: run `43513925340` (head 75a5df1) → commit `64841581`; run `43530608132`/`43527196190` (head feeb678) → commits `0fd1ede`/`cd84c6a`; run `43539268796` (head 25e39c4, head final) = **success** → commit `bf2780e` na branch `contexto`, com `docs/contexto/supabase/` completo (grants.md, policies.md, tables.md, lints.md, snapshot.json etc.) |

---

## 3. Inventário de funcionalidades (linha de base "sem perda")

### 3.1 Rotas / telas (fonte: `rotas.json` + `src/routes/*.tsx`)
| Grupo | Qtd | Estado |
|---|---|---|
| URLs de front catalogadas | 104 | **OK** (`resumo.urls=104`, lazy=103) |
| Rotas protegidas (`protectedRoutes.tsx`) | 94 | **OK** (94 `path:`) |
| Rotas públicas (`publicRoutes.tsx`) | 11 | **OK** (login, register, forgot-password, reset-password, verify-email, unauthorized, landing, pricing, vs/3cplus, status, marketplace) |
| Itens de menu | 79 | **OK** (`resumo.itens_menu=79`) |
| Rotas HTTP backend | 12 | **OK** (`resumo.rotas_http_backend=12`) |

### 3.2 Edge functions (fonte: `supabase/functions/`)
| Item | Qtd | Estado |
|---|---|---|
| Edge functions reais | 96 | **OK** (`supabase/functions` com 98 dirs; `_shared`/`__tests__` não são functions) |
| Categorias | — | voz, sentimento, VoIP/recomendações, DNC, SLA, geo/IP, webauthn, whatsapp, CRM, scorecards (lista completa em `edge-functions.json`) |

### 3.3 Banco de dados (fonte: `banco.json` na branch `contexto` + `supabase/migrations`)
| Item | Qtd | Estado |
|---|---|---|
| Tabelas catalogadas | 171 | **OK** (`banco.json`) |
| Migrations no repo | 207 | **OK** (dir `supabase/migrations`) |
| Migrations com `CREATE POLICY` | 124 | **OK** (grep) |
| Migrations com `ENABLE ROW LEVEL SECURITY` | 73 | **OK** (grep) |
| Tabelas sem RLS no catálogo de código | 2 | **OK-info** (`migration_rollbacks`, `schema_migrations` — controle de migração; `banco.json` é visão do código, `rls=false` pode ser falso no vivo) |
| RLS no banco vivo | **OK** | `tables.md` do novo snapshot vivo: **0 tabelas com RLS = não**; 442 policies em 159 tabelas (`policies.md`) |
| Cron jobs no banco | 7 | **OK** (`cron.md`/`cron-runs.md`) |
| `rls_audit_logs` | **OK** | presente no snapshot |

### 3.4 Workflows / integrações
| Item | Estado |
|---|---|
| Workflows ativos | **OK** (3: `ci.yml`, `contexto.yml` cron `3-59/10`, `inventario-estado-semanal.yml` cron `23 10 * * 1`) |
| Integrações (Bitrix, elevenlabs, whatsapp, telefonia VoIP, CRM, fax, webauthn) | **OK** (edge functions dedicadas) |

---

## 4. Qualidade de código (req 5)
| Checagem | Resultado |
|---|---|
| TODO/FIXME/WIP em `src` | **OK** — nenhum marcador real (hits são texto PT-BR "Todos") |
| `test.only`/`describe.only`/`.skip(` | **OK** — nenhum |

---

## 5. BLOQUEADO (não resolvido nesta sessão)
1. **Cron `update-contact-name-daily` falha diariamente** — `cron-runs.md`: `OPTIMISTIC_LOCK_CONFLICT` (registro alterado por outro usuário) em 11/12/13 nov. Causa raiz não corrigida nesta sessão (fora de escopo).
2. **Lint ALTA `view_security_definer` em `public.financial_impact_daily`** — `lints.md`: view sem `security_invoker` executa como owner e ignora RLS das tabelas base. Correção = DDL/migration em produção (regra 8 → PR sem merge).
3. **Erro no manifest: custom-hostname** — `manifest.json`: `HTTP 400 em /projects/cfmlmcdyjuotqobjapng/custom-hostname`. Config de domínio, não bloqueia app.
4. **Projeto morto `dyibdjwuoibwwpidgsxu.supabase.co`** — apontado em `.env` versionado, cron `data-lake-flush` e docs, mas DNS não resolve; produção usa `cfmlmcdyjuotqobjapng`. Fora de escopo (mudança de arquitetura/dado).

---

## 6. Correções entregues nesta sessão (PR + evidência)
- **PR #28** — rewrite da query de grants (`snapshot.py` via `aclexplode`): 131.5s → 6.3s, paridade 1952 rows, 109 unittests. Squash `8ed39f4`.
- **PR #29** — guard de segredo ignora senha redigida (`contexto.yml:251` com lookahead). Squash `75a5df1`.
- **PR #30** — cria `docs/prod-readiness.md` (inventário completo). Squash `4060612d`.
- **PR #31** — atualiza relatório c/ BLOQUEADOs (cron `OPTIMISTIC_LOCK_CONFLICT`, lint `view_security_definer`, manifest custom-hostname 400, projeto morto). Squash `feeb678`.
- **PR #32** — evidência de publicação mais recente. Squash `25e39c4`.
- **PR #33** — fecha relatório final: main `25e39c4`, publicação `bf2780e`, smoke HTTP 200.
- Merges via REST (`PUT /pulls/N/merge` squash); branches apagadas.
- CI verde + deploy Production success em `75a5df1`, `4060612d`, `feeb678` e `25e39c4`.

---
_Relatório automático — evidências: check-runs/deployments via API do GitHub; catálogo via branch `contexto` (commit bf2780e); código na main `25e39c4`._

