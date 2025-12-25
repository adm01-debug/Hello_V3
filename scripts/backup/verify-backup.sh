#!/bin/bash
# Verify Backup Integrity

set -e

BACKUP_FILE="$1"

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: $0 <backup_file.sql.gz>"
  exit 1
fi

echo "🔍 Verificando integridade do backup..."

# Test gzip integrity
if gzip -t "$BACKUP_FILE" 2>/dev/null; then
  echo "✅ Arquivo comprimido válido"
else
  echo "❌ Arquivo comprimido corrompido"
  exit 1
fi

# Test SQL validity
if gunzip -c "$BACKUP_FILE" | head -100 | grep -q "PostgreSQL"; then
  echo "✅ Conteúdo SQL válido"
else
  echo "❌ Conteúdo SQL inválido"
  exit 1
fi

SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "✅ Tamanho: $SIZE"
echo "✅ Backup verificado com sucesso!"
