# Achados fora de escopo (Hello_V3, 2026-11-21)

> Itens encontrados no caminho que NÃO são do item em execução. Não corrigidos (regra do goal). Cada um executável por agente futuro.

## Código
- A1. `src/pages/admin/SecurityAuditDashboard.tsx` tem 9 warnings de lint: 'ptBR' definido e não usado (`:18`), 'user' atribuído e não usado (`:55`). Não tocado na #62 (zero regressão). Limpeza trivial numa chore futura.
- A2. Rota `/security` (SecurityDashboard antigo, ex-/src/pages/SecurityDashboard.tsx) ainda existe e funciona; mantida por regra anti-regressão. Avaliar eventual unificação com `/admin/security-audit` (decisão de negócio).
- A3. `useSecurityDashboard` (hook) continua consumido por `src/pages/SecurityDashboard.tsx` (rota /security) e por seu coerente test de cobertura — NÃO é órfão, não remover. Verificado em 21/11.

## Banco / dados
- A4. `permissions`/`role_permissions` = 0 linhas: RBAC de módulos não definido. Depende de decisão de negócio (WIRING-01 usa mas tem fallback).
- A5. `conversations` = 0 e canal whatsapp sem conversa real — "Melhorar com IA" testável O2O apenas após haver uma conversa real OU o valor de `LOVABLE_API_KEY` (credencial, AGUARDANDO HUMANO).
- A6. `call_translations` (LiveTranslationPanel) = 0 linhas; todas as 51 call_sessions estão `completed` — sem chamada ativa, sem dado de tradução em tempo real. WIRING-02 descartado por isso.

## Segredos / infra
- A7. `LOVABLE_API_KEY` NÃO está configurada como secret de edge function no projeto Supabase (listagem de secrets via Management API = só chaves `SUPABASE_*`; edge retorna 503 no branch `!LOVABLE_API_KEY`). Necessária em 20+ edge functions. AGUARDANDO HUMANO (dashboard Supabase).
- A8. `SUPABASE_SERVICE_ROLE_KEY` nunca rotacionado (segredo mais poderoso) — risco latente, só via dashboard.

## Docs
- A9. `docs/estado/infra-ci-rotas-integracoes.md:130,142` e `docs/estado/paginas-parte2.md:59,124-125` descrevem o estado PRÉ-#61/#62 (rota apontando para security antigo). Defasados; atualizar na próxima melhoria de docs (sem mudança de código).