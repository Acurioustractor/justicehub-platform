#!/bin/bash

# Youth Justice Service Finder - Backup Script
set -e

echo "💾 Youth Justice Service Finder - Backup System"
echo "==============================================="

# Configuration
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.prod"
BACKUP_BASE_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="$BACKUP_BASE_DIR/$TIMESTAMP"
RETENTION_DAYS=30

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Create backup directory
create_backup_dir() {
    log_info "Creating backup directory: $BACKUP_DIR"
    mkdir -p "$BACKUP_DIR"
}

# Backup database
backup_database() {
    log_info "Backing up PostgreSQL database..."
    
    if docker-compose -f $COMPOSE_FILE ps | grep -q "postgres.*Up"; then
        # SQL dump
        docker-compose -f $COMPOSE_FILE exec -T postgres pg_dump -U postgres -d youth_justice_prod --clean --if-exists > "$BACKUP_DIR/database.sql"
        
        # Compress the dump
        gzip "$BACKUP_DIR/database.sql"
        
        log_success "Database backup completed: database.sql.gz"
    else
        log_error "PostgreSQL container is not running"
        return 1
    fi
}

# Backup Elasticsearch indices
backup_elasticsearch() {
    log_info "Backing up Elasticsearch data..."
    
    if docker-compose -f $COMPOSE_FILE ps | grep -q "elasticsearch.*Up"; then
        # Create snapshot repository
        curl -X PUT "localhost:9200/_snapshot/backup_repo" -H 'Content-Type: application/json' -d'
        {
            "type": "fs",
            "settings": {
                "location": "/usr/share/elasticsearch/data/snapshots"
            }
        }' 2>/dev/null || true
        
        # Create snapshot
        SNAPSHOT_NAME="backup_$TIMESTAMP"
        curl -X PUT "localhost:9200/_snapshot/backup_repo/$SNAPSHOT_NAME?wait_for_completion=true" -H 'Content-Type: application/json' -d'
        {
            "indices": "*",
            "ignore_unavailable": true,
            "include_global_state": false
        }' > "$BACKUP_DIR/elasticsearch_snapshot.json" 2>/dev/null
        
        # Backup volume data
        docker run --rm -v youth-justice-service-finder_es_data:/data -v $(pwd)/$BACKUP_DIR:/backup alpine tar czf /backup/elasticsearch_data.tar.gz -C /data .
        
        log_success "Elasticsearch backup completed"
    else
        log_error "Elasticsearch container is not running"
        return 1
    fi
}

# Backup Redis data
backup_redis() {
    log_info "Backing up Redis data..."
    
    if docker-compose -f $COMPOSE_FILE ps | grep -q "redis.*Up"; then
        # Create Redis backup
        docker-compose -f $COMPOSE_FILE exec redis redis-cli BGSAVE
        
        # Wait for backup to complete
        sleep 5
        
        # Copy backup file
        docker run --rm -v youth-justice-service-finder_redis_data:/data -v $(pwd)/$BACKUP_DIR:/backup alpine cp /data/dump.rdb /backup/redis_dump.rdb
        
        log_success "Redis backup completed"
    else
        log_warning "Redis container is not running, skipping backup"
    fi
}

# Backup application data and configuration
backup_application() {
    log_info "Backing up application configuration..."
    
    # Copy environment files
    cp .env.prod "$BACKUP_DIR/" 2>/dev/null || log_warning "No .env.prod file found"
    
    # Copy nginx configuration
    cp -r nginx/ "$BACKUP_DIR/" 2>/dev/null || log_warning "No nginx config found"
    
    # Copy docker configuration
    cp docker-compose.prod.yml "$BACKUP_DIR/"
    
    # Create system info
    cat > "$BACKUP_DIR/system_info.txt" << EOF
Backup created: $(date)
System: $(uname -a)
Docker version: $(docker --version)
Docker Compose version: $(docker-compose --version)

Running containers:
$(docker-compose -f $COMPOSE_FILE ps)

Application version: $(git rev-parse HEAD 2>/dev/null || echo "unknown")
EOF
    
    log_success "Application backup completed"
}

# Compress entire backup
compress_backup() {
    log_info "Compressing backup..."
    
    cd "$BACKUP_BASE_DIR"
    tar czf "${TIMESTAMP}_youth_justice_complete_backup.tar.gz" "$TIMESTAMP/"
    
    # Calculate size
    BACKUP_SIZE=$(du -h "${TIMESTAMP}_youth_justice_complete_backup.tar.gz" | cut -f1)
    
    log_success "Backup compressed: ${TIMESTAMP}_youth_justice_complete_backup.tar.gz ($BACKUP_SIZE)"
}

# Clean old backups
cleanup_old_backups() {
    log_info "Cleaning up backups older than $RETENTION_DAYS days..."
    
    find "$BACKUP_BASE_DIR" -name "*.tar.gz" -type f -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
    find "$BACKUP_BASE_DIR" -maxdepth 1 -type d -mtime +$RETENTION_DAYS -exec rm -rf {} \; 2>/dev/null || true
    
    log_success "Old backup cleanup completed"
}

# Upload to cloud storage (optional)
upload_to_cloud() {
    if [ -n "${S3_BACKUP_BUCKET}" ] && [ -n "${AWS_ACCESS_KEY_ID}" ]; then
        log_info "Uploading backup to S3..."
        
        if command -v aws &> /dev/null; then
            aws s3 cp "$BACKUP_BASE_DIR/${TIMESTAMP}_youth_justice_complete_backup.tar.gz" \
                "s3://$S3_BACKUP_BUCKET/youth-justice-backups/" \
                --storage-class STANDARD_IA
            
            log_success "Backup uploaded to S3"
        else
            log_warning "AWS CLI not found, skipping cloud upload"
        fi
    else
        log_info "Cloud backup not configured, keeping local backup only"
    fi
}

# Restore from backup
restore_backup() {
    local backup_file="$1"
    
    if [ -z "$backup_file" ]; then
        log_error "Please specify backup file to restore"
        echo "Available backups:"
        ls -la "$BACKUP_BASE_DIR"/*.tar.gz 2>/dev/null || echo "No backups found"
        return 1
    fi
    
    if [ ! -f "$backup_file" ]; then
        log_error "Backup file not found: $backup_file"
        return 1
    fi
    
    log_warning "This will overwrite current data. Are you sure? (y/N)"
    read -r confirmation
    if [ "$confirmation" != "y" ] && [ "$confirmation" != "Y" ]; then
        log_info "Restore cancelled"
        return 0
    fi
    
    log_info "Restoring from backup: $backup_file"
    
    # Stop services
    docker-compose -f $COMPOSE_FILE down
    
    # Extract backup
    RESTORE_DIR="./restore_$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$RESTORE_DIR"
    tar xzf "$backup_file" -C "$RESTORE_DIR" --strip-components=1
    
    # Restore database
    if [ -f "$RESTORE_DIR/database.sql.gz" ]; then
        docker-compose -f $COMPOSE_FILE up -d postgres
        sleep 10
        
        zcat "$RESTORE_DIR/database.sql.gz" | docker-compose -f $COMPOSE_FILE exec -T postgres psql -U postgres -d youth_justice_prod
        log_success "Database restored"
    fi
    
    # Restore Elasticsearch
    if [ -f "$RESTORE_DIR/elasticsearch_data.tar.gz" ]; then
        docker run --rm -v youth-justice-service-finder_es_data:/data -v $(pwd)/$RESTORE_DIR:/backup alpine tar xzf /backup/elasticsearch_data.tar.gz -C /data
        log_success "Elasticsearch data restored"
    fi
    
    # Restore Redis
    if [ -f "$RESTORE_DIR/redis_dump.rdb" ]; then
        docker run --rm -v youth-justice-service-finder_redis_data:/data -v $(pwd)/$RESTORE_DIR:/backup alpine cp /backup/redis_dump.rdb /data/dump.rdb
        log_success "Redis data restored"
    fi
    
    # Start all services
    docker-compose -f $COMPOSE_FILE up -d
    
    # Cleanup
    rm -rf "$RESTORE_DIR"
    
    log_success "Restore completed successfully!"
}

# Main function
main() {
    case "${1:-backup}" in
        "backup")
            create_backup_dir
            backup_database
            backup_elasticsearch
            backup_redis
            backup_application
            compress_backup
            cleanup_old_backups
            upload_to_cloud
            
            echo ""
            log_success "Backup completed successfully!"
            log_info "Backup location: $BACKUP_BASE_DIR/${TIMESTAMP}_youth_justice_complete_backup.tar.gz"
            ;;
        "restore")
            restore_backup "$2"
            ;;
        "list")
            echo "Available backups:"
            ls -la "$BACKUP_BASE_DIR"/*.tar.gz 2>/dev/null || echo "No backups found"
            ;;
        "cleanup")
            cleanup_old_backups
            ;;
        *)
            echo "Usage: $0 {backup|restore|list|cleanup}"
            echo ""
            echo "Commands:"
            echo "  backup         - Create full backup"
            echo "  restore <file> - Restore from backup file"
            echo "  list           - List available backups"
            echo "  cleanup        - Remove old backups"
            ;;
    esac
}

# Load environment if available
if [ -f "$ENV_FILE" ]; then
    set -a
    source "$ENV_FILE"
    set +a
fi

main "$@"