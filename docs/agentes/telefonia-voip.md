# Arquitetura de telefonia VoIP — dono do ciclo de vida da chamada

> **Decisão tomada:** `useMultiChannelCall` é o único dono do ciclo de vida da chamada ativa.
> **Commit de referência:** `7df1b5b` · **Data:** 2026-11-23

---

## 1. Quem é o dono do ciclo de vida da chamada

**`src/hooks/useMultiChannelCall.ts`** (`useMultiChannelCall`)

Razão: é o hook consumido diretamente pelo softphone em uso (`UnifiedSoftphone.tsx:36`),
quem controla as transições de estado (`initiateCall`, `updateCallStatus`, `endCall`),
e quem já mantém `activeCalls`, transferência e conferência.

Os outros dois candidatos não são o dono:
- **`useSipCall`** (`src/hooks/useSipCall.ts`) — é o driver de protocolo jssip, exclusivamente
  responsável pela conexão de rede. Não sabe nada de regras de negócio.
- **`ActiveCallBar`** (`src/components/calls/ActiveCallBar.tsx`) — componente visual com estado
  local `useState<ActiveCall | null>(null)` que nada popula. É consumidor, não produtor de estado.

---

## 2. Ponto exato do INSERT em `call_sessions`

Transição de **qualquer status → `active`** em `useMultiChannelCall.updateCallStatus`.

**Por que:** a chamada só está atendida quando `status === 'active'`. Gravar em `connecting` ou
`ringing` inflaria a tabela com tentativas não atendidas, invalidando a taxa de abandono (A-027)
e o nível de serviço (A-028).

Implementado em: `useMultiChannelCall.ts`, dentro de `updateCallStatus`, via `useCallSession.startSession`.

---

## 3. Ponto exato do UPDATE de encerramento

**`useMultiChannelCall.endCall`** — quando a chamada é removida de `activeCalls`.

Status de encerramento:
- `completed` — chamada atendida e encerrada (`call.status === 'active'` ou `'on-hold'` antes de terminar)
- `missed` — chamada não atendida (removida antes de atingir `active`)
- `abandoned` — cancelada na fila (ringing longo → endCall sem transição para active)

A grafia exata foi confirmada com `grep -rn "'abandoned'\|'missed'\|'completed'" src/ supabase/` —
não há CHECK na coluna (A-126, etapa 147 adiciona); erro de grafia só aparece como métrica errada.

---

## 4. Quem passa a consumir `useCallSession`

Exclusivamente `useMultiChannelCall`. O hook é chamado internamente:

```typescript
// src/hooks/useMultiChannelCall.ts
const { startSession, endSession } = useCallSession();
const { profile } = useAuthContext();
```

`ActiveCallBar` continua importando `useCallSession` para o `addTranscript`/`addAnalysis` usados na
barra de pós-chamada (`CrmSuggestionsCard`), mas **não** chama mais `startSession`/`endSession`
(esses ramos nunca eram atingidos porque `call` era sempre `null`).

---

## 5. Contrato das etapas 057–065

| Etapa | O que faz | Arquivo principal |
|---|---|---|
| 057 | Garante `dbSessionId?: string` no tipo `CallSession` + teste | `useMultiChannelCall.ts` |
| 058 | Chama `startSession` na transição para `active` + `setCallDbSession` | `useMultiChannelCall.ts` |
| 059 | Chama `endSession` em `endCall` com duração e status correto | `useMultiChannelCall.ts` |
| 060 | Faz `ActiveCallBar` consumir a chamada de `useMultiChannelCall` | `ActiveCallBar.tsx` |
| 061 | Religar transcrição ao vivo | `ActiveCallBar.tsx` / `useLiveTranscription` |

