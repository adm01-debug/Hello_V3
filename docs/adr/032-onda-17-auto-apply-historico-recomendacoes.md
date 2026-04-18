# ADR-032 — Onda 17: Auto-Apply Programado e Histórico Auditável de Recomendações VoIP

**Data:** 2026-04-18
**Status:** Aceito

## Contexto

A Onda 16 entregou o painel de recomendações acionáveis com snooze 24h em `localStorage`. Faltavam dois capacidades para fechar o loop operacional em nível enterprise:

1. **Persistência auditável** — sem registro central, era impossível medir adoção das recomendações, tempo médio até aplicar, ou diferenciar agentes/supervisores responsivos.
2. **Auto-remediação opcional** — operadores precisavam clicar manualmente em recomendações críticas seguras (ex.: `run_connectivity_test`), introduzindo latência.

## Decisão

### 1. Tabela `voip_recommendation_actions`
- Persistência via `supabase.from().insert()` direto do client (sem edge function de escrita), aproveitando RLS por `auth.uid() = user_id`
- Outcome enumerado em CHECK constraint: `applied | snoozed | dismissed | auto_applied`
- Índices duplos: `(user_id, applied_at desc)` para histórico pessoal e `(category, outcome)` para agregações cross-user
- Visão admin/supervisor via `is_admin_or_supervisor()` security definer

### 2. Edge function `voip-recommendation-history`
- Single-call agregada (`Promise.all` desnecessário — query única + agregação em memória)
- Retorna sempre 14 dias na série temporal (zero-fill) para sparkline consistente
- Períodos `day | week | month`, limites `10 | 25 | 50 | 100` validados via `oneOf`

### 3. Auto-apply restrito
- **Opt-in explícito** via toggle persistente em `localStorage` (`voip-rec-auto-apply`)
- **Whitelist rígida**: apenas `severity=critical` + `action_type=function`. Hoje só `run_connectivity_test` se qualifica.
- **Countdown 3s** com cancelamento; cancelar grava `dismissed` para auditoria
- **Anti-loop**: `useRef<Set<string>>` impede reaplicar o mesmo ID na sessão

### 4. Drawer lateral
- `Sheet` shadcn com lazy-load (query desabilitada até `open=true`)
- Reuso do padrão CSV BOM UTF-8 da Onda 15
- Sparkline via recharts já presente, sem nova dependência

## Consequências

### Positivas
- Loop completo de remediação: **detectar → recomendar → aplicar/auto → registrar → auditar**
- Métricas de adoção viáveis (% auto-aplicado, tempo médio até apply)
- Compliance: auditoria imutável de quem fez o quê e quando
- Zero lock-in: tabela isolada, edge function read-only, fácil rollback

### Negativas / Mitigações
- Auto-apply pode causar surpresa → mitigado por opt-in + countdown + cancelamento
- Histórico cresce indefinidamente → próxima onda pode adicionar TTL/archive (não bloqueante)

## Alternativas consideradas
- **Trigger PG para auto-registrar** — descartado: requer edge function adicional ou exposição de schema; client-side insert com RLS é mais simples e auditável
- **Auto-apply server-side via cron** — descartado: viola princípio de consentimento explícito do operador no momento da ação

## Métricas de sucesso
- Taxa de auto-apply > 0% nas primeiras 48h após enable
- Zero erros de RLS em logs de produção
- Drawer abre em <300ms (lazy query)

## Referências
- ADR-031 (Onda 16 — Recomendações acionáveis)
- `mem/features/voip-recommendation-history.md`
