#!/bin/bash
# Database Backup Script
# Automated daily backups of Supabase database

set -e

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/hello"
S3_BUCKET="hello-backups"
RETENTION_DAYS=30

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔄 BACKUP DO BANCO DE DADOS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Data: $(date)"
echo ""

# Criar diretório se não existir
mkdir -p "$BACKUP_DIR"

# Nome do arquivo
BACKUP_FILE="$BACKUP_DIR/db_$TIMESTAMP.sql"

# Backup Supabase
echo "📥 Fazendo backup do Supabase..."
supabase db dump > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
  FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
  echo "✅ Backup criado: db_$TIMESTAMP.sql ($FILE_SIZE)"
  
  # Comprimir backup
  echo "🗜️  Comprimindo backup..."
  gzip "$BACKUP_FILE"
  COMPRESSED_FILE="${BACKUP_FILE}.gz"
  COMPRESSED_SIZE=$(du -h "$COMPRESSED_FILE" | cut -f1)
  echo "✅ Backup comprimido: $COMPRESSED_SIZE"
  
  # Upload para S3 (AWS)
  if command -v aws &> /dev/null; then
    echo "☁️  Enviando para S3..."
    aws s3 cp "$COMPRESSED_FILE" "s3://$S3_BUCKET/db_$TIMESTAMP.sql.gz"
    echo "✅ Backup enviado para S3"
  fi
  
  # Limpeza de backups antigos
  echo "🧹 Limpando backups antigos..."
  find "$BACKUP_DIR" -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete
  echo "✅ Backups mais antigos que $RETENTION_DAYS dias removidos"
  
  echo ""
  echo "✅ BACKUP COMPLETO!"
else
  echo "❌ FALHA NO BACKUP"
  exit 1
fi
