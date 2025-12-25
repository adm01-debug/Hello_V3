#!/bin/bash

# 🔍 AUDITORIA DETALHADA - ARQUIVO POR ARQUIVO
# Verifica CADA arquivo antes do upload

set -e

SOURCE_DIR="/mnt/user-data/outputs/hello-improvements"
MANIFEST="$SOURCE_DIR/.upload-manifest.json"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 AUDITORIA DETALHADA - ARQUIVO POR ARQUIVO"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contadores
TOTAL_FILES=0
VALID_FILES=0
INVALID_FILES=0
MISSING_CRITICAL=0

# 1. Verificar arquivos críticos
echo "1️⃣  Verificando arquivos críticos..."
echo ""

CRITICAL_FILES=(
    "tsconfig.json"
    "eslint.config.js"
    "vitest.config.ts"
    "playwright.config.ts"
    "package.json"
    ".github/workflows/ci.yml"
    "src/lib/env.ts"
    "src/lib/logger.ts"
    "src/lib/constants.ts"
    "src/lib/errors.ts"
    "src/lib/auth.ts"
    "src/lib/schemas/call.schema.ts"
    "src/components/ErrorBoundary.tsx"
    "src/components/ProtectedRoute.tsx"
    "src/hooks/useAuth.ts"
    "supabase/functions/_shared/cors.ts"
    "supabase/functions/_shared/rate-limit.ts"
)

for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "$SOURCE_DIR/$file" ]; then
        SIZE=$(stat -f%z "$SOURCE_DIR/$file" 2>/dev/null || stat -c%s "$SOURCE_DIR/$file" 2>/dev/null)
        if [ $SIZE -gt 0 ]; then
            echo -e "  ${GREEN}✅${NC} $file ($SIZE bytes)"
            ((VALID_FILES++))
        else
            echo -e "  ${RED}❌${NC} $file (arquivo vazio!)"
            ((INVALID_FILES++))
            ((MISSING_CRITICAL++))
        fi
    else
        echo -e "  ${RED}❌${NC} $file (FALTANDO!)"
        ((MISSING_CRITICAL++))
    fi
done

echo ""
echo "Arquivos críticos: $VALID_FILES/${#CRITICAL_FILES[@]}"
echo ""

# 2. Verificar diretórios críticos
echo "2️⃣  Verificando diretórios críticos..."
echo ""

CRITICAL_DIRS=(
    "src/lib"
    "src/components"
    "src/hooks"
    "src/__tests__"
    ".github/workflows"
    "supabase/functions"
    "supabase/migrations"
)

for dir in "${CRITICAL_DIRS[@]}"; do
    if [ -d "$SOURCE_DIR/$dir" ]; then
        COUNT=$(find "$SOURCE_DIR/$dir" -type f | wc -l | tr -d ' ')
        if [ $COUNT -gt 0 ]; then
            echo -e "  ${GREEN}✅${NC} $dir/ ($COUNT arquivos)"
        else
            echo -e "  ${YELLOW}⚠️${NC}  $dir/ (diretório vazio)"
        fi
    else
        echo -e "  ${RED}❌${NC} $dir/ (FALTANDO!)"
    fi
done

echo ""

# 3. Contar todos os arquivos
echo "3️⃣  Contando todos os arquivos..."
echo ""

# Por tipo
TS_FILES=$(find "$SOURCE_DIR" -name "*.ts" -not -path "*/node_modules/*" | wc -l | tr -d ' ')
TSX_FILES=$(find "$SOURCE_DIR" -name "*.tsx" -not -path "*/node_modules/*" | wc -l | tr -d ' ')
JSON_FILES=$(find "$SOURCE_DIR" -name "*.json" -not -path "*/node_modules/*" | wc -l | tr -d ' ')
MD_FILES=$(find "$SOURCE_DIR" -name "*.md" -not -path "*/node_modules/*" | wc -l | tr -d ' ')
SH_FILES=$(find "$SOURCE_DIR" -name "*.sh" -not -path "*/node_modules/*" | wc -l | tr -d ' ')
SQL_FILES=$(find "$SOURCE_DIR" -name "*.sql" -not -path "*/node_modules/*" | wc -l | tr -d ' ')

echo "  📝 TypeScript (.ts):     $TS_FILES"
echo "  📝 React (.tsx):         $TSX_FILES"
echo "  📄 JSON:                 $JSON_FILES"
echo "  📄 Markdown:             $MD_FILES"
echo "  📜 Scripts (.sh):        $SH_FILES"
echo "  🗄️  SQL:                  $SQL_FILES"

TOTAL_FILES=$(find "$SOURCE_DIR" -type f -not -path "*/node_modules/*" -not -path "*/.git/*" | wc -l | tr -d ' ')
echo ""
echo "  📦 TOTAL:                $TOTAL_FILES arquivos"
echo ""

# 4. Verificar tamanho total
echo "4️⃣  Verificando tamanho total..."
echo ""

TOTAL_SIZE=$(du -sh "$SOURCE_DIR" | cut -f1)
echo "  📦 Tamanho total: $TOTAL_SIZE"
echo ""

# 5. Listar arquivos por categoria
echo "5️⃣  Gerando relatório de arquivos..."
echo ""

# Criar relatório detalhado
REPORT_FILE="$SOURCE_DIR/AUDIT_REPORT.txt"

cat > "$REPORT_FILE" << REPORT_HEADER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RELATÓRIO DE AUDITORIA DETALHADA
Data: $(date)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RESUMO:
- Total de arquivos: $TOTAL_FILES
- Arquivos TypeScript: $TS_FILES
- Arquivos React: $TSX_FILES
- Arquivos críticos válidos: $VALID_FILES/${#CRITICAL_FILES[@]}
- Tamanho total: $TOTAL_SIZE

REPORT_HEADER

# Listar TODOS os arquivos
echo "" >> "$REPORT_FILE"
echo "LISTA COMPLETA DE ARQUIVOS:" >> "$REPORT_FILE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

find "$SOURCE_DIR" -type f -not -path "*/node_modules/*" -not -path "*/.git/*" | while read file; do
    REL_PATH="${file#$SOURCE_DIR/}"
    SIZE=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)
    printf "%-80s %10s bytes\n" "$REL_PATH" "$SIZE" >> "$REPORT_FILE"
done

echo "  ✅ Relatório salvo em: AUDIT_REPORT.txt"
echo ""

# 6. Verificar integridade dos arquivos
echo "6️⃣  Verificando integridade (checksums)..."
echo ""

# Gerar checksums
find "$SOURCE_DIR" -type f -not -path "*/node_modules/*" -not -path "*/.git/*" -exec md5sum {} \; > "$SOURCE_DIR/CHECKSUMS.txt" 2>/dev/null || \
find "$SOURCE_DIR" -type f -not -path "*/node_modules/*" -not -path "*/.git/*" -exec md5 {} \; > "$SOURCE_DIR/CHECKSUMS.txt" 2>/dev/null

CHECKSUM_COUNT=$(wc -l < "$SOURCE_DIR/CHECKSUMS.txt" | tr -d ' ')
echo "  ✅ Checksums gerados: $CHECKSUM_COUNT arquivos"
echo ""

# 7. Verificar arquivos duplicados
echo "7️⃣  Verificando arquivos duplicados..."
echo ""

DUPLICATES=$(cat "$SOURCE_DIR/CHECKSUMS.txt" | awk '{print $1}' | sort | uniq -d | wc -l | tr -d ' ')
if [ $DUPLICATES -eq 0 ]; then
    echo "  ✅ Nenhum arquivo duplicado encontrado"
else
    echo "  ⚠️  $DUPLICATES checksums duplicados encontrados"
fi
echo ""

# Relatório final
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 RELATÓRIO FINAL DA AUDITORIA"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Total de arquivos:           $TOTAL_FILES"
echo "Arquivos críticos OK:        $VALID_FILES/${#CRITICAL_FILES[@]}"
echo "Arquivos críticos faltando:  $MISSING_CRITICAL"
echo "Tamanho total:               $TOTAL_SIZE"
echo "Arquivos duplicados:         $DUPLICATES"
echo ""

if [ $MISSING_CRITICAL -eq 0 ]; then
    echo -e "${GREEN}✅ AUDITORIA PASSOU - PRONTO PARA UPLOAD!${NC}"
    echo ""
    echo "Próximo passo:"
    echo "  cd $SOURCE_DIR/scripts"
    echo "  ./0-master-upload.sh"
    exit 0
else
    echo -e "${RED}❌ AUDITORIA FALHOU - CORRIJA OS ERROS${NC}"
    echo ""
    echo "Arquivos críticos faltando: $MISSING_CRITICAL"
    echo "Revise os arquivos marcados com ❌ acima"
    exit 1
fi
