# ADR 011 — Workforce Management & Operational Excellence Suite

**Status:** Aceito
**Data:** 2026-04-17

## Contexto

Após entregar Conversation Intelligence (ADR 008), Sales Enablement (009) e Customer Success (010) em nível 10/10, o próximo gap competitivo está em Workforce Management — domínio de plataformas como NICE, Verint, Calabrio e Five9. A operação carecia de:

- Previsão de volume com dimensionamento de equipe (Erlang C)
- Escala de turnos com modelos reutilizáveis e fluxo de folgas
- Aderência em tempo real (programado vs realizado)
- Skill-based routing com proficiência mensurável (1-5)
- Workflow estruturado de Quality Management (rascunho → calibração → assinatura)
- Coaching assignments com SLA e prazo
- Biblioteca de microlearning

## Decisão

Implementar suíte completa em uma única migração + 2 edge functions + 7 hooks + 3 páginas + 1 card no Executive Dashboard.

### Modelagem
9 tabelas com RLS rigoroso (admin/supervisor full; agent só seus dados). Catálogos compartilhados (skills, templates, learning_modules) visíveis a todos autenticados.

### Heurísticas determinísticas
Para auditabilidade e custo zero, evitamos IA onde uma fórmula simples atende:
- **Forecast:** média de 4 semanas + Erlang C (AHT 240s, SL 80%)
- **Adherence:** soma de tempo em `available`/`busy` ÷ programado; desvio se `away` > 15min
- **Skill match:** `weight × proficiency` ordenado desc (a ser usado na distribuição futura)

### UX
- Grade semanal 7 colunas em `/scheduling` (drag-friendly via cliques)
- Heatmap 7×24 no Executive Dashboard mostra volume previsto + agentes necessários
- Matriz agente×skill em tabela única em `/skills`
- Cards de microlearning agrupados por categoria com flag "concluído" por agente

## Consequências

**Positivas**
- Operação ganha capacidade de planejamento preditivo sem custo recorrente
- Aderência permite intervenção imediata do supervisor
- Skills permitem evolução para roteamento inteligente sem mudança de schema
- Coaching com prazo + learning fecham loop de desenvolvimento

**Negativas / Trade-offs**
- Erlang C simplificado (sem fórmula completa com Poisson) — aceitável para projeção; refinar quando houver demanda
- Adherence depende de `agent_status_history` (já existente) — fallback assume 100% se sem histórico
- Distribuidor real por skills é fora deste ADR (apenas o schema + matriz)

**Neutras**
- Sem novas dependências externas
- Sem novas integrações de IA
