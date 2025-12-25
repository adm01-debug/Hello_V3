#!/bin/bash

# ✅ VERIFICAÇÃO PRÉVIA - PRÉ-REQUISITOS
# Verifica se tudo está pronto antes de começar

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ VERIFICAÇÃO PRÉVIA - PRÉ-REQUISITOS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

ERRORS=0
WARNINGS=0

# 1. Verificar gh CLI
echo "1️⃣  Verificando GitHub CLI..."
if command -v gh &> /dev/null; then
    GH_VERSION=$(gh --version | head -1)
    echo "   ✅ $GH_VERSION"
else
    echo "   ❌ GitHub CLI não instalado"
    echo "      Instale: brew install gh (Mac) ou apt install gh (Ubuntu)"
    ((ERRORS++))
fi
echo ""

# 2. Verificar autenticação
echo "2️⃣  Verificando autenticação GitHub..."
if gh auth status &> /dev/null; then
    GH_USER=$(gh api user | jq -r '.login')
    echo "   ✅ Autenticado como: $GH_USER"
else
    echo "   ❌ Não autenticado"
    echo "      Execute: gh auth login"
    ((ERRORS++))
fi
echo ""

# 3. Verificar git
echo "3️⃣  Verificando Git..."
if command -v git &> /dev/null; then
    GIT_VERSION=$(git --version)
    echo "   ✅ $GIT_VERSION"
    
    # Verificar configuração git
    if git config user.name &> /dev/null && git config user.email &> /dev/null; then
        echo "   ✅ Git configurado:"
        echo "      Nome: $(git config user.name)"
        echo "      Email: $(git config user.email)"
    else
        echo "   ⚠️  Git não configurado completamente"
        echo "      Configure com:"
        echo "      git config --global user.name \"Seu Nome\""
        echo "      git config --global user.email \"seu@email.com\""
        ((WARNINGS++))
    fi
else
    echo "   ❌ Git não instalado"
    ((ERRORS++))
fi
echo ""

# 4. Verificar repositório local
echo "4️⃣  Verificando repositório local..."
TARGET_DIR="$HOME/projects/hello"
if [ -d "$TARGET_DIR/.git" ]; then
    echo "   ✅ Repositório encontrado: $TARGET_DIR"
    cd "$TARGET_DIR"
    REMOTE=$(git remote get-url origin 2>/dev/null || echo "none")
    echo "   ✅ Remote: $REMOTE"
    
    # Verificar se está limpo
    if git diff --quiet && git diff --cached --quiet; then
        echo "   ✅ Working directory limpo"
    else
        echo "   ⚠️  Há mudanças não commitadas"
        echo "      Commit ou stash antes de continuar"
        ((WARNINGS++))
    fi
else
    echo "   ❌ Repositório não encontrado"
    echo "      Clone com: git clone https://github.com/adm01-debug/hello.git $TARGET_DIR"
    ((ERRORS++))
fi
echo ""

# 5. Verificar arquivos de origem
echo "5️⃣  Verificando arquivos de origem..."
SOURCE_DIR="/mnt/user-data/outputs/hello-improvements"
if [ -d "$SOURCE_DIR" ]; then
    FILE_COUNT=$(find "$SOURCE_DIR" -type f | wc -l)
    echo "   ✅ Arquivos encontrados: $FILE_COUNT"
    
    # Verificar tamanho
    SIZE=$(du -sh "$SOURCE_DIR" | cut -f1)
    echo "   ✅ Tamanho total: $SIZE"
else
    echo "   ❌ Diretório de origem não encontrado: $SOURCE_DIR"
    ((ERRORS++))
fi
echo ""

# 6. Verificar ferramentas adicionais
echo "6️⃣  Verificando ferramentas adicionais..."

if command -v jq &> /dev/null; then
    echo "   ✅ jq (JSON processor)"
else
    echo "   ⚠️  jq não instalado (recomendado)"
    echo "      Instale: brew install jq (Mac) ou apt install jq (Ubuntu)"
    ((WARNINGS++))
fi

if command -v rsync &> /dev/null; then
    echo "   ✅ rsync"
else
    echo "   ⚠️  rsync não instalado (recomendado)"
    ((WARNINGS++))
fi
echo ""

# 7. Verificar espaço em disco
echo "7️⃣  Verificando espaço em disco..."
AVAILABLE=$(df -h ~ | awk 'NR==2 {print $4}')
echo "   ✅ Espaço disponível: $AVAILABLE"
echo ""

# 8. Verificar conectividade
echo "8️⃣  Verificando conectividade com GitHub..."
if ping -c 1 github.com &> /dev/null; then
    echo "   ✅ Conexão com GitHub OK"
else
    echo "   ⚠️  Problemas de conectividade com GitHub"
    ((WARNINGS++))
fi
echo ""

# Resumo final
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 RESUMO DA VERIFICAÇÃO"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "❌ Erros: $ERRORS"
echo "⚠️  Avisos: $WARNINGS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ $ERRORS -eq 0 ]; then
    if [ $WARNINGS -eq 0 ]; then
        echo "✅ TUDO PRONTO PARA COMEÇAR!"
        echo ""
        echo "Execute o próximo passo:"
        echo "   ./0-master-upload.sh"
    else
        echo "⚠️  PRONTO COM AVISOS"
        echo ""
        echo "Você pode continuar, mas corrija os avisos se possível."
        echo ""
        echo "Execute o próximo passo:"
        echo "   ./0-master-upload.sh"
    fi
else
    echo "❌ NÃO ESTÁ PRONTO"
    echo ""
    echo "Corrija os erros acima antes de continuar."
    echo ""
    echo "Após corrigir, execute novamente:"
    echo "   ./pre-check.sh"
    exit 1
fi
