#!/bin/bash

# 📦 SCRIPT DE PREPARAÇÃO PARA UPLOAD
# Prepara todos os arquivos com verificações de integridade

set -e

SOURCE_DIR="/mnt/user-data/outputs/hello-improvements"
TARGET_DIR="$HOME/projects/hello"
BACKUP_DIR="$HOME/projects/hello-backup-$(date +%Y%m%d-%H%M%S)"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 PREPARAÇÃO PARA UPLOAD - GITHUB"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Verificar se diretório de origem existe
if [ ! -d "$SOURCE_DIR" ]; then
    echo "❌ Diretório de origem não encontrado: $SOURCE_DIR"
    exit 1
fi

# Verificar se repositório local existe
if [ ! -d "$TARGET_DIR/.git" ]; then
    echo "❌ Repositório não encontrado em: $TARGET_DIR"
    echo "📥 Clone o repositório primeiro:"
    echo "   git clone https://github.com/adm01-debug/hello.git $TARGET_DIR"
    exit 1
fi

echo "✅ Diretório de origem: $SOURCE_DIR"
echo "✅ Repositório local: $TARGET_DIR"
echo ""

# Fazer backup completo
echo "💾 Criando backup do repositório atual..."
cp -r "$TARGET_DIR" "$BACKUP_DIR"
echo "✅ Backup criado em: $BACKUP_DIR"
echo ""

# Ir para o diretório do repositório
cd "$TARGET_DIR"

# Verificar branch atual
CURRENT_BRANCH=$(git branch --show-current)
echo "🌿 Branch atual: $CURRENT_BRANCH"

# Garantir que estamos na main/master
if [ "$CURRENT_BRANCH" != "main" ] && [ "$CURRENT_BRANCH" != "master" ]; then
    echo "⚠️  Não está na branch main/master"
    echo "🔄 Mudando para main..."
    git checkout main 2>/dev/null || git checkout master
fi

# Atualizar do remote
echo "🔄 Atualizando do remote..."
git fetch origin
git pull origin $(git branch --show-current)
echo "✅ Repositório atualizado"
echo ""

# Criar branch para as melhorias
FEATURE_BRANCH="feature/308-improvements-$(date +%Y%m%d)"
echo "🌿 Criando branch: $FEATURE_BRANCH"
git checkout -b "$FEATURE_BRANCH" 2>/dev/null || git checkout "$FEATURE_BRANCH"
echo "✅ Branch criada"
echo ""

# Copiar arquivos com verificação
echo "📁 Copiando arquivos..."
echo ""

# Função para copiar com verificação
copy_with_verification() {
    local src="$1"
    local dst="$2"
    
    # Criar diretório de destino se não existir
    mkdir -p "$(dirname "$dst")"
    
    # Copiar
    cp "$src" "$dst"
    
    # Verificar se a cópia foi bem-sucedida
    if cmp -s "$src" "$dst"; then
        return 0
    else
        echo "❌ Erro ao copiar: $src"
        return 1
    fi
}

# Contador
COPIED=0
FAILED=0

# Copiar arquivos de configuração
echo "📄 Copiando arquivos de configuração..."
for file in tsconfig.json eslint.config.js vitest.config.ts playwright.config.ts .prettierrc .gitignore .env.example package.json; do
    if [ -f "$SOURCE_DIR/$file" ]; then
        if copy_with_verification "$SOURCE_DIR/$file" "$TARGET_DIR/$file"; then
            echo "  ✅ $file"
            ((COPIED++))
        else
            ((FAILED++))
        fi
    fi
done
echo ""

# Copiar diretórios completos
echo "📁 Copiando diretórios..."
DIRS=(
    "src/lib"
    "src/components"
    "src/hooks"
    "src/pages"
    "src/__tests__"
    "src/config"
    "src/types"
    ".github/workflows"
    ".husky"
    "supabase/functions"
    "supabase/migrations"
    "e2e"
    "public"
    "docs"
)

for dir in "${DIRS[@]}"; do
    if [ -d "$SOURCE_DIR/$dir" ]; then
        echo "  📂 Copiando $dir..."
        mkdir -p "$TARGET_DIR/$dir"
        
        # Copiar recursivamente
        rsync -av --checksum "$SOURCE_DIR/$dir/" "$TARGET_DIR/$dir/" > /tmp/rsync_${dir//\//_}.log 2>&1
        
        if [ $? -eq 0 ]; then
            FILES_COPIED=$(cat /tmp/rsync_${dir//\//_}.log | grep -v "^sending" | grep -v "^sent" | grep -v "^total" | grep -v "^$" | wc -l)
            echo "  ✅ $dir ($FILES_COPIED arquivos)"
            ((COPIED+=$FILES_COPIED))
        else
            echo "  ❌ Erro ao copiar $dir"
            ((FAILED++))
        fi
    fi
done
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 RESUMO DA PREPARAÇÃO"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Arquivos copiados com sucesso: $COPIED"
echo "❌ Falhas: $FAILED"
echo "💾 Backup salvo em: $BACKUP_DIR"
echo "🌿 Branch: $FEATURE_BRANCH"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ $FAILED -eq 0 ]; then
    echo "✅ Preparação completa! Pronto para commit."
    echo ""
    echo "📝 Próximo passo: Execute ./3-commit-and-push.sh"
else
    echo "⚠️  Preparação completa com $FAILED falhas"
    echo "🔍 Revise os erros antes de continuar"
fi
