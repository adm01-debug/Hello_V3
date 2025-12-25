#!/bin/bash
# Restore Database Backup

set -e

BACKUP_FILE="$1"

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: $0 <backup_file.sql.gz>"
  exit 1
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⚠️  RESTAURAÇÃO DE BACKUP"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔴 ATENÇÃO: Esta operação irá SOBRESCREVER o banco atual!"
echo ""
read -p "Tem certeza? (digite 'CONFIRMO' para continuar): " confirm

if [ "$confirm" != "CONFIRMO" ]; then
  echo "❌ Restauração cancelada"
  exit 1
fi

echo ""
echo "🔄 Descomprimindo backup..."
gunzip -c "$BACKUP_FILE" > /tmp/restore.sql

echo "🔄 Restaurando banco de dados..."
supabase db reset
psql < /tmp/restore.sql

if [ $? -eq 0 ]; then
  echo "✅ BANCO RESTAURADO COM SUCESSO!"
  rm /tmp/restore.sql
else
  echo "❌ FALHA NA RESTAURAÇÃO"
  exit 1
fi
