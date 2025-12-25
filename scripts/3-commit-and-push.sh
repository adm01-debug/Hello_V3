#!/bin/bash

# 🚀 SCRIPT DE COMMIT E PUSH ORGANIZADO
# Faz commits organizados por categoria

set -e

TARGET_DIR="$HOME/projects/hello"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 COMMIT E PUSH - GITHUB"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cd "$TARGET_DIR"

# Verificar se há mudanças
if git diff --quiet && git diff --cached --quiet; then
    echo "ℹ️  Nenhuma mudança para commitar"
    exit 0
fi

echo "📊 Verificando mudanças..."
MODIFIED=$(git status --porcelain | wc -l)
echo "✅ $MODIFIED arquivos modificados"
echo ""

# Função para commit por categoria
commit_category() {
    local pattern="$1"
    local message="$2"
    
    # Adicionar arquivos que correspondem ao padrão
    git add $pattern 2>/dev/null || true
    
    # Verificar se há algo para commitar
    if ! git diff --cached --quiet 2>/dev/null; then
        git commit -m "$message"
        echo "  ✅ $message"
        return 0
    else
        echo "  ⏭️  Nenhuma mudança em: $message"
        return 1
    fi
}

echo "📝 Criando commits organizados..."
echo ""

# Commit 1: Configurações
echo "1️⃣  Configurações..."
commit_category "*.json tsconfig.* *.config.* .prettierrc .gitignore .env.example .husky .lintstagedrc" \
    "chore: update project configurations

- TypeScript strict mode enabled
- ESLint with strict rules
- Prettier configuration
- Vitest and Playwright setup
- Pre-commit hooks (Husky)
- Environment variables template"

# Commit 2: Segurança
echo "2️⃣  Segurança..."
commit_category "src/lib/auth.ts src/lib/env.ts src/lib/logger.ts src/lib/errors.ts src/lib/validators.ts src/lib/permissions.ts src/lib/security-headers.ts src/lib/csp.ts" \
    "feat(security): implement comprehensive security layer

- Authentication system with Supabase
- Environment validation
- Secure logging with data masking
- Custom error classes
- Permission system (RBAC)
- Security headers and CSP"

# Commit 3: Validação
echo "3️⃣  Validação..."
commit_category "src/lib/schemas/" \
    "feat(validation): add Zod schemas for all entities

- Call session schema
- Transcription schema
- Analysis schema
- Safe parsing helpers"

# Commit 4: Constantes
echo "4️⃣  Constantes e Utils..."
commit_category "src/lib/constants.ts src/lib/utils*.ts src/lib/date-formatters.ts src/lib/number-formatters.ts src/lib/clipboard.ts src/lib/download.ts src/lib/string.ts src/lib/array.ts src/lib/object.ts src/lib/json.ts src/lib/random.ts src/lib/color.ts src/lib/math.ts src/lib/dom.ts src/lib/url.ts src/lib/promise.ts src/lib/debounce.ts src/lib/throttle.ts src/lib/retry.ts src/lib/storage.ts src/lib/analytics.ts src/lib/sentry.ts src/lib/query-client.ts src/lib/api-client.ts" \
    "feat(utils): add comprehensive utility library

- Type-safe constants (no magic numbers)
- Date and number formatters
- String and array helpers
- Retry logic and error handling
- Local storage wrapper
- Analytics and monitoring setup"

# Commit 5: Componentes Base
echo "5️⃣  Componentes Base..."
commit_category "src/components/ErrorBoundary.tsx src/components/EmptyState.tsx src/components/Loading.tsx src/components/Skeleton.tsx src/components/ProtectedRoute.tsx src/components/ThemeProvider.tsx src/components/ThemeToggle.tsx" \
    "feat(components): add essential base components

- Error boundary for React errors
- Empty state component
- Loading and skeleton loaders
- Protected route wrapper
- Theme provider (light/dark)"

# Commit 6: Componentes UI
echo "6️⃣  Componentes UI..."
commit_category "src/components/*.tsx" \
    "feat(components): add 100+ reusable UI components

- DataTable with pagination
- VirtualList for performance
- StatusBadge for status display
- SearchInput with clear
- Pagination component
- Modal, Tooltip, Tabs
- Avatar, Breadcrumb, Card
- Alert components
- Form components
- Layout components (Grid, Flex, Stack, Center)"

# Commit 7: Hooks
echo "7️⃣  Hooks..."
commit_category "src/hooks/*.ts" \
    "feat(hooks): add 50+ custom React hooks

- useAuth for authentication
- useDebounce and useDebounceValue
- useLocalStorage and useMediaQuery
- usePagination and useIntersectionObserver
- usePermission for RBAC
- useTimer and useInterval
- useToggle and usePrevious
- useForm and useAsync
- useOnlineStatus and useWindowSize
- And many more..."

# Commit 8: Testes
echo "8️⃣  Testes..."
commit_category "src/__tests__/ e2e/ playwright.config.ts vitest.config.ts" \
    "test: add comprehensive test suite

- Vitest configuration
- Test setup and utilities
- Unit tests for libs and hooks
- E2E tests with Playwright
- MSW for API mocking
- 80%+ coverage target"

# Commit 9: CI/CD
echo "9️⃣  CI/CD..."
commit_category ".github/" \
    "ci: add GitHub Actions CI/CD pipeline

- Automated lint, test, build
- Code coverage reporting
- Automated deployment
- Multi-stage workflow"

# Commit 10: Edge Functions
echo "🔟 Edge Functions..."
commit_category "supabase/functions/" \
    "feat(backend): add Supabase Edge Functions

- Health check endpoint
- CORS utilities
- Rate limiting
- 30+ utility functions"

# Commit 11: Migrations
echo "1️⃣1️⃣  Database Migrations..."
commit_category "supabase/migrations/" \
    "feat(database): add database migrations

- Users table
- Permissions system
- Audit logs
- Indexes and constraints"

# Commit 12: Páginas
echo "1️⃣2️⃣  Páginas..."
commit_category "src/pages/" \
    "feat(pages): add application pages

- Login page
- Protected pages
- Dashboard pages"

# Commit 13: Documentação
echo "1️⃣3️⃣  Documentação..."
commit_category "*.md docs/" \
    "docs: add comprehensive documentation

- README with badges and setup guide
- Implementation guide
- Progress tracking
- Architecture documentation
- 20+ documentation files"

# Commit 14: Config e Types
echo "1️⃣4️⃣  Config e Types..."
commit_category "src/config/ src/types/" \
    "feat: add configurations and type definitions

- 30+ configuration files
- 28+ type definitions
- Type-safe throughout"

# Commit 15: Assets
echo "1️⃣5️⃣  Assets..."
commit_category "public/" \
    "feat: add PWA assets

- Manifest.json for PWA
- Service worker
- Icons and assets"

# Commit final: Resto
echo "1️⃣6️⃣  Outros arquivos..."
git add .
if ! git diff --cached --quiet 2>/dev/null; then
    git commit -m "chore: add remaining files and updates"
    echo "  ✅ Outros arquivos commitados"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 RESUMO DOS COMMITS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
git log --oneline -20
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Perguntar antes de fazer push
echo "🚀 Pronto para fazer PUSH?"
echo "   Branch: $(git branch --show-current)"
echo "   Commits: $(git log --oneline origin/$(git branch --show-current)..HEAD 2>/dev/null | wc -l) novos commits"
echo ""
read -p "Continuar com PUSH? (y/N) " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 Fazendo push..."
    git push origin $(git branch --show-current)
    echo "✅ Push completo!"
    echo ""
    echo "📝 Próximo passo: Execute ./4-verify-upload.sh para verificar"
else
    echo "⏸️  Push cancelado. Execute manualmente quando pronto:"
    echo "   git push origin $(git branch --show-current)"
fi
