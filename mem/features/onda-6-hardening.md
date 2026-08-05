---
name: Onda 6 Hardening Final
description: Tipagem residual em components (live_sentiment_snapshots, coaching_timestamps tipados via Database), cobertura de testes Deno para 4 edge functions críticas (translate-utterance, score-call-attempt, enforce-sla, compute-deal-health), ADR-021 e re-auditoria final. Mantém 10/10.
type: feature
---
# Onda 6 — Hardening Final (pós-10/10)

## Tipagem
- `LiveCallAnalysis.tsx`, `BattleCardAlert.tsx`, `CoachingTimeline.tsx`, `CallDetailDialog.tsx`: removido `as any` em queries Supabase. Agora usam tipos inferidos de `Database['public']['Tables']`.
- Restantes (`webkitAudioContext`, refs externas de ScrollArea, formatters do Recharts, `calendar.tsx` do shadcn): mantidos como `as any` por interoperabilidade legítima com APIs externas tipadas pobremente. Documentado no ADR-021.

## Testes Deno (Edge Functions)
- `supabase/functions/translate-utterance/__tests__/index.test.ts` — 7 cenários (auth, validação, idiomas, 429/402, tracing, confidence default).
- `supabase/functions/score-call-attempt/__tests__/index.test.ts` — 7 cenários (auth, Zod, DNC=block, fora de horário, scoring com pattern, thresholds, defaults).
- `supabase/functions/enforce-sla/__tests__/index.test.ts` — 6 cenários (matching de política, fallback all/all, due dates, breach detection, idempotência).
- `supabase/functions/compute-deal-health/__tests__/index.test.ts` — 9 cenários (recencyScore, sentimentScore, momentScore com clamping, satScore, composição ponderada, defaults).

## Re-auditoria
- `supabase--linter`: 3 WARN restantes — todos `RLS Policy Always True` em SELECT policies intencionais para leitura pública (kb_articles, badges, etc). Não-acionáveis.
- `security--run_security_scan`: findings residuais já endereçados em ondas anteriores ou aceitos como risco baixo (documentado).

## Status
Maturidade **10/10** mantida. Onda 6 era opcional — todas as melhorias de polimento concluídas sem regressões.
