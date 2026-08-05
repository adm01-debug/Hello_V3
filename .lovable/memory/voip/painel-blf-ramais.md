---
name: painel-blf-ramais
description: Painel BLF (Busy Lamp Field) em /blf — presença de ramais em tempo real combinando agents, call_sessions e parked_calls
type: feature
---

Onda #5 do roadmap de paridade 3CX: **Painel BLF (Busy Lamp Field)** em `/blf`.

## Arquitetura
- `src/lib/blf.ts` — lógica pura (sem I/O) que deriva o estado da lâmpada de cada ramal.
  Estados: `ringing` > `talking` > `hold` > `parked` > `available` > `away` > `offline`
  (constante `LAMP_PRIORITY` define precedência e ordenação).
- `src/hooks/useBlfBoard.ts` — React Query + realtime nas 3 tabelas (`agents`,
  `call_sessions`, `parked_calls`); cronômetro local de 1s evita refetch só para timers,
  e é pausado quando a aba está oculta (`usePageVisibility`).
- `src/components/blf/BlfLampCard.tsx` e `BlfSummaryBar.tsx`; página `src/pages/BlfBoard.tsx`.

## Regras de negócio
- Correspondência agente ↔ sessão por nome normalizado (sem acento/caixa/espaços duplos),
  pois `call_sessions.agent_name` é texto livre.
- Telefones sempre mascarados (apenas 4 últimos dígitos) no mural.
- Ocupação = (ringing+talking+hold) / ramais online; ramais offline não entram no denominador.
- Chamadas estacionadas só contam com `status = 'parked'`.

Validado por 17 testes, incluindo 4 propriedades PBT (400 runs cada).
