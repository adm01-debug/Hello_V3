
## Onda 38 — Auditoria Massiva End-to-End + Correção de Gaps

Expansão da Onda 37 (5.000+ cenários PBT/fuzz) para **auditoria total do sistema** antes de produção: análise camada-a-camada, simulação de jornadas reais, teste de cada edge function, cada webhook, cada integração, cada botão crítico — com correção imediata de cada falha encontrada.

### Bug já detectado nos console logs
**`VideoConference` passa ref para componente funcional sem `forwardRef`** → React warning ativo na rota `/video-conference`. Será corrigido como item 0 da execução.

### 1. Auditoria de Edge Functions (45+ funções)
- **Linter Supabase** + revisão manual de cada função em `supabase/functions/`
- Checklist por função: CORS centralizado ✓, JWT validado ✓, validate.ts usado ✓, request_id propagado ✓, error handling ✓, rate limit aplicável ✓
- Suíte Deno test cobrindo as 10 funções mais críticas (auth, voip-*, bitrix-*, ai-*)
- Fuzz adicional em endpoints expostos (payloads >1MB, unicode exótico, JWT manipulado)

### 2. Auditoria de Segurança (RLS + Roles)
- `supabase--linter` para detectar tabelas sem RLS, policies permissivas
- Revisão manual das policies das 15 tabelas mais sensíveis (audit_logs, user_profiles, user_roles, voip_*, contacts, deals)
- Teste de role escalation: agent tenta acessar admin endpoints, supervisor tenta ler audit_logs de outros
- Validação do `prevent_role_escalation` trigger
- Teste do lockout exponencial (5 → 1min, 10 → 30min)

### 3. Auditoria de Hooks Críticos (cobertura ampliada)
- `useAuthState`, `useExtensionsOverview`, `useCallSession`, `useDeals`, `useAccounts`, `useChurnRisk`, `useRenewals`, `useNotifications`, `useBitrixSync`, `useVoipQuality`
- Cenários: sem auth, sem network, payload corrompido, race condition em mutations, cache stale
- Snapshot de cada hook com 20+ cenários

### 4. Auditoria de Componentes UI Críticos
- `UnifiedSoftphone`, `ActiveCallDisplay`, `ExtensionsAdmin`, `ConferenceRoom`, `DealsKanban`, `NotificationCenter`, `CommandPalette`, `LoginForm`
- Teste de cada botão: estado loading, disabled, erro, success
- Acessibilidade: `axe-core` em 30 páginas principais
- Responsividade: viewport 360, 768, 1280, 1920 (smoke test via Playwright)

### 5. Auditoria de Integrações
- **Bitrix24**: timeout 12s, retry, fallback, normalização de telefones
- **ElevenLabs**: token agent dinâmico, fallback de agentId
- **Wavoip**: WhatsApp voice token validation
- **JsSIP**: WebRTC reconnect, codec negotiation, ICE failure
- **Lovable AI**: rate limit handling, model fallback

### 6. Auditoria de Webhooks
- `bitrix-webhook`, `voip-webhook`, `recording-webhook`
- Validação de assinatura, idempotência, retry, replay attack
- Payloads malformados, headers ausentes

### 7. Auditoria de Performance
- Render <200ms para listas com 500+ itens (ExtensionsAdmin, DealsKanban, ContactsList)
- React Query cache footprint <50MB com 10k entradas
- LCP/FID/CLS via observabilidade existente
- Bundle size check: alertar se chunk principal >500KB

### 8. Auditoria de Conformidade & UX
- PT-BR em todas as strings novas (grep `[A-Z][a-z]+ing|Error:|Failed` para detectar EN)
- `sonner` para toasts (não `toast` antigo nem `alert()`)
- `logger` central (sem `console.log` em produção)
- Tokens semânticos Tailwind (sem hex hardcoded em componentes novos)
- ErrorBoundary em rotas top-level

### 9. Jornadas E2E (Playwright)
- **Jornada 1 — Admin**: login → /admin/extensions → filtra → bulk assign trunk → export CSV → audita histórico
- **Jornada 2 — Agente**: login → softphone → discar → atender → encerrar → ver gravação
- **Jornada 3 — Supervisor**: login → fila → barge-in → whisper → relatório
- **Jornada 4 — Segurança**: 5 logins falhos → lockout → recovery → MFA
- **Jornada 5 — CRM**: criar deal → mover estágio → forecast → cadência

### 10. Relatório Consolidado & Correções
- `docs/qa/onda-38-auditoria-producao.md` com:
  - Inventário completo (módulos × cenários × resultado)
  - Lista de bugs encontrados + commits de correção
  - Métricas de cobertura, performance, segurança
  - Checklist final "Pronto para produção"
- ADR-052 documentando estratégia de auditoria pré-produção
- Atualização `mem://engineering/testing-infrastructure`

## Ordem de execução
0. **Fix imediato**: `VideoConference` ref warning (forwardRef)
1. Linter Supabase + correção de findings críticos
2. Auditoria edge functions + Deno tests (10 críticas)
3. Auditoria RLS + role escalation tests
4. Ampliação de cobertura de hooks (20+ cenários cada)
5. Testes de componentes críticos + a11y
6. Testes de integrações (mocks + smoke real)
7. Testes de webhooks (idempotência, assinatura)
8. Performance benchmarks
9. Lint de conformidade (PT-BR, sonner, logger, tokens)
10. Suítes E2E Playwright (5 jornadas)
11. Relatório + ADR-052 + memória + índice
12. Validação `tsc --noEmit` + `vitest run` + `playwright test`

## Considerações
- ≤400 linhas por arquivo, PT-BR, sem `any`, cyberpunk
- Cada bug encontrado é corrigido na mesma onda + documentado
- Sem migrations destrutivas — apenas testes e fixes pontuais
- Meta: **2.500+ testes verdes** (1.862 atuais + ~700 novos), 0 findings críticos do linter, 0 warnings React em produção, 5 jornadas E2E passando

Resultado: sistema **certificado 10/10 para produção** — cada camada auditada, cada gap fechado, cada cenário simulado, base sólida para escalar com confiança total.
