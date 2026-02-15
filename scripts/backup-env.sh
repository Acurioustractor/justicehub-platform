#!/bin/bash
# Secure backup script for environment files
# Usage: ./scripts/backup-env.sh

BACKUP_DIR=~/.justicehub-secure-backup
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
PROJECT_NAME=$(basename $(pwd))

mkdir -p $BACKUP_DIR

echo "🔐 JusticeHub Environment Backup"
echo "================================"

# Backup .env.local
if [ -f .env.local ]; then
  cp .env.local $BACKUP_DIR/.env.local.backup-$TIMESTAMP
  echo "✅ Backed up .env.local"
else
  echo "⚠️  No .env.local found"
fi

# Backup .env
if [ -f .env ]; then
  cp .env $BACKUP_DIR/.env.backup-$TIMESTAMP
  echo "✅ Backed up .env"
else
  echo "⚠️  No .env found"
fi

# Keep only last 10 backups of each file
echo ""
echo "🧹 Cleaning old backups (keeping last 10)..."
ls -t $BACKUP_DIR/.env.local.backup-* 2>/dev/null | tail -n +11 | xargs rm -f 2>/dev/null
ls -t $BACKUP_DIR/.env.backup-* 2>/dev/null | tail -n +11 | xargs rm -f 2>/dev/null

echo ""
echo "✅ Backup complete!"
echo "📁 Location: $BACKUP_DIR"
echo ""
echo "📋 Current backups:"
ls -lht $BACKUP_DIR/ | head -n 12
