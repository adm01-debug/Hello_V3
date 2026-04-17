
Erros de build atuais: 9 ocorrências em Inbox/Knowledge/RoutingRules/SLAPolicies onde props `icon` recebem `LucideIcon` em vez de `<Icon />`. Preciso corrigir junto com a implementação da nova feature.

## Plano: Meeting Summary AI (notas pós-call automáticas) + correções de build

### 1. Correções de build (pré-requisito)
- `src/pages/Inbox.tsx` (3 erros): linhas 106, 157, 218 — passar `<Icon />` em vez de `Icon`
- `src/pages/Knowledge.tsx` (2 erros): linhas 64, 108
- `src/pages/RoutingRules.tsx` (2 erros): linhas 52, 61
- `src/pages/SLAPolicies.tsx` (2 erros): linhas 45, 71

### 2. Backend: edge function `generate-meeting-summary`
- Auth JWT obrigatório + rate limit DB (`checkRateLimitDB`)
- Input: `callSessionId` (busca transcrição via `call_transcripts` + `call_sessions`)
- Lovable AI (`google/gemini-2.5-flash`) com **tool calling** para output estruturado:
  - `summary` (resumo executivo 2-3 parágrafos)
  - `key_points` (lista de tópicos)
  - `action_items` (com responsável + prazo sugerido)
  - `decisions` (decisões tomadas)
  - `next_steps` (próximos passos)
  - `participants_sentiment` (por participante)
  - `topics_discussed` (tags)
  - `follow_up_required` (boolean + razão)
- Persiste em nova tabela `meeting_summaries`
- Trata 429/402 com mensagens claras

### 3. Database: migration
```sql
CREATE TABLE meeting_summaries (
  id uuid PK,
  call_session_id uuid FK,
  summary text,
  key_points jsonb,
  action_items jsonb,
  decisions jsonb,
  next_steps jsonb,
  participants_sentiment jsonb,
  topics_discussed text[],
  follow_up_required boolean,
  follow_up_reason text,
  ai_model text,
  generated_by uuid FK auth.users,
  generated_at timestamptz,
  edited boolean default false,
  edited_content jsonb,
  shared_with uuid[],
  created_at, updated_at
);
```
- RLS: admin/supervisor full; agent vê apenas summaries de chamadas onde participou (`agent_id = get_user_agent_id()`)
- Índice em `call_session_id`

### 4. Auto-trigger pós-call
- Hook `useCallSession` já marca `status='ended'` — adicionar disparo automático via novo hook `useAutoMeetingSummary` que escuta mudança e chama edge function quando duração ≥ 60s e há transcrição

### 5. Frontend
- **Hook** `src/hooks/useMeetingSummary.ts`: query (por callSessionId), mutation (gerar/regenerar/editar/compartilhar), realtime subscription
- **Componente** `src/components/calls/MeetingSummaryCard.tsx` (≤400 linhas): visualização com tabs (Resumo / Ações / Decisões / Sentimento), botão regenerar, edição inline, copiar/compartilhar, exportar PDF
- **Integração**: 
  - `CallDetailDialog.tsx`: nova aba "Resumo IA"
  - `CallHistory.tsx`: badge indicando se há summary
  - `ExecutiveDashboard.tsx`: card "Action items pendentes" (agregado)

### 6. Página dedicada `/meeting-summaries`
- Lista paginada de summaries com filtros (data, agente, follow-up pendente)
- Busca full-text no resumo
- Adicionar rota em `protectedRoutes.tsx` + entrada no `AppSidebar` + `CommandPalette`

### 7. Testes
- `useMeetingSummary.test.ts`: queries, mutations, error handling
- `meeting-summary-utils.test.ts`: parsers, validação de schema

### 8. Documentação
- ADR `docs/adr/012-meeting-summary-ai.md`
- Memória `mem://features/meeting-summary-ai.md` + atualizar `mem://index.md`

### Considerações técnicas
- ≤400 linhas/arquivo, PT-BR, logger central, sonner, estética cyberpunk neon
- Reuso de `call_sessions`, `call_transcripts`, `agents`
- Tool calling para garantir JSON estruturado (sem parseamento frágil)
- Auto-geração só quando duração ≥ 60s + transcrição disponível (evita custo desnecessário)
- Retentativa manual sempre disponível
- Sem novas dependências externas

### Ordem de execução
1. Corrigir 9 erros de build (props icon)
2. Migration `meeting_summaries` + RLS + índices
3. Edge function `generate-meeting-summary` com tool calling
4. Hooks `useMeetingSummary` + `useAutoMeetingSummary`
5. Componente `MeetingSummaryCard` + integração em `CallDetailDialog`
6. Página `/meeting-summaries` + rota + sidebar + command palette
7. Card no Executive Dashboard
8. Testes + ADR + memória
9. Validação end-to-end (preview + verificação de tipos)
