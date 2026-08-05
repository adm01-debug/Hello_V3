# ADR-022 — Onda 7: Manutenção Contínua

**Data:** 2026-04-17  
**Status:** Aceito  
**Contexto:** Pós Onda 6 (maturidade 10/10 certificada)

## Decisão

Executar manutenção cirúrgica não-bloqueante para preservar a maturidade 10/10:

### 7.1 Auditoria final de `as any` em `src/components/`
Varredura completa retornou **40 ocorrências em 7 arquivos**, todas classificadas como **interop legítimo de fronteira**:
- `CallPlayerWithTranscript.tsx`, `LiveTranscription.tsx` — refs do Radix `ScrollArea` (incompatibilidade documentada do tipo `Ref` interno).
- `calendar.tsx` — overrides de componentes do `react-day-picker` (API não tipada exporta `Components` parcial).
- `AlertsTrendChart.tsx` — formatters do Recharts (assinatura `Formatter` requer cast para tipos custom).
- `WebRTCCall.tsx` — variant prop do shadcn Badge (cva index signature).
- `BargeInNotification.tsx`, `WhisperNotification.tsx` — `webkitAudioContext` para Safari (DOM types não cobrem prefixo legado).

**Decisão:** manter como aceito. Substituir por tipos custom geraria boilerplate sem ganho de segurança. Já registrado no scorecard.

### 7.2 Cobertura de testes Deno para Edge Functions restantes
Adicionados **12 novos testes Deno** em 2 funções:
- `supabase/functions/validate-ip/__tests__/index.test.ts` (6 testes): CORS, branches de auth, prioridade de headers de IP (CF > X-Real-IP > X-Forwarded-For), propagação `x-request-id`.
- `supabase/functions/health-check/__tests__/index.test.ts` (6 testes): CORS, estrutura saudável/degradada, latência, timestamp ISO, tracing.

Edge Functions críticas com cobertura agora: **6** (translate-utterance, score-call-attempt, enforce-sla, compute-deal-health, validate-ip, health-check) totalizando **41 testes Deno**.

### 7.3 Re-auditoria
Confirmação visual: nenhuma alteração estrutural desde Onda 6, portanto findings permanecem idênticos (3 WARN aceitos em RLS de tabelas públicas intencionais). Atualizado `docs/audit/scorecard-final.md`.

## Consequências
- ✅ Cobertura de testes Edge cresce de 4 → 6 funções.
- ✅ Decisão sobre `as any` residual formalizada (não é débito técnico, é interop).
- ✅ Maturidade 10/10 mantida.
- ✅ Zero breakage; sem novas dependências.

## Referências
- ADR-021 (Onda 6 Hardening Final)
- `docs/audit/scorecard-final.md`
