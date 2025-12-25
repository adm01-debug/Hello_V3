#!/bin/bash

# 🔍 SCRIPT DE AUDITORIA DO REPOSITÓRIO GITHUB
# Verifica estado atual e prepara para upload

set -e

REPO="adm01-debug/hello"
BRANCH="main"
SOURCE_DIR="/mnt/user-data/outputs/hello-improvements"
TARGET_DIR="$HOME/projects/hello"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 AUDITORIA DO REPOSITÓRIO GITHUB"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Verificar se gh CLI está instalado
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) não está instalado"
    echo "📥 Instale com: brew install gh (Mac) ou apt install gh (Ubuntu)"
    exit 1
fi

# Verificar autenticação
echo "🔐 Verificando autenticação GitHub..."
if ! gh auth status &> /dev/null; then
    echo "❌ Não autenticado no GitHub"
    echo "🔑 Execute: gh auth login"
    exit 1
fi
echo "✅ Autenticado com sucesso"
echo ""

# Obter informações do repositório
echo "📊 Obtendo informações do repositório..."
gh repo view $REPO --json name,owner,defaultBranchRef,createdAt,updatedAt,diskUsage > /tmp/repo_info.json

echo "✅ Repositório: $(cat /tmp/repo_info.json | jq -r '.name')"
echo "✅ Owner: $(cat /tmp/repo_info.json | jq -r '.owner.login')"
echo "✅ Branch: $(cat /tmp/repo_info.json | jq -r '.defaultBranchRef.name')"
echo "✅ Última atualização: $(cat /tmp/repo_info.json | jq -r '.updatedAt')"
echo ""

# Listar arquivos no repositório
echo "📁 Listando arquivos no repositório..."
gh api repos/$REPO/git/trees/main?recursive=1 > /tmp/repo_tree.json

REPO_FILES=$(cat /tmp/repo_tree.json | jq -r '.tree[].path' | wc -l)
echo "✅ Arquivos no repositório: $REPO_FILES"
echo ""

# Listar arquivos locais preparados
echo "📁 Listando arquivos preparados para upload..."
LOCAL_FILES=$(find $SOURCE_DIR -type f | wc -l)
echo "✅ Arquivos preparados: $LOCAL_FILES"
echo ""

# Salvar lista de arquivos do repositório
cat /tmp/repo_tree.json | jq -r '.tree[] | select(.type=="blob") | .path' | sort > /tmp/repo_files.txt

# Salvar lista de arquivos locais
find $SOURCE_DIR -type f -printf '%P\n' | sort > /tmp/local_files.txt

# Comparar
echo "🔍 Comparando arquivos..."
echo ""
echo "Arquivos NOVOS (não existem no repo):"
comm -13 /tmp/repo_files.txt /tmp/local_files.txt | head -20
NOVOS=$(comm -13 /tmp/repo_files.txt /tmp/local_files.txt | wc -l)
echo "Total: $NOVOS arquivos novos"
echo ""

echo "Arquivos que serão ATUALIZADOS (já existem):"
comm -12 /tmp/repo_files.txt /tmp/local_files.txt | head -20
ATUALIZADOS=$(comm -12 /tmp/repo_files.txt /tmp/local_files.txt | wc -l)
echo "Total: $ATUALIZADOS arquivos para atualizar"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 RESUMO DA AUDITORIA"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Arquivos no repositório: $REPO_FILES"
echo "✅ Arquivos preparados: $LOCAL_FILES"
echo "📥 Arquivos novos: $NOVOS"
echo "🔄 Arquivos para atualizar: $ATUALIZADOS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Auditoria completa! Relatório salvo em /tmp/"
