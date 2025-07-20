#!/bin/bash

# Youth Justice Service Finder - Production Monitoring Script
set -e

echo "📊 Youth Justice Service Finder - Production Monitoring"
echo "======================================================="

# Configuration
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.prod"
ALERT_EMAIL=${ALERT_EMAIL:-"admin@youth-justice.local"}
SLACK_WEBHOOK=${SLACK_WEBHOOK:-""}

# Thresholds
CPU_THRESHOLD=80
MEMORY_THRESHOLD=80
DISK_THRESHOLD=90
RESPONSE_TIME_THRESHOLD=5000  # milliseconds

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Send alert
send_alert() {
    local message="$1"
    local severity="$2"
    
    echo "🚨 ALERT [$severity]: $message"
    
    # Send to Slack if configured
    if [ -n "$SLACK_WEBHOOK" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🚨 Youth Justice Service Finder Alert [$severity]: $message\"}" \
            "$SLACK_WEBHOOK" >/dev/null 2>&1 || true
    fi
    
    # Log to file
    echo "$(date): [$severity] $message" >> /var/log/youth-justice-alerts.log 2>/dev/null || true
}

# Check service health
check_service_health() {
    log_info "Checking service health..."
    
    local failed_services=0
    
    # Check API health
    if ! curl -f -s --max-time 10 http://localhost/health >/dev/null; then
        log_error "API health check failed"
        send_alert "API health check failed" "CRITICAL"
        ((failed_services++))
    else
        log_success "API health check passed"
    fi
    
    # Check Elasticsearch
    if ! curl -f -s --max-time 10 http://localhost:9200/_cluster/health >/dev/null; then
        log_error "Elasticsearch health check failed"
        send_alert "Elasticsearch health check failed" "CRITICAL"
        ((failed_services++))
    else
        log_success "Elasticsearch health check passed"
    fi
    
    # Check database
    if ! docker-compose -f $COMPOSE_FILE exec -T postgres pg_isready -U postgres -d youth_justice_prod >/dev/null 2>&1; then
        log_error "Database health check failed"
        send_alert "Database health check failed" "CRITICAL"
        ((failed_services++))
    else
        log_success "Database health check passed"
    fi
    
    # Check Redis
    if ! docker-compose -f $COMPOSE_FILE exec -T redis redis-cli ping >/dev/null 2>&1; then
        log_error "Redis health check failed"
        send_alert "Redis health check failed" "WARNING"
        ((failed_services++))
    else
        log_success "Redis health check passed"
    fi
    
    return $failed_services
}

# Check resource usage
check_resource_usage() {
    log_info "Checking resource usage..."
    
    # CPU usage
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | sed 's/%us,//')
    cpu_usage=${cpu_usage%.*}  # Remove decimal part
    
    if [ "$cpu_usage" -gt "$CPU_THRESHOLD" ]; then
        log_warning "High CPU usage: ${cpu_usage}%"
        send_alert "High CPU usage: ${cpu_usage}%" "WARNING"
    else
        log_success "CPU usage: ${cpu_usage}%"
    fi
    
    # Memory usage
    local memory_info=$(free | grep Mem)
    local total_mem=$(echo $memory_info | awk '{print $2}')
    local used_mem=$(echo $memory_info | awk '{print $3}')
    local memory_usage=$((used_mem * 100 / total_mem))
    
    if [ "$memory_usage" -gt "$MEMORY_THRESHOLD" ]; then
        log_warning "High memory usage: ${memory_usage}%"
        send_alert "High memory usage: ${memory_usage}%" "WARNING"
    else
        log_success "Memory usage: ${memory_usage}%"
    fi
    
    # Disk usage
    local disk_usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    
    if [ "$disk_usage" -gt "$DISK_THRESHOLD" ]; then
        log_error "High disk usage: ${disk_usage}%"
        send_alert "High disk usage: ${disk_usage}%" "CRITICAL"
    else
        log_success "Disk usage: ${disk_usage}%"
    fi
}

# Check container status
check_container_status() {
    log_info "Checking container status..."
    
    local containers=$(docker-compose -f $COMPOSE_FILE ps --services)
    local failed_containers=0
    
    for container in $containers; do
        local status=$(docker-compose -f $COMPOSE_FILE ps $container | grep $container | awk '{print $3}')
        
        if [[ "$status" != "Up" ]] && [[ "$status" != "running" ]]; then
            log_error "Container $container is not running (status: $status)"
            send_alert "Container $container is not running" "CRITICAL"
            ((failed_containers++))
        else
            log_success "Container $container is running"
        fi
    done
    
    return $failed_containers
}

# Check response times
check_response_times() {
    log_info "Checking API response times..."
    
    # Health endpoint
    local health_time=$(curl -o /dev/null -s -w '%{time_total}' http://localhost/health | awk '{print $1*1000}')
    health_time=${health_time%.*}  # Remove decimal part
    
    if [ "$health_time" -gt "$RESPONSE_TIME_THRESHOLD" ]; then
        log_warning "Slow health endpoint response: ${health_time}ms"
        send_alert "Slow health endpoint response: ${health_time}ms" "WARNING"
    else
        log_success "Health endpoint response time: ${health_time}ms"
    fi
    
    # Search endpoint
    local search_time=$(curl -o /dev/null -s -w '%{time_total}' "http://localhost/search/es/enhanced?limit=5" | awk '{print $1*1000}')
    search_time=${search_time%.*}  # Remove decimal part
    
    if [ "$search_time" -gt "$RESPONSE_TIME_THRESHOLD" ]; then
        log_warning "Slow search endpoint response: ${search_time}ms"
        send_alert "Slow search endpoint response: ${search_time}ms" "WARNING"
    else
        log_success "Search endpoint response time: ${search_time}ms"
    fi
}

# Check database metrics
check_database_metrics() {
    log_info "Checking database metrics..."
    
    # Database size
    local db_size=$(docker-compose -f $COMPOSE_FILE exec -T postgres psql -U postgres -d youth_justice_prod -t -c "SELECT pg_size_pretty(pg_database_size('youth_justice_prod'));" 2>/dev/null | xargs)
    log_info "Database size: $db_size"
    
    # Active connections
    local connections=$(docker-compose -f $COMPOSE_FILE exec -T postgres psql -U postgres -d youth_justice_prod -t -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';" 2>/dev/null | xargs)
    log_info "Active database connections: $connections"
    
    # Check for long-running queries (> 5 minutes)
    local long_queries=$(docker-compose -f $COMPOSE_FILE exec -T postgres psql -U postgres -d youth_justice_prod -t -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active' AND now() - query_start > interval '5 minutes';" 2>/dev/null | xargs)
    
    if [ "$long_queries" -gt "0" ]; then
        log_warning "Found $long_queries long-running queries"
        send_alert "Found $long_queries long-running database queries" "WARNING"
    else
        log_success "No long-running queries found"
    fi
}

# Check Elasticsearch metrics
check_elasticsearch_metrics() {
    log_info "Checking Elasticsearch metrics..."
    
    # Cluster health
    local cluster_status=$(curl -s http://localhost:9200/_cluster/health | python3 -c "import sys, json; print(json.load(sys.stdin)['status'])" 2>/dev/null || echo "unknown")
    
    case $cluster_status in
        "green")
            log_success "Elasticsearch cluster status: green"
            ;;
        "yellow")
            log_warning "Elasticsearch cluster status: yellow"
            send_alert "Elasticsearch cluster status is yellow" "WARNING"
            ;;
        "red")
            log_error "Elasticsearch cluster status: red"
            send_alert "Elasticsearch cluster status is red" "CRITICAL"
            ;;
        *)
            log_error "Cannot determine Elasticsearch cluster status"
            send_alert "Cannot determine Elasticsearch cluster status" "CRITICAL"
            ;;
    esac
    
    # Index size
    local indices_size=$(curl -s "http://localhost:9200/_cat/indices?h=store.size" 2>/dev/null | awk '{sum += $1} END {print sum}' || echo "unknown")
    log_info "Elasticsearch indices size: ${indices_size}b"
}

# Check log errors
check_log_errors() {
    log_info "Checking for recent errors in logs..."
    
    # Check for errors in the last hour
    local error_count=$(docker-compose -f $COMPOSE_FILE logs --since=1h 2>/dev/null | grep -i error | wc -l)
    
    if [ "$error_count" -gt "10" ]; then
        log_warning "Found $error_count errors in logs in the last hour"
        send_alert "High error rate: $error_count errors in the last hour" "WARNING"
    else
        log_success "Error count in last hour: $error_count"
    fi
}

# Generate status report
generate_status_report() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    cat > /tmp/youth-justice-status.txt << EOF
Youth Justice Service Finder - Status Report
Generated: $timestamp

SYSTEM RESOURCES:
- CPU Usage: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | sed 's/%us,//')%
- Memory Usage: $(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}')%
- Disk Usage: $(df / | awk 'NR==2 {print $5}')

CONTAINER STATUS:
$(docker-compose -f $COMPOSE_FILE ps)

SERVICE HEALTH:
- API: $(curl -f -s --max-time 5 http://localhost/health >/dev/null && echo "✅ Healthy" || echo "❌ Failed")
- Elasticsearch: $(curl -f -s --max-time 5 http://localhost:9200/_cluster/health >/dev/null && echo "✅ Healthy" || echo "❌ Failed")
- Database: $(docker-compose -f $COMPOSE_FILE exec -T postgres pg_isready -U postgres -d youth_justice_prod >/dev/null 2>&1 && echo "✅ Healthy" || echo "❌ Failed")
- Redis: $(docker-compose -f $COMPOSE_FILE exec -T redis redis-cli ping >/dev/null 2>&1 && echo "✅ Healthy" || echo "❌ Failed")

RESPONSE TIMES:
- Health endpoint: $(curl -o /dev/null -s -w '%{time_total}' http://localhost/health | awk '{print $1*1000}')ms
- Search endpoint: $(curl -o /dev/null -s -w '%{time_total}' "http://localhost/search/es/enhanced?limit=5" | awk '{print $1*1000}')ms

DATABASE:
- Size: $(docker-compose -f $COMPOSE_FILE exec -T postgres psql -U postgres -d youth_justice_prod -t -c "SELECT pg_size_pretty(pg_database_size('youth_justice_prod'));" 2>/dev/null | xargs)
- Active connections: $(docker-compose -f $COMPOSE_FILE exec -T postgres psql -U postgres -d youth_justice_prod -t -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';" 2>/dev/null | xargs)

ELASTICSEARCH:
- Cluster status: $(curl -s http://localhost:9200/_cluster/health | python3 -c "import sys, json; print(json.load(sys.stdin)['status'])" 2>/dev/null || echo "unknown")
- Indices count: $(curl -s "http://localhost:9200/_cat/indices?h=index" 2>/dev/null | wc -l || echo "unknown")
EOF

    echo "📋 Status report generated: /tmp/youth-justice-status.txt"
}

# Main monitoring function
main() {
    case "${1:-check}" in
        "check")
            local total_issues=0
            
            check_service_health || ((total_issues+=$?))
            check_resource_usage
            check_container_status || ((total_issues+=$?))
            check_response_times
            check_database_metrics
            check_elasticsearch_metrics
            check_log_errors
            
            echo ""
            if [ $total_issues -eq 0 ]; then
                log_success "All monitoring checks passed! 🎉"
            else
                log_warning "Found $total_issues issues that need attention"
            fi
            ;;
        "status")
            generate_status_report
            cat /tmp/youth-justice-status.txt
            ;;
        "health")
            check_service_health
            ;;
        "resources")
            check_resource_usage
            ;;
        "containers")
            check_container_status
            ;;
        "database")
            check_database_metrics
            ;;
        "elasticsearch")
            check_elasticsearch_metrics
            ;;
        "install-cron")
            # Install monitoring cron job
            echo "*/5 * * * * /path/to/youth-justice-service-finder/scripts/production/monitor.sh check >> /var/log/youth-justice-monitor.log 2>&1" | crontab -
            log_success "Monitoring cron job installed (runs every 5 minutes)"
            ;;
        *)
            echo "Usage: $0 {check|status|health|resources|containers|database|elasticsearch|install-cron}"
            echo ""
            echo "Commands:"
            echo "  check         - Run all monitoring checks (default)"
            echo "  status        - Generate detailed status report"
            echo "  health        - Check service health only"
            echo "  resources     - Check system resources only"
            echo "  containers    - Check container status only"
            echo "  database      - Check database metrics only"
            echo "  elasticsearch - Check Elasticsearch metrics only"
            echo "  install-cron  - Install monitoring cron job"
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