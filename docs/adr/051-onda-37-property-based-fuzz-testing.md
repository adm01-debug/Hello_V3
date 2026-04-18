# ADR-051 — Estratégia de Testes Massivos via Property-Based + Fuzz

**Status:** Aceito  
**Data:** 2026-04-18  
**Onda:** 37

## Contexto

A suíte de testes do projeto cobria 1.527 cenários determinísticos (Vitest/JSDOM + 22 Playwright). Funções puras críticas como `computeHealth`, normalização de telefones, escaping de CSV e validação Zod tinham apenas alguns asserts manuais — insuficiente para descobrir edge cases sutis (boundaries de score, escaping com caracteres exóticos, payloads maliciosos).

## Decisão

Adotar **property-based testing** via [`fast-check`](https://github.com/dubzzz/fast-check) para funções puras + **fuzz testing** para validators expostos a inputs externos (edge functions). Cada propriedade roda **com seed fixo** (`seed: 42`, `seed: 7`, etc.) para reproducibilidade total.

### Padrões adotados

1. **Funções puras testáveis:** Extrair lógica de hooks/components para módulos `src/lib/*.ts` puros.
   - Ex: `computeHealth` saiu de `useExtensionsOverview` para `src/lib/health-score.ts`.
2. **Geradores alinhados ao domínio:** Criar arbitrários customizados quando o validador for mais restrito que o RFC (ex: Zod `.email()` vs `fc.emailAddress()`).
3. **Invariantes explícitas:** Cada `fc.property` testa **uma** invariante (boundaries, idempotência, monotonicidade).
4. **Runs reproduzíveis:** `{ numRuns: N, seed: M }` em cada `fc.assert`.
5. **Fuzz para edge functions:** 500+ inputs maliciosos (XSS, SQLi, UTF-8, payloads gigantes) sem exceptions não tratadas.

## Consequências

### Positivas
- **5.000+ cenários** automatizados validam invariantes em ~4s.
- Bug descoberto e corrigido durante a implementação (gerador `emailAddress` muito permissivo).
- Refatoração estrutural: `health-score.ts` agora é módulo puro reutilizável.
- Confiança alta para refatorações futuras (`useExtensionsOverview` pode evoluir sem quebrar score).

### Negativas
- Tempo de CI levemente maior (+~5s por arquivo property-based).
- Curva de aprendizado para devs não familiarizados com PBT.

### Mitigações
- Seeds fixos eliminam flakiness.
- Geradores documentados no próprio teste.

## Alternativas Consideradas

- **Mutation testing (Stryker):** Mais lento (minutos) e complementar — fica para Onda futura.
- **Apenas snapshot testing:** Frágil, não cobre invariantes lógicas.

## Referências

- `docs/qa/onda-37-relatorio-massivo.md` — relatório completo.
- `mem://engineering/testing-infrastructure` — atualizada.
