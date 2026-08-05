# ADR 009 — Sales Enablement & Revenue Intelligence Suite

**Status:** Aceito
**Data:** 2026-04-16

## Contexto

Após a entrega da suíte Conversation Intelligence (ADR 008), o próximo gap competitivo identificado em relação a plataformas líderes (Gong, Chorus, Outreach, Salesloft) é o **Sales Enablement / Revenue Intelligence**: pipeline de oportunidades vinculado a chamadas, forecast assistido por IA, cadências multi-touch, scorecards estruturados, trackers temáticos e playlists de coaching.

## Decisão

### Modelo de dados (sem novas dependências)
- **deals** + `call_sessions.deal_id`: vinculação chamada↔oportunidade com health score persistido
- **scorecard_templates / scorecard_criteria / call_scorecards / scorecard_responses**: rubrica configurável e respostas individuais (rascunho IA + revisão humana)
- **cadences / cadence_steps / cadence_enrollments**: motor multi-touch com `next_action_at` indexado para scheduler futuro
- **trackers / tracker_matches**: generalização de battle cards para qualquer tema (compliance, descoberta, fechamento)
- **call_playlists / playlist_items**: playlists manuais ou automáticas, com compartilhamento via array `shared_with`

### Edge functions
- **compute-deal-health**: heurística determinística (recência 20% + sentimento 25% + momentos 25% + satisfação 15% + probabilidade 15%) — rápida e auditável, sem custo de IA por chamada
- **forecast-deals**: agregação por estágio + composição probabilidade×health (70/30); retorna weighted/best/commit + confiança média
- **score-call**: usa `google/gemini-2.5-flash` via Lovable AI Gateway para gerar rascunho de avaliação a partir da rubrica + transcrição + resumo

### RLS
- Admin/supervisor: acesso total
- Agente: somente seus deals, suas inscrições, suas avaliações; playlists próprias ou compartilhadas

### Frontend
- Páginas dedicadas: `/deals` (kanban), `/cadences`, `/trackers`
- Card `ForecastCard` integrado ao Executive Dashboard
- Reuso do `NeonPageLayout` e tokens semânticos para manter estética cyberpunk

## Alternativas consideradas

- **Forecast 100% IA generativa**: descartado por custo, latência e baixa explicabilidade. Híbrido (heurística com sinais de CI) entrega resultado comparável e rastreável.
- **Reuso de `dialer_campaigns` para cadências**: descartado — cadências têm semântica multi-touch (não apenas dialing) e steps tipados (call/whatsapp/email/task).
- **Trackers como extensão de battle cards**: descartado para evitar acoplar conceito de "concorrente" a temas genéricos; trackers é um modelo limpo.

## Consequências

### Positivas
- Paridade competitiva em Revenue Intelligence sem novas dependências
- Health score determinístico permite auditoria e A/B
- Edge function `score-call` é o único ponto de custo de IA recorrente; demais cálculos são SQL puro
- RLS coerente com hierarquia já estabelecida (`get_user_agent_name`, `is_admin_or_supervisor`)

### Negativas / pendências
- Engine de cadências (cron job que processa `next_action_at`) ainda não implementado — apenas modelo + UI
- Sync bidirecional Bitrix de deals fica como follow-up (depende de validação de fluxo CRM com o cliente)
- Detecção automática de tracker matches em transcrições requer worker dedicado (próxima iteração)

## Referências
- `supabase/functions/compute-deal-health/index.ts`
- `supabase/functions/forecast-deals/index.ts`
- `supabase/functions/score-call/index.ts`
- `src/hooks/useDeals.ts`, `src/hooks/useCadences.ts`, `src/hooks/useScorecards.ts`, `src/hooks/useTrackers.ts`, `src/hooks/useCallPlaylists.ts`, `src/hooks/useDealForecast.ts`
- `src/pages/Deals.tsx`, `src/pages/Cadences.tsx`, `src/pages/Trackers.tsx`
- `src/components/executive/ForecastCard.tsx`
