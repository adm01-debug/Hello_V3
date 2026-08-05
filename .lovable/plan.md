
## Onda 39 — Auditoria Real “do zero” + correção total pré-produção

Vou reiniciar a auditoria sem confiar cegamente na suíte atual: validar código real, fluxos reais, regras reais de segurança e integração real. Tudo que falhar será corrigido na mesma onda.

### Descobertas iniciais já confirmadas
- Há um bug real de runtime na home (`/`): **hooks sendo chamados dentro de funções auxiliares/callbacks**, causando `Rendered more hooks than during the previous render`.
- O padrão quebrado aparece em páginas como:
  - `src/pages/Index.tsx`
  - `src/pages/Reports.tsx`
  - `src/pages/Voicemail.tsx`
  - `src/pages/QRProvisioning.tsx`
  - `src/pages/CallFlowDesigner.tsx`
  - `src/pages/SessionManagement.tsx`
  - `src/pages/TopicDetection.tsx`
  - `src/pages/HoldAlertSettings.tsx`
- Parte relevante dos testes atuais é **muito sintética**: vários arquivos validam constantes/mocks locais, não o comportamento real dos módulos, hooks, policies e Edge Functions.
- Exemplo de gap: `bitrix-api` existe, mas **não há teste Deno dedicado visível** para ela; algumas suítes de Edge Functions hoje validam só lógica simulada.

## O que vou fazer
### 0. Corrigir o bloqueador atual
- Remover todos os usos incorretos de `usePageTitle` em funções internas/helpers/callbacks.
- Padronizar: hook sempre no topo do componente.
- Fazer varredura global por hooks usados fora do fluxo correto.

### 1. Reauditar a base de testes “do zero”
- Classificar a suíte atual em:
  - testes reais
  - testes úteis porém superficiais
  - testes placebo/sintéticos
- Substituir testes sintéticos por testes que exercitam código real:
  - hooks reais
  - componentes reais
  - shared utils reais
  - Edge Functions reais
  - regras de acesso reais

### 2. Frontend: cobertura exaustiva por camada
- Hooks críticos: auth, CRM/Sales, VoIP, segurança, notificações, realtime, aderência, relatórios.
- Páginas críticas: dashboard, inbox, deals, accounts, renewals, notifications, settings, admin, segurança, videoconferência, voicemail, compliance.
- Componentes com ações do usuário: botões, filtros, modais, tabelas, formulários, tabs, exportações.
- Cenários: loading, empty, erro, race condition, retry, payload parcial, auth ausente, role incorreta, dados grandes, stale cache.

### 3. Segurança e acesso
- Rodar linter de banco e revisar manualmente schema/policies.
- Validar autenticação, roles, prevenção de escalation e lockout.
- Reforçar testes de RLS: reduzir dependência de matrizes simuladas e validar comportamento mais próximo do real.
- Conferir storage protegido (`call-recordings`) e permissões por papel.

### 4. Edge Functions, webhooks e integrações
- Auditar as funções críticas primeiro:
  - `health-check`
  - `bitrix-api`
  - `check-hold-alerts`
  - `check-queue-metrics`
  - `voip-trunks-healthcheck`
  - `request-password-reset`
  - `approve-password-reset`
  - funções de voz/IA/WhatsApp
- Para cada uma:
  - CORS
  - auth/JWT
  - validação de entrada
  - tratamento de erro
  - timeout/retry
  - resposta consistente
- Criar/expandir testes Deno reais e smoke tests das rotas críticas.
- Revisar webhooks quanto a assinatura, idempotência, replay e payload malformado.

### 5. Milhares de cenários automatizados
- Expandir property-based/fuzz para utilitários, validadores, normalização, parsers, regras de negócio e contratos.
- Aumentar cenários de hooks e componentes com matrizes amplas e seeds reproduzíveis.
- Garantir milhares de execuções úteis, não só volume artificial.

### 6. Jornadas ponta a ponta
- Fluxos prioritários:
  - login/cadastro/recuperação
  - dashboard/home
  - CRM: deal, conta, renovação
  - VoIP: sessão, trunk, alertas, qualidade
  - segurança: lockout, sessões, 2FA/passkeys
  - admin: permissões, relatórios, observabilidade
- Validar UI + efeito final, não apenas abertura de modal.

### 7. Correção imediata de cada falha encontrada
- Cada bug real encontrado será corrigido na mesma onda.
- Se aparecer problema estrutural recorrente, aplico correção em lote com padrão único.
- Manterei tudo em PT-BR, sem `any`, respeitando limite de tamanho por arquivo.

## Entregáveis
- Correções no código de produção
- Ampliação/substituição da suíte de testes com foco em comportamento real
- Testes Deno das Edge Functions críticas
- Relatório consolidado de auditoria pré-produção com:
  - bugs encontrados
  - correções aplicadas
  - gaps fechados
  - riscos remanescentes
  - checklist final de prontidão

## Critério de aceite
- Runtime blocker atual eliminado
- Suíte verde sem falhas relevantes
- Edge Functions críticas cobertas por testes reais
- Segurança/RLS revisadas sem findings críticos
- Fluxos principais funcionando ponta a ponta
- Sistema em estado confiável para produção, com evidência objetiva e não apenas “sensação de estabilidade”
