#!/bin/bash

# ✅ SCRIPT DE VERIFICAÇÃO PÓS-UPLOAD
# Verifica se TUDO foi enviado corretamente

set -e

REPO="adm01-debug/hello"
TARGET_DIR="$HOME/projects/hello"
SOURCE_DIR="/mnt/user-data/outputs/hello-improvements"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ VERIFICAÇÃO PÓS-UPLOAD - GITHUB"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Verificar gh CLI
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI não instalado"
    exit 1
fi

cd "$TARGET_DIR"

BRANCH=$(git branch --show-current)
echo "🌿 Branch atual: $BRANCH"
echo ""

# Verificar se branch foi pushed
echo "🔍 Verificando se branch foi enviada..."
if git ls-remote --heads origin $BRANCH | grep -q $BRANCH; then
    echo "✅ Branch $BRANCH existe no GitHub"
else
    echo "❌ Branch $BRANCH NÃO foi enviada ao GitHub"
    echo "Execute: git push origin $BRANCH"
    exit 1
fi
echo ""

# Obter SHA do último commit local
LOCAL_SHA=$(git rev-parse HEAD)
echo "📝 Último commit local: $LOCAL_SHA"

# Obter SHA do último commit remoto
REMOTE_SHA=$(git rev-parse origin/$BRANCH)
echo "📝 Último commit remoto: $REMOTE_SHA"
echo ""

if [ "$LOCAL_SHA" = "$REMOTE_SHA" ]; then
    echo "✅ Local e remoto estão sincronizados"
else
    echo "⚠️  Local e remoto estão DIFERENTES"
    echo "Commits locais não enviados: $(git log --oneline origin/$BRANCH..HEAD | wc -l)"
    exit 1
fi
echo ""

# Listar arquivos no GitHub
echo "📁 Obtendo lista de arquivos do GitHub..."
gh api repos/$REPO/git/trees/$BRANCH?recursive=1 > /tmp/github_tree.json

GITHUB_FILES=$(cat /tmp/github_tree.json | jq -r '.tree[] | select(.type=="blob") | .path' | wc -l)
echo "✅ Arquivos no GitHub ($BRANCH): $GITHUB_FILES"
echo ""

# Listar arquivos locais
LOCAL_FILES=$(git ls-files | wc -l)
echo "✅ Arquivos locais rastreados: $LOCAL_FILES"
echo ""

# Salvar listas
cat /tmp/github_tree.json | jq -r '.tree[] | select(.type=="blob") | .path' | sort > /tmp/github_files.txt
git ls-files | sort > /tmp/local_tracked_files.txt

# Comparar
echo "🔍 Comparando arquivos..."
echo ""

ONLY_LOCAL=$(comm -13 /tmp/github_files.txt /tmp/local_tracked_files.txt | wc -l)
ONLY_GITHUB=$(comm -23 /tmp/github_files.txt /tmp/local_tracked_files.txt | wc -l)

if [ $ONLY_LOCAL -gt 0 ]; then
    echo "⚠️  $ONLY_LOCAL arquivos apenas no local (não enviados):"
    comm -13 /tmp/github_files.txt /tmp/local_tracked_files.txt | head -10
    echo ""
fi

if [ $ONLY_GITHUB -gt 0 ]; then
    echo "ℹ️  $ONLY_GITHUB arquivos apenas no GitHub (podem ser antigos):"
    comm -23 /tmp/github_files.txt /tmp/local_tracked_files.txt | head -10
    echo ""
fi

# Verificar arquivos críticos
echo "🔍 Verificando arquivos críticos..."
echo ""

CRITICAL_FILES=(
    "tsconfig.json"
    "eslint.config.js"
    "vitest.config.ts"
    "package.json"
    ".github/workflows/ci.yml"
    "src/lib/env.ts"
    "src/lib/logger.ts"
    "src/lib/constants.ts"
    "src/lib/errors.ts"
    "src/components/ErrorBoundary.tsx"
    "src/components/ProtectedRoute.tsx"
    "src/hooks/useAuth.ts"
    "supabase/functions/_shared/cors.ts"
)

MISSING=0
for file in "${CRITICAL_FILES[@]}"; do
    if grep -q "^$file$" /tmp/github_files.txt; then
        echo "  ✅ $file"
    else
        echo "  ❌ FALTANDO: $file"
        ((MISSING++))
    fi
done
echo ""

# Verificar diretórios importantes
echo "🔍 Verificando diretórios..."
echo ""

DIRS=(
    "src/lib"
    "src/components"
    "src/hooks"
    "src/__tests__"
    ".github/workflows"
    "supabase/functions"
    "supabase/migrations"
)

for dir in "${DIRS[@]}"; do
    COUNT=$(grep "^$dir/" /tmp/github_files.txt | wc -l)
    if [ $COUNT -gt 0 ]; then
        echo "  ✅ $dir/ ($COUNT arquivos)"
    else
        echo "  ❌ $dir/ (vazio ou ausente)"
    fi
done
echo ""

# Verificar tamanho do repositório
echo "📊 Estatísticas do repositório..."
REPO_INFO=$(gh api repos/$REPO)
SIZE=$(echo $REPO_INFO | jq -r '.size')
echo "  📦 Tamanho: ${SIZE}KB"
echo "  📅 Última atualização: $(echo $REPO_INFO | jq -r '.updated_at')"
echo ""

# Verificar commits recentes
echo "📝 Últimos 10 commits no GitHub:"
gh api repos/$REPO/commits?sha=$BRANCH&per_page=10 | jq -r '.[] | "\(.commit.author.date) - \(.commit.message | split("\n")[0])"'
echo ""

# Relatório final
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 RELATÓRIO DE VERIFICAÇÃO"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Branch: $BRANCH"
echo "✅ Arquivos no GitHub: $GITHUB_FILES"
echo "✅ Arquivos locais: $LOCAL_FILES"
echo "⚠️  Arquivos críticos faltando: $MISSING"

if [ $ONLY_LOCAL -gt 0 ]; then
    echo "⚠️  Arquivos não enviados: $ONLY_LOCAL"
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ $MISSING -eq 0 ] && [ $ONLY_LOCAL -eq 0 ]; then
    echo "🎉 VERIFICAÇÃO COMPLETA - TUDO OK!"
    echo ""
    echo "✅ Todos os arquivos foram enviados com sucesso"
    echo "✅ Nenhum arquivo crítico está faltando"
    echo "✅ Local e remoto sincronizados"
    echo ""
    echo "🔗 Visualize no GitHub:"
    echo "   https://github.com/$REPO/tree/$BRANCH"
else
    echo "⚠️  VERIFICAÇÃO COMPLETA - COM ALERTAS"
    echo ""
    echo "Problemas encontrados:"
    [ $MISSING -gt 0 ] && echo "  - $MISSING arquivos críticos faltando"
    [ $ONLY_LOCAL -gt 0 ] && echo "  - $ONLY_LOCAL arquivos não enviados"
    echo ""
    echo "📝 Ações recomendadas:"
    echo "  1. Revise os arquivos listados acima"
    echo "  2. Execute novamente: ./2-prepare-files.sh"
    echo "  3. Execute novamente: ./3-commit-and-push.sh"
fi
