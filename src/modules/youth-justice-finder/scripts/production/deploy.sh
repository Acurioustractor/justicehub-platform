#!/bin/bash

# Youth Justice Service Finder - Production Deployment Script
set -e

echo "🚀 Youth Justice Service Finder - Production Deployment"
echo "======================================================="

# Configuration
COMPOSE_FILE="docker-compose.production.yml"
ENV_FILE=".env.production"
BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
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

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose is not installed"
        exit 1
    fi
    
    # Check environment file
    if [ ! -f "$ENV_FILE" ]; then
        log_error "Environment file $ENV_FILE not found"
        log_info "Please create $ENV_FILE with your production configuration"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Create backup
create_backup() {
    log_info "Creating backup..."
    
    if docker-compose -f $COMPOSE_FILE ps | grep -q "yjs_postgres"; then
        mkdir -p "$BACKUP_DIR"
        
        # Backup database
        docker exec yjs_postgres pg_dump -U yjs_app youth_justice_services > "$BACKUP_DIR/database.sql"
        
        # Backup volumes
        docker run --rm -v postgres_data:/data -v $(pwd)/$BACKUP_DIR:/backup alpine tar czf /backup/postgres_data.tar.gz -C /data .
        docker run --rm -v redis_data:/data -v $(pwd)/$BACKUP_DIR:/backup alpine tar czf /backup/redis_data.tar.gz -C /data .
        
        log_success "Backup created in $BACKUP_DIR"
    else
        log_warning "No existing database found, skipping backup"
    fi
}

# Build and deploy
deploy() {
    log_info "Building and deploying application..."
    
    # Build and start all services
    log_info "Building services..."
    docker-compose -f $COMPOSE_FILE --env-file $ENV_FILE build --no-cache
    
    log_info "Starting services..."
    docker-compose -f $COMPOSE_FILE --env-file $ENV_FILE up -d
    
    # Wait for services to be ready
    log_info "Waiting for services to be ready..."
    sleep 30
    
    # Check PostgreSQL health
    log_info "Checking PostgreSQL health..."
    for i in {1..30}; do
        if docker exec yjs_postgres pg_isready -U yjs_app -d youth_justice_services > /dev/null 2>&1; then
            log_success "PostgreSQL is ready"
            break
        fi
        if [ $i -eq 30 ]; then
            log_error "PostgreSQL failed to start"
            exit 1
        fi
        sleep 2
    done
    
    # Check Redis health
    log_info "Checking Redis health..."
    for i in {1..10}; do
        if docker exec yjs_redis redis-cli ping > /dev/null 2>&1; then
            log_success "Redis is ready"
            break
        fi
        if [ $i -eq 10 ]; then
            log_error "Redis failed to start"
            exit 1
        fi
        sleep 1
    done
    
    log_success "Deployment completed successfully!"
}

# Health check
health_check() {
    log_info "Performing health checks..."
    
    # Wait for services to start
    sleep 15
    
    # Check API health
    if curl -f http://localhost:3000/health > /dev/null 2>&1; then
        log_success "API health check passed"
    else
        log_error "API health check failed"
        return 1
    fi
    
    # Check Pipeline Service health
    if curl -f http://localhost:3002/health > /dev/null 2>&1; then
        log_success "Pipeline Service health check passed"
    else
        log_error "Pipeline Service health check failed"
        return 1
    fi
    
    # Check database
    if docker exec yjs_postgres pg_isready -U yjs_app -d youth_justice_services > /dev/null 2>&1; then
        log_success "Database health check passed"
    else
        log_error "Database health check failed"
        return 1
    fi
    
    log_success "All health checks passed!"
}

# Show status
show_status() {
    echo ""
    log_info "Deployment Status:"
    echo "=================="
    
    docker-compose -f $COMPOSE_FILE --env-file $ENV_FILE ps
    
    echo ""
    log_info "Service URLs:"
    echo "============="
    echo "🔌 API: http://localhost:3000"
    echo "🔄 Pipeline Service: http://localhost:3002"
    echo "📊 Grafana: http://localhost:3001"
    echo "📈 Prometheus: http://localhost:9090"
    echo "❤️ API Health: http://localhost:3000/health"
    echo "❤️ Pipeline Health: http://localhost:3002/health"
    echo ""
    
    log_info "Useful Commands:"
    echo "================"
    echo "View logs: docker-compose -f $COMPOSE_FILE logs -f [service]"
    echo "Trigger pipeline: curl -X POST http://localhost:3002/trigger"
    echo "View statistics: curl http://localhost:3002/statistics"
    echo "Stop all: docker-compose -f $COMPOSE_FILE down"
    echo "Restart service: docker-compose -f $COMPOSE_FILE restart [service]"
}

# Main deployment flow
main() {
    case "${1:-deploy}" in
        "deploy")
            check_prerequisites
            create_backup
            deploy
            health_check
            show_status
            ;;
        "backup")
            create_backup
            ;;
        "health")
            health_check
            ;;
        "status")
            show_status
            ;;
        "stop")
            log_info "Stopping all services..."
            docker-compose -f $COMPOSE_FILE --env-file $ENV_FILE down
            log_success "Services stopped"
            ;;
        "logs")
            docker-compose -f $COMPOSE_FILE --env-file $ENV_FILE logs -f "${2:-app}"
            ;;
        *)
            echo "Usage: $0 {deploy|backup|health|status|stop|logs [service]}"
            echo ""
            echo "Commands:"
            echo "  deploy  - Full deployment (default)"
            echo "  backup  - Create backup only"
            echo "  health  - Run health checks only"
            echo "  status  - Show service status"
            echo "  stop    - Stop all services"
            echo "  logs    - View service logs"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"