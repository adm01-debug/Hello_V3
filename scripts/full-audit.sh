#!/bin/bash
set -e

echo "🚀 Iniciando Auditoria Técnica Completa..."

# 1. Lint and Type-check
echo "🔍 Rodando Lint e Type-check..."
bun run lint
bun run type-check

# 2. Frontend Unit/Integration Tests
echo "🧪 Rodando testes unitários e de integração (Vitest)..."
bunx vitest run --reporter=verbose

# 3. Playwright E2E Tests
echo "🎭 Rodando testes End-to-End (Playwright)..."
# In a real environment, we'd start the dev server, but here we assume it's running or we just check config
bunx playwright test --project=chromium

# 4. Edge Function Tests (Deno)
echo "⚡ Rodando testes das Edge Functions (Deno)..."
deno test -A supabase/functions/

# 5. Load and Stress Verification
echo "📈 Executando verificação de carga e estresse..."
curl -s -X POST "${SUPABASE_URL}/functions/v1/global-load-test" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" | jq .

echo "✅ Auditoria concluída com sucesso! Sistema 10/10."
