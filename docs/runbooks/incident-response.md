# Runbook — Resposta a Incidentes

**Versão:** 1.0 · **Onda:** 8 · **Data:** 2026-04-17

Este runbook documenta procedimentos operacionais para incidentes recorrentes em produção. Todos os procedimentos são executáveis por equipe de suporte L1/L2.

---

## Severidades

| Nível | Tempo de resposta | Quem aciona |
|---|---|---|
| **P1 — Crítico** | < 15 min | Plantão + tech lead |
| **P2 — Alto** | < 1 h | Suporte L2 |
| **P3 — Médio** | < 4 h | Suporte L1 |
| **P4 — Baixo** | < 24 h | Backlog |

---

## 1. Falha de Edge Function

**Sintomas:** erros 5xx em invokes, toasts de "erro interno", `x-request-id` aparecendo nos logs do cliente.

**Diagnóstico:**
1. Identificar função afetada (nome aparece no toast/console).
2. Acessar **Lovable Cloud → Functions → [nome] → Logs**.
3. Filtrar pelo `x-request-id` reportado pelo usuário.
4. Verificar stack trace e mensagem de erro.

**Ações:**
- Erro de auth (`Invalid user session`) → orientar logout/login.
- Erro de validação (400) → bug no cliente; abrir issue.
- Erro de DB → seguir runbook de DB (seção 2).
- Erro 500 desconhecido → escalar para tech lead com `x-request-id`.

**Severidade padrão:** P2 (P1 se afetar autenticação ou compliance).

---

## 2. Degradação de Banco de Dados

**Sintomas:** `health-check` retorna `degraded` ou `unhealthy`; latência > 1s; queries lentas.

**Diagnóstico:**
1. Invocar `health-check` e analisar `db_latency_ms`.
2. Acessar **Lovable Cloud → Database → Statistics**.
3. Verificar conexões ativas, slow queries, locks.

**Ações:**
- Latência 500-1000ms → monitorar; escalar se persistir > 10 min.
- Latência > 1000ms → P1; verificar locks e queries em execução.
- Conexões esgotadas → identificar cliente que vaza conexões.
- Indisponível → contatar suporte Lovable.

**Severidade:** P1 se latência > 1s sustentada; P2 caso contrário.

---

## 3. Spike de IPs Bloqueados

**Sintomas:** alerta de `blocked_access_logs` com volume anormal; usuários relatando 403.

**Diagnóstico:**
1. Query: `SELECT ip_address, COUNT(*) FROM blocked_access_logs WHERE created_at > now() - interval '15 min' GROUP BY ip_address ORDER BY 2 DESC LIMIT 20;`
2. Verificar geolocalização e padrão (mesmo país? mesmo ASN?).
3. Cruzar com `audit_logs` para identificar tentativas legítimas.

**Ações:**
- Spike de IPs únicos (botnet) → revisar regras de geo-blocking; manter bloqueio.
- IP único legítimo bloqueado → adicionar a `ip_whitelist` ou `user_allowed_ips`.
- Falso positivo recorrente → revisar política em **Settings → Security → IP Restrictions**.

**Severidade:** P2 (P1 se afetar usuário-chave).

---

## 4. Violação de Rate Limit

**Sintomas:** alertas em `rate_limit_alerts` com severidade `critical`; usuários reportando "429 Too Many Requests".

**Diagnóstico:**
1. Query: `SELECT user_id, endpoint, request_count, threshold FROM rate_limit_alerts WHERE created_at > now() - interval '1 hour' AND severity = 'critical';`
2. Identificar se é abuso, bug do cliente (loop de invokes) ou legítimo.

**Ações:**
- Loop de invokes do cliente → bug de frontend; abrir issue P1 se em produção.
- Abuso confirmado → manter bloqueio; adicionar IP a denylist se necessário.
- Limite muito baixo → ajustar `rate_limit_settings` (requer aprovação tech lead).

**Severidade:** P2.

---

## 5. Falha em Compliance (DNC / Calling Hours)

**Sintomas:** chamadas executadas para números em DNC ou fora do horário permitido.

**Diagnóstico:**
1. Verificar logs de `check-dnc` e `check-calling-hours` no `x-request-id` da chamada.
2. Confirmar dados em `dnc_list` e `calling_hours_config`.

**Ações:**
- Falha real de compliance → P1; pausar campanha imediatamente; notificar DPO.
- Falso positivo → revisar normalização de telefone e timezone.

**Severidade:** P1 (sempre — risco TCPA/LGPD).

---

## Pós-incidente

Para todo incidente P1/P2:
1. Registrar timeline em `docs/incidents/YYYY-MM-DD-titulo.md`.
2. Identificar causa raiz (5 porquês).
3. Criar ADR se mudança arquitetural for necessária.
4. Atualizar este runbook se procedimento for novo.

---

## Contatos

- **Tech lead:** via canal `#oncall`.
- **Suporte Lovable:** dashboard → Help.
- **DPO (compliance):** dpo@empresa.com.br.
