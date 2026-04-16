
Plano já aprovado anteriormente. Restam 4 itens (7-10). Apresentando plano focado nas melhorias finais para alcançar 10/10.

## Plano: Finalizar Conversation Intelligence (itens 7-10)

### 7. Card "Conversation Intelligence" no Dashboard Executivo
- Novo componente `src/components/executive/ConversationIntelligenceCard.tsx` consultando:
  - Talk ratio médio agregado de `call_summaries` + `call_sessions`
  - Top 3 concorrentes mencionados via agregação de `call_key_moments` (type='competitor')
  - % chamadas com objeção (type='objection') sobre total
  - Total de momentos-chave da semana
- Integrar em `ExecutiveDashboard.tsx` após `HoldKPICards`
- Estética cyberpunk: glassmorphism + glow primary, ícone Brain

### 8. Testes unitários adicionais
- `src/hooks/__tests__/useCallSearch.test.ts` — mock supabase.functions.invoke, validar filtros, paginação, estados loading/error/empty query
- `src/hooks/__tests__/useTalkRatio.test.ts` — estados loading/success/error e retorno do data
- `supabase/functions/detect-key-moments/__tests__/schema.test.ts` (ou inline em src) — validar schema Zod de input/output

### 9. ADR — `docs/adr/008-conversation-intelligence.md`
- Contexto: necessidade de paridade com Gong/Chorus
- Decisões: Lovable AI (gemini-2.5-flash) para detecção de momentos; tsvector PT-BR + GIN para busca; persistência via background invoke; Teams adiado por falta de connector aprovado
- Consequências: custo de IA controlado, busca rápida full-text, dependência de qualidade de transcrição, importação externa pendente

### 10. Atualização de memória
- Atualizar `mem://features/conversation-intelligence.md` com estado final 10/10, listando todos os componentes/hooks/edge functions/páginas
- Atualizar `mem://index.md` com a referência completa

### Considerações
- ≤400 linhas/arquivo, PT-BR, logger central, sonner, estética neon mantida
- Sem novas dependências, sem novas tabelas
- Execução sequencial sem pausas conforme solicitado
