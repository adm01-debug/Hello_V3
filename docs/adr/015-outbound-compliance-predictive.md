# ADR 015 — Outbound Compliance & Predictive Engagement Suite

**Status:** Aceito
**Data:** 2026-04-17
**Autores:** Equipe Lovable

## Contexto

Plataformas líderes em call center outbound (Five9, NICE CXone, Convoso) oferecem três capacidades-chave que faltavam ao produto:

1. **Gestão de consentimento** com audit trail (TCPA, LGPD, GDPR).
2. **Otimização de janela de contato** baseada em padrões históricos por contato.
3. **Score preditivo de atendimento** que combina sinais de compliance, histórico e janela ótima para priorização do discador.

Sem essas capacidades, o discador preditivo opera "no escuro": tenta contatos em horários estatisticamente ruins, expõe a empresa a multas por violação de DNC/horário, e desperdiça tempo de agente em ligações com baixa probabilidade de atendimento.

## Decisão

Implementamos uma suíte coesa **Outbound Compliance & Predictive Engagement** com três pilares:

### 1. Consent Management
- Tabela `consent_records` registra opt-in/opt-out por canal (`voice`, `sms`, `whatsapp`, `email`) e tipo (`marketing`, `transactional`, `recording`, `data_processing`).
- Edge function `record-consent` valida payload, força papéis admin/supervisor, e gera entrada em `audit_logs` para cada registro.
- Evidência (IP, user-agent, fonte, observações) é persistida para auditoria forense.

### 2. Smart Time-to-Contact Optimizer
- Tabela `contact_engagement_patterns` armazena, por contato: `best_hour`, `best_day_of_week`, `answer_rate`, distribuições horária/diária e timestamps.
- Edge function `compute-best-time` analisa até 500 sessões mais recentes por contato e calcula a melhor janela com base em taxa de atendimento ponderada (mínimo 2 tentativas por slot para evitar viés).
- Hook `useBestTimeToContact` permite recálculo em massa ou pontual via UI.

### 3. Predictive Answer Rate Scoring
- Edge function `score-call-attempt` combina: estado DNC, horário permitido (RPC `check_calling_hours`), padrão de engajamento e match com janela atual.
- Score normalizado em [0,1] com 5 níveis: `block`, `defer`, `low_priority`, `normal`, `high_priority`.
- Util client-side `outbound-scoring.ts` espelha a lógica para uso síncrono no Predictive Dialer e UI.

### Por que NÃO usar Lovable AI no scoring?

A regra de scoring é determinística e auditável (compliance exige reprodutibilidade). Usar LLM introduziria não-determinismo, custo recorrente desnecessário e dificuldade de explicar decisões em auditorias. A IA continua disponível para análise pós-call (sentiment, próxima melhor ação) onde criatividade agrega valor.

## Trade-offs

| Aspecto | Decisão | Alternativa rejeitada |
|---|---|---|
| Cálculo do score | Heurística determinística | LLM (não auditável, caro) |
| Storage de evidência | JSONB em `consent_records` | Tabela separada `consent_evidence` (overkill no MVP) |
| Cálculo de padrões | Edge function on-demand + manual | Cron diário (adicionado depois se necessário) |
| Filtro mínimo de slots | ≥ 2 tentativas | ≥ 5 (rejeitado por reduzir cobertura inicial) |

## Consequências

**Positivas:**
- Compliance verificável para TCPA/LGPD com audit trail completo.
- Discador preditivo prioriza contatos com maior probabilidade de atendimento.
- Reuso pesado de infraestrutura existente (`dnc_list`, `calling_hours_config`, `holidays`, `call_sessions`).
- Score determinístico e explicável.

**Negativas / mitigações:**
- Padrões precisam de histórico mínimo (3 tentativas) — fallback para score base 0.5.
- Recálculo em massa pode ser lento para >500 contatos — limite de 200 por chamada e processamento idempotente via upsert.

## Ordem de implementação

1. Migration: `consent_records`, `contact_engagement_patterns` + RLS + índices.
2. Edge functions: `record-consent`, `compute-best-time`, `score-call-attempt`.
3. Hooks: `useConsent`, `useBestTimeToContact`, `useCallScoring`.
4. Util `outbound-scoring.ts` + testes Vitest.
5. Página `/outbound-compliance` (4 tabs).
6. Card no Executive Dashboard.
7. Sidebar + Command Palette + rota.

## Métricas de sucesso

- Taxa de violação DNC = 0 (ligações bloqueadas pré-discagem).
- Aumento ≥ 15% na taxa de atendimento de campanhas que usam priorização por score.
- 100% das mudanças de consentimento auditáveis em `audit_logs`.
