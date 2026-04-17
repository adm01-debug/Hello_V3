
Status atual: Ondas 1-6 entregues. Maturidade 10/10 certificada em 22 dimensões. Auditoria, scorecard final, ADRs 014-021, testes RLS, testes de Edge Functions, tracing 100%, tipagem 100% — tudo concluído.

Não há melhorias remanescentes do roadmap aprovado. Para evitar trabalho redundante ou degradação por refactor sem objetivo, proponho uma Onda 7 enxuta e cirúrgica de manutenção contínua, focada apenas em pontos verificáveis que ainda agregam valor mensurável.

## Onda 7 — Manutenção Contínua (cirúrgica)

### 7.1 Varredura final `as any` em `src/components/`
Auditar com `code--search_files` por `as any` e `: any` em components não tocados nas Ondas 5-6. Substituir por tipos do `Database` ou `unknown` + guards. Estimativa ≤ 10 ocorrências.

### 7.2 Testes Deno para 2 Edge Functions ainda sem cobertura
Selecionar 2 funções críticas sem `__tests__/` (verificar via `code--list_dir supabase/functions/`):
- Candidatas prováveis: `check-dnc`, `check-calling-hours`, `validate-ip`, `health-check`
Criar `index.test.ts` cobrindo: auth, validação, branches de erro, propagação `x-request-id`.

### 7.3 Re-execução de linters e segurança
- `supabase--linter`
- `security--run_security_scan`
- Confirmar zero novos findings desde Onda 6
- Anexar resultado ao `docs/audit/scorecard-final.md` (seção "Re-verificação Onda 7")

### 7.4 ADR-022 + memória + índice
- `docs/adr/022-onda-7-manutencao-continua.md`
- `mem/features/onda-7-manutencao.md`
- Atualizar `mem/index.md`

### Considerações
- ≤400 linhas/arquivo, PT-BR, logger central, sonner, cyberpunk neon
- Zero breakage; sem novas dependências
- Se varredura 7.1 retornar zero ocorrências, registrar no ADR e pular para 7.2
- Se todas Edge Functions já tiverem testes, registrar e pular para 7.3

### Ordem de execução
1. 7.1 Varredura + correção `as any` em components
2. 7.2 Testes de 2 Edge Functions selecionadas
3. 7.3 Re-execução linter + security scan + atualização do scorecard
4. 7.4 ADR-022 + memória + índice
