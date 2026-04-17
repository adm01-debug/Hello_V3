---
name: Onda 7 Manutenção Contínua
description: 12 testes Deno em validate-ip + health-check; auditoria de `as any` confirmou interop legítimo (Recharts/Radix/Web Audio); ADR-022; maturidade 10/10 mantida
type: feature
---

# Onda 7 — Manutenção Contínua

## Entregas
- **Testes Deno**: +12 testes em `validate-ip/__tests__/` e `health-check/__tests__/` (CORS, auth, headers de IP, latência, tracing). Total agora: 41 testes Deno em 6 Edge Functions críticas.
- **Auditoria `as any`**: 40 ocorrências em 7 components, todas classificadas como interop legítimo (Radix ScrollArea refs, Recharts Formatter, react-day-picker Components, shadcn cva variants, Safari webkitAudioContext). Decisão registrada no ADR-022.
- **Scorecard**: seção "Re-verificação Onda 7" adicionada.
- **ADR-022**: `docs/adr/022-onda-7-manutencao-continua.md`.

## Decisão arquitetural
`as any` em fronteira de APIs externas não-tipadas (DOM legado, libs com tipagem parcial) é **aceito** e não conta como débito técnico. Substituir geraria boilerplate sem ganho de segurança.

## Status
Maturidade **10/10** mantida em 22 dimensões.
