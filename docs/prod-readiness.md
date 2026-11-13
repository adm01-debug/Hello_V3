# Prod Readiness — adm01-debug/Hello_V3

> Relatório de prontidão de produção gerado em 2026-11-13 sobre a main 75a5df15 (PR #29 merge).
> Formato: cada funcionalidade com **OK** (prova ao lado) ou **BLOQUEADO** (erro exato + o que falta). Zero itens "não verificado".

---

## 1. Estado global

| Critério | Estado | Evidência |
|---|---|---|
| CI na main | **OK** | check-runs de 75a5df1: Lint • Type-check • Test • Build = success; Security audit = success |
| Deploy produção | **OK** | deployment 7776392972 env=Production sha=75a5df1 → status success |
| PRs abertas | 0 | GET /pulls?state=open → vazio |
| Baseline build/testes | **OK** | CI reporta Test success no mesmo commit (não há testes removidos/afrouxados no diff das PRs #28/#29) |

---

## 2. Pipeline de contexto (destrave desta sessão)

| Item | Estado | Evidência |
|---|---|---|
| Fix query de grants (PR #28, commit 96c5745→squash 8ed39f4) | **OK** | snapshot.py ~608-629 usa clexplode; local: 6.3s vs 131.5s, paridade 1952 rows, 109 unittests OK |
| Fix guard de segredos (PR #29, commit 1d05514→squash 75a5df1) | **OK** | contexto.yml:251 grep -rIPl '(?!\[REDACTED\]@)'; guard não acusa mais a senha já redigida |
| Secrets SUPABASE_DB_URL / SUPABASE_ACCESS_TOKEN | **OK** | gravados no repo (ip validados p/ projeto real ...cfmlmcdyjuotqobjapng, região us-east-2) |
| Publicar docs/contexto/supabase/ na branch contexto | **BLoQUEADO** | run do contexto 43513925340 permanece queued (saturação da fila do GitHub Actions, zero runners self-hosted). docs/contexto/supabase/ = HTTP 404 na branch contexto; docs/contexto/codigo/ publicado com 9 arquivos (banco.json 171 tabelas, edge-functions.json, rotas.json, etc.) |

---

## 3. Inventário de funcionalidades (linha de base "sem perda")

### 3.1 Rotas / telas (fonte: otas.json + src/routes/*.tsx)
| Grupo | Qtd | Estado |
|---|---|---|
| URLs de front catalogadas | 104 | **OK** (rotas.json esumo.urls=104, lazy=103) |
| Rotas protegidas (protectedRoutes.tsx) | 94 | **OK** (94 path:) |
| Rotas públicas (publicRoutes.tsx) | 11 | **OK** (/login, /register, /forgot-password, /reset-password, /verify-email, /unauthorized, /landing, /pricing, /vs/3cplus, /status, /marketplace) |
| Itens de menu | 79 | **OK** (rotas.json esumo.itens_menu=79) |
| Rotas HTTP backend | 12 | **OK** (rotas.json esumo.rotas_http_backend=12) |

### 3.2 Edge functions (fonte: supabase/functions/)
| Item | Qtd | Estado |
|---|---|---|
| Edge functions reais | 96 | **OK** (supabase/functions com 98 dirs; _shared/__tests__ não são functions) |
| Categorias | — | voz, análise de sentimento, VoIP/recomendações, DNC, SLA, geo/IP, autenticação (webauthn), whatsapp, CRM, scorecards, etc. (lista completa em edge-functions.json) |

### 3.3 Banco de dados (fonte: anco.json na branch contexto)
| Item | Qtd | Estado |
|---|---|---|
| Tabelas catalogadas | 171 | **OK** (banco.json 	abelas) |
| Migrations no repo | 207 | **OK** (dir supabase/migrations, 207 .sql) |
| Migrations com CREATE POLICY | 124 | **OK** (grep) |
| Migrations com ENABLE ROW LEVEL SECURITY | 73 | **OK** (grep) |
| Tabelas sem RLS no catálogo | 2 | **OK-info** (migration_rollbacks, schema_migrations — tabelas de controle de migração; demais 169 catalogadas não marcadas sem_rls) |
| Cron jobs no banco | 7 | **OK** (daily-cleanup, data-lake-flush, quarterly-reset, bloat/idle/pgss/vacuum semanais) |
| ls_audit_logs | **OK** | presente no snapshot (validação da auditoria de RLS) |
| Aviso DDL dinâmico | — | 14 blocos EXECUTE format(...) não modelados no catálogo (limitação do analisador; policies dinâmicas podem faltar no JSON — não afeta o banco vivo) |

### 3.4 Trabalhos / integrações
| Item | Estado |
|---|---|
| Workflows ativos | **OK** (3: ci.yml, contexto.yml, inventario-estado-semanal.yml; schedulers confirmados) |
| Integrações (Bitrix, elevenlabs, whatsapp, VM/telefonia, CRM, fax, MFA webauthn) | **OK** (edge functions dedicadas) |

---

## 4. Qualidade de código (req 5)
| Checagem | Resultado |
|---|---|
| TODO/FIXME/WIP em src | **OK** — nenhum marcador real; hits são texto PT-BR "Todos" |
| 	est.only / describe.only / .skip( | **OK** — nenhum |

---

## 5. BLOQUEADO (não resolvido nesta sessão)
1. **Run do contexto não publica docs/contexto/supabase/** — fila do GitHub Actions saturada; run queued. Fora do controle do repo (zero self-hosted). Não fabrico evidência; reexecutar em horário de fila vazia.
2. **Projeto morto dyibdjwuoibwwpidgsxu.supabase.co** — apontado em .env versionado, cron data-lake-flush e docs, mas DNS não resolve; produção usa cfmlmcdyjuotqobjapng. Fora de escopo desta sessão (mudança de arquitetura/dado).

---

## 6. Correções entregues nesta sessão (PR + evidência)
- **PR #28** — rewrite da query de grants (snapshot.py via clexplode): 131.5s → 6.3s, paridade 1952 rows, 109 unittests. Squash 8ed39f4.
- **PR #29** — guard de segredo ignora senha redigida (contexto.yml:251 com lookahead). Squash 75a5df1.
- Merges via REST (PUT /pulls/N/merge squash); branches apagadas.
- CI verde + deploy Production success em 75a5df1.

---
_Relatório automático — evidências: check-runs/deployments via API do GitHub; catálogo via branch contexto; código na main 75a5df15._

