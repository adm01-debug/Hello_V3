# Regras de negócio verificadas (Hello_V3, 2026-11-21)

> Extraídas do código e do banco vivo nesta sessão. Cada regra com evidência.
> Hierarquia: auditoria diz o que DEVE existir; código+banco em produção dizem o que EXISTE. Em conflito, produção prevalece.

## Papéis e permissões
- R1. Tipos de papel: `admin`, `supervisor`, `agent`, `viewer` (enum `app_role`). Evidência: `supabase/migrations/20251231115936_...sql:7` e `20260515170309_...sql:3`.
- R2. Função `public.has_role(_user_id UUID, _role app_role)` centraliza checagem de papel. Evidência: `20251231115936_...sql:141`.
- R3. `user_roles` guarda 2 admins reais; RLS fecha leitura a chave anon (0 linhas). Evidência: `_verificado-banco.md`, querys service_role 20/11.
- R4. RBAC de `permissions`/`role_permissions` NÃO está definido (0 linhas) — aguarda decisão de negócio (quem pode o quê), não é seed técnico. Decisão em `_verificado-banco.md`.

## Auditoria e segurança
- R5. Toda ação sensível grava em `audit_logs` (213+ linhas). O painel de auditoria (SecurityAuditDashboard) lê `audit_logs`, `rls_audit_logs` e `webhook_flush_metrics`. Evidência: `src/pages/admin/SecurityAuditDashboard.tsx:78-81`.
- R6. `user_roles` exige 2 admins reais no sistema; remoção precisa de guard. (hook/função de guard — verificar em PR futura).

## Edge functions e IA
- R7. IA de conversa/atendimento usa o Lovable AI Gateway (`ai.gateway.lovable.dev/v1/chat/completions`) com `LOVABLE_API_KEY` como secret de edge, nunca no front. Evidência: `supabase/functions/whatsapp-rewrite/index.ts:70-72`, `AGENTS.md:103`.
- R8. `whatsapp-rewrite` reescreve mensagem no tom pedido (profissional/amigavel/conciso/empatico), exige JWT autenticado, valida message (1..4000), context (≤500), impõe rate-limit por usuário, e responde 503 se `LOVABLE_API_KEY` não configurada. Evidência: `whatsapp-rewrite/index.ts:43,54-72` (testado live: 401 sem JWT, 503 sem chave, 429 rate-limit).
- R9. Edge `send-survey` cria placeholder pending em `survey_responses`; NPS tem categorias promoter/passive/detractor. Evidência: `supabase/functions/send-survey/index.ts` e seed.

## Status e ciclo de vida
- R10. `call_sessions.status` usa 'completed' para chamadas encerradas; features de chamada ativa (LiveTranslation) dependem de sessions NÃO-completed (hoje 0). Evidência: `_verificado-banco.md` (51 sessions, todas completed), WIRING-02 DESCARTADO.
- R11. `survey_responses.answers` é JSONB (não text). Evidência: erro 42804 do seed (cast exigido), corrigido com `::jsonb`.

## Cron e data lake
- R12. Cron `data-lake-flush` exporta para export-data-lake; falhava por constraint de dataset sem call_summaries — corrigido em #60. Evidência: `20261120154610_fix-data-lake-exports-call-summaries.sql`, PR #60.
- R13. Inventário de edge functions é gerado por script e aponta pendências de deploy/segredo. Evidência: `inventario/estado/edges.json`, `scripts/ai-context/*`.

## Frontend
- R14. Gate de permissão na UI via `PermissionGate` (module+action) com fallback para comportamento atual quando sem permissão. Evidência: `src/components/auth/PermissionGate.tsx`, uso em `admin/ExtensionsAdmin.tsx` (botão Offline).
- R15. Composer de IA do inbox aparece SÓ para canal whatsapp; demais canais mantêm textarea/send originais. Evidência: `src/pages/Inbox.tsx` (WIRING-03).
- R16. Segredos do front usam prefixo VITE_; secrets de edge não entram no front. Evidência: `AGENTS.md:103`, `.env.example`.