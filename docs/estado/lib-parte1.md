<!-- Gerado pela auditoria de estado. Fonte: lote L1. -->

> **Procedência:** lote `L1` da auditoria de estado.
> **Recontagem de cobertura (Fase D):** 30/67 arquivos citados (45%).
> **Limitação global:** sem acesso ao banco/runtime — nada nesta página é verificado contra produção.

# Lote L1 — src/lib (parte 1)

## Cobertura

- **67 arquivos, 11.059 linhas — 100% são arquivos de teste** (todos sob `src/lib/__tests__/`). O lote não contém nenhum módulo de produção; a auditoria de módulos abaixo cobre os **alvos** que estes testes exercitam.
- **Todos os 67 rodam no CI.** `vitest.config.ts:11` — `include: ['src/**/*.{test,spec}.{ts,tsx}']`; `vitest.config.ts:12` — `exclude` só remove `src/**/*.integration.{test,spec}.{ts,tsx}`, e **nenhum** arquivo do lote tem sufixo `.integration`. Zero arquivos fora da execução.
- **Todos os 67 ficam fora da MEDIÇÃO de cobertura**, por desenho: `vitest.config.ts:22` (`coverage.include: ['src/lib/**','src/hooks/**']`) combinado com `vitest.config.ts:26` (`coverage.exclude: [... 'src/**/__tests__/**']`).
- **Ponto cego relevante:** 6 arquivos do lote testam alvos **fora** de `coverage.include` (`src/pages/**`, `src/components/**`, `vite.config.ts`, `supabase/functions/**`, `scripts/**`). O trabalho deles não aparece em nenhuma métrica de cobertura e não protege `src/lib`:
  `accessibility-improvements.test.ts:11`, `performance-optimizations.test.ts:12`, `dashboard-integration.test.ts:10`, `guard-edge-numeric.test.ts:21`, `error-boundaries.test.tsx:9`, `security-observability.test.ts:10`.
- Thresholds ativos: lines/functions/statements 75%, branches 70% (`vitest.config.ts:29-34`).
- **Nenhum `.skip` / `.todo` / `.only` / `xit` / `xdescribe`** em todo o lote (grep em `src/lib/__tests__/`, zero ocorrências).
- **Nenhum ALVO INEXISTENTE**: os 82 caminhos de import de projeto (`@/…` e `../…`) foram resolvidos um a um contra o disco — todos existem.

## Tabela de funcionalidades (módulos)

O lote não entrega módulos. A tabela abaixo classifica os **alvos** exercitados, com foco em módulos que a auditoria mostrou órfãos, duplicados ou com dado fictício. Contagem de consumidores = imports fora de `__tests__`.

| Módulo | Classificação | Evidência | Quem importa | Tabela/edge fn | O que falta |
|---|---|---|---|---|---|
| `src/lib/meeting-summary-utils.ts` | ⬛ MORTO_OU_ABANDONADO | `meeting-summary-utils.ts:1` importa tipos de `@/hooks/useMeetingSummary`; grep em `src/` + `supabase/` retorna **0 consumidores** fora de testes | Só `src/lib/__tests__/meeting-summary-utils.test.ts:1` (116 linhas) | edge fn `generate-meeting-summary` existe mas **não** usa este arquivo | Ligar ao consumidor real ou remover módulo + teste |
| `src/lib/talkRatio.ts` | ⬛ MORTO_OU_ABANDONADO (cópia paralela) | `talkRatio.ts:1` — *"Pure helper extracted from edge function `analyze-talk-ratio` for unit testability"*; **0 consumidores** em produção | Só `src/lib/__tests__/talkRatio.test.ts:1` | `supabase/functions/analyze-talk-ratio/index.ts:36-102` reimplementa a mesma matemática inline, sem importar o helper | O teste não protege o código deployado; divergência entre as duas cópias é silenciosa |
| `src/data/mockData.ts` (311 linhas) | ⬛ MORTO_OU_ABANDONADO | grep por `mockContacts|mockCallHistory|mockAgents|mockDashboardStats|mockData` em `src/` fora de `__tests__` → **0 resultados** | Só `src/lib/__tests__/mock-data-integrity.test.ts:2-16` (339 linhas) | — | 339 linhas de teste guardam um dataset que ninguém consome |
| `src/lib/security-alerts-webhook*.ts` (5 arquivos) | ✅ IMPLEMENTADO_TOTAL | 6, 6, 2, 2 e 4 consumidores fora de teste; suíte forte com PBT (`security-alerts-webhook.property.test.ts:23-24`, seed fixo + 300 runs) | `src/components/security/*`, hooks | localStorage (`hashEndpoint` em `security-alerts-webhook-queue.ts`) | Nada crítico. `Math.random()` em `security-alerts-webhook.ts:186,342` e `-queue.ts:88` é jitter/ID legítimo, não dado fictício |
| `src/lib/logger.ts` / `safe-date.ts` / `utils.ts` / `tracing.ts` / `safe-number.ts` | ✅ IMPLEMENTADO_TOTAL | 181, 100, 149, 21 e 15 consumidores respectivamente | Toda a base | — | — |
| `src/lib/dialer/*`, `call-park`, `call-queue`, `ring-group`, `queue-audio`, `blf`, `device-identity` | ✅ IMPLEMENTADO_TOTAL | 4–8 consumidores cada; testes PBT com seed determinístico (`call-park.test.ts:22`, `queue-audio.test.ts:23`) | componentes de softphone/dialer | — | — |
| `src/lib/voipProactiveSnapshot.ts`, `voipRecommendationCoaching.ts`, `voice-biometrics.ts`, `health-score.ts`, `security-alerts-export.ts`, `holdReminderSounds.ts` | 🟨 IMPLEMENTADO_PARCIAL | 1–2 consumidores cada (grep fora de `__tests__`) | 1 componente cada | localStorage (`voip-rec-last-snapshot`, `voip-rec-coaching-queue`) | Superfície de uso mínima — risco de virarem órfãos |
| `scripts/guard-edge-numeric.mjs` | ✅ IMPLEMENTADO_TOTAL | exercitado de verdade via subprocesso em `guard-edge-numeric.test.ts:25` | CI/guard | valida `supabase/functions/**` | Custo: ~150 `execSync` por execução, timeout elevado para 120s (`guard-edge-numeric.test.ts:53`) |
| `src/lib/elevenlabs-stub.ts` | 🟦 SUGERIDO_OU_INICIADO (**stub em produção**) | `elevenlabs-stub.ts:1` "Stub for @elevenlabs/react — provides a mock useConversation hook"; `:12-13` retorna `status: 'disconnected'` e `isSpeaking: false` **constantes** | `src/components/calls/UnifiedSoftphone.tsx:3` (produção) | — | Fora do lote L1, mas é dado fictício servido à UI real. Sem teste no lote |

## Auditoria de testes

`Importa o alvo?` = há pelo menos um import de projeto (`@/…`, `../…`, incluindo `await import()` dinâmico e imports multilinha).
`Roda no CI?` = **Sim** para os 67 (nenhum é `.integration`).

| Arquivo de teste | Importa o alvo? | Patologia | Evidência | Roda no CI? |
|---|---|---|---|---|
| `performance-optimizations.test.ts` | **NÃO** | 🔴 **TESTE-ESPELHO** + teste-grep de código-fonte | `:11-13` lê `.tsx` como string; `:100-105` reimplementa `formatDuration` local com o comentário *"Test the inline formatDuration in Index.tsx"* — e o real existe e é importável (`utils.coverage.test.ts:2`). `:23-53` asserções sobre substrings (`memo(`, `export const X = memo`) | Sim |
| `accessibility-improvements.test.ts` | **NÃO** | 🔴 Teste-grep de código-fonte (0 imports de projeto) | `:10-12` `readFileSync`; `:22,30,80,93,105` asserções `toContain('aria-label="…"')` sobre texto de `.tsx`. Renomear uma prop quebra 30 testes; remover a acessibilidade de fato não quebra nada | Sim |
| `cache.stress.test.ts` | **NÃO** | 🔴 Testa só biblioteca de terceiros + asserção de tempo de parede | `:2` importa apenas `@tanstack/react-query`; `:17` `expect(elapsed).toBeLessThan(2000)`, `:28` `<500`, `:46` `<100`. Zero código do projeto exercitado; flaky por natureza em CI compartilhado | Sim |
| `guard-edge-numeric.test.ts` | **NÃO** (mas exercita alvo real) | 🟡 Não é espelho — roda o script real; porém é lento e acopla ao estado do repo | `:25` `execSync('node scripts/guard-edge-numeric.mjs --check')` ~150×; `:53` timeout 120s; `:188-191` assere que o repo **atual** passa (falha por mudança alheia ao guard) | Sim |
| `fixes-exhaustive.test.ts` (505 ln) | Parcial (2 de 6 seções) | 🔴 **ESPELHO em 4 das 6 seções** + asserção vacuamente verdadeira | Espelhos: `:17-26` (`generateBackupCodes` do `useMFA`), `:310-317` (guard de env do supabase/client), `:357-364` (`readLayout` do `useDashboardLayout`), `:422+` (`readSoundEnabled` do `useSupervisorPanel`). Só `:90` (jwt-handler) e `:240` (`../web-vitals`) importam código real. Vacuidade: `:340-345` `try { guard() } catch (e) { expect(...) }` **sem** `expect.assertions()` — se não lançar, passa com 0 asserções | Sim |
| `security-observability.test.ts` | Sim (`:23` `await import('@/lib/logger')`) | 🔴 Asserção condicional vacuamente verdadeira + swallow de erro | `:123-127` `catch { content = '' }`; `:134-137` e `:140-143` `if (content) { expect(...) }` → se a edge function sumir, o corpo não executa asserção nenhuma e o teste **passa**. `:171-181,214-223,253-262` são teste-grep de fonte | Sim |
| `dashboard-integration.test.ts` | Sim (2 imports) | 🔴 Asserção condicional vacuamente verdadeira + teste-grep frágil | `:160-162` `if (!file.includes('ErrorBoundary')) { expect(hasExplicitAny).toBe(false) }` → para `ErrorBoundary` o teste passa sem asserção. `:22-27` asserções sobre a string literal do import; `:169-171` limites de linhas de arquivo (`maxLines: 200/130/50`) | Sim |
| `utilities-comprehensive.test.ts` | Sim (6 imports) | 🔴 Asserção vacuamente verdadeira | `:71-75` teste chamado *"suggests adding numbers"* que só faz `expect(result.score).toBeDefined()`, com o comentário `// May or may not suggest depending on score`. O nome mente sobre o que é verificado | Sim |
| `error-boundaries.test.tsx` | Sim (`:5`) | 🟡 Misto — render real (bom) + teste-grep no final | `:3` `@testing-library/react` com render de verdade; mas `:271-275` e `:308+` voltam a `readSrc(...)` + `toContain("import { SectionBoundary }")` | Sim |
| `mock-data-integrity.test.ts` (339 ln) | Sim (`:2-16`) | 🟡 Testa dataset sem consumidor em produção; asserções fracas | `:316-319` `expect(contact.id).toBeDefined()` ×4. Alvo `@/data/mockData` tem 0 consumidores fora de teste | Sim |
| `utils.test.ts` + `utils.coverage.test.ts` | Sim | 🟡 Duplicação | `utils.test.ts:5-11` e `utils.coverage.test.ts:5-13` testam `cn` merge/dedup/falsy com os mesmos casos | Sim |
| `edge-cases-stress.test.ts`, `voice-biometrics.coverage.test.ts`, `webhook-health-and-export.simulation.test.ts` | Sim | 🟡 Asserções de tempo de parede (risco de flake) | `performance.now()` + `toBeLessThan(<n>)` | Sim |
| `agent-assist.pbt.test.ts`, `predictive-pace.property.test.ts` | Sim (`:3` / `:3`) | ✅ Sem patologia (o `expects=0` é falso positivo: PBT com predicado booleano em `fc.property`) | `agent-assist.pbt.test.ts:47-58`; `predictive-pace.property.test.ts:33` | Sim |
| Os **51 arquivos restantes** (`hash-endpoint`, `tag-filter-label`, `favorite-sync-labels`, `executive-dashboard-utils`, `blf`, `call-park`, `call-queue`, `queue-audio`, `ring-group`, `sync-history`, `safe-number*`, `safe-date`, `security-alerts-*` (9), `security-advanced`, `security-infrastructure`, `security-sanitizers`, `encryption-webauthn`, `validation-schemas`, `language-detection`, `logger`, `error-tracking`, `tracing.coverage`, `web-vitals.coverage`, `voice-*`, `voip*`, `dialer-*` (5), `csv-export.property`, `health-score.property`, `phone-normalization.property`, `meeting-summary-utils`, `talkRatio`, `outbound-scoring`, `softphone-utils`, `holdReminderSounds.coverage`, `agent-assist-utils`, `device-identity`, `export-audit-notifications`) | Sim | ✅ Nenhuma patologia detectada | Importam o alvo real; usam PBT com seed fixo (`tag-filter-label.test.ts:26`, `favorite-sync-labels.test.ts:22`); funções locais são apenas *factories*/*arbitraries* (`call-park.test.ts:35,54`; `queue-audio.test.ts:36`; `sync-history.test.ts:20`) | Sim |

## Achados graves

1. **`fixes-exhaustive.test.ts` (505 linhas) é majoritariamente teste-espelho — 4 das 6 correções que declara validar nunca tocam o código corrigido.** O cabeçalho (`:1-9`) promete cobrir 6 bugfixes do PR #4; as seções 1 (`:17-26`), 4 (`:310-317`), 5 (`:357-364`) e 6 (`:422+`) copiam a lógica para dentro do arquivo de teste e testam a cópia. Se `useMFA`, `integrations/supabase/client`, `useDashboardLayout` ou `useSupervisorPanel` regredirem, esta suíte continua verde. Agrava: `:340-345` usa `try/catch` sem `expect.assertions()`, passando com zero asserções caso o guard não lance.

2. **Asserções condicionais que transformam ausência de arquivo em teste verde.** `security-observability.test.ts:123-127` engole a falha de leitura (`catch { content = '' }`) e `:134-143` embrulha as asserções em `if (content)`. Deletar `supabase/functions/database-backup/index.ts` faz o teste "handles CORS OPTIONS requests" **passar**. Mesmo padrão em `dashboard-integration.test.ts:160-162`, onde o arquivo `ErrorBoundary` é isento e o teste passa sem executar asserção alguma.

3. **~750 linhas de "teste" que não testam comportamento: leem `.tsx`/`.ts` como texto e comparam substrings.** `accessibility-improvements.test.ts` (197 ln, 0 imports de projeto), `performance-optimizations.test.ts` (159 ln, 0 imports, com espelho explícito de `formatDuration` em `:100-105`), mais blocos em `dashboard-integration.test.ts`, `error-boundaries.test.tsx:271+` e `security-observability.test.ts:171-262`. Nenhum deles renderiza nada; todos quebram com refatoração cosmética e nenhum quebra se a acessibilidade ou a memoização forem de fato removidas. Somado a `cache.stress.test.ts` (48 ln testando exclusivamente `@tanstack/react-query`), são **4 arquivos sem qualquer import do projeto** — os únicos espelhos estritos do lote.

**Achados secundários relevantes:** `src/lib/talkRatio.ts:1` é cópia declarada da lógica de `supabase/functions/analyze-talk-ratio/index.ts:36-102`, com 0 consumidores em produção — o teste valida a cópia, não o deployado. `src/data/mockData.ts` (311 ln) e `src/lib/meeting-summary-utils.ts` têm 0 consumidores fora de teste, mas somam 455 linhas de suíte. `src/lib/elevenlabs-stub.ts:12-13` retorna `status: 'disconnected'` / `isSpeaking: false` constantes e é consumido em produção por `src/components/calls/UnifiedSoftphone.tsx:3`.

## Integrações de terceiros observadas

| Integração | Onde aparece no lote | Situação |
|---|---|---|
| `fast-check` (PBT) | ~25 arquivos; seeds fixos (`security-alerts-webhook-validation.property.test.ts:33-34` SEED=20260712, NUM_RUNS=1000) | ✅ Uso maduro e determinístico — o ponto forte do lote |
| `@tanstack/react-query` | `cache.stress.test.ts:2` | 🔴 É o **único** alvo do arquivo — testa a biblioteca, não o produto |
| `@testing-library/react` | `error-boundaries.test.tsx:3`, `holdReminderSounds.coverage.test.tsx` | ✅ Único ponto do lote com renderização real |
| Supabase (`@/integrations/supabase/client`) | `utilities-comprehensive.test.ts:17-32` (mock completo de `from/rpc/functions.invoke`) | 🟡 Mockado; nenhum teste do lote toca banco ou edge function de verdade |
| Supabase Edge Functions | `security-observability.test.ts:110-116` (5 functions, só por substring); `guard-edge-numeric.test.ts:44` (fixtures sintéticas) | 🟡 Só `guard-edge-numeric` executa algo real (o script guard, não as functions) |
| ElevenLabs | `src/lib/elevenlabs-stub.ts:1` (fora do lote, sem teste) | 🔴 Stub com retorno constante em produção |
| `zod` | `validation-schemas.test.ts`, `guard-edge-numeric.test.ts:59` | ✅ |
| `sonner` (toast) | mocks em `voipProactiveSnapshot.coverage.test.ts:3`, `voipRecommendationCoaching.coverage.test.ts:3` | ✅ |
| `node:child_process` | `guard-edge-numeric.test.ts:15,25` | 🟡 ~150 subprocessos por run; timeout de 120s |
