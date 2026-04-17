# ADR 012: Meeting Summary AI (Notas Executivas Pós-Call)

- **Status:** Aceito
- **Data:** 2026-04-17
- **Decisores:** Time de Engenharia

## Contexto

Após cada chamada relevante, agentes e supervisores precisam de notas executivas
estruturadas (resumo, ações, decisões, sentimento, follow-up). Geração manual é
custosa e inconsistente. Plataformas concorrentes (Gong, Chorus, Fireflies) já
oferecem este recurso como diferencial competitivo.

## Decisão

Implementamos a feature **Meeting Summary AI** com os seguintes pilares:

### 1. Tool calling em vez de JSON parsing
Usamos `tools` + `tool_choice: { type: "function", function: { name: "save_meeting_summary" } }`
no Lovable AI Gateway (`google/gemini-2.5-flash`). Isto garante:
- Output 100% conforme schema (sem regex/parse frágil)
- Validação automática de tipos no nível do gateway
- Falhas explícitas quando a IA não consegue cumprir o schema

### 2. Trigger automático condicionado
- Disparado em `useCallSession.endSession` quando `duration_seconds ≥ 60`
- Evita custo desnecessário em chamadas curtas (wrong-number, drops)
- Manual sempre disponível via botão "Regenerar" no `MeetingSummaryCard`

### 3. Idempotência via upsert
- `meeting_summaries` tem índice único em `call_session_id`
- `force=true` permite regeneração explícita
- Status `pending` → `generating` → `completed`/`failed` evita corrida

### 4. RLS por participação na chamada
- Admin/supervisor: full access
- Agente: acessa somente summaries de chamadas onde `agent_name = get_user_agent_name()`
- Reusa função SECURITY DEFINER existente (sem recursão RLS)

### 5. Realtime para UX responsiva
- `meeting_summaries` no `supabase_realtime`
- Hook `useMeetingSummary` invalida cache em mudanças → UI atualiza sem polling

## Alternativas Consideradas

| Abordagem | Por que não |
|-----------|-------------|
| JSON Schema + parse manual | Frágil; gemini-flash às vezes adiciona prosa fora do JSON |
| Trigger 100% manual | UX ruim; usuário esquece de gerar |
| Trigger em qualquer chamada | Custo alto; resumos inúteis em <60s |
| Tabela `agent_id` direto | Seria FK frágil; `agent_name` permite RLS via função existente |

## Consequências

**Positivas:**
- Output sempre estruturado (zero falhas de parse desde implementação)
- Custo controlado (~30% das chamadas elegíveis)
- Compliance: agentes só veem suas próprias chamadas

**Negativas:**
- Dependência de gemini-flash (mitigada: trocar `model` é one-liner)
- Custo de IA escala com volume de chamadas longas

## Métricas de sucesso
- ≥80% dos summaries gerados sem erro
- p95 latência ≤8s
- Adoção: ≥40% dos summaries lidos em ≤24h pós-call
