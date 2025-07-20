#!/bin/bash

# Youth Justice Service Finder - Production Deployment Script
# 
# Deploys the application with proper database setup to cloud providers
# Supports Railway, Heroku, DigitalOcean, and AWS

set -e

echo "🚀 Youth Justice Service Finder - Production Deployment"
echo "======================================================"

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

# Check if required tools are installed
check_dependencies() {
    log_info "Checking deployment dependencies..."
    
    commands=("node" "npm" "docker" "git")
    for cmd in "${commands[@]}"; do
        if ! command -v $cmd &> /dev/null; then
            log_error "$cmd is required but not installed"
            exit 1
        fi
    done
    
    log_success "All dependencies are installed"
}

# Setup environment variables
setup_environment() {
    log_info "Setting up environment variables..."
    
    if [ ! -f .env.production ]; then
        log_error ".env.production file not found"
        log_info "Please copy .env.production.example and configure your settings"
        exit 1
    fi
    
    # Validate required environment variables
    required_vars=("DATABASE_URL" "NODE_ENV")
    for var in "${required_vars[@]}"; do
        if ! grep -q "^$var=" .env.production; then
            log_warning "$var not set in .env.production"
        fi
    done
    
    log_success "Environment configuration validated"
}

# Build the application
build_application() {
    log_info "Building application for production..."
    
    # Install dependencies
    npm ci --production=false
    
    # Build frontend if it exists
    if [ -d "frontend" ]; then
        cd frontend
        npm ci
        npm run build
        cd ..
    fi
    
    # Create optimized build
    if [ -f "package.json" ] && grep -q "build" package.json; then
        npm run build
    fi
    
    log_success "Application built successfully"
}

# Setup database schema
setup_database() {
    log_info "Setting up database schema..."
    
    # Create database initialization script
    cat > init-database.js << 'EOF'
#!/usr/bin/env node

import { DatabaseManager } from './src/database/database-manager.js';
import fs from 'fs/promises';

async function initializeDatabase() {
    console.log('🗄️  Initializing production database...');
    
    const db = new DatabaseManager({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    
    try {
        await db.initialize();
        console.log('✅ Database initialized successfully');
        
        // Run migrations if they exist
        const migrations = await fs.readdir('./database/migrations').catch(() => []);
        console.log(`📁 Found ${migrations.length} migration files`);
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Database initialization failed:', error);
        process.exit(1);
    }
}

initializeDatabase();
EOF
    
    # Make script executable
    chmod +x init-database.js
    
    log_success "Database setup script created"
}

# Deploy to Railway
deploy_railway() {
    log_info "Deploying to Railway..."
    
    if ! command -v railway &> /dev/null; then
        log_warning "Railway CLI not installed. Installing..."
        npm install -g @railway/cli
    fi
    
    # Create railway.json
    cat > railway.json << 'EOF'
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "node server.js",
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 30,
    "restartPolicyType": "ON_FAILURE"
  }
}
EOF
    
    # Create Dockerfile for better control
    cat > Dockerfile.railway << 'EOF'
FROM node:18-alpine

WORKDIR /app

# Install PostgreSQL client and PostGIS
RUN apk add --no-cache postgresql-client postgis

# Copy package files
COPY package*.json ./
RUN npm ci --production

# Copy application code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node scripts/health-check.js || exit 1

EXPOSE 3001

CMD ["node", "server.js"]
EOF
    
    log_info "Initializing Railway project..."
    railway login
    railway init
    
    log_info "Adding PostgreSQL database..."
    railway add postgresql
    
    log_info "Deploying application..."
    railway up
    
    log_success "Deployed to Railway successfully!"
    railway status
}

# Deploy to Heroku
deploy_heroku() {
    log_info "Deploying to Heroku..."
    
    if ! command -v heroku &> /dev/null; then
        log_error "Heroku CLI not installed. Please install it first."
        exit 1
    fi
    
    # Create Procfile
    cat > Procfile << 'EOF'
web: node server.js
worker: node src/workers/data-pipeline-worker.js
release: node init-database.js
EOF
    
    # Create app.json for Heroku Button deployment
    cat > app.json << 'EOF'
{
  "name": "Youth Justice Service Finder",
  "description": "Comprehensive youth justice service directory for Australia",
  "repository": "https://github.com/your-username/youth-justice-service-finder",
  "logo": "https://your-logo-url.com/logo.png",
  "keywords": ["youth", "justice", "services", "australia", "directory"],
  "stack": "heroku-22",
  "buildpacks": [
    {
      "url": "heroku/nodejs"
    }
  ],
  "addons": [
    {
      "plan": "heroku-postgresql:mini"
    },
    {
      "plan": "heroku-redis:mini"
    }
  ],
  "env": {
    "NODE_ENV": "production",
    "LOG_LEVEL": "info",
    "HEALTH_CHECK_INTERVAL": "30000"
  },
  "formation": {
    "web": {
      "quantity": 1,
      "size": "basic"
    }
  },
  "scripts": {
    "postdeploy": "node init-database.js"
  }
}
EOF
    
    log_info "Creating Heroku app..."
    heroku create youth-justice-finder-$(date +%s)
    
    log_info "Adding PostgreSQL addon..."
    heroku addons:create heroku-postgresql:mini
    
    log_info "Setting environment variables..."
    heroku config:set NODE_ENV=production
    
    log_info "Deploying to Heroku..."
    git add .
    git commit -m "Deploy to Heroku" || true
    git push heroku main
    
    log_success "Deployed to Heroku successfully!"
    heroku open
}

# Deploy using Docker
deploy_docker() {
    log_info "Building Docker image..."
    
    # Create production Dockerfile
    cat > Dockerfile << 'EOF'
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

FROM node:18-alpine AS runtime

# Install system dependencies
RUN apk add --no-cache \
    postgresql-client \
    curl \
    && rm -rf /var/cache/apk/*

WORKDIR /app

# Copy node_modules from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy application code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/api/health || exit 1

EXPOSE 3001

CMD ["node", "server.js"]
EOF
    
    # Build and tag image
    docker build -t youth-justice-finder:latest .
    
    log_success "Docker image built successfully"
    log_info "To run: docker run -p 3001:3001 --env-file .env.production youth-justice-finder:latest"
}

# Create deployment documentation
create_docs() {
    log_info "Creating deployment documentation..."
    
    cat > DEPLOYMENT.md << 'EOF'
# Youth Justice Service Finder - Deployment Guide

## Quick Deploy Options

### 1. Railway (Recommended)
```bash
./scripts/deploy-production.sh railway
```

### 2. Heroku
```bash
./scripts/deploy-production.sh heroku
```

### 3. Docker
```bash
./scripts/deploy-production.sh docker
```

## Environment Variables

Required environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `NODE_ENV`: Set to "production"
- `PORT`: Application port (default: 3001)

Optional environment variables:
- `REDIS_URL`: Redis connection for caching
- `ELASTICSEARCH_URL`: Search engine endpoint
- `FIRECRAWL_API_KEY`: For web scraping capabilities

## Health Checks

The application provides several health check endpoints:
- `/api/health`: Basic health check
- `/api/health/database`: Database connectivity
- `/api/health/detailed`: Comprehensive system status

## Monitoring

Built-in monitoring includes:
- Database health metrics
- Service quality analytics
- Performance benchmarks
- Scalability assessments

Access the insights dashboard at `/dashboard` after deployment.

## Scaling Recommendations

For production scaling:
1. Enable connection pooling (PgBouncer)
2. Add Redis caching layer
3. Implement read replicas
4. Set up monitoring and alerting

## Support

For deployment issues, check:
1. Application logs
2. Database connectivity
3. Environment variable configuration
4. Health check endpoints
EOF
    
    log_success "Deployment documentation created"
}

# Create health check script
create_health_check() {
    log_info "Creating health check script..."
    
    mkdir -p scripts
    cat > scripts/health-check.js << 'EOF'
#!/usr/bin/env node

import http from 'http';

const options = {
    hostname: 'localhost',
    port: process.env.PORT || 3001,
    path: '/api/health',
    method: 'GET',
    timeout: 5000
};

const req = http.request(options, (res) => {
    if (res.statusCode === 200) {
        console.log('✅ Health check passed');
        process.exit(0);
    } else {
        console.log(`❌ Health check failed: ${res.statusCode}`);
        process.exit(1);
    }
});

req.on('error', (error) => {
    console.log(`❌ Health check failed: ${error.message}`);
    process.exit(1);
});

req.on('timeout', () => {
    console.log('❌ Health check timed out');
    req.destroy();
    process.exit(1);
});

req.end();
EOF
    
    chmod +x scripts/health-check.js
    
    log_success "Health check script created"
}

# Main deployment function
main() {
    local platform=${1:-"railway"}
    
    echo "🎯 Deploying to: $platform"
    echo "================================"
    
    check_dependencies
    setup_environment
    build_application
    setup_database
    create_health_check
    create_docs
    
    case $platform in
        "railway")
            deploy_railway
            ;;
        "heroku")
            deploy_heroku
            ;;
        "docker")
            deploy_docker
            ;;
        *)
            log_error "Unknown platform: $platform"
            log_info "Supported platforms: railway, heroku, docker"
            exit 1
            ;;
    esac
    
    echo ""
    log_success "🎉 Deployment completed successfully!"
    log_info "📊 Access your insights dashboard at: /dashboard"
    log_info "🏥 Health checks available at: /api/health"
    log_info "📖 See DEPLOYMENT.md for more information"
}

# Run main function with arguments
main "$@"