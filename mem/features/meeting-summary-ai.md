---
name: Meeting Summary AI
description: Notas executivas pós-chamada geradas automaticamente por IA com tool calling estruturado, resumo, ações, decisões, sentimento e follow-up.
type: feature
---

# Meeting Summary AI

Geração automática de notas executivas pós-call usando Lovable AI (gemini-2.5-flash) com **tool calling** para garantir output estruturado.

## Trigger automático
- Disparado em `useCallSession.endSession` quando duração ≥ 60s + transcrição disponível
- Idempotente (upsert por `call_session_id`); regeneração manual via `force=true`
- Retentativa manual sempre disponível pelo `MeetingSummaryCard`

## Saída estruturada (tool: save_meeting_summary)
- `summary` (resumo executivo 2-3 parágrafos)
- `key_points`, `action_items` (com owner/due/priority), `decisions`, `next_steps`
- `participants_sentiment` (por speaker, com sentiment + score)
- `topics_discussed` (tags)
- `follow_up_required` + `follow_up_reason`
- `confidence` (0-1)

## Tabela `meeting_summaries`
- RLS: admin/supervisor full; agente acessa apenas summaries de chamadas em que participou (`get_user_agent_name()`)
- Índice único em `call_session_id`; índices em `generated_at`, `follow_up_required`, `status`
- Suporte a edição manual (`edited`, `edited_content`, `edited_by`, `edited_at`)
- Realtime habilitado

## Frontend
- Hook `useMeetingSummary(callSessionId)`: query, mutation generate/update/share, realtime
- Hook `useMeetingSummariesList`: lista paginada com filtros + busca
- Hook `usePendingActionItems`: agregado para Executive Dashboard
- Componente `MeetingSummaryCard` com tabs (Resumo / Ações / Decisões / Sentimento)
- Página `/meeting-summaries` com lista + detalhes lado-a-lado
- Aba "Resumo IA" no `CallDetailDialog`
- Card no Executive Dashboard mostrando follow-ups pendentes + ações totais

## Edge function `generate-meeting-summary`
- Auth JWT obrigatório + rate limit DB
- Trata 429 (rate limit IA) e 402 (créditos esgotados) com mensagens claras
- Marca `status='generating'` durante processamento; `'failed'` com `error_message` em caso de erro
