
Vou conduzir auditoria técnica exaustiva (22 dimensões, padrão 10/10) usando ferramentas read-only: scan de segurança, linter Supabase, leitura de RLS, Edge Functions, scorecard, ADRs, testes e estrutura.

## Plano de Execução da Auditoria

### Fase 0 — Inventário
- Listar `src/`, `supabase/functions/`, `supabase/migrations/`, `docs/adr/`
- Contar arquivos, edge functions, testes, ADRs
- Validar stack: React 18 + Vite + TS strict + Supabase + Lovable Cloud + Lovable AI Gateway

### Fase 1 — Coleta de Evidências (paralela)
1. **Segurança**: `security--run_security_scan` + `supabase--linter` + leitura de `src/lib/security/*`
2. **RLS/Autorização**: `supabase--read_query` em `pg_policies` + leitura de migrations recentes
3. **Auth**: leitura de `src/hooks/useAuth.ts`, `src/hooks/auth/*`, lockout policy, MFA presence
4. **Edge Functions**: amostragem de 3-5 functions críticas (JWT, CORS, validação, error handling)
5. **Tipagem**: `tsconfig.json` (já visto: strict + noImplicitAny ✓) + grep de `as any` residual
6. **Testes**: contar suites Vitest + Deno + Playwright + cobertura RLS declarativa
7. **Observabilidade**: `src/lib/logger.ts`, `src/lib/tracing.ts`, `src/lib/web-vitals.ts`, `src/lib/error-tracking.ts`
8. **Performance**: React Query config, lazy loading, bundle hints
9. **Validação**: `src/lib/validation/` (Zod schemas)
10. **Documentação**: contar ADRs (esperado ~37), runbooks, scorecard, memórias

### Fase 2 — Análise das 22 Dimensões
Para cada dimensão: nota 0-10, evidências com paths, gaps para 10/10, ações corretivas concretas.

Áreas com risco conhecido (do scorecard atual):
- 3 WARN linter Supabase (RLS true em SELECT públicos intencionais — aceito, mas verificar)
- `as any` residuais em interop (Recharts/Radix/Web Audio — formalizado em ADR-022)
- `crm_field_suggestions` policies amplas (mapeado para próxima iteração)
- `leaked-password-protection` depende de toggle no Dashboard Supabase

### Fase 3 — Consolidação
- Scorecard ASCII completo (20 dimensões + ponderada)
- Top 10 ações por ROI
- Roadmap 3 ondas (Quick Wins / Sprint 1 / Sprint 2)
- Comentário final de maturidade

### Pesos (conforme prompt)
- ×3: Segurança, Autenticação, Autorização, Data Integrity
- ×2: Banco, Tipagem, Validação, Testes, Arquitetura
- ×1: Demais

### Entregável
Relatório completo em PT-BR no chat (sem alterações de código — modo read-only). Após sua aprovação, no modo default posso executar as ações Quick Wins identificadas (ex.: ativar HIBP, refinar policies amplas, eliminar últimos `as any` evitáveis).

Considerações:
- Auditoria 100% baseada em evidências do codebase (sem achismo)
- Notas conservadoras: 10/10 só com zero gaps demonstráveis
- Calibrada ao contexto (web-only, Lovable Cloud, time pequeno)
- Ações concretas com paths/migrations/configs
