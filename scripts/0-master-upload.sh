#!/bin/bash

# 🎯 SCRIPT MASTER - UPLOAD COMPLETO PARA GITHUB
# Executa todos os passos com verificações

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎯 UPLOAD COMPLETO PARA GITHUB - HELLO PROJECT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 308 Melhorias Implementadas"
echo "🎯 Repositório: adm01-debug/hello"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Tornar scripts executáveis
chmod +x "$SCRIPT_DIR"/*.sh

echo "PASSO 1/4: AUDITORIA DO REPOSITÓRIO"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
"$SCRIPT_DIR/1-audit-repository.sh"
echo ""

read -p "⏸️  Continuar com preparação dos arquivos? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Operação cancelada"
    exit 1
fi
echo ""

echo "PASSO 2/4: PREPARAÇÃO DOS ARQUIVOS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
"$SCRIPT_DIR/2-prepare-files.sh"
echo ""

read -p "⏸️  Continuar com commit e push? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "⏸️  Parado antes do commit"
    echo "📝 Execute manualmente quando pronto: ./3-commit-and-push.sh"
    exit 0
fi
echo ""

echo "PASSO 3/4: COMMIT E PUSH"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
"$SCRIPT_DIR/3-commit-and-push.sh"
echo ""

echo "PASSO 4/4: VERIFICAÇÃO FINAL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
sleep 5  # Aguardar GitHub processar
"$SCRIPT_DIR/4-verify-upload.sh"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 PROCESSO COMPLETO!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Todas as 308 melhorias foram enviadas ao GitHub"
echo "✅ Verificação de integridade completa"
echo ""
echo "🔗 Visualize no GitHub:"
echo "   https://github.com/adm01-debug/hello"
echo ""
echo "📝 Próximos passos:"
echo "   1. Abra um Pull Request no GitHub"
echo "   2. Revise as mudanças"
echo "   3. Merge na branch main"
echo "   4. Deploy em produção"
echo ""
