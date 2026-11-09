# Edge Functions (Supabase/Deno) — referência para agentes

Ler quando for criar ou alterar função em `supabase/functions/`, mexer em `_shared/`, validação de payload
ou autenticação de edge.

## Mapa

| O que | Valor (medido 2026-11-08) |
|---|---|
| Diretórios em `supabase/functions/` | **98** |
| Com `index.ts` (deployáveis) | **94** |
| Sem `index.ts` | `check-calling-hours` e `check-dnc` — **só têm `__tests__/`**; a lógica vive como RPC no banco (`score-call-attempt/index.ts` chama `rpc('check_calling_hours')` e `rpc('check_dnc')`) |
| Arquivos de teste Deno | **40** (`*.test.ts` / `*_test.ts`, em `__tests__/` ou ao lado) |
| `verify_jwt` versionado | **1 só**: `[functions.migrate-helper] verify_jwt = false` (`supabase/config.toml:3-4`) |
| Funções que chamam `auth.getUser()` | **57** de 94 |
| Funções que criam cliente com `SUPABASE_SERVICE_ROLE_KEY` | **64** de 94 |

**O `supabase/config.toml` tem 4 linhas.** Como só uma função declara `verify_jwt`, **a exposição real das
outras 93 não está no repositório** — depende de configuração de plataforma. Qualquer afirmação do tipo
"essa função é anônima" ou "essa função exige JWT" para as 93 é **`NÃO VERIFICADO`** sem olhar o painel do
Supabase. Ao criar função nova, **versione o `verify_jwt` dela** em `supabase/config.toml`.

## `_shared/` — o que existe antes de você escrever de novo

| Arquivo | Para que serve |
|---|---|
| `cors.ts` | `buildCorsHeaders(req)` — **use esta**; `corsHeaders` é depreciado e sempre devolve `localhost:8086` (detalhe em `lovable-deploy.md`) |
| `validate.ts` · `validator.ts` | validadores de payload escritos à mão (4 exports em `validator.ts`) |
| `numeric-schemas.ts` (12 exports) · `external-payload-schemas.ts` | schemas Zod numéricos e de payload externo, com testes Deno ao lado |
| `hmac.ts` | assinatura/validação HMAC de webhook |
| `rate-limit.ts` (3 exports) | limite de taxa |
| `resilience.ts` (12 exports) | retry / circuit breaker / timeout |
| `observability.ts` | log estruturado com request id |
| `voice-utils.ts` | utilidades de áudio/voz |

`_shared/` **é pulado inteiro** pelo guard `scripts/guard-edge-numeric.mjs:51` — e isso já esconde uma
violação viva: `_shared/validate.ts:24` faz `const n = typeof value === 'number' ? value : Number(value)`,
coerção crua de input externo no validador que dezenas de funções usam. Mexer em `_shared` não é coberto por
gate: teste à mão.

## Padrão de uma função nova

1. **Autenticação explícita.** O padrão correto do repo é `verify-voice/index.ts:24-29`:
   `supabase.auth.getUser()` e `return 401` quando falha. Faça isso **antes** de qualquer acesso a dados.
2. **Só use `SUPABASE_SERVICE_ROLE_KEY` quando a função precisar escapar da RLS de propósito** — e então
   valide papel por RPC (`is_admin_or_supervisor()` e afins) na própria função. Cliente com service role
   recebendo `Authorization` do chamador **não** aplica RLS: é bypass, não delegação.
3. **CORS:** `buildCorsHeaders(req)`, com resposta a `OPTIONS`.
4. **Payload:** valide com Zod ou com os validadores de `_shared/`; para número, `.finite()` na cadeia —
   `z.number()` sem `.finite()` aceita `Infinity`/`NaN`.
5. **Nunca `?? "fallback-<algo>"` em segredo.** Falte o secret → falhe fechada (500 com log), nunca abra com
   valor previsível.
6. **Teste Deno ao lado** (`__tests__/index.test.ts` ou `<nome>_test.ts`) e rode
   `deno test -A supabase/functions/<nome>/`.
7. **Versione o `verify_jwt`** da função em `supabase/config.toml`.
8. Rode `node scripts/guard-edge-numeric.mjs --check` antes da PR (sabendo dos furos abaixo).

## Desvios conhecidos — não copiar, e não "consertar de passagem"

| Função | O que está errado | Evidência |
|---|---|---|
| `search-calls` | Cria cliente com `SUPABASE_SERVICE_ROLE_KEY` e repassa `Authorization: authHeader \|\| ''`. **Nenhum `getUser()` e nenhum `401` nas 122 linhas** — leitura com papel de serviço sobre transcrições de chamada para qualquer chamador que a alcance. | `search-calls/index.ts:28-33`; `grep 'getUser\|401'` → vazio |
| `global-load-test` | Cliente com service role, **sem nenhuma checagem** nas 103 linhas; insere 50 iterações de `call_sessions`/`contacts`/`deals`/`audit_logs` fictícios. **Sem chamador identificado** — está deployada sem uso legítimo. | `global-load-test/index.ts` |
| `sip-config` | `Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "fallback-key"` — falha aberta. | `sip-config/index.ts:5` |
| `wavoip-call` | Exige `WAVOIP_TOKEN` e **nunca o usa**; respostas constantes. | ver `telefonia-voip.md` |
| `elevenlabs-stub.ts` | `status: 'disconnected'` / `isSpeaking: false` constantes, consumido em produção. | `src/lib/elevenlabs-stub.ts:12-13` |
| `check-hold-alerts` | `.is('ended_at', null)` gera alerta que nunca cessa porque o fio de dados de hold está quebrado. | `check-hold-alerts/index.ts:52`; ver `telefonia-voip.md` |
| Sem chamador identificado | `cleanup-lock-conflicts`, `fuzz-test-runner`, `generate-coaching-track`, `global-load-test`, `rls-audit`, `sync-crm-queue`, `translate-summary` | `ESTADO_ATUAL.md` §3 R10 |

**Regra:** corrija o que foi pedido. Achou outro item desta tabela no caminho → "Próximos passos", não
"aproveitei e também". Adicionar auth a `search-calls` muda o contrato de quem a chama hoje: é mudança de
comportamento em produção, vai para PR própria.

## Segredos de edge usados no código e **não** documentados

`SUPABASE_URL` (101 usos), `SUPABASE_SERVICE_ROLE_KEY` (68), `SUPABASE_ANON_KEY` (64) são injetados pela
plataforma. Os demais precisam existir como secret e **não estão em `.env.example`**:

`LOVABLE_API_KEY`, `ELEVENLABS_API_KEY`, `ELEVENLABS_AGENT_ID`, `RESEND_API_KEY`, `FROM_EMAIL`,
`WAVOIP_TOKEN`, `MICROSOFT_TEAMS_API_KEY`, `BITRIX_WEBHOOK_URL`, `ADMIN_EMAIL`, `SIP_SERVER`,
`SIP_USERNAME`, `SIP_PASSWORD`, `SUPABASE_DB_URL`.

Sem eles o deploy degrada em silêncio (`wavoip-call:43` e `voice-command:46` respondem 500/503;
`voip-trunks-manage:7` cai no `"fallback-key"`). **Ao usar um secret novo, registre o nome em `.env.example`
sem valor.**

**Padrão de teste legado:** 8 arquivos `__tests__/index.test.ts` leem `VITE_SUPABASE_URL` e 5 leem
`VITE_SUPABASE_PUBLISHABLE_KEY` com `Deno.env.get` — isso ocorre **somente em arquivos de teste**, não em
código de produção (`index.ts`). Em função nova **e em seus testes**, use `SUPABASE_URL`/`SUPABASE_ANON_KEY`.

## Testes Deno — limite

Não há `deno.json` nem import map no repositório: os imports resolvem por URL remota (`deno.land`, `esm.sh`)
a cada execução, sem lockfile. O gate `deno test -A supabase/functions/` do CI tem substância, mas **não é
hermético** — falha de rede ou mudança de versão upstream vira vermelho sem mudança de código. Criar
`deno.json` com import map muda o build de todas as 94 funções: decisão do dono.
