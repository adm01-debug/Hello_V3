
Meeting Summary AI base entregue. Para fechar 10/10, faltam: ADR, testes, validação E2E + pequenos ajustes de polimento.

## Plano: Finalização Meeting Summary AI → 10/10

### 1. ADR 012
- `docs/adr/012-meeting-summary-ai.md` documentando: contexto, decisão (tool calling vs JSON parse), trigger automático ≥60s, idempotência por upsert, RLS por agente da chamada, integração com `useCallSession.endSession`

### 2. Testes
- `src/hooks/__tests__/useMeetingSummary.test.ts`:
  - parse robusto de campos jsonb (arrays vazios, nulls)
  - generate sucesso → invalida cache + toast
  - generate erro → toast.error
  - skipped → toast.info
  - updateContent marca `edited=true` + `edited_at`
- `src/lib/__tests__/meeting-summary-utils.test.ts`:
  - validação do formato de `ActionItem` e `ParticipantSentiment`
  - serialização "copiar tudo" (formato texto plano)

### 3. Polimento
- Botão "Compartilhar" no `MeetingSummaryCard` (popover com seleção de usuários do `user_profiles`)
- Badge "Resumo IA" na lista `CallSessionsList` quando existir summary (left join leve)
- Empty state melhorado quando `transcripts.length === 0` (mensagem clara: "Sem transcrição — gere transcrição primeiro")

### 4. Validação E2E
- Verificar build TypeScript (`tsc --noEmit`)
- Inspecionar console/network do preview para erros
- Confirmar realtime funciona (mudança de status `generating` → `completed`)

### Considerações técnicas
- ≤400 linhas/arquivo, PT-BR, logger central, sonner
- Sem novas dependências
- Tests usando padrão já estabelecido em `__tests__` (vitest + mocks de supabase)

### Ordem de execução
1. ADR 012
2. Testes (`useMeetingSummary.test.ts` + `meeting-summary-utils.test.ts`)
3. Polimento (badge na lista + empty state transcrição + share popover)
4. Build check + console/network do preview
5. Atualizar `mem://index.md` com nota de conclusão
